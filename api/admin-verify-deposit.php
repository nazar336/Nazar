<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

// ── Admin auth via secret header ONLY (GET param removed for security) ──
$pdo = db();
$adminIp = substr((string)($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 0, 45);

// Rate limit admin auth attempts: max 5 per 15 min per IP
if (check_rate_limit($pdo, 'admin_auth:' . $adminIp, 5, 15))
    json_response(['success' => false, 'message' => 'Too many attempts. Try again later.'], 429);

$secret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
if ($secret !== ADMIN_SECRET || ADMIN_SECRET === 'change-this-to-a-random-secret-key') {
    record_rate_limit($pdo, 'admin_auth:' . $adminIp);
    error_log('Admin auth failed from IP: ' . $adminIp);
    json_response(['success' => false, 'message' => 'Unauthorized'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // List pending deposits with tx hashes (awaiting review)
    $stmt = $pdo->prepare("
        SELECT cd.id, cd.user_id, u.username, u.email,
               cd.currency, cd.network, cd.amount_native, cd.amount_usdt, cd.amount_coins,
               cd.transaction_hash, cd.status, cd.admin_verified, cd.wallet_address,
               cd.created_at, cd.expires_at
        FROM crypto_deposits cd
        JOIN users u ON u.id = cd.user_id
        WHERE cd.transaction_hash IS NOT NULL
          AND cd.status = 'pending'
          AND cd.admin_verified = FALSE
        ORDER BY cd.created_at ASC
        LIMIT 100
    ");
    $stmt->execute();
    json_response(['success' => true, 'pending_deposits' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
    $input     = read_json();
    $depositId = (int)($input['deposit_id'] ?? 0);
    $action    = $input['action'] ?? 'approve'; // approve | reject
    $note      = substr(trim((string)($input['note'] ?? '')), 0, 255);

    if ($depositId <= 0)
        json_response(['success' => false, 'message' => 'Missing deposit_id'], 400);
    if (!in_array($action, ['approve', 'reject'], true))
        json_response(['success' => false, 'message' => 'action must be approve or reject'], 400);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("SELECT id,user_id,amount_coins,amount_usdt,currency,network,status FROM crypto_deposits WHERE id=:id FOR UPDATE");
        $stmt->execute([':id' => $depositId]);
        $deposit = $stmt->fetch();

        if (!$deposit) { $pdo->rollBack(); json_response(['success' => false, 'message' => 'Deposit not found'], 404); }
        if ($deposit['status'] !== 'pending') { $pdo->rollBack(); json_response(['success' => false, 'message' => 'Deposit already processed: ' . $deposit['status']], 400); }

        if ($action === 'reject') {
            $pdo->prepare("UPDATE crypto_deposits SET status='failed', admin_verified=FALSE, admin_note=:note WHERE id=:id")
                ->execute([':note' => $note ?: 'Rejected by admin', ':id' => $depositId]);

            // Notify user
            $pdo->prepare("INSERT INTO notifications (user_id,type,title,content) VALUES (:uid,'payment','Депозит відхилено',:content)")
                ->execute([':uid' => $deposit['user_id'], ':content' => 'Ваш депозит #' . $depositId . ' відхилено адміністратором. ' . $note]);

            $pdo->commit();
            json_response(['success' => true, 'message' => 'Deposit rejected.', 'deposit_id' => $depositId]);
        }

        // APPROVE
        $amountCoins = (float)$deposit['amount_coins'];
        $userId      = (int)$deposit['user_id'];

        // Apply deposit fee
        $feeCoins = round($amountCoins * DEPOSIT_FEE_PCT / 100, 2);
        $netCoins = $amountCoins - $feeCoins;

        // Update deposit
        $pdo->prepare("UPDATE crypto_deposits SET status='confirmed', admin_verified=TRUE, confirmed_at=NOW(), admin_note=:note WHERE id=:id")
            ->execute([':note' => $note ?: 'Verified by admin', ':id' => $depositId]);

        // Credit coins (net after fee)
        $pdo->prepare("
            INSERT INTO user_coins (user_id, coin_balance, total_purchased)
            VALUES (:uid, :coins, :coins)
            ON DUPLICATE KEY UPDATE
                coin_balance    = coin_balance + :coins2,
                total_purchased = total_purchased + :coins3,
                updated_at      = NOW()
        ")->execute([':uid' => $userId, ':coins' => $netCoins, ':coins2' => $netCoins, ':coins3' => $netCoins]);

        // Transaction log
        $pdo->prepare("INSERT INTO transactions (user_id,type,amount,status,description) VALUES (:uid,'deposit',:amt,'completed',:desc)")
            ->execute([':uid' => $userId, ':amt' => $deposit['amount_usdt'], ':desc' => 'Crypto deposit (' . $deposit['network'] . '): +' . $netCoins . ' LOL (fee ' . $feeCoins . ' LOL, ' . DEPOSIT_FEE_PCT . '%)']);

        // Log platform fee
        if ($feeCoins > 0) {
            $pdo->prepare("
                INSERT INTO coin_spending (user_id, amount, type, description)
                VALUES (:uid, :amt, 'platform_fee', :desc)
            ")->execute([':uid' => $userId, ':amt' => $feeCoins, ':desc' => 'Deposit fee ' . DEPOSIT_FEE_PCT . '%: ' . $feeCoins . ' LOL']);
        }

        // Notify user
        $pdo->prepare("INSERT INTO notifications (user_id,type,title,content) VALUES (:uid,'payment','Депозит підтверджено! ✅',:content)")
            ->execute([':uid' => $userId, ':content' => $netCoins . ' монет зараховано за депозит ' . $deposit['amount_native'] . ' ' . $deposit['currency'] . ' (' . $deposit['network'] . '). Комісія: ' . $feeCoins . ' LOL (' . DEPOSIT_FEE_PCT . '%).']);

        $pdo->commit();

        // New balance
        $balStmt = $pdo->prepare('SELECT coin_balance FROM user_coins WHERE user_id=:uid');
        $balStmt->execute([':uid' => $userId]);
        $newBalance = (float)($balStmt->fetchColumn() ?? 0);

        json_response([
            'success'        => true,
            'message'        => 'Deposit approved. ' . $netCoins . ' LOL credited (fee: ' . $feeCoins . ' LOL).',
            'deposit_id'     => $depositId,
            'user_id'        => $userId,
            'coins_credited' => $netCoins,
            'fee_coins'      => $feeCoins,
            'fee_pct'        => DEPOSIT_FEE_PCT,
            'new_balance'    => $newBalance,
        ]);

    } catch (\Exception $e) {
        $pdo->rollBack();
        error_log('Admin verify error: ' . $e->getMessage());
        json_response(['success' => false, 'message' => 'Server error'], 500);
    }
}

json_response(['success' => false, 'message' => 'Method not allowed'], 405);

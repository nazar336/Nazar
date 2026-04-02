<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['GET', 'POST', 'OPTIONS']);

$pdo = db();

// Admin auth via secret header ONLY (GET param removed for security)
$secret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
if ($secret !== ADMIN_SECRET || ADMIN_SECRET === 'change-this-to-a-random-secret-key')
    json_response(['success' => false, 'message' => 'Unauthorized'], 401);

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        handleGetPending($pdo);
    } elseif ($method === 'POST') {
        $input = read_json();
        handleProcess($pdo, $input);
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (\Exception $e) {
    error_log('admin-verify-withdraw error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

// ── GET pending withdrawals ───────────────────────────────────────
function handleGetPending(PDO $pdo): never {
    $stmt = $pdo->query("
        SELECT w.*, u.name AS user_name, u.username, u.email
        FROM crypto_withdrawals w
        JOIN users u ON u.id = w.user_id
        WHERE w.status = 'pending'
        ORDER BY w.created_at ASC
    ");

    json_response([
        'success'     => true,
        'withdrawals' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
}

// ── POST approve/reject ──────────────────────────────────────────
function handleProcess(PDO $pdo, array $input): never {
    $withdrawId = (int)($input['withdraw_id'] ?? 0);
    $action     = strtolower(trim((string)($input['action'] ?? '')));
    $txHash     = trim((string)($input['tx_hash'] ?? ''));
    $adminNote  = substr(trim((string)($input['admin_note'] ?? '')), 0, 255);

    if ($withdrawId <= 0)
        json_response(['success' => false, 'message' => 'Invalid withdraw_id'], 400);
    if (!in_array($action, ['approve', 'reject'], true))
        json_response(['success' => false, 'message' => 'Action must be "approve" or "reject"'], 400);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            SELECT id, user_id, amount_coins, fee_coins, net_coins, status
            FROM crypto_withdrawals WHERE id=:id FOR UPDATE
        ");
        $stmt->execute([':id' => $withdrawId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Withdrawal not found'], 404);
        }
        if ($row['status'] !== 'pending') {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Already processed (status: ' . $row['status'] . ')'], 400);
        }

        $userId      = (int)$row['user_id'];
        $amountCoins = (float)$row['amount_coins'];

        if ($action === 'approve') {
            if (strlen($txHash) < 5)
                json_response(['success' => false, 'message' => 'Provide tx_hash for approval'], 400);

            $pdo->prepare("
                UPDATE crypto_withdrawals
                SET status='completed', transaction_hash=:h, admin_note=:note, processed_at=NOW()
                WHERE id=:id
            ")->execute([':h' => $txHash, ':note' => $adminNote, ':id' => $withdrawId]);

            // Record in main transactions table
            $pdo->prepare("
                INSERT INTO transactions (user_id, type, amount, status, description)
                VALUES (:uid, 'withdraw', :amt, 'completed', :desc)
            ")->execute([
                ':uid'  => $userId,
                ':amt'  => $amountCoins,
                ':desc' => 'Crypto withdrawal completed (tx: ' . $txHash . ')',
            ]);

            // Notification
            $pdo->prepare("
                INSERT INTO notifications (user_id, type, title, content)
                VALUES (:uid, 'payment', 'Withdrawal completed ✅', :c)
            ")->execute([
                ':uid' => $userId,
                ':c'   => 'Your withdrawal of ' . $amountCoins . ' coins has been processed.',
            ]);

        } else {
            // Reject — refund coins
            $pdo->prepare("
                UPDATE crypto_withdrawals
                SET status='rejected', admin_note=:note, processed_at=NOW()
                WHERE id=:id
            ")->execute([':note' => $adminNote, ':id' => $withdrawId]);

            // Refund coins back to user
            $pdo->prepare('
                UPDATE user_coins
                SET coin_balance = coin_balance + :amt,
                    total_spent  = GREATEST(0, total_spent - :amt2),
                    updated_at   = NOW()
                WHERE user_id = :uid
            ')->execute([':amt' => $amountCoins, ':amt2' => $amountCoins, ':uid' => $userId]);

            // Log refund
            $pdo->prepare('
                INSERT INTO coin_spending (user_id, amount, type, description)
                VALUES (:uid, :amt, "withdraw", :desc)
            ')->execute([
                ':uid'  => $userId,
                ':amt'  => -$amountCoins,
                ':desc' => 'Withdrawal rejected — refund ' . $amountCoins . ' coins',
            ]);

            // Notification
            $pdo->prepare("
                INSERT INTO notifications (user_id, type, title, content)
                VALUES (:uid, 'payment', 'Withdrawal rejected ❌', :c)
            ")->execute([
                ':uid' => $userId,
                ':c'   => 'Your withdrawal of ' . $amountCoins . ' coins was rejected.' . ($adminNote ? ' Reason: ' . $adminNote : ''),
            ]);
        }

        $pdo->commit();

        json_response([
            'success' => true,
            'message' => 'Withdrawal ' . $action . 'd successfully.',
            'withdraw_id' => $withdrawId,
            'action'  => $action,
        ]);

    } catch (\Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

<?php
declare(strict_types=1);
/**
 * On-chain auto-verification cron job.
 *
 * Periodically checks pending crypto deposits (that have a tx_hash)
 * against blockchain RPC nodes. Auto-approves deposits when
 * on-chain confirmations are found.
 *
 * Run via cron every 2–5 minutes:
 *   curl -s -H "X-Admin-Secret: YOUR_SECRET" https://domain/api/cron-verify.php
 *
 * Security: requires ADMIN_SECRET header (same as admin-verify endpoints).
 */
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/crypto-lib.php';

header('Content-Type: application/json; charset=utf-8');

$pdo = db();

// ── Admin auth ────────────────────────────────────────────────────
$adminIp = substr((string)($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 0, 45);
if (check_rate_limit($pdo, 'admin_auth:' . $adminIp, 10, 15))
    json_response(['success' => false, 'message' => 'Too many attempts.'], 429);

$secret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
if ($secret !== ADMIN_SECRET || ADMIN_SECRET === 'change-this-to-a-random-secret-key') {
    record_rate_limit($pdo, 'admin_auth:' . $adminIp);
    json_response(['success' => false, 'message' => 'Unauthorized'], 401);
}

$results = ['verified' => 0, 'failed' => 0, 'skipped' => 0, 'details' => []];

try {
    // ── 1. Auto-verify pending deposits ───────────────────────────
    $stmt = $pdo->prepare("
        SELECT id, user_id, transaction_hash, network, amount_coins, amount_usdt,
               currency, amount_native, wallet_address
        FROM crypto_deposits
        WHERE status = 'pending'
          AND transaction_hash IS NOT NULL
          AND admin_verified = FALSE
          AND expires_at > NOW()
        ORDER BY created_at ASC
        LIMIT 20
    ");
    $stmt->execute();
    $pendingDeposits = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($pendingDeposits as $deposit) {
        $txHash  = (string)$deposit['transaction_hash'];
        $network = (string)$deposit['network'];
        $depId   = (int)$deposit['id'];

        try {
            $rpc = verify_transaction_rpc($txHash, $network);

            if ($rpc['verified'] && $rpc['confirmations'] > 0) {
                // Auto-approve: credit coins
                $pdo->beginTransaction();
                try {
                    // Lock row
                    $lockStmt = $pdo->prepare("SELECT id, status FROM crypto_deposits WHERE id=:id FOR UPDATE");
                    $lockStmt->execute([':id' => $depId]);
                    $locked = $lockStmt->fetch(PDO::FETCH_ASSOC);

                    if (!$locked || $locked['status'] !== 'pending') {
                        $pdo->rollBack();
                        $results['skipped']++;
                        continue;
                    }

                    $amountCoins = (float)$deposit['amount_coins'];
                    $userId      = (int)$deposit['user_id'];

                    // Apply deposit fee
                    $feeCoins = round($amountCoins * DEPOSIT_FEE_PCT / 100, 2);
                    $netCoins = $amountCoins - $feeCoins;

                    // Update deposit status
                    $pdo->prepare("
                        UPDATE crypto_deposits
                        SET status='confirmed', admin_verified=TRUE, confirmed_at=NOW(),
                            admin_note=:note
                        WHERE id=:id
                    ")->execute([
                        ':note' => 'Auto-verified on-chain (' . $rpc['confirmations'] . ' confirmations)',
                        ':id'   => $depId,
                    ]);

                    // Credit coins (net after fee)
                    $pdo->prepare("
                        INSERT INTO user_coins (user_id, coin_balance, total_purchased)
                        VALUES (:uid, :coins, :coins)
                        ON DUPLICATE KEY UPDATE
                            coin_balance    = coin_balance + :coins2,
                            total_purchased = total_purchased + :coins3,
                            updated_at      = NOW()
                    ")->execute([
                        ':uid'    => $userId,
                        ':coins'  => $netCoins,
                        ':coins2' => $netCoins,
                        ':coins3' => $netCoins,
                    ]);

                    // Transaction log
                    $pdo->prepare("
                        INSERT INTO transactions (user_id, type, amount, status, description)
                        VALUES (:uid, 'deposit', :amt, 'completed', :desc)
                    ")->execute([
                        ':uid'  => $userId,
                        ':amt'  => (float)$deposit['amount_usdt'],
                        ':desc' => 'Auto-verified crypto deposit (' . $network . '): +' . $netCoins . ' LOL (fee ' . $feeCoins . ' LOL, ' . DEPOSIT_FEE_PCT . '%)',
                    ]);

                    // Log platform fee
                    if ($feeCoins > 0) {
                        $pdo->prepare("
                            INSERT INTO coin_spending (user_id, amount, type, description)
                            VALUES (:uid, :amt, 'platform_fee', :desc)
                        ")->execute([
                            ':uid' => $userId,
                            ':amt' => $feeCoins,
                            ':desc' => 'Deposit fee ' . DEPOSIT_FEE_PCT . '%: ' . $feeCoins . ' LOL',
                        ]);
                    }

                    // Notification
                    $pdo->prepare("
                        INSERT INTO notifications (user_id, type, title, content)
                        VALUES (:uid, 'payment', 'Депозит підтверджено! ✅', :content)
                    ")->execute([
                        ':uid'     => $userId,
                        ':content' => $netCoins . ' монет зараховано (on-chain верифікація). Комісія: ' . $feeCoins . ' LOL. TX: ' . substr($txHash, 0, 16) . '...',
                    ]);

                    $pdo->commit();
                    $results['verified']++;
                    $results['details'][] = [
                        'deposit_id' => $depId,
                        'action'     => 'auto_approved',
                        'coins'      => $netCoins,
                        'fee_coins'  => $feeCoins,
                        'network'    => $network,
                    ];
                } catch (\Throwable $e) {
                    if ($pdo->inTransaction()) $pdo->rollBack();
                    error_log('cron-verify deposit #' . $depId . ' error: ' . $e->getMessage());
                    $results['failed']++;
                }
            } else {
                $results['skipped']++;
            }
        } catch (\Throwable $e) {
            error_log('cron-verify RPC error for deposit #' . $depId . ': ' . $e->getMessage());
            $results['skipped']++;
        }
    }

    // ── 2. Auto-expire old pending deposits ──────────────────────
    $expired = $pdo->prepare("
        UPDATE crypto_deposits
        SET status='expired'
        WHERE status='pending' AND expires_at <= NOW()
    ");
    $expired->execute();
    $results['expired_deposits'] = $expired->rowCount();

    json_response([
        'success' => true,
        'message' => 'Cron verification completed',
        'deposits_checked' => count($pendingDeposits),
        'results' => $results,
    ]);

} catch (\Exception $e) {
    error_log('cron-verify fatal: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

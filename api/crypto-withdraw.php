<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/crypto-lib.php';
cors_headers(['GET', 'POST', 'OPTIONS']);

start_secure_session();
$pdo = db();

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0)
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);

$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ── Constants ─────────────────────────────────────────────────────
define('MIN_WITHDRAW_COINS', 500);       // мінімум 500 coins = $5
define('MAX_WITHDRAW_COINS', 1000000);   // максимум 1M coins = $10,000
define('WITHDRAW_FEE_PCT', 5.0);         // 5% commission

try {
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'history';
        match ($action) {
            'history' => handleWithdrawHistory($pdo, $userId),
            'status'  => handleWithdrawStatus($pdo, $userId),
            'info'    => handleWithdrawInfo(),
            default   => json_response(['success' => false, 'message' => 'Unknown action'], 400),
        };
    } elseif ($method === 'POST') {
        $input  = read_json();
        $action = $input['action'] ?? 'initiate';
        match ($action) {
            'initiate' => handleWithdrawInitiate($pdo, $userId, $input),
            'cancel'   => handleWithdrawCancel($pdo, $userId, $input),
            default    => json_response(['success' => false, 'message' => 'Unknown action'], 400),
        };
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (\Exception $e) {
    error_log('crypto-withdraw error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

// ── GET info ──────────────────────────────────────────────────────
function handleWithdrawInfo(): never {
    $rates = get_crypto_rates();
    json_response([
        'success'           => true,
        'rates'             => $rates,
        'coins_per_usd'     => COINS_PER_USD,
        'networks'          => array_keys(CRYPTO_WALLETS),
        'min_withdraw_coins'=> MIN_WITHDRAW_COINS,
        'max_withdraw_coins'=> MAX_WITHDRAW_COINS,
        'fee_pct'           => WITHDRAW_FEE_PCT,
    ]);
}

// ── POST initiate ─────────────────────────────────────────────────
function handleWithdrawInitiate(PDO $pdo, int $userId, array $input): never {
    // Rate limit: max 3 withdrawal requests per user per 60 min
    if (check_rate_limit($pdo, 'withdraw:' . $userId, 3, 60))
        json_response(['success' => false, 'message' => 'Too many withdrawal requests. Please wait.'], 429);

    $amountCoins   = (float)($input['amount_coins'] ?? 0);
    $network       = strtoupper(trim((string)($input['network'] ?? 'TRC20')));
    $walletAddress = trim((string)($input['wallet_address'] ?? ''));

    // Validation
    if ($amountCoins < MIN_WITHDRAW_COINS)
        json_response(['success' => false, 'message' => 'Мінімальна сума: ' . MIN_WITHDRAW_COINS . ' coins'], 400);
    if ($amountCoins > MAX_WITHDRAW_COINS)
        json_response(['success' => false, 'message' => 'Максимальна сума: ' . MAX_WITHDRAW_COINS . ' coins'], 400);
    if (!array_key_exists($network, CRYPTO_WALLETS))
        json_response(['success' => false, 'message' => 'Unsupported network: ' . $network], 400);
    if (strlen($walletAddress) < 10 || strlen($walletAddress) > 128)
        json_response(['success' => false, 'message' => 'Невірна адреса гаманця (10–128 символів)'], 400);
    if (!preg_match('/^[A-Za-z0-9]+$/', $walletAddress))
        json_response(['success' => false, 'message' => 'Адреса гаманця: тільки латиниця та цифри'], 400);

    // Network-specific address format validation
    if (!validate_crypto_address($walletAddress, $network))
        json_response(['success' => false, 'message' => 'Невірний формат адреси для мережі ' . $network], 400);

    // Calculate amounts
    $feeCoins    = round($amountCoins * WITHDRAW_FEE_PCT / 100, 2);
    $netCoins    = $amountCoins - $feeCoins;
    $amountUsd   = round($netCoins / COINS_PER_USD, 2);

    $rates       = get_crypto_rates();
    $netCurr     = NETWORK_CURRENCY;
    $currency    = $netCurr[$network];
    $usdRate     = $rates[$currency] ?? 1.0;
    $amountNative= $usdRate > 0 ? round($amountUsd / $usdRate, 8) : 0;

    if ($amountNative <= 0)
        json_response(['success' => false, 'message' => 'Сума занадто мала після комісії'], 400);

    // Check for existing pending withdrawal
    $pendingCheck = $pdo->prepare("
        SELECT COUNT(*) FROM crypto_withdrawals
        WHERE user_id=:uid AND status='pending'
    ");
    $pendingCheck->execute([':uid' => $userId]);
    if ((int)$pendingCheck->fetchColumn() > 0)
        json_response(['success' => false, 'message' => 'У вас вже є активний запит на вивід. Дочекайтесь обробки або скасуйте його.'], 400);

    $pdo->beginTransaction();
    try {
        // Lock and check balance
        $pdo->prepare('INSERT IGNORE INTO user_coins (user_id) VALUES (:uid)')->execute([':uid' => $userId]);
        $balStmt = $pdo->prepare('SELECT coin_balance FROM user_coins WHERE user_id=:uid FOR UPDATE');
        $balStmt->execute([':uid' => $userId]);
        $row     = $balStmt->fetch(PDO::FETCH_ASSOC);
        $balance = (float)($row['coin_balance'] ?? 0);

        if ($balance < $amountCoins) {
            $pdo->rollBack();
            json_response([
                'success' => false,
                'message' => 'Недостатньо монет. Баланс: ' . $balance . ', Потрібно: ' . $amountCoins,
                'balance' => $balance,
            ], 400);
        }

        // Deduct coins immediately (hold)
        $pdo->prepare('
            UPDATE user_coins
            SET coin_balance = coin_balance - :amt,
                total_spent  = total_spent  + :amt2,
                updated_at   = NOW()
            WHERE user_id = :uid
        ')->execute([':amt' => $amountCoins, ':amt2' => $amountCoins, ':uid' => $userId]);

        // Log the spending
        $pdo->prepare('
            INSERT INTO coin_spending (user_id, amount, type, description)
            VALUES (:uid, :amt, "withdraw", :desc)
        ')->execute([
            ':uid'  => $userId,
            ':amt'  => $amountCoins,
            ':desc' => 'Withdrawal request: ' . $amountCoins . ' coins → ' . $amountNative . ' ' . $currency . ' (' . $network . ')',
        ]);

        // Create withdrawal record
        $pdo->prepare("
            INSERT INTO crypto_withdrawals
                (user_id, currency, network, amount_coins, fee_coins, net_coins, amount_usd, usd_rate, amount_native, wallet_address, status)
            VALUES
                (:uid, :cur, :net, :coins, :fee, :net_coins, :usd, :rate, :native, :addr, 'pending')
        ")->execute([
            ':uid'       => $userId,
            ':cur'       => $currency,
            ':net'       => $network,
            ':coins'     => $amountCoins,
            ':fee'       => $feeCoins,
            ':net_coins' => $netCoins,
            ':usd'       => $amountUsd,
            ':rate'      => $usdRate,
            ':native'    => $amountNative,
            ':addr'      => $walletAddress,
        ]);
        $withdrawId = (int)$pdo->lastInsertId();
        record_rate_limit($pdo, 'withdraw:' . $userId);

        $pdo->commit();

        // Rotate session after sensitive financial operation
        rotate_session();

        // New balance
        $newBal = $pdo->prepare('SELECT coin_balance FROM user_coins WHERE user_id=:uid');
        $newBal->execute([':uid' => $userId]);
        $newBalance = (float)($newBal->fetch(PDO::FETCH_ASSOC)['coin_balance'] ?? 0);

        json_response([
            'success'        => true,
            'withdraw_id'    => $withdrawId,
            'amount_coins'   => $amountCoins,
            'fee_coins'      => $feeCoins,
            'net_coins'      => $netCoins,
            'amount_usd'     => $amountUsd,
            'amount_native'  => $amountNative,
            'currency'       => $currency,
            'network'        => $network,
            'wallet_address' => $walletAddress,
            'new_balance'    => $newBalance,
            'message'        => "Запит на вивід створено. {$netCoins} coins → ~{$amountNative} {$currency} ({$network}). Буде оброблено протягом 1–24 годин.",
        ]);

    } catch (\Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// ── POST cancel ───────────────────────────────────────────────────
function handleWithdrawCancel(PDO $pdo, int $userId, array $input): never {
    $withdrawId = (int)($input['withdraw_id'] ?? 0);
    if ($withdrawId <= 0)
        json_response(['success' => false, 'message' => 'Invalid withdraw_id'], 400);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            SELECT id, amount_coins, status FROM crypto_withdrawals
            WHERE id=:id AND user_id=:uid FOR UPDATE
        ");
        $stmt->execute([':id' => $withdrawId, ':uid' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Запит на вивід не знайдено'], 404);
        }
        if ($row['status'] !== 'pending') {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Запит вже оброблено (статус: ' . $row['status'] . ')'], 400);
        }

        $refundCoins = (float)$row['amount_coins'];

        // Refund coins
        $pdo->prepare('
            UPDATE user_coins
            SET coin_balance = coin_balance + :amt,
                total_spent  = GREATEST(0, total_spent - :amt2),
                updated_at   = NOW()
            WHERE user_id = :uid
        ')->execute([':amt' => $refundCoins, ':amt2' => $refundCoins, ':uid' => $userId]);

        // Mark cancelled
        $pdo->prepare("UPDATE crypto_withdrawals SET status='cancelled' WHERE id=:id")
            ->execute([':id' => $withdrawId]);

        // Reverse the coin_spending log
        $pdo->prepare('
            INSERT INTO coin_spending (user_id, amount, type, description)
            VALUES (:uid, :amt, "withdraw", :desc)
        ')->execute([
            ':uid'  => $userId,
            ':amt'  => -$refundCoins,
            ':desc' => 'Withdrawal cancelled — refund ' . $refundCoins . ' coins',
        ]);

        $pdo->commit();

        json_response([
            'success' => true,
            'message' => 'Запит на вивід скасовано. ' . $refundCoins . ' coins повернено на баланс.',
            'refunded_coins' => $refundCoins,
        ]);

    } catch (\Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// ── GET history ───────────────────────────────────────────────────
function handleWithdrawHistory(PDO $pdo, int $userId): never {
    $stmt = $pdo->prepare("
        SELECT id, currency, network, amount_coins, fee_coins, net_coins,
               amount_usd, usd_rate, amount_native, wallet_address,
               transaction_hash, status, admin_note, processed_at, created_at
        FROM crypto_withdrawals
        WHERE user_id=:uid
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute([':uid' => $userId]);

    json_response([
        'success'     => true,
        'withdrawals' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
}

// ── GET status ────────────────────────────────────────────────────
function handleWithdrawStatus(PDO $pdo, int $userId): never {
    $withdrawId = (int)($_GET['withdraw_id'] ?? 0);
    if ($withdrawId <= 0)
        json_response(['success' => false, 'message' => 'Invalid withdraw_id'], 400);

    $stmt = $pdo->prepare("
        SELECT id, currency, network, amount_coins, fee_coins, net_coins,
               amount_usd, usd_rate, amount_native, wallet_address,
               transaction_hash, status, admin_note, processed_at, created_at
        FROM crypto_withdrawals
        WHERE id=:id AND user_id=:uid LIMIT 1
    ");
    $stmt->execute([':id' => $withdrawId, ':uid' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row)
        json_response(['success' => false, 'message' => 'Запит не знайдено'], 404);

    json_response(['success' => true, 'withdrawal' => $row]);
}

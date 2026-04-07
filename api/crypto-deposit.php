<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/crypto-lib.php';
cors_headers(['GET', 'POST', 'OPTIONS']);

start_secure_session();
$pdo = db();
csrf_validate();

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0)
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);

$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'history';
        match ($action) {
            'history' => handleGetHistory($pdo, $userId),
            'status'  => handleGetStatus($pdo, $userId),
            'rates'   => handleGetRates(),
            default   => json_response(['success' => false, 'message' => 'Unknown action'], 400),
        };
    } elseif ($method === 'POST') {
        $input  = read_json();
        $action = $input['action'] ?? 'initiate';
        match ($action) {
            'initiate' => handleInitiate($pdo, $userId, $input),
            'confirm'  => handleConfirm($pdo, $userId, $input),
            'cancel'   => handleCancel($pdo, $userId, $input),
            default    => json_response(['success' => false, 'message' => 'Unknown action'], 400),
        };
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (\Exception $e) {
    error_log('crypto-deposit error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

// ── GET rates ─────────────────────────────────────────────────────
function handleGetRates(): never {
    json_response([
        'success'         => true,
        'rates'           => get_crypto_rates(),
        'coins_per_usd'   => COINS_PER_USD,
        'networks'        => array_keys(CRYPTO_WALLETS),
        'wallets'         => CRYPTO_WALLETS,
        'min_deposit_usd' => MIN_DEPOSIT_USD,
        'max_deposit_usd' => MAX_DEPOSIT_USD,
        'deposit_fee_pct' => DEPOSIT_FEE_PCT,
    ]);
}

// ── POST initiate ─────────────────────────────────────────────────
function handleInitiate(PDO $pdo, int $userId, array $input): never {
    // Rate limit: configurable deposit rate limit
    $rl = get_rate_limit('deposit');
    if (check_rate_limit($pdo, 'deposit:' . $userId, $rl[0], $rl[1]))
        json_response(['success' => false, 'message' => 'Too many deposit requests. Please wait.'], 429);

    $network = strtoupper(trim((string)($input['network'] ?? 'TRC20')));

    if (!array_key_exists($network, CRYPTO_WALLETS))
        json_response(['success' => false, 'message' => 'Unsupported network: ' . $network], 400);

    $wallets   = CRYPTO_WALLETS;
    $netCurr   = NETWORK_CURRENCY;
    $currency  = $netCurr[$network];
    $rates     = get_crypto_rates();
    $usdRate   = $rates[$currency] ?? 1.0;  // USD per 1 unit of currency

    // Amount in native currency (e.g. BTC or USDT)
    $amountNative = (float)($input['amount'] ?? 0);
    if ($amountNative <= 0)
        json_response(['success' => false, 'message' => 'Amount must be positive'], 400);

    // Convert to USD
    $amountUsd = $amountNative * $usdRate;

    if ($amountUsd < MIN_DEPOSIT_USD)
        json_response(['success' => false, 'message' => 'Мінімальний депозит: $' . MIN_DEPOSIT_USD . ' USD'], 400);
    if ($amountUsd > MAX_DEPOSIT_USD)
        json_response(['success' => false, 'message' => 'Максимальний депозит: $' . MAX_DEPOSIT_USD . ' USD'], 400);

    // Coins to credit (before fee — fee applied on confirmation)
    $amountCoins = round($amountUsd * COINS_PER_USD, 2);
    $feeCoins    = round($amountCoins * DEPOSIT_FEE_PCT / 100, 2);
    $netCoins    = $amountCoins - $feeCoins;
    $walletAddr  = $wallets[$network];
    $expiresAt   = date('Y-m-d H:i:s', strtotime('+' . DEPOSIT_EXPIRE_MINUTES . ' minutes'));

    // Cancel existing pending deposits for this user+network to avoid confusion
    $pdo->prepare("UPDATE crypto_deposits SET status='expired' WHERE user_id=:uid AND network=:net AND status='pending' AND expires_at <= NOW()")
        ->execute([':uid' => $userId, ':net' => $network]);

    // Check for active pending
    $existing = $pdo->prepare("SELECT id,wallet_address,amount_native,currency,network,amount_coins,expires_at FROM crypto_deposits WHERE user_id=:uid AND network=:net AND status='pending' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1");
    $existing->execute([':uid' => $userId, ':net' => $network]);
    $pending = $existing->fetch();

    if ($pending) {
        json_response([
            'success'        => true,
            'deposit_id'     => (int)$pending['id'],
            'wallet_address' => $pending['wallet_address'],
            'network'        => $pending['network'],
            'currency'       => $pending['currency'],
            'amount_native'  => (float)$pending['amount_native'],
            'amount_coins'   => (float)$pending['amount_coins'],
            'expires_at'     => $pending['expires_at'],
            'already_exists' => true,
            'message'        => 'У вас вже є активний депозит. Використай ту саму адресу.',
            'usd_rate'       => $usdRate,
            'coins_per_usd'  => COINS_PER_USD,
        ]);
    }

    $stmt = $pdo->prepare("
        INSERT INTO crypto_deposits
            (user_id, currency, amount_native, usd_rate, amount_usdt, amount_coins, exchange_rate, network, wallet_address, status, expires_at)
        VALUES
            (:uid, :cur, :native, :urate, :usdt, :coins, :rate, :net, :addr, 'pending', :exp)
    ");
    $stmt->execute([
        ':uid'    => $userId,
        ':cur'    => $currency,
        ':native' => $amountNative,
        ':urate'  => $usdRate,
        ':usdt'   => $amountUsd,
        ':coins'  => $amountCoins,
        ':rate'   => COINS_PER_USD,
        ':net'    => $network,
        ':addr'   => $walletAddr,
        ':exp'    => $expiresAt,
    ]);
    $depositId = (int)$pdo->lastInsertId();
    record_rate_limit($pdo, 'deposit:' . $userId);

    json_response([
        'success'        => true,
        'deposit_id'     => $depositId,
        'wallet_address' => $walletAddr,
        'network'        => $network,
        'currency'       => $currency,
        'amount_native'  => $amountNative,
        'amount_usdt'    => round($amountUsd, 2),
        'amount_coins'   => $amountCoins,
        'fee_coins'      => $feeCoins,
        'net_coins'      => $netCoins,
        'deposit_fee_pct'=> DEPOSIT_FEE_PCT,
        'usd_rate'       => $usdRate,
        'coins_per_usd'  => COINS_PER_USD,
        'expires_at'     => $expiresAt,
        'message'        => "Надішли {$amountNative} {$currency} ({$network}) на адресу нижче. Після відправки вкажи хеш транзакції. Комісія: " . DEPOSIT_FEE_PCT . "% ({$feeCoins} LOL).",
    ]);
}

// ── POST confirm (user submits tx hash — goes to PENDING ADMIN REVIEW) ──
function handleConfirm(PDO $pdo, int $userId, array $input): never {
    $depositId = (int)($input['deposit_id'] ?? 0);
    $txHash    = trim((string)($input['tx_hash'] ?? ''));

    if ($depositId <= 0)
        json_response(['success' => false, 'message' => 'Invalid deposit_id'], 400);
    if (strlen($txHash) < 10 || strlen($txHash) > 128)
        json_response(['success' => false, 'message' => 'Невірний хеш транзакції (10–128 символів)'], 400);
    if (!preg_match('/^[A-Fa-f0-9]+$/', $txHash) && !preg_match('/^[A-Za-z0-9]+$/', $txHash))
        json_response(['success' => false, 'message' => 'Хеш транзакції: тільки hex/base58 символи'], 400);

    // NOTE: TX hash is validated for format only. Actual blockchain verification
    // is performed by admin via admin-verify-deposit.php before coins are credited.
    // No coins are credited until admin manually approves the deposit.

    // Unique tx hash check
    $dup = $pdo->prepare('SELECT id FROM crypto_deposits WHERE transaction_hash=:h LIMIT 1');
    $dup->execute([':h' => $txHash]);
    if ($dup->fetch())
        json_response(['success' => false, 'message' => 'Цей хеш транзакції вже використано'], 409);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("SELECT id,amount_usdt,amount_coins,network,currency,status,expires_at FROM crypto_deposits WHERE id=:id AND user_id=:uid FOR UPDATE");
        $stmt->execute([':id' => $depositId, ':uid' => $userId]);
        $deposit = $stmt->fetch();

        if (!$deposit) { $pdo->rollBack(); json_response(['success' => false, 'message' => 'Депозит не знайдено'], 404); }
        if ($deposit['status'] !== 'pending') { $pdo->rollBack(); json_response(['success' => false, 'message' => 'Депозит вже оброблено (status: ' . $deposit['status'] . ')'], 400); }
        if (strtotime($deposit['expires_at']) < time()) {
            $pdo->prepare("UPDATE crypto_deposits SET status='expired' WHERE id=:id")->execute([':id' => $depositId]);
            $pdo->commit();
            json_response(['success' => false, 'message' => 'Час депозиту закінчився. Створи новий.'], 410);
        }

        // Mark as awaiting admin verification (not confirmed yet!)
        $pdo->prepare("UPDATE crypto_deposits SET status='pending', transaction_hash=:h WHERE id=:id")
            ->execute([':h' => $txHash, ':id' => $depositId]);

        $pdo->commit();

        // Rotate session after sensitive crypto operation
        rotate_session();

        // Best-effort RPC verification (non-blocking for user)
        $rpcResult = verify_transaction_rpc($txHash, $deposit['network']);

        json_response([
            'success' => true,
            'message' => 'Хеш транзакції прийнято. Депозит буде підтверджено адміністратором протягом 1–24 годин.',
            'deposit_id' => $depositId,
            'tx_hash'    => $txHash,
            'status'     => 'pending_review',
            'rpc_check'  => $rpcResult['verified'] ? 'found_on_chain' : 'pending',
        ]);
    } catch (\Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// ── POST cancel ───────────────────────────────────────────────────
function handleCancel(PDO $pdo, int $userId, array $input): never {
    $depositId = (int)($input['deposit_id'] ?? 0);
    if ($depositId <= 0)
        json_response(['success' => false, 'message' => 'Invalid deposit_id'], 400);

    $stmt = $pdo->prepare("UPDATE crypto_deposits SET status='failed' WHERE id=:id AND user_id=:uid AND status='pending'");
    $stmt->execute([':id' => $depositId, ':uid' => $userId]);

    if ($stmt->rowCount() === 0)
        json_response(['success' => false, 'message' => 'Депозит не знайдено або вже оброблено'], 404);

    json_response(['success' => true, 'message' => 'Депозит скасовано.']);
}

// ── GET history ───────────────────────────────────────────────────
function handleGetHistory(PDO $pdo, int $userId): never {
    $stmt = $pdo->prepare("
        SELECT id, currency, network, amount_native, usd_rate, amount_usdt, amount_coins,
               transaction_hash, status, admin_verified, wallet_address, expires_at, confirmed_at, created_at
        FROM crypto_deposits WHERE user_id=:uid ORDER BY created_at DESC LIMIT 50
    ");
    $stmt->execute([':uid' => $userId]);

    $pdo->prepare('INSERT IGNORE INTO user_coins (user_id) VALUES (:uid)')->execute([':uid' => $userId]);
    $coinStmt = $pdo->prepare('SELECT coin_balance, total_purchased, total_spent FROM user_coins WHERE user_id=:uid');
    $coinStmt->execute([':uid' => $userId]);
    $coins = $coinStmt->fetch();

    json_response([
        'success'         => true,
        'deposits'        => $stmt->fetchAll(),
        'coin_balance'    => (float)($coins['coin_balance']    ?? 0),
        'total_purchased' => (float)($coins['total_purchased'] ?? 0),
        'total_spent'     => (float)($coins['total_spent']     ?? 0),
        'coins_per_usd'   => COINS_PER_USD,
        'networks'        => array_keys(CRYPTO_WALLETS),
        'min_deposit_usd' => MIN_DEPOSIT_USD,
        'max_deposit_usd' => MAX_DEPOSIT_USD,
        'deposit_fee_pct' => DEPOSIT_FEE_PCT,
    ]);
}

// ── GET status ────────────────────────────────────────────────────
function handleGetStatus(PDO $pdo, int $userId): never {
    $depositId = (int)($_GET['deposit_id'] ?? 0);
    if ($depositId <= 0)
        json_response(['success' => false, 'message' => 'Invalid deposit_id'], 400);

    $stmt = $pdo->prepare("
        SELECT id, currency, network, amount_native, amount_usdt, amount_coins,
               transaction_hash, status, admin_verified, wallet_address, expires_at, confirmed_at, created_at
        FROM crypto_deposits WHERE id=:id AND user_id=:uid LIMIT 1
    ");
    $stmt->execute([':id' => $depositId, ':uid' => $userId]);
    $deposit = $stmt->fetch();

    if (!$deposit)
        json_response(['success' => false, 'message' => 'Депозит не знайдено'], 404);

    // Auto-expire
    if ($deposit['status'] === 'pending' && !$deposit['transaction_hash'] && strtotime($deposit['expires_at']) < time()) {
        $pdo->prepare("UPDATE crypto_deposits SET status='expired' WHERE id=:id")->execute([':id' => $depositId]);
        $deposit['status'] = 'expired';
    }

    json_response(['success' => true, 'deposit' => $deposit]);
}

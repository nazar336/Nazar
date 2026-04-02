<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/crypto-lib.php';
cors_headers(['GET', 'OPTIONS']);

if ($_SERVER['REQUEST_METHOD'] !== 'GET')
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);

json_response([
    'success'          => true,
    'rates'            => get_crypto_rates(),
    'coins_per_usd'    => COINS_PER_USD,
    'networks'         => array_keys(CRYPTO_WALLETS),
    'wallets'          => CRYPTO_WALLETS,
    'network_currency' => NETWORK_CURRENCY,
    'min_deposit_usd'  => MIN_DEPOSIT_USD,
    'max_deposit_usd'  => MAX_DEPOSIT_USD,
]);

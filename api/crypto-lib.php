<?php
declare(strict_types=1);
/**
 * Shared crypto helper — НЕ виводить нічого, тільки функції.
 * Підключається через require_once звідки потрібно.
 */

function get_crypto_rates(): array
{
    $fallback = [
        'USDT' => 1.0,
        'ETH'  => 3200.0,
        'BTC'  => 85000.0,
        'BNB'  => 580.0,
        'SOL'  => 150.0,
    ];

    $ttl = defined('CRYPTO_RATE_CACHE_TTL') ? CRYPTO_RATE_CACHE_TTL : 300;

    // Try unified cache first (Redis or file)
    $cached = cache_get('crypto_rates');
    if (is_array($cached) && isset($cached['BTC'])) return $cached;

    // Legacy file cache compatibility (< 5 min default)
    $legacyCache = sys_get_temp_dir() . '/lolance_rates.json';
    if (file_exists($legacyCache) && (time() - filemtime($legacyCache)) < $ttl) {
        $data = json_decode((string)file_get_contents($legacyCache), true);
        if (is_array($data) && isset($data['BTC'])) {
            cache_set('crypto_rates', $data, $ttl);
            return $data;
        }
    }

    $url = 'https://api.coingecko.com/api/v3/simple/price'
         . '?ids=bitcoin,ethereum,binancecoin,solana,tether'
         . '&vs_currencies=usd';
    $ctx  = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true]]);
    $body = @file_get_contents($url, false, $ctx);

    if (!$body) {
        error_log('LOLance: CoinGecko unavailable, using fallback rates');
        return $fallback;
    }

    $parsed = json_decode($body, true);
    if (!is_array($parsed)) return $fallback;

    $rates = [
        'USDT' => 1.0,
        'ETH'  => (float)($parsed['ethereum']['usd']    ?? $fallback['ETH']),
        'BTC'  => (float)($parsed['bitcoin']['usd']     ?? $fallback['BTC']),
        'BNB'  => (float)($parsed['binancecoin']['usd'] ?? $fallback['BNB']),
        'SOL'  => (float)($parsed['solana']['usd']      ?? $fallback['SOL']),
    ];

    // Store in both Redis/unified cache and legacy file
    cache_set('crypto_rates', $rates, $ttl);
    @file_put_contents($legacyCache, json_encode($rates), LOCK_EX);

    return $rates;
}

// ── Crypto address validation by network ──────────────────────────

/** Network-specific address regex patterns */
function get_address_patterns(): array
{
    return [
        'TRC20' => '/^T[1-9A-HJ-NP-Za-km-z]{33}$/',          // TRON base58, starts with T, 34 chars
        'BEP20' => '/^0x[0-9a-fA-F]{40}$/',                   // BSC (EVM), 0x + 40 hex
        'ERC20' => '/^0x[0-9a-fA-F]{40}$/',                   // Ethereum (EVM), 0x + 40 hex
        'BTC'   => '/^(1[1-9A-HJ-NP-Za-km-z]{25,34}|3[1-9A-HJ-NP-Za-km-z]{25,34}|bc1[0-9a-z]{39,59})$/',  // Legacy, P2SH, Bech32
        'SOL'   => '/^[1-9A-HJ-NP-Za-km-z]{32,44}$/',        // Solana base58, 32-44 chars
    ];
}

/**
 * Validate crypto wallet address format for a given network.
 * Returns true if the address matches the expected pattern.
 */
function validate_crypto_address(string $address, string $network): bool
{
    $patterns = get_address_patterns();
    if (!isset($patterns[$network])) {
        return false;
    }
    return (bool)preg_match($patterns[$network], $address);
}

// ── Blockchain RPC verification ───────────────────────────────────

/** RPC endpoints for blockchain verification (public nodes) */
function get_rpc_endpoints(): array
{
    return [
        'TRC20' => 'https://api.trongrid.io',
        'BEP20' => 'https://bsc-dataseed1.binance.org',
        'ERC20' => 'https://eth.llamarpc.com',
        'BTC'   => 'https://blockstream.info/api',
        'SOL'   => 'https://api.mainnet-beta.solana.com',
    ];
}

/**
 * Verify a transaction hash on the blockchain via public RPC.
 * Returns ['verified' => bool, 'confirmations' => int, 'error' => string|null]
 *
 * NOTE: This is best-effort verification. Admin should still review deposits manually.
 * RPC calls have a 10s timeout to avoid blocking the request.
 */
function verify_transaction_rpc(string $txHash, string $network): array
{
    $result = ['verified' => false, 'confirmations' => 0, 'error' => null];
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 10,
            'ignore_errors' => true,
            'header' => "Content-Type: application/json\r\n",
        ],
    ]);

    try {
        switch ($network) {
            case 'TRC20':
                $url  = 'https://api.trongrid.io/wallet/gettransactioninfobyid';
                $body = json_encode(['value' => $txHash]);
                $ctx  = stream_context_create([
                    'http' => [
                        'method'  => 'POST',
                        'timeout' => 10,
                        'ignore_errors' => true,
                        'header'  => "Content-Type: application/json\r\n",
                        'content' => $body,
                    ],
                ]);
                $resp = @file_get_contents($url, false, $ctx);
                if ($resp) {
                    $data = json_decode($resp, true);
                    if (!empty($data['id'])) {
                        $result['verified'] = true;
                        $result['confirmations'] = isset($data['blockNumber']) ? 1 : 0;
                    }
                }
                break;

            case 'BEP20':
            case 'ERC20':
                $rpcUrl = $network === 'BEP20'
                    ? 'https://bsc-dataseed1.binance.org'
                    : 'https://eth.llamarpc.com';
                $payload = json_encode([
                    'jsonrpc' => '2.0',
                    'method'  => 'eth_getTransactionReceipt',
                    'params'  => [$txHash],
                    'id'      => 1,
                ]);
                $ctx = stream_context_create([
                    'http' => [
                        'method'  => 'POST',
                        'timeout' => 10,
                        'ignore_errors' => true,
                        'header'  => "Content-Type: application/json\r\n",
                        'content' => $payload,
                    ],
                ]);
                $resp = @file_get_contents($rpcUrl, false, $ctx);
                if ($resp) {
                    $data = json_decode($resp, true);
                    if (!empty($data['result']['transactionHash'])) {
                        $result['verified'] = true;
                        $blockHex = $data['result']['blockNumber'] ?? '0x0';
                        $result['confirmations'] = hexdec($blockHex) > 0 ? 1 : 0;
                    }
                }
                break;

            case 'BTC':
                $url  = 'https://blockstream.info/api/tx/' . urlencode($txHash);
                $resp = @file_get_contents($url, false, $ctx);
                if ($resp) {
                    $data = json_decode($resp, true);
                    if (!empty($data['txid'])) {
                        $result['verified'] = true;
                        $result['confirmations'] = isset($data['status']['confirmed']) && $data['status']['confirmed'] ? 1 : 0;
                    }
                }
                break;

            case 'SOL':
                $payload = json_encode([
                    'jsonrpc' => '2.0',
                    'id'      => 1,
                    'method'  => 'getTransaction',
                    'params'  => [$txHash, ['encoding' => 'json', 'maxSupportedTransactionVersion' => 0]],
                ]);
                $ctx = stream_context_create([
                    'http' => [
                        'method'  => 'POST',
                        'timeout' => 10,
                        'ignore_errors' => true,
                        'header'  => "Content-Type: application/json\r\n",
                        'content' => $payload,
                    ],
                ]);
                $resp = @file_get_contents('https://api.mainnet-beta.solana.com', false, $ctx);
                if ($resp) {
                    $data = json_decode($resp, true);
                    if (!empty($data['result'])) {
                        $result['verified'] = true;
                        $result['confirmations'] = isset($data['result']['slot']) ? 1 : 0;
                    }
                }
                break;

            default:
                $result['error'] = 'Unsupported network for RPC verification';
        }
    } catch (\Throwable $e) {
        error_log('LOLance RPC verify error (' . $network . '): ' . $e->getMessage());
        $result['error'] = 'RPC verification temporarily unavailable';
    }

    return $result;
}

/**
 * Rotate session ID for sensitive operations (e.g. after crypto confirm).
 * Preserves session data but issues a new session ID.
 */
function rotate_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
    }
}

<?php
declare(strict_types=1);
/**
 * Shared crypto helper — НЕ виводить нічого, тільки функції.
 * Підключається через require_once звідки потрібно.
 */

function get_crypto_rates(): array
{
    $cache    = sys_get_temp_dir() . '/lolance_rates.json';
    $fallback = [
        'USDT' => 1.0,
        'ETH'  => 3200.0,
        'BTC'  => 85000.0,
        'BNB'  => 580.0,
        'SOL'  => 150.0,
    ];

    // Використати кеш якщо свіжий (< 5 хв)
    if (file_exists($cache) && (time() - filemtime($cache)) < 300) {
        $data = json_decode((string)file_get_contents($cache), true);
        if (is_array($data) && isset($data['BTC'])) return $data;
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

    @file_put_contents($cache, json_encode($rates));
    return $rates;
}

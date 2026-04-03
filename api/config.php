<?php
declare(strict_types=1);

// ── Load .env file if it exists ───────────────────────────────────
(function (): void {
    $envFile = dirname(__DIR__) . '/.env';
    if (!file_exists($envFile)) return;
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!$lines) return;
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (!str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value);
        // Remove surrounding quotes
        if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
            $value = substr($value, 1, -1);
        }
        if (!getenv($key)) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
        }
    }
})();

/**
 * Helper: get env variable with required/optional semantics.
 * In production, missing required vars trigger an error log.
 */
function env(string $key, ?string $default = null): string {
    $val = getenv($key);
    if ($val !== false && $val !== '') return $val;
    if ($default !== null) return $default;
    error_log("LOLance config: missing required env var {$key}");
    return '';
}

// ── Environment ───────────────────────────────────────────────────
define('APP_ENV',    env('APP_ENV', 'production'));
define('APP_DOMAIN', env('APP_DOMAIN', 'lolance.com'));

// ── Database ──────────────────────────────────────────────────────
define('DB_HOST', env('DB_HOST', '127.0.0.1'));
define('DB_NAME', env('DB_NAME', 'lolance'));
define('DB_USER', env('DB_USER'));
define('DB_PASS', env('DB_PASS'));

// ── Session ───────────────────────────────────────────────────────
define('SESSION_NAME', env('SESSION_NAME', 'lolance_session'));

// ── Email / SMTP ──────────────────────────────────────────────────
define('MAIL_FROM',      env('MAIL_FROM', 'noreply@lolance.com'));
define('MAIL_FROM_NAME', env('MAIL_FROM_NAME', 'LOLance'));
define('SMTP_HOST',      env('SMTP_HOST', 'smtp.gmail.com'));
define('SMTP_PORT',      (int) env('SMTP_PORT', '587'));
define('SMTP_USER',      env('SMTP_USER'));
define('SMTP_PASS',      env('SMTP_PASS'));

// ── Legal ─────────────────────────────────────────────────────────
define('TERMS_VERSION',   env('TERMS_VERSION', '2026-04-01'));
define('PRIVACY_VERSION', env('PRIVACY_VERSION', '2026-04-01'));

// ── Admin secret (для підтвердження депозитів) ────────────────────
define('ADMIN_SECRET', env('ADMIN_SECRET'));

// ── Rate limiting ─────────────────────────────────────────────────
define('LOGIN_MAX_ATTEMPTS',    (int) env('LOGIN_MAX_ATTEMPTS', '5'));
define('LOGIN_LOCKOUT_MINUTES', (int) env('LOGIN_LOCKOUT_MINUTES', '15'));

// ── Crypto wallets ────────────────────────────────────────────────
define('CRYPTO_WALLETS', [
    'TRC20' => env('CRYPTO_WALLET_TRC20'),
    'BEP20' => env('CRYPTO_WALLET_BEP20'),
    'ERC20' => env('CRYPTO_WALLET_ERC20'),
    'BTC'   => env('CRYPTO_WALLET_BTC'),
    'SOL'   => env('CRYPTO_WALLET_SOL'),
]);

// Мережа → валюта (для відображення)
define('NETWORK_CURRENCY', [
    'TRC20' => 'USDT',
    'BEP20' => 'USDT',
    'ERC20' => 'ETH',
    'BTC'   => 'BTC',
    'SOL'   => 'SOL',
]);

// Coins per 1 USD
define('COINS_PER_USD', (float) env('COINS_PER_USD', '100.0'));

// Мінімальний/максимальний депозит в USD
define('MIN_DEPOSIT_USD', (float) env('MIN_DEPOSIT_USD', '1.0'));
define('MAX_DEPOSIT_USD', (float) env('MAX_DEPOSIT_USD', '10000.0'));

define('DEPOSIT_EXPIRE_MINUTES', (int) env('DEPOSIT_EXPIRE_MINUTES', '60'));

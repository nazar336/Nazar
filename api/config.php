<?php
declare(strict_types=1);

// ── Environment ───────────────────────────────────────────────────
define('APP_ENV',    getenv('APP_ENV')    ?: 'production');
define('APP_DOMAIN', getenv('APP_DOMAIN') ?: 'lolance.com'); // ЗМІНИТИ на свій домен

// ── Database ──────────────────────────────────────────────────────
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('DB_NAME') ?: 'lolance');
define('DB_USER', getenv('DB_USER') ?: 'root');     // ЗМІНИТИ
define('DB_PASS', getenv('DB_PASS') ?: '');          // ЗМІНИТИ

// ── Session ───────────────────────────────────────────────────────
define('SESSION_NAME', 'lolance_session');

// ── Email / SMTP (Gmail) ──────────────────────────────────────────
// ! Використовуй App Password, НЕ звичайний пароль Gmail
// ! Як отримати: myaccount.google.com → Security → 2-Step Verification → App Passwords
define('MAIL_FROM',      'lolancefrelas@gmail.com');
define('MAIL_FROM_NAME', 'LOLance');
define('SMTP_HOST',      'smtp.gmail.com');
define('SMTP_PORT',      587);
define('SMTP_USER',      'lolancefrelas@gmail.com');
define('SMTP_PASS',      getenv('SMTP_PASS') ?: 'YOUR_GMAIL_APP_PASSWORD'); // ЗМІНИТИ

// ── Legal ─────────────────────────────────────────────────────────
define('TERMS_VERSION',   '2026-04-01');
define('PRIVACY_VERSION', '2026-04-01');

// ── Admin secret (для підтвердження депозитів) ────────────────────
define('ADMIN_SECRET', getenv('ADMIN_SECRET') ?: 'change-this-to-a-random-secret-key');

// ── Rate limiting ─────────────────────────────────────────────────
define('LOGIN_MAX_ATTEMPTS',    5);
define('LOGIN_LOCKOUT_MINUTES', 15);

// ── Crypto wallets ────────────────────────────────────────────────
define('CRYPTO_WALLETS', [
    'TRC20' => 'TLyCRCFjGAaCagESyZNJTWh1u8Yxz38HdU',
    'BEP20' => '0x8c275f4fc4dc2121e5322111448921eca6a42dc9',
    'ERC20' => '0x8c275f4fc4dc2121e5322111448921eca6a42dc9',
    'BTC'   => '14N6uCEx64Lv353znfaJ3V996asMgUPSWP',
    'SOL'   => 'GU2xLFTiau6hhLuTdhrCskTHYsu6SrSUuUw1cbgAWvrN',
]);

// Мережа → валюта (для відображення)
define('NETWORK_CURRENCY', [
    'TRC20' => 'USDT', // Tron — приймаємо USDT
    'BEP20' => 'USDT', // BNB Chain — приймаємо USDT
    'ERC20' => 'ETH',  // Ethereum — приймаємо ETH (не USDT, бо комісії величезні)
    'BTC'   => 'BTC',
    'SOL'   => 'SOL',
]);

// Coins per 1 USD
define('COINS_PER_USD', 100.0);

// Мінімальний депозит в USD
define('MIN_DEPOSIT_USD', 1.0);
define('MAX_DEPOSIT_USD', 10000.0);

define('DEPOSIT_EXPIRE_MINUTES', 60);

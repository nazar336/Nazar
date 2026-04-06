<?php
declare(strict_types=1);

// Ensure test environment
putenv('APP_ENV=testing');
putenv('DB_HOST=127.0.0.1');
putenv('DB_NAME=lolance_test');
putenv('DB_USER=test');
putenv('DB_PASS=test');
putenv('ADMIN_SECRET=test_secret_key_for_testing');
putenv('SMTP_PASS=test');
putenv('CRYPTO_WALLET_TRC20=TTestAddress123456789012345678901');
putenv('CRYPTO_WALLET_BEP20=0x0000000000000000000000000000000000000001');
putenv('CRYPTO_WALLET_ERC20=0x0000000000000000000000000000000000000002');
putenv('CRYPTO_WALLET_BTC=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

require_once __DIR__ . '/../vendor/autoload.php';

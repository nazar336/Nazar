<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class ConfigTest extends TestCase
{
    private bool $configLoaded = false;

    protected function setUp(): void
    {
        if (!$this->configLoaded) {
            // Set env vars before loading config
            putenv('APP_ENV=testing');
            putenv('DB_HOST=127.0.0.1');
            putenv('DB_NAME=lolance_test');
            putenv('DB_USER=test');
            putenv('DB_PASS=test');
            putenv('ADMIN_SECRET=test_secret_key');
            putenv('SMTP_PASS=test_smtp');
            putenv('CRYPTO_WALLET_TRC20=TTestAddr');
            putenv('CRYPTO_WALLET_BEP20=0x0000000000000000000000000000000000000001');
            putenv('CRYPTO_WALLET_ERC20=0x0000000000000000000000000000000000000002');
            putenv('CRYPTO_WALLET_BTC=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

            if (!defined('APP_ENV')) {
                require_once __DIR__ . '/../../api/config.php';
            }
            $this->configLoaded = true;
        }
    }

    public function testEnvFunctionExists(): void
    {
        $this->assertTrue(function_exists('env'));
    }

    public function testEnvReturnsEnvVar(): void
    {
        putenv('TEST_CONFIG_VAR=hello');
        $this->assertSame('hello', env('TEST_CONFIG_VAR'));
        putenv('TEST_CONFIG_VAR');
    }

    public function testEnvReturnsDefault(): void
    {
        $this->assertSame('fallback', env('NONEXISTENT_VAR_12345', 'fallback'));
    }

    public function testAppEnvDefined(): void
    {
        $this->assertTrue(defined('APP_ENV'));
    }

    public function testDbHostDefined(): void
    {
        $this->assertTrue(defined('DB_HOST'));
    }

    public function testDbNameDefined(): void
    {
        $this->assertTrue(defined('DB_NAME'));
    }

    public function testSessionNameDefined(): void
    {
        $this->assertTrue(defined('SESSION_NAME'));
        $this->assertSame('lolance_session', SESSION_NAME);
    }

    public function testCryptoWalletsDefined(): void
    {
        $this->assertTrue(defined('CRYPTO_WALLETS'));
        $this->assertIsArray(CRYPTO_WALLETS);
        $this->assertArrayHasKey('TRC20', CRYPTO_WALLETS);
        $this->assertArrayHasKey('BEP20', CRYPTO_WALLETS);
        $this->assertArrayHasKey('BTC', CRYPTO_WALLETS);
    }

    public function testNetworkCurrencyDefined(): void
    {
        $this->assertTrue(defined('NETWORK_CURRENCY'));
        $this->assertIsArray(NETWORK_CURRENCY);
        $this->assertSame('USDT', NETWORK_CURRENCY['TRC20']);
        $this->assertSame('BTC', NETWORK_CURRENCY['BTC']);
    }

    public function testCoinsPerUsd(): void
    {
        $this->assertTrue(defined('COINS_PER_USD'));
        $this->assertSame(100.0, COINS_PER_USD);
    }

    public function testDepositLimits(): void
    {
        $this->assertTrue(defined('MIN_DEPOSIT_USD'));
        $this->assertTrue(defined('MAX_DEPOSIT_USD'));
        $this->assertGreaterThan(0, MIN_DEPOSIT_USD);
        $this->assertGreaterThan(MIN_DEPOSIT_USD, MAX_DEPOSIT_USD);
    }

    public function testRateLimitConstants(): void
    {
        $this->assertTrue(defined('LOGIN_MAX_ATTEMPTS'));
        $this->assertTrue(defined('LOGIN_LOCKOUT_MINUTES'));
        $this->assertSame(5, LOGIN_MAX_ATTEMPTS);
        $this->assertSame(15, LOGIN_LOCKOUT_MINUTES);
    }

    public function testNoHardcodedSecrets(): void
    {
        // Config should NOT have hardcoded fallback secrets visible
        $configContent = file_get_contents(__DIR__ . '/../../api/config.php');
        $this->assertStringNotContainsString('change-this-to-a-random-secret-key', $configContent);
        $this->assertStringNotContainsString('YOUR_GMAIL_APP_PASSWORD', $configContent);
    }
}

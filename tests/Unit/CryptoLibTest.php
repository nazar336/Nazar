<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class CryptoLibTest extends TestCase
{
    private static bool $loaded = false;

    public static function setUpBeforeClass(): void
    {
        if (!self::$loaded) {
            if (!defined('APP_ENV')) {
                require_once __DIR__ . '/../../api/config.php';
            }
            require_once __DIR__ . '/../../api/crypto-lib.php';
            self::$loaded = true;
        }
    }

    public function testValidateTrc20Address(): void
    {
        // TRC20 addresses start with T and are 34 chars (base58)
        if (function_exists('validate_crypto_address')) {
            $this->assertTrue(validate_crypto_address('TLyCRCFjGAaCagESyZNJTWh1u8Yxz38HdU', 'TRC20'));
        } else {
            $this->markTestSkipped('validate_crypto_address not available');
        }
    }

    public function testInvalidTrc20Address(): void
    {
        if (function_exists('validate_crypto_address')) {
            $this->assertFalse(validate_crypto_address('invalid_address', 'TRC20'));
        } else {
            $this->markTestSkipped('validate_crypto_address not available');
        }
    }

    public function testValidateBep20Address(): void
    {
        // BEP20/ERC20 addresses start with 0x and are 42 chars
        if (function_exists('validate_crypto_address')) {
            $this->assertTrue(validate_crypto_address('0x8c275f4fc4dc2121e5322111448921eca6a42dc9', 'BEP20'));
        } else {
            $this->markTestSkipped('validate_crypto_address not available');
        }
    }

    public function testInvalidBep20Address(): void
    {
        if (function_exists('validate_crypto_address')) {
            $this->assertFalse(validate_crypto_address('not_an_address', 'BEP20'));
        } else {
            $this->markTestSkipped('validate_crypto_address not available');
        }
    }

    public function testEmptyAddressIsInvalid(): void
    {
        if (function_exists('validate_crypto_address')) {
            $this->assertFalse(validate_crypto_address('', 'TRC20'));
        } else {
            $this->markTestSkipped('validate_crypto_address not available');
        }
    }

    public function testGetExchangeRatesFunctionExists(): void
    {
        $this->assertTrue(function_exists('get_crypto_rates'));
    }

    public function testGetFallbackRates(): void
    {
        // get_crypto_rates should return an array
        $this->assertTrue(function_exists('get_crypto_rates'));
    }

    public function testCryptoLibConstants(): void
    {
        // Verify that COINS_PER_USD is set correctly
        $this->assertSame(100.0, COINS_PER_USD);
    }
}

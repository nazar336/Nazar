<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

class BootstrapHelpersTest extends TestCase
{
    private static bool $loaded = false;

    public static function setUpBeforeClass(): void
    {
        if (!self::$loaded) {
            // Load config first (sets constants)
            if (!defined('APP_ENV')) {
                require_once __DIR__ . '/../../api/config.php';
            }
            // Load bootstrap for helper functions
            // We need to capture the headers / session calls
            if (!function_exists('normalize_email')) {
                // Define stubs for functions that need session/output
                require_once __DIR__ . '/../../api/bootstrap.php';
            }
            self::$loaded = true;
        }
    }

    public function testNormalizeEmailLowercases(): void
    {
        $this->assertSame('test@example.com', normalize_email('  TEST@EXAMPLE.COM  '));
    }

    public function testNormalizeEmailTrims(): void
    {
        $this->assertSame('user@test.com', normalize_email('  user@test.com  '));
    }

    public function testNormalizeEmailPreservesValid(): void
    {
        $this->assertSame('hello@world.org', normalize_email('hello@world.org'));
    }

    public function testPublicUserReturnsExpectedKeys(): void
    {
        $row = [
            'id' => '42',
            'name' => 'John',
            'username' => 'john_doe',
            'email' => 'john@example.com',
            'password_hash' => '$2y$10$secret',
            'extra_field' => 'should not appear',
        ];
        $result = public_user($row);
        $this->assertSame(42, $result['id']);
        $this->assertSame('John', $result['name']);
        $this->assertSame('john_doe', $result['username']);
        $this->assertSame('john@example.com', $result['email']);
        $this->assertArrayNotHasKey('password_hash', $result);
        $this->assertArrayNotHasKey('extra_field', $result);
    }

    public function testReadJsonReturnsArrayForEmptyInput(): void
    {
        // read_json reads from php://input which is empty in CLI
        $result = read_json();
        $this->assertIsArray($result);
    }

    public function testCsrfTokenFunctionExists(): void
    {
        $this->assertTrue(function_exists('csrf_token'));
    }

    public function testCsrfValidateFunctionExists(): void
    {
        $this->assertTrue(function_exists('csrf_validate'));
    }

    public function testJsonResponseFunctionExists(): void
    {
        $this->assertTrue(function_exists('json_response'));
    }

    public function testDbFunctionExists(): void
    {
        $this->assertTrue(function_exists('db'));
    }

    public function testCorsHeadersFunctionExists(): void
    {
        $this->assertTrue(function_exists('cors_headers'));
    }

    public function testCheckRateLimitFunctionExists(): void
    {
        $this->assertTrue(function_exists('check_rate_limit'));
    }

    public function testRecordRateLimitFunctionExists(): void
    {
        $this->assertTrue(function_exists('record_rate_limit'));
    }

    public function testStartSecureSessionFunctionExists(): void
    {
        $this->assertTrue(function_exists('start_secure_session'));
    }
}

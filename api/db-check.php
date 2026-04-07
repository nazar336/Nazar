<?php
/**
 * Lolanceizi — Database Diagnostic & Auto-Setup
 * 
 * Usage:
 *   GET  /api/db-check.php?secret=YOUR_ADMIN_SECRET           — check status
 *   POST /api/db-check.php?secret=YOUR_ADMIN_SECRET&action=setup — create tables
 *
 * Protected by ADMIN_SECRET (from .env).
 */
declare(strict_types=1);
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// ── Auth: require admin secret ────────────────────────────────────
$secret = $_GET['secret'] ?? $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
if ($secret === '' || !defined('ADMIN_SECRET') || ADMIN_SECRET === '' || $secret !== ADMIN_SECRET) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden. Provide ?secret=YOUR_ADMIN_SECRET or X-Admin-Secret header.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// ── Step 1: Check .env loading ────────────────────────────────────
$envStatus = [
    'DB_HOST'  => DB_HOST !== '' ? DB_HOST : '(empty!)',
    'DB_NAME'  => DB_NAME !== '' ? DB_NAME : '(empty!)',
    'DB_USER'  => DB_USER !== '' ? substr(DB_USER, 0, 3) . '***' : '(empty!)',
    'DB_PASS'  => DB_PASS !== '' ? '***set***' : '(EMPTY — this is the problem!)',
    'APP_ENV'  => APP_ENV,
];

$envFile = dirname(__DIR__) . '/.env';
$envFileExists = file_exists($envFile);

// ── Step 2: Try to connect to DB ──────────────────────────────────
$dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
$dbError = null;
$pdo = null;

try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    $dbError = $e->getMessage();
}

// ── Step 3: Check tables ──────────────────────────────────────────
$requiredTables = [
    'users', 'legal_acceptances', 'email_verifications', 'tasks',
    'task_assignments', 'transactions', 'message_threads', 'messages',
    'notifications', 'support_tickets', 'ticket_responses', 'achievements',
    'task_reviews', 'user_coins', 'crypto_deposits', 'crypto_withdrawals',
    'daily_checkins', 'daily_visits', 'chat_room_passes', 'chat_room_messages',
    'coin_spending', 'feed_posts', 'feed_likes', 'login_attempts',
];

$existingTables = [];
$missingTables  = [];

if ($pdo !== null) {
    $stmt = $pdo->query('SHOW TABLES');
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $missingTables = array_values(array_diff($requiredTables, $existingTables));
}

// ── Step 4: Auto-setup if requested ───────────────────────────────
$setupResult = null;
$action = $_GET['action'] ?? '';

if ($action === 'setup' && $_SERVER['REQUEST_METHOD'] === 'POST' && $pdo !== null) {
    $schemaFile = dirname(__DIR__) . '/full-schema.sql';
    if (!file_exists($schemaFile)) {
        $setupResult = ['success' => false, 'message' => 'full-schema.sql not found in project root'];
    } else {
        $sql = file_get_contents($schemaFile);
        // Remove the CREATE DATABASE / USE lines (commented out anyway)
        $sql = preg_replace('/^--\s*(CREATE DATABASE|USE\s).*$/m', '', $sql);
        // Remove SQL comments
        $sql = preg_replace('/^--.*$/m', '', $sql);
        
        $errors = [];
        $created = 0;
        
        // Split by semicolons and execute each statement
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        foreach ($statements as $statement) {
            if ($statement === '') continue;
            try {
                $pdo->exec($statement);
                $created++;
            } catch (PDOException $e) {
                // Ignore "table already exists" errors
                if (strpos($e->getMessage(), 'already exists') === false) {
                    $errors[] = substr($e->getMessage(), 0, 200);
                }
            }
        }
        
        // Re-check tables after setup
        $stmt = $pdo->query('SHOW TABLES');
        $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $missingTables = array_values(array_diff($requiredTables, $existingTables));
        
        $setupResult = [
            'success'    => count($errors) === 0,
            'statements' => $created,
            'errors'     => $errors,
            'message'    => count($errors) === 0 
                ? "Всі таблиці створені успішно! ({$created} statements)" 
                : 'Деякі запити повернули помилки',
        ];
    }
}

// ── Build response ────────────────────────────────────────────────
$result = [
    'success' => true,
    'env_file_exists' => $envFileExists,
    'env_values' => $envStatus,
    'db_connection' => $dbError === null ? 'OK' : 'FAILED',
];

if ($dbError !== null) {
    $result['db_error'] = $dbError;
    $result['hints'] = [];
    
    if (str_contains($dbError, 'Access denied')) {
        $result['hints'][] = 'Неправильний DB_USER або DB_PASS. Перевірте .env файл.';
    }
    if (str_contains($dbError, 'Unknown database')) {
        $result['hints'][] = 'База даних "' . DB_NAME . '" не існує. Створіть її в phpMyAdmin.';
        $result['hints'][] = 'На Hostinger назва БД має префікс, наприклад: u310037570_lolanceizi';
    }
    if (str_contains($dbError, 'Connection refused') || str_contains($dbError, 'No such file')) {
        $result['hints'][] = 'MySQL сервер не відповідає на ' . DB_HOST;
        $result['hints'][] = 'На Hostinger DB_HOST має бути "localhost" (не 127.0.0.1)';
    }
    if (str_contains($dbError, 'getaddrinfo')) {
        $result['hints'][] = 'Невідомий хост: ' . DB_HOST . '. Перевірте DB_HOST в .env';
    }
} else {
    $result['tables'] = [
        'existing_count' => count($existingTables),
        'existing'       => $existingTables,
        'missing_count'  => count($missingTables),
        'missing'        => $missingTables,
    ];
    
    if (count($missingTables) > 0) {
        $result['action_needed'] = 'Таблиці відсутні! Відправ POST запит з ?action=setup щоб створити їх автоматично.';
        $result['setup_command'] = 'curl -X POST "https://' . APP_DOMAIN . '/api/db-check.php?secret=YOUR_SECRET&action=setup"';
    } else {
        $result['status'] = '✅ Всі ' . count($requiredTables) . ' таблиць на місці. База даних готова!';
    }
    
    if ($setupResult !== null) {
        $result['setup_result'] = $setupResult;
    }
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

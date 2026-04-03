<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self'; frame-ancestors 'self'");

// ── Helpers ───────────────────────────────────────────────────────

function json_response(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function cors_headers(array $allowedMethods = ['GET', 'POST', 'OPTIONS']): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host   = $_SERVER['HTTP_HOST'] ?? '';
    if ($origin !== '' && parse_url($origin, PHP_URL_HOST) === $host) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: ' . implode(', ', $allowedMethods));
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Allow-Credentials: true');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

function start_secure_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name(SESSION_NAME);
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'domain'   => '',
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        error_log('LOLance DB error: ' . $e->getMessage());
        http_response_code(503);
        echo json_encode(['success' => false, 'message' => 'Database unavailable']);
        exit;
    }
    return $pdo;
}

/**
 * Generic IP-based rate limiter using login_attempts table.
 * $identifier — unique key (e.g. "register:IP", "support:userID")
 * $maxAttempts — how many allowed within $windowMinutes
 * Returns true if limit exceeded.
 */
function check_rate_limit(PDO $pdo, string $identifier, int $maxAttempts, int $windowMinutes): bool {
    $window = date('Y-m-d H:i:s', strtotime('-' . $windowMinutes . ' minutes'));
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE identifier = :id AND attempted_at >= :window');
    $stmt->execute([':id' => $identifier, ':window' => $window]);
    return (int)$stmt->fetchColumn() >= $maxAttempts;
}

function record_rate_limit(PDO $pdo, string $identifier): void {
    $pdo->prepare('INSERT INTO login_attempts (identifier) VALUES (:id)')->execute([':id' => $identifier]);
}

function read_json(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

// ── CSRF protection ──────────────────────────────────────────────

function csrf_token(): string {
    if (session_status() !== PHP_SESSION_ACTIVE) start_secure_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Validate CSRF token from X-CSRF-Token header on state-changing requests.
 * Call after start_secure_session() on POST/PUT/DELETE endpoints.
 */
function csrf_validate(): void {
    if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'OPTIONS') return;
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token) || empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        json_response(['success' => false, 'message' => 'Invalid CSRF token'], 403);
    }
}

function normalize_email(string $e): string {
    return mb_strtolower(trim($e));
}

function public_user(array $row): array {
    return [
        'id'       => (int)$row['id'],
        'name'     => $row['name'],
        'username' => $row['username'],
        'email'    => $row['email'],
    ];
}

function validate_registration(array $data): array {
    $name     = trim((string)($data['name']     ?? ''));
    $username = preg_replace('/\s+/', '', trim((string)($data['username'] ?? '')));
    $email    = normalize_email((string)($data['email']    ?? ''));
    $password = (string)($data['password'] ?? '');

    if ($name === '' || $username === '' || $email === '' || $password === '')
        json_response(['success' => false, 'message' => 'Заповни всі поля.'], 422);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))
        json_response(['success' => false, 'message' => 'Email некоректний.'], 422);
    if (!preg_match('/^[a-zA-Z0-9_]{3,32}$/', $username))
        json_response(['success' => false, 'message' => 'Username: 3–32 символи, букви/цифри/_.'], 422);
    if (mb_strlen($name) < 2 || mb_strlen($name) > 80)
        json_response(['success' => false, 'message' => "Ім'я: 2–80 символів."], 422);
    if (strlen($password) < 8)
        json_response(['success' => false, 'message' => 'Пароль мінімум 8 символів.'], 422);
    if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password))
        json_response(['success' => false, 'message' => 'Пароль: букви і цифри.'], 422);

    return [$name, $username, $email, $password];
}

// ── SMTP Mailer ───────────────────────────────────────────────────

function send_verification_email(string $toEmail, string $toName, string $code): bool {
    $subject = 'LOLance — код верифікації';
    $name    = trim($toName) !== '' ? $toName : 'User';
    $body    = "Привіт, {$name}!\n\nТвій код верифікації LOLance: {$code}\n\nКод дійсний 15 хвилин.\n\nЯкщо ти не реєструвався — проігноруй цей лист.";

    return smtp_send(SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_FROM_NAME, $toEmail, $name, $subject, $body);
}

function smtp_send(
    string $host, int $port,
    string $authUser, string $authPass,
    string $fromEmail, string $fromName,
    string $toEmail, string $toName,
    string $subject, string $body
): bool {
    $errno  = 0;
    $errstr = '';

    // Open TCP connection
    $sock = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 10);
    if (!$sock) {
        error_log("SMTP connect failed: {$errstr}");
        return false;
    }
    stream_set_timeout($sock, 10);

    $read = fn() => fgets($sock, 1024);
    $write = function (string $line) use ($sock): void { fputs($sock, $line . "\r\n"); };
    $code = fn(string $r): int => (int)substr(trim($r), 0, 3);

    try {
        $r = $read(); // greeting
        if ($code($r) !== 220) throw new \RuntimeException("Bad greeting: $r");

        $write("EHLO " . (gethostname() ?: 'localhost'));
        do { $r = $read(); } while (isset($r[3]) && $r[3] === '-'); // drain EHLO
        if ($code($r) < 200 || $code($r) > 299) throw new \RuntimeException("EHLO failed: $r");

        // STARTTLS
        $write("STARTTLS");
        $r = $read();
        if ($code($r) !== 220) throw new \RuntimeException("STARTTLS failed: $r");

        if (!stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new \RuntimeException("TLS handshake failed");
        }

        $write("EHLO " . (gethostname() ?: 'localhost'));
        do { $r = $read(); } while (isset($r[3]) && $r[3] === '-');

        // AUTH LOGIN
        $write("AUTH LOGIN");
        $r = $read();
        if ($code($r) !== 334) throw new \RuntimeException("AUTH LOGIN failed: $r");

        $write(base64_encode($authUser));
        $r = $read();
        if ($code($r) !== 334) throw new \RuntimeException("Username rejected: $r");

        $write(base64_encode($authPass));
        $r = $read();
        if ($code($r) !== 235) throw new \RuntimeException("Auth failed: $r");

        // MAIL FROM
        $write("MAIL FROM:<{$fromEmail}>");
        $r = $read();
        if ($code($r) !== 250) throw new \RuntimeException("MAIL FROM failed: $r");

        // RCPT TO
        $write("RCPT TO:<{$toEmail}>");
        $r = $read();
        if ($code($r) !== 250 && $code($r) !== 251) throw new \RuntimeException("RCPT TO failed: $r");

        // DATA
        $write("DATA");
        $r = $read();
        if ($code($r) !== 354) throw new \RuntimeException("DATA failed: $r");

        $encSubject  = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $encFrom     = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
        $encTo       = '=?UTF-8?B?' . base64_encode($toName)   . '?=';
        $encodedBody = chunk_split(base64_encode($body));

        $write("From: {$encFrom} <{$fromEmail}>");
        $write("To: {$encTo} <{$toEmail}>");
        $write("Subject: {$encSubject}");
        $write("MIME-Version: 1.0");
        $write("Content-Type: text/plain; charset=UTF-8");
        $write("Content-Transfer-Encoding: base64");
        $write("");
        fputs($sock, $encodedBody . "\r\n.\r\n");

        $r = $read();
        if ($code($r) !== 250) throw new \RuntimeException("Message rejected: $r");

        $write("QUIT");
        fclose($sock);
        return true;

    } catch (\Throwable $e) {
        error_log('LOLance SMTP error: ' . $e->getMessage());
        if (is_resource($sock)) fclose($sock);
        return false;
    }
}

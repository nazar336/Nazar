<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['POST', 'OPTIONS']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST')
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);

$data     = read_json();
$email    = normalize_email((string)($data['email']    ?? ''));
$password = (string)($data['password'] ?? '');

if ($email === '' || $password === '')
    json_response(['success' => false, 'message' => 'Введи email і пароль.'], 422);

$pdo = db();
$ip  = substr((string)($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 0, 45);

// ── Rate limiting ─────────────────────────────────────────────────
$window = date('Y-m-d H:i:s', strtotime('-' . LOGIN_LOCKOUT_MINUTES . ' minutes'));

$attStmt = $pdo->prepare('
    SELECT COUNT(*) FROM login_attempts
    WHERE identifier = :id AND attempted_at >= :window
');
$attStmt->execute([':id' => $email, ':window' => $window]);
if ((int)$attStmt->fetchColumn() >= LOGIN_MAX_ATTEMPTS)
    json_response(['success' => false, 'message' => 'Забагато спроб. Спробуй через ' . LOGIN_LOCKOUT_MINUTES . ' хвилин.'], 429);

// ── Authenticate ──────────────────────────────────────────────────
$stmt = $pdo->prepare('SELECT id,name,username,email,password_hash,is_active FROM users WHERE email=:e LIMIT 1');
$stmt->execute(['e' => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    // Log failed attempt
    $pdo->prepare('INSERT INTO login_attempts (identifier) VALUES (:id)')->execute([':id' => $email]);
    json_response(['success' => false, 'message' => 'Невірний email або пароль.'], 401);
}

if (!(bool)$user['is_active']) {
    // Check if there's a pending verification
    $vStmt = $pdo->prepare('SELECT id FROM email_verifications WHERE user_id=:uid AND is_verified=FALSE LIMIT 1');
    $vStmt->execute(['uid' => (int)$user['id']]);
    $hasPendingVerification = (bool)$vStmt->fetch();

    json_response([
        'success' => false,
        'message' => 'Акаунт не активовано. Перевір email для верифікації.',
        'needs_verification' => $hasPendingVerification,
        'user_id' => (int)$user['id'],
    ], 403);
}

// ── Clean old attempts on success ─────────────────────────────────
$pdo->prepare('DELETE FROM login_attempts WHERE identifier=:id')->execute([':id' => $email]);

start_secure_session();
session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];
unset($_SESSION['is_guest']);

json_response(['success' => true, 'csrf_token' => csrf_token(), 'user' => public_user($user)]);

<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['POST', 'OPTIONS']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST')
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);

$data   = read_json();
$userId = (int)($data['user_id'] ?? 0);
$code   = (string)($data['code']    ?? '');

if ($userId <= 0 || $code === '')
    json_response(['success' => false, 'message' => 'Не всі поля заповнені.'], 422);
if (!preg_match('/^\d{6}$/', $code))
    json_response(['success' => false, 'message' => 'Код повинен бути 6 цифр.'], 422);

$pdo = db();

// Rate limit verification attempts per IP to prevent brute force
$ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 0, 45);
if (check_rate_limit($pdo, 'verify:' . $ip, 10, 15))
    json_response(['success' => false, 'message' => 'Забагато спроб верифікації. Спробуй через 15 хвилин.'], 429);

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT id,verification_code,attempts,expires_at FROM email_verifications WHERE user_id=:uid AND is_verified=FALSE LIMIT 1 FOR UPDATE');
    $stmt->execute(['uid' => $userId]);
    $verification = $stmt->fetch();

    if (!$verification) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Верифікація не знайдена.'], 404);
    }
    if (strtotime($verification['expires_at']) < time()) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Код закінчив дію. Зареєструйся заново.'], 401);
    }
    if ((int)$verification['attempts'] >= 5) {
        $pdo->rollBack();
        json_response(['success' => false, 'message' => 'Забагато невдалих спроб. Спробуй пізніше.'], 429);
    }
    if ($verification['verification_code'] !== $code) {
        $pdo->prepare('UPDATE email_verifications SET attempts=attempts+1 WHERE id=:id')->execute(['id' => $verification['id']]);
        $pdo->commit();
        record_rate_limit($pdo, 'verify:' . $ip);
        json_response(['success' => false, 'message' => 'Неправильний код.'], 401);
    }

    $pdo->prepare('UPDATE email_verifications SET is_verified=TRUE WHERE id=:id')->execute(['id' => $verification['id']]);
    $pdo->prepare('UPDATE users SET is_active=TRUE WHERE id=:uid')->execute(['uid' => $userId]);
    $pdo->commit();

    $getUserStmt = $pdo->prepare('SELECT id,name,username,email FROM users WHERE id=:uid LIMIT 1');
    $getUserStmt->execute(['uid' => $userId]);
    $user = $getUserStmt->fetch();

    start_secure_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;

    json_response(['success' => true, 'message' => 'Акаунт активований!', 'user' => public_user($user)]);
} catch (\Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Verify error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Помилка верифікації.'], 500);
}

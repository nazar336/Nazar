<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['POST', 'OPTIONS']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST')
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);

$data   = read_json();
$action = (string)($data['action'] ?? 'verify');
$userId = (int)($data['user_id'] ?? 0);

$pdo = db();

// Rate limit verification attempts per IP to prevent brute force
$ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'), 0, 45);
if (check_rate_limit($pdo, 'verify:' . $ip, 10, 15))
    json_response(['success' => false, 'message' => 'Забагато спроб верифікації. Спробуй через 15 хвилин.'], 429);

// ── Resend verification code ──────────────────────────────────────
if ($action === 'resend') {
    $email = normalize_email((string)($data['email'] ?? ''));

    if ($userId <= 0 || $email === '')
        json_response(['success' => false, 'message' => 'Не всі поля заповнені.'], 422);

    // Look up the inactive user
    $userStmt = $pdo->prepare('SELECT id, name, email FROM users WHERE id=:uid AND email=:e AND is_active=FALSE LIMIT 1');
    $userStmt->execute(['uid' => $userId, 'e' => $email]);
    $user = $userStmt->fetch();

    if (!$user)
        json_response(['success' => false, 'message' => 'Користувача не знайдено або акаунт вже активований.'], 404);

    // Generate new code and update the verification record
    $newCode = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    $pdo->beginTransaction();
    try {
        // Delete old verification record and insert new one
        $pdo->prepare('DELETE FROM email_verifications WHERE user_id=:uid')->execute(['uid' => $userId]);
        $pdo->prepare('INSERT INTO email_verifications (user_id,verification_code,expires_at) VALUES (:uid,:code,DATE_ADD(NOW(),INTERVAL 15 MINUTE))')
            ->execute(['uid' => $userId, 'code' => $newCode]);
        $pdo->commit();

        $mailSent = send_verification_email($user['email'], $user['name'], $newCode);

        // Only record rate limit after successful operation
        record_rate_limit($pdo, 'verify:' . $ip);

        $response = ['success' => true, 'message' => 'Новий код верифікації надіслано на email.'];
        if (!$mailSent) {
            error_log('Lolanceizi: resend verification email failed for user ' . $userId . ' (' . $email . ')');
            if (APP_ENV === 'development') {
                $response['message'] = 'DEV MODE: mail не відправлено, код: ' . $newCode;
                error_log('Lolanceizi DEV: resend verification code for user ' . $userId . ': ' . $newCode);
            } else {
                $response['message'] = 'Не вдалося відправити email. Спробуйте пізніше або зверніться в підтримку.';
            }
        }
        json_response($response);
    } catch (\Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Resend verify error: ' . $e->getMessage());
        json_response(['success' => false, 'message' => 'Помилка при повторній відправці коду.'], 500);
    }
}

// ── Verify code ───────────────────────────────────────────────────
$code   = (string)($data['code']    ?? '');

if ($userId <= 0 || $code === '')
    json_response(['success' => false, 'message' => 'Не всі поля заповнені.'], 422);
if (!preg_match('/^\d{6}$/', $code))
    json_response(['success' => false, 'message' => 'Код повинен бути 6 цифр.'], 422);

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
    unset($_SESSION['is_guest']);

    json_response(['success' => true, 'message' => 'Акаунт активований!', 'user' => public_user($user)]);
} catch (\Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Verify error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Помилка верифікації.'], 500);
}

<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['POST', 'OPTIONS']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST')
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);

$payload = read_json();
[$name, $username, $email, $password] = validate_registration($payload);

$acceptedTerms   = !empty($payload['accept_terms']);
$acceptedPrivacy = !empty($payload['accept_privacy']);
if (!$acceptedTerms || !$acceptedPrivacy)
    json_response(['success' => false, 'message' => 'Для реєстрації потрібно погодитись з Правилами платформи та Політикою приватності.'], 422);

$pdo   = db();

// Rate limit: configurable registrations per IP
$ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
$rl = get_rate_limit('register');
if (check_rate_limit($pdo, 'register:' . $ip, $rl[0], $rl[1]))
    json_response(['success' => false, 'message' => 'Забагато спроб реєстрації. Спробуй через 15 хвилин.'], 429);

$check = $pdo->prepare('SELECT id FROM users WHERE email=:e OR username=:u LIMIT 1');
$check->execute(['e' => $email, 'u' => $username]);
if ($check->fetch())
    json_response(['success' => false, 'message' => 'Користувач з таким email або username вже існує.'], 409);

$hash             = password_hash($password, PASSWORD_DEFAULT);
$verificationCode = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

// Create user first, then attempt to send email
$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('INSERT INTO users (name,username,email,password_hash,is_active) VALUES (:n,:u,:e,:h,FALSE)');
    $stmt->execute(['n' => $name, 'u' => $username, 'e' => $email, 'h' => $hash]);
    $userId = (int)$pdo->lastInsertId();

    $userAgent = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);

    $legalStmt = $pdo->prepare('INSERT INTO legal_acceptances (user_id,doc_type,doc_version,accepted_ip,user_agent) VALUES (:uid,:type,:ver,:ip,:ua)');
    $legalStmt->execute(['uid' => $userId, 'type' => 'terms',   'ver' => TERMS_VERSION,   'ip' => $ip, 'ua' => $userAgent]);
    $legalStmt->execute(['uid' => $userId, 'type' => 'privacy', 'ver' => PRIVACY_VERSION, 'ip' => $ip, 'ua' => $userAgent]);

    $verifyStmt = $pdo->prepare('INSERT INTO email_verifications (user_id,verification_code,expires_at) VALUES (:uid,:code,DATE_ADD(NOW(),INTERVAL 15 MINUTE))');
    $verifyStmt->execute(['uid' => $userId, 'code' => $verificationCode]);

    $pdo->commit();

    // Record rate limit only after successful user creation
    record_rate_limit($pdo, 'register:' . $ip);

    // Try to send verification email (non-blocking — user is already created)
    $mailSent = send_verification_email($email, $name, $verificationCode);

    $response = ['success' => true, 'message' => 'Реєстрація успішна. Код верифікації надіслано на email.', 'user_id' => $userId];
    if (!$mailSent) {
        error_log('Lolanceizi: verification email failed for user ' . $userId . ' (' . $email . ')');
        if (APP_ENV === 'development') {
            $response['message'] = 'DEV MODE: mail не відправлено, код записано в лог сервера.';
            error_log('Lolanceizi DEV: verification code for user ' . $userId . ': ' . $verificationCode);
        } else {
            $response['message'] = 'Реєстрація успішна, але email не відправлено. Зверніться в підтримку для активації акаунту.';
        }
    }
    json_response($response);
} catch (\Exception $e) {
    $pdo->rollBack();
    error_log('Register error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Помилка при реєстрації.'], 500);
}

<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['GET', 'OPTIONS']);

if ($_SERVER['REQUEST_METHOD'] !== 'GET')
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);

start_secure_session();

if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id']  = 0;
    $_SESSION['is_guest'] = true;
}

if ((int)$_SESSION['user_id'] === 0) {
    json_response(['success' => true, 'csrf_token' => csrf_token(), 'user' => [
        'id' => 0, 'name' => 'Guest', 'username' => 'guest_user',
        'email' => 'guest@lolanceizi.local', 'is_guest' => true,
    ]]);
}

$pdo  = db();
$stmt = $pdo->prepare('SELECT id,name,username,email FROM users WHERE id=:id AND is_active=TRUE LIMIT 1');
$stmt->execute(['id' => (int)$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    // Session user no longer valid — reset
    session_destroy();
    start_secure_session();
    json_response(['success' => true, 'csrf_token' => csrf_token(), 'user' => [
        'id' => 0, 'name' => 'Guest', 'username' => 'guest_user',
        'email' => 'guest@lolanceizi.local', 'is_guest' => true,
    ]]);
}

json_response(['success' => true, 'csrf_token' => csrf_token(), 'user' => public_user($user)]);

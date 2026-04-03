<?php
declare(strict_types=1);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) === $host) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/bootstrap.php';
start_secure_session();

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0) {
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

/*
 * Ієрархія кімнат:
 *  tier 1 — 🌐 Global   : all users
 *  tier 2 — ⚪ Silver   : Level 3+ (або пас: 200 монет / 7 днів)
 *  tier 3 — 🟡 Gold     : Level 6+ (або пас: 500 монет / 7 днів)
 *  tier 4 — 💎 Diamond  : Level 9+ (або пас: 1000 монет / 7 днів)
 */
const ROOMS = [
    1 => ['name' => 'Global',  'emoji' => '🌐', 'min_level' => 1, 'pass_coins' => 0,    'pass_days' => 0],
    2 => ['name' => 'Silver',  'emoji' => '⚪', 'min_level' => 3, 'pass_coins' => 200,  'pass_days' => 7],
    3 => ['name' => 'Gold',    'emoji' => '🟡', 'min_level' => 6, 'pass_coins' => 500,  'pass_days' => 7],
    4 => ['name' => 'Diamond', 'emoji' => '💎', 'min_level' => 9, 'pass_coins' => 1000, 'pass_days' => 7],
];

const MESSAGES_LIMIT = 60;
const MESSAGE_COOLDOWN_SECONDS = 2;

try {
    if ($method === 'GET') {
        $tier = isset($_GET['tier']) ? (int)$_GET['tier'] : 0;
        if ($tier >= 1 && $tier <= 4) {
            handleGetMessages($pdo, $userId, $tier);
        } else {
            handleGetRooms($pdo, $userId);
        }
    } elseif ($method === 'POST') {
        $input  = read_json();
        $action = $input['action'] ?? '';
        match ($action) {
            'send'     => handleSend($pdo, $userId, $input),
            'buy_pass' => handleBuyPass($pdo, $userId, $input),
            default    => json_response(['success' => false, 'message' => 'Unknown action'], 400),
        };
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (\Exception $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

/* ── Отримати XP/Level юзера ── */
function getUserProgress(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare('SELECT xp, level FROM users WHERE id=:uid LIMIT 1');
    $stmt->execute([':uid' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: ['xp' => 0, 'level' => 1];
    return ['xp' => (int)$row['xp'], 'level' => (int)$row['level']];
}

/* ── Перевірити доступ до кімнати ── */
function canAccessRoom(PDO $pdo, int $userId, int $tier, int $userLevel): bool
{
    if ($tier < 1 || $tier > 4) return false;
    $room = ROOMS[$tier];
    if ($tier === 1) return true;
    if ($userLevel >= $room['min_level']) return true;
    if ($room['pass_coins'] === 0) return true; // bronze: free

    // Перевірити активний пас
    $stmt = $pdo->prepare('SELECT id FROM chat_room_passes WHERE user_id=:uid AND room_tier=:tier AND expires_at > NOW() LIMIT 1');
    $stmt->execute([':uid' => $userId, ':tier' => $tier]);
    return (bool)$stmt->fetch();
}

/* ── GET: список кімнат з метаданими ── */
function handleGetRooms(PDO $pdo, int $userId): never
{
    $progress = getUserProgress($pdo, $userId);
    $userXp = $progress['xp'];
    $userLevel = $progress['level'];

    $roomList = [];
    foreach (ROOMS as $tier => $room) {
        $hasAccess = canAccessRoom($pdo, $userId, $tier, $userLevel);

        // Активний пас
        $passExpires = null;
        if (!$hasAccess || $userLevel < $room['min_level']) {
            $passStmt = $pdo->prepare('SELECT expires_at FROM chat_room_passes WHERE user_id=:uid AND room_tier=:tier AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1');
            $passStmt->execute([':uid' => $userId, ':tier' => $tier]);
            $passRow = $passStmt->fetch(PDO::FETCH_ASSOC);
            if ($passRow) {
                $hasAccess  = true;
                $passExpires = $passRow['expires_at'];
            }
        }

        // Кількість онлайн (approximation: повідомлення за останні 5 хв)
        $onlineStmt = $pdo->prepare('SELECT COUNT(DISTINCT user_id) FROM chat_room_messages WHERE room_tier=:tier AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)');
        $onlineStmt->execute([':tier' => $tier]);
        $online = (int)$onlineStmt->fetchColumn();

        $roomList[] = [
            'tier'        => $tier,
            'name'        => $room['name'],
            'emoji'       => $room['emoji'],
            'min_level'   => $room['min_level'],
            'is_global'   => $tier === 1,
            'pass_coins'  => $room['pass_coins'],
            'pass_days'   => $room['pass_days'],
            'has_access'  => $hasAccess,
            'pass_expires'=> $passExpires,
            'online'      => $online,
        ];
    }

    json_response([
        'success'    => true,
        'user_xp'    => $userXp,
        'user_level' => $userLevel,
        'rooms'      => $roomList,
    ]);
}

/* ── GET ?tier=N: повідомлення кімнати ── */
function handleGetMessages(PDO $pdo, int $userId, int $tier): never
{
    $progress = getUserProgress($pdo, $userId);
    if (!canAccessRoom($pdo, $userId, $tier, $progress['level'])) {
        json_response(['success' => false, 'message' => 'Access denied. Not enough level or no active pass.'], 403);
    }

    $stmt = $pdo->prepare('
        SELECT crm.id, crm.user_id, crm.username, crm.message, crm.created_at,
               u.name
        FROM chat_room_messages crm
        JOIN users u ON u.id = crm.user_id
        WHERE crm.room_tier=:tier
        ORDER BY crm.created_at DESC
        LIMIT :lim
    ');
    $stmt->bindValue(':tier', $tier, PDO::PARAM_INT);
    $stmt->bindValue(':lim', MESSAGES_LIMIT, PDO::PARAM_INT);
    $stmt->execute();
    $msgs = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));

    json_response([
        'success'    => true,
        'tier'       => $tier,
        'messages'   => $msgs,
        'user_xp'    => $progress['xp'],
        'user_level' => $progress['level'],
    ]);
}

/* ── POST send: надіслати повідомлення ── */
function handleSend(PDO $pdo, int $userId, array $input): never
{
    $tier    = (int)($input['tier']    ?? 0);
    $message = trim((string)($input['message'] ?? ''));

    if ($tier < 1 || $tier > 4) {
        json_response(['success' => false, 'message' => 'Invalid room'], 400);
    }
    if ($message === '' || mb_strlen($message) > 500) {
        json_response(['success' => false, 'message' => 'Message is empty or too long'], 400);
    }

    $progress = getUserProgress($pdo, $userId);
    if (!canAccessRoom($pdo, $userId, $tier, $progress['level'])) {
        json_response(['success' => false, 'message' => 'Access denied'], 403);
    }

    // Rate limit: max 60 messages per 5 min
    if (check_rate_limit($pdo, 'chat:' . $userId, 60, 5))
        json_response(['success' => false, 'message' => 'You are sending messages too fast. Please wait.'], 429);

    $cooldownStmt = $pdo->prepare('SELECT created_at FROM chat_room_messages WHERE user_id=:uid ORDER BY created_at DESC LIMIT 1');
    $cooldownStmt->execute([':uid' => $userId]);
    $lastCreated = $cooldownStmt->fetchColumn();
    if ($lastCreated) {
        $seconds = time() - strtotime((string)$lastCreated);
        if ($seconds < MESSAGE_COOLDOWN_SECONDS) {
            json_response(['success' => false, 'message' => 'You are sending messages too fast. Please wait a moment.'], 429);
        }
    }

    // Отримати username
    $uStmt = $pdo->prepare('SELECT username FROM users WHERE id=:uid');
    $uStmt->execute([':uid' => $userId]);
    $username = (string)($uStmt->fetchColumn() ?? 'unknown');

    $pdo->prepare('
        INSERT INTO chat_room_messages (room_tier, user_id, username, message)
        VALUES (:tier, :uid, :uname, :msg)
    ')->execute([':tier' => $tier, ':uid' => $userId, ':uname' => $username, ':msg' => $message]);

    $msgId = (int)$pdo->lastInsertId();
    record_rate_limit($pdo, 'chat:' . $userId);

    json_response([
        'success' => true,
        'message' => [
            'id'         => $msgId,
            'user_id'    => $userId,
            'username'   => $username,
            'message'    => $message,
            'created_at' => date('Y-m-d H:i:s'),
        ],
    ]);
}

/* ── POST buy_pass: купити пас до кімнати за монети ── */
function handleBuyPass(PDO $pdo, int $userId, array $input): never
{
    $tier = (int)($input['tier'] ?? 0);
    if ($tier < 2 || $tier > 4) {
        json_response(['success' => false, 'message' => 'Invalid room tier for pass purchase'], 400);
    }

    $room      = ROOMS[$tier];
    $coinsCost = $room['pass_coins'];
    $days      = $room['pass_days'];

    $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT IGNORE INTO user_coins (user_id) VALUES (:uid)')->execute([':uid' => $userId]);
        $coinStmt = $pdo->prepare('SELECT coin_balance FROM user_coins WHERE user_id=:uid FOR UPDATE');
        $coinStmt->execute([':uid' => $userId]);
        $balance = (float)($coinStmt->fetchColumn() ?? 0);

        if ($balance < $coinsCost) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => "Not enough coins. Need {$coinsCost} coins for {$room['name']} pass."], 400);
        }

        // Якщо вже є активний пас — продовжити від поточного expires_at
        $existingStmt = $pdo->prepare('SELECT id, expires_at FROM chat_room_passes WHERE user_id=:uid AND room_tier=:tier AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1');
        $existingStmt->execute([':uid' => $userId, ':tier' => $tier]);
        $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $baseDate  = $existing['expires_at'];
            $expiresAt = date('Y-m-d H:i:s', strtotime($baseDate . " +{$days} days"));
            $pdo->prepare('UPDATE chat_room_passes SET expires_at=:exp, coins_paid=coins_paid+:cost WHERE id=:id')
                ->execute([':exp' => $expiresAt, ':cost' => $coinsCost, ':id' => $existing['id']]);
        } else {
            $expiresAt = date('Y-m-d H:i:s', strtotime("+{$days} days"));
            $pdo->prepare('INSERT INTO chat_room_passes (user_id, room_tier, coins_paid, expires_at) VALUES (:uid, :tier, :cost, :exp)')
                ->execute([':uid' => $userId, ':tier' => $tier, ':cost' => $coinsCost, ':exp' => $expiresAt]);
        }

        // Списати монети
        $pdo->prepare('UPDATE user_coins SET coin_balance=coin_balance-:cost, total_spent=total_spent+:cost WHERE user_id=:uid')
            ->execute([':cost' => $coinsCost, ':uid' => $userId]);

        $pdo->prepare('INSERT INTO coin_spending (user_id, amount, type, description) VALUES (:uid, :amt, "premium", :desc)')
            ->execute([':uid' => $userId, ':amt' => $coinsCost, ':desc' => "{$room['emoji']} {$room['name']} chat pass ({$days} days)"]);

        $pdo->commit();
    } catch (\Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

    json_response([
        'success'     => true,
        'tier'        => $tier,
        'expires_at'  => $expiresAt,
        'coins_spent' => $coinsCost,
        'message'     => "Access to {$room['emoji']} {$room['name']} room granted until {$expiresAt}",
    ]);
}
?>

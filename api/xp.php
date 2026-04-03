<?php
declare(strict_types=1);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) === $host) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/bootstrap.php';
start_secure_session();
csrf_validate();

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0) {
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

/* ─────── Константи ─────── */
const XP_DAILY_CHECKIN = 10;
const XP_DAILY_VISIT   = 5;
const XP_BUY_RATE      = 100; // скільки XP за 1 купівлю
const COINS_BUY_RATE   = 50;  // скільки монет коштує 1 купівля

/* ─────── Level Privileges Map ─────── */
const LEVEL_PRIVILEGES = [
    1  => ['max_tasks' => 3,   'can_create' => false, 'max_reward' => 0,      'feed_media' => 'none',  'take_difficulty' => ['easy'],                  'badge' => '🌱', 'title' => 'Newcomer'],
    2  => ['max_tasks' => 5,   'can_create' => false, 'max_reward' => 0,      'feed_media' => 'image', 'take_difficulty' => ['easy','medium'],          'badge' => '📸', 'title' => 'Explorer'],
    3  => ['max_tasks' => 7,   'can_create' => true,  'max_reward' => 1000,   'feed_media' => 'image', 'take_difficulty' => ['easy','medium'],          'badge' => '🛠', 'title' => 'Creator'],
    4  => ['max_tasks' => 10,  'can_create' => true,  'max_reward' => 2500,   'feed_media' => 'video', 'take_difficulty' => ['easy','medium'],          'badge' => '🎬', 'title' => 'Producer'],
    5  => ['max_tasks' => 13,  'can_create' => true,  'max_reward' => 5000,   'feed_media' => 'video', 'take_difficulty' => ['easy','medium','hard'],   'badge' => '⚔️', 'title' => 'Warrior'],
    6  => ['max_tasks' => 16,  'can_create' => true,  'max_reward' => 10000,  'feed_media' => 'all',   'take_difficulty' => ['easy','medium','hard'],   'badge' => '🥇', 'title' => 'Champion'],
    7  => ['max_tasks' => 20,  'can_create' => true,  'max_reward' => 25000,  'feed_media' => 'all',   'take_difficulty' => ['easy','medium','hard'],   'badge' => '💎', 'title' => 'Expert'],
    8  => ['max_tasks' => 25,  'can_create' => true,  'max_reward' => 50000,  'feed_media' => 'all',   'take_difficulty' => ['easy','medium','hard'],   'badge' => '🔥', 'title' => 'Elite'],
    9  => ['max_tasks' => 30,  'can_create' => true,  'max_reward' => 100000, 'feed_media' => 'all',   'take_difficulty' => ['easy','medium','hard'],   'badge' => '👑', 'title' => 'Master'],
    10 => ['max_tasks' => 40,  'can_create' => true,  'max_reward' => 500000, 'feed_media' => 'all',   'take_difficulty' => ['easy','medium','hard'],   'badge' => '🌟', 'title' => 'Grandmaster'],
    11 => ['max_tasks' => 50,  'can_create' => true,  'max_reward' => 999999, 'feed_media' => 'all',   'take_difficulty' => ['easy','medium','hard'],   'badge' => '⚡', 'title' => 'Titan'],
    12 => ['max_tasks' => 999, 'can_create' => true,  'max_reward' => 999999, 'feed_media' => 'all',   'take_difficulty' => ['easy','medium','hard'],   'badge' => '🏆', 'title' => 'Legend'],
];

try {
    if ($method === 'GET') {
        handleGetPoints($pdo, $userId);
    } elseif ($method === 'POST') {
        $input  = read_json();
        $action = $input['action'] ?? '';
        match ($action) {
            'checkin'     => handleCheckin($pdo, $userId),
            'daily_visit' => handleDailyVisit($pdo, $userId),
            'buy_points'  => handleBuyPoints($pdo, $userId, $input),
            'buy_xp'      => handleBuyPoints($pdo, $userId, $input),
            default       => json_response(['success' => false, 'message' => 'Unknown action'], 400),
        };
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

function addXp(PDO $pdo, int $userId, int $amount): array
{
    // xp is updated first (left-to-right in SET), so level calculation uses already-updated xp
    $pdo->prepare('UPDATE users SET xp=xp+:xp, level=LEAST(12, FLOOR(xp/1000)+1) WHERE id=:uid')
        ->execute([':xp' => $amount, ':uid' => $userId]);
    $stmt = $pdo->prepare('SELECT xp, level FROM users WHERE id=:uid');
    $stmt->execute([':uid' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: ['xp' => 0, 'level' => 1];
    return ['xp' => (int)$row['xp'], 'level' => (int)$row['level']];
}

/* ══ GET: XP/Level + check-in календар ══ */
function handleGetPoints(PDO $pdo, int $userId): never
{
    $stmt = $pdo->prepare('SELECT xp, level FROM users WHERE id=:uid');
    $stmt->execute([':uid' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?? ['xp' => 0, 'level' => 1];

    // Останні 30 днів check-in
    $since = date('Y-m-d', strtotime('-29 days'));
    $ciStmt = $pdo->prepare('SELECT checkin_date, points_earned FROM daily_checkins WHERE user_id=:uid AND checkin_date >= :since ORDER BY checkin_date');
    $ciStmt->execute([':uid' => $userId, ':since' => $since]);
    $checkins = $ciStmt->fetchAll(PDO::FETCH_ASSOC);

    // Перевірити чи вже зроблено check-in сьогодні
    $today = date('Y-m-d');
    $doneToday = false;
    foreach ($checkins as $ci) {
        if ($ci['checkin_date'] === $today) { $doneToday = true; break; }
    }

    // Серія (consecutive streak)
    $streak = 0;
    $checkDate = new DateTime($today);
    $checkinSet = array_column($checkins, 'checkin_date');
    while (in_array($checkDate->format('Y-m-d'), $checkinSet, true)) {
        $streak++;
        $checkDate->modify('-1 day');
    }

    // Чи отримав щоденний візит бонус
    $visitStmt = $pdo->prepare('SELECT visit_date FROM daily_visits WHERE user_id=:uid AND visit_date=:today LIMIT 1');
    $visitStmt->execute([':uid' => $userId, ':today' => $today]);
    $visitedToday = (bool)$visitStmt->fetch();

    json_response([
        'success'        => true,
        'xp'             => (int)$row['xp'],
        'level'          => (int)$row['level'],
        'checkin_streak' => $streak,
        'done_today'     => $doneToday,
        'visited_today'  => $visitedToday,
        'checkins'       => $checkins,   // [{checkin_date, points_earned}, …]
        'privileges'     => LEVEL_PRIVILEGES[(int)$row['level']] ?? LEVEL_PRIVILEGES[1],
        'next_privileges'=> (int)$row['level'] < 12 ? LEVEL_PRIVILEGES[(int)$row['level'] + 1] : null,
        'all_privileges' => LEVEL_PRIVILEGES,
    ]);
}

/* ══ POST checkin: щоденний check-in ══ */
function handleCheckin(PDO $pdo, int $userId): never
{
    $today = date('Y-m-d');

    $pdo->beginTransaction();
    try {
        // Перевірити чи ще не зроблено
        $check = $pdo->prepare('SELECT id FROM daily_checkins WHERE user_id=:uid AND checkin_date=:d FOR UPDATE');
        $check->execute([':uid' => $userId, ':d' => $today]);
        if ($check->fetch()) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Already checked in today'], 409);
        }

        // Порахувати серію для бонусу
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $streakStmt = $pdo->prepare('SELECT checkin_date FROM daily_checkins WHERE user_id=:uid AND checkin_date=:d');
        $streakStmt->execute([':uid' => $userId, ':d' => $yesterday]);
        $hadYest = (bool)$streakStmt->fetch();

        $streak = 1;
        if ($hadYest) {
            $allStmt = $pdo->prepare('SELECT checkin_date FROM daily_checkins WHERE user_id=:uid ORDER BY checkin_date DESC');
            $allStmt->execute([':uid' => $userId]);
            $dates = array_column($allStmt->fetchAll(PDO::FETCH_ASSOC), 'checkin_date');
            $cur = new DateTime($yesterday);
            foreach ($dates as $d) {
                if ($d === $cur->format('Y-m-d')) { $streak++; $cur->modify('-1 day'); }
                else break;
            }
        }

        // Бонус: +5 за кожен 7-й день серії
        $bonus = (int)floor($streak / 7) * 5;
        $earned = XP_DAILY_CHECKIN + $bonus;

        $pdo->prepare('INSERT INTO daily_checkins (user_id, checkin_date, points_earned) VALUES (:uid, :d, :pts)')
            ->execute([':uid' => $userId, ':d' => $today, ':pts' => $earned]);

        $new = addXp($pdo, $userId, $earned);
        $pdo->commit();

        json_response([
            'success'     => true,
            'xp_earned'   => $earned,
            'streak'      => $streak,
            'xp'          => $new['xp'],
            'level'       => $new['level'],
            'bonus'       => $bonus,
        ]);
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ((int)$e->getCode() === 23000) {
            json_response(['success' => false, 'message' => 'Already checked in today'], 409);
        }
        throw $e;
    }
}

/* ══ POST daily_visit: 5 XP за перший візит за день ══ */
function handleDailyVisit(PDO $pdo, int $userId): never
{
    $today = date('Y-m-d');

    $pdo->beginTransaction();
    try {
        $exists = $pdo->prepare('SELECT id FROM daily_visits WHERE user_id=:uid AND visit_date=:d FOR UPDATE');
        $exists->execute([':uid' => $userId, ':d' => $today]);
        if ($exists->fetch()) {
            $pdo->rollBack();
            json_response(['success' => true, 'already_visited' => true, 'xp_earned' => 0]);
        }

        $pdo->prepare('INSERT INTO daily_visits (user_id, visit_date, points_earned) VALUES (:uid, :d, :pts)')
            ->execute([':uid' => $userId, ':d' => $today, ':pts' => XP_DAILY_VISIT]);

        $new = addXp($pdo, $userId, XP_DAILY_VISIT);
        $pdo->commit();

        json_response([
            'success'         => true,
            'already_visited' => false,
            'xp_earned'       => XP_DAILY_VISIT,
            'xp'              => $new['xp'],
            'level'           => $new['level'],
        ]);
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ((int)$e->getCode() === 23000) {
            json_response(['success' => true, 'already_visited' => true, 'xp_earned' => 0]);
        }
        throw $e;
    }
}

/* ══ POST buy_points/buy_xp: витратити монети, отримати XP ══ */
function handleBuyPoints(PDO $pdo, int $userId, array $input): never
{
    $packs = (int)($input['packs'] ?? 1); // 1 пак = 50 монет = 100 XP
    if ($packs < 1 || $packs > 100) {
        json_response(['success' => false, 'message' => 'Invalid pack count (1-100)'], 400);
    }

    // Rate limit: max 10 XP purchases per user per 60 min
    if (check_rate_limit($pdo, 'buy_xp:' . $userId, 10, 60))
        json_response(['success' => false, 'message' => 'Too many XP purchases. Please wait.'], 429);
    record_rate_limit($pdo, 'buy_xp:' . $userId);

    $coinsNeeded  = $packs * COINS_BUY_RATE;   // 50 монет за пак
    $xpToGive = $packs * XP_BUY_RATE;

    $pdo->beginTransaction();
    try {
        // Заблокувати та перевірити баланс монет
        $pdo->prepare('INSERT IGNORE INTO user_coins (user_id) VALUES (:uid)')->execute([':uid' => $userId]);
        $coinStmt = $pdo->prepare('SELECT coin_balance FROM user_coins WHERE user_id=:uid FOR UPDATE');
        $coinStmt->execute([':uid' => $userId]);
        $coinBalance = (float)($coinStmt->fetchColumn() ?? 0);

        if ($coinBalance < $coinsNeeded) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Not enough coins. Need ' . $coinsNeeded . ' coins.'], 400);
        }

        // Списати монети
        $pdo->prepare('UPDATE user_coins SET coin_balance=coin_balance-:cost, total_spent=total_spent+:cost WHERE user_id=:uid')
            ->execute([':cost' => $coinsNeeded, ':uid' => $userId]);

        // Зафіксувати витрати
        $pdo->prepare('INSERT INTO coin_spending (user_id, amount, type, description) VALUES (:uid, :amt, "premium", :desc)')
            ->execute([':uid' => $userId, ':amt' => $coinsNeeded, ':desc' => "Bought {$xpToGive} XP"]);

        $new = addXp($pdo, $userId, $xpToGive);
        $pdo->commit();
    } catch (\Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

    json_response([
        'success'        => true,
        'xp_earned'      => $xpToGive,
        'coins_spent'    => $coinsNeeded,
        'xp'             => $new['xp'],
        'level'          => $new['level'],
    ]);
}
?>

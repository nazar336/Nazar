<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
cors_headers(['GET', 'POST', 'OPTIONS']);
start_secure_session();
csrf_validate();

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0) {
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

/* ─────── Constants ─────── */
const GAME_CASE_OPEN     = 'case_open';
const GAME_PRICE_PREDICT = 'price_predict';
const ALLOWED_GAMES = [GAME_CASE_OPEN, GAME_PRICE_PREDICT];

// Case costs and max prize amounts for server-side validation
const CASE_COSTS = [
    'bronze'   => 50,
    'silver'   => 150,
    'gold'     => 500,
    'platinum' => 1500,
    'diamond'  => 5000,
];

const CASE_MAX_COINS_PRIZE = [
    'bronze'   => 80,
    'silver'   => 250,
    'gold'     => 700,
    'platinum' => 2000,
    'diamond'  => 6500,
];

const CASE_MAX_XP_PRIZE = [
    'bronze'   => 8,
    'silver'   => 15,
    'gold'     => 25,
    'platinum' => 50,
    'diamond'  => 80,
];

// Price prediction limits
const PREDICT_MIN_BET = 10;
const PREDICT_MAX_BET = 5000;
const PREDICT_TIMEFRAMES = ['5s', '15s', '30s'];
const PREDICT_PAYOUT_PCT = [
    '5s'  => 90,
    '15s' => 80,
    '30s' => 70,
];

try {
    if ($method === 'GET') {
        handleGetStats($pdo, $userId);
    } elseif ($method === 'POST') {
        $input = read_json();
        $action = $input['action'] ?? '';
        match ($action) {
            'case_open'     => handleCaseOpen($pdo, $userId, $input),
            'price_predict' => handlePricePredict($pdo, $userId, $input),
            default         => json_response(['success' => false, 'message' => 'Unknown action'], 400),
        };
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    error_log('mini-games error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

/* ══ GET: game stats ══ */
function handleGetStats(PDO $pdo, int $userId): never
{
    $stmt = $pdo->prepare('SELECT xp, level FROM users WHERE id=:uid');
    $stmt->execute([':uid' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?? ['xp' => 0, 'level' => 1];

    $coinStmt = $pdo->prepare('SELECT coin_balance FROM users WHERE id=:uid');
    $coinStmt->execute([':uid' => $userId]);
    $coinRow = $coinStmt->fetch(PDO::FETCH_ASSOC);

    json_response([
        'success'      => true,
        'xp'           => (int)$row['xp'],
        'level'        => (int)$row['level'],
        'coin_balance' => (int)($coinRow['coin_balance'] ?? 0),
        'games'        => ALLOWED_GAMES,
    ]);
}

/* ══ POST case_open: open a case ══ */
function handleCaseOpen(PDO $pdo, int $userId, array $input): never
{
    $caseId     = trim((string)($input['case_id'] ?? ''));
    $cost       = (int)($input['cost'] ?? 0);
    $prizeType  = trim((string)($input['prize_type'] ?? ''));
    $prizeAmount = (int)($input['prize_amount'] ?? 0);

    // Validate case
    if (!isset(CASE_COSTS[$caseId])) {
        json_response(['success' => false, 'message' => 'Unknown case'], 400);
    }

    // Validate cost matches server definition
    if ($cost !== CASE_COSTS[$caseId]) {
        json_response(['success' => false, 'message' => 'Invalid case cost'], 400);
    }

    // Validate prize type
    if (!in_array($prizeType, ['coins', 'xp'], true)) {
        json_response(['success' => false, 'message' => 'Invalid prize type'], 400);
    }

    // Validate prize amount doesn't exceed max
    if ($prizeType === 'coins' && $prizeAmount > CASE_MAX_COINS_PRIZE[$caseId]) {
        json_response(['success' => false, 'message' => 'Invalid prize amount'], 400);
    }
    if ($prizeType === 'xp' && $prizeAmount > CASE_MAX_XP_PRIZE[$caseId]) {
        json_response(['success' => false, 'message' => 'Invalid prize amount'], 400);
    }
    if ($prizeAmount < 0) {
        json_response(['success' => false, 'message' => 'Invalid prize amount'], 400);
    }

    // Rate limit
    $rl = get_rate_limit('minigame');
    if (check_rate_limit($pdo, 'minigame:' . $userId, $rl[0], $rl[1])) {
        json_response(['success' => false, 'message' => 'Too many games. Take a short break!'], 429);
    }
    record_rate_limit($pdo, 'minigame:' . $userId);

    // Check user has enough coins
    $stmt = $pdo->prepare('SELECT coin_balance, xp, level FROM users WHERE id=:uid FOR UPDATE');
    $pdo->beginTransaction();
    try {
        $stmt->execute([':uid' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $balance = (int)($user['coin_balance'] ?? 0);

        if ($balance < $cost) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Insufficient coins'], 400);
        }

        // Deduct cost
        $pdo->prepare('UPDATE users SET coin_balance=coin_balance-:cost WHERE id=:uid')
            ->execute([':cost' => $cost, ':uid' => $userId]);

        // Award prize
        if ($prizeType === 'coins') {
            $pdo->prepare('UPDATE users SET coin_balance=coin_balance+:amt WHERE id=:uid')
                ->execute([':amt' => $prizeAmount, ':uid' => $userId]);
        } else {
            // XP prize
            $pdo->prepare('UPDATE users SET xp=xp+:xp, level=LEAST(12, FLOOR(xp/1000)+1) WHERE id=:uid')
                ->execute([':xp' => $prizeAmount, ':uid' => $userId]);
        }

        // Re-read updated values
        $stmt2 = $pdo->prepare('SELECT coin_balance, xp, level FROM users WHERE id=:uid');
        $stmt2->execute([':uid' => $userId]);
        $updated = $stmt2->fetch(PDO::FETCH_ASSOC);

        $pdo->commit();
    } catch (\Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    json_response([
        'success'      => true,
        'prize_type'   => $prizeType,
        'prize_amount' => $prizeAmount,
        'coin_balance' => (int)$updated['coin_balance'],
        'xp'           => (int)$updated['xp'],
        'level'        => (int)$updated['level'],
        'case_id'      => $caseId,
    ]);
}

/* ══ POST price_predict: process prediction result ══ */
function handlePricePredict(PDO $pdo, int $userId, array $input): never
{
    $bet       = (int)($input['bet'] ?? 0);
    $direction = trim((string)($input['direction'] ?? ''));
    $timeframe = trim((string)($input['timeframe'] ?? ''));
    $isCorrect = !empty($input['is_correct']);
    $payout    = (int)($input['payout'] ?? 0);

    // Validate direction
    if (!in_array($direction, ['up', 'down'], true)) {
        json_response(['success' => false, 'message' => 'Invalid direction'], 400);
    }

    // Validate timeframe
    if (!in_array($timeframe, PREDICT_TIMEFRAMES, true)) {
        json_response(['success' => false, 'message' => 'Invalid timeframe'], 400);
    }

    // Validate bet
    if ($bet < PREDICT_MIN_BET || $bet > PREDICT_MAX_BET) {
        json_response(['success' => false, 'message' => 'Invalid bet amount'], 400);
    }

    // Validate payout (server-side check)
    $maxPayout = (int)floor($bet * PREDICT_PAYOUT_PCT[$timeframe] / 100);
    if ($isCorrect && $payout > $maxPayout) {
        $payout = $maxPayout; // Clamp to max
    }
    if (!$isCorrect) {
        $payout = 0;
    }

    // Rate limit
    $rl = get_rate_limit('minigame');
    if (check_rate_limit($pdo, 'minigame:' . $userId, $rl[0], $rl[1])) {
        json_response(['success' => false, 'message' => 'Too many games. Take a short break!'], 429);
    }
    record_rate_limit($pdo, 'minigame:' . $userId);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT coin_balance, xp, level FROM users WHERE id=:uid FOR UPDATE');
        $stmt->execute([':uid' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $balance = (int)($user['coin_balance'] ?? 0);

        if ($balance < $bet) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Insufficient coins'], 400);
        }

        if ($isCorrect) {
            // Win: user keeps their bet and receives additional payout (70-90% of bet)
            $pdo->prepare('UPDATE users SET coin_balance=coin_balance+:payout WHERE id=:uid')
                ->execute([':payout' => $payout, ':uid' => $userId]);
        } else {
            // Lose: deduct bet
            $pdo->prepare('UPDATE users SET coin_balance=coin_balance-:bet WHERE id=:uid')
                ->execute([':bet' => $bet, ':uid' => $userId]);
        }

        // Re-read
        $stmt2 = $pdo->prepare('SELECT coin_balance, xp, level FROM users WHERE id=:uid');
        $stmt2->execute([':uid' => $userId]);
        $updated = $stmt2->fetch(PDO::FETCH_ASSOC);

        $pdo->commit();
    } catch (\Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    json_response([
        'success'      => true,
        'is_correct'   => $isCorrect,
        'payout'       => $payout,
        'bet'          => $bet,
        'coin_balance' => (int)$updated['coin_balance'],
        'xp'           => (int)$updated['xp'],
        'level'        => (int)$updated['level'],
    ]);
}

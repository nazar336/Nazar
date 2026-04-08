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

// Case costs (server is the single source of truth)
const CASE_COSTS = [
    'bronze'   => 50,
    'silver'   => 150,
    'gold'     => 500,
    'platinum' => 1500,
    'diamond'  => 5000,
];

/* ═══════════════════════════════════════════════════════════════════
   SERVER-SIDE CASE PRIZE TABLES
   All prize determination happens here — never trust the client.

   Each case uses the same weight structure (total weight = 10000).
   ~26.4% of outcomes are XP consolation prizes (0 coin value).
   Coin prizes range from 0.1x to 100x the case cost.
   The 100x JACKPOT exists at 0.01% probability (1 in 10000).

   Expected coin return ≈ 72.6% of cost → house edge ≈ 27.4%.
   This ensures the platform profits long-term while giving lucky
   players a real chance at life-changing wins.

   EV calculations (coins only, XP prizes contribute 0 coin EV):
     Bronze  (50):  EV≈36.3  → 72.6% return
     Silver  (150): EV≈108.9 → 72.6% return
     Gold    (500): EV≈363.0 → 72.6% return
     Platinum(1500):EV≈1089  → 72.6% return
     Diamond (5000):EV≈3630  → 72.6% return
   ═══════════════════════════════════════════════════════════════════ */
const CASE_PRIZE_TABLES = [
    'bronze' => [ // cost: 50
        ['type' => 'xp',    'amount' => 3,     'weight' => 2000], // 20.0% consolation XP
        ['type' => 'xp',    'amount' => 8,     'weight' => 500],  //  5.0%
        ['type' => 'xp',    'amount' => 20,    'weight' => 100],  //  1.0%
        ['type' => 'xp',    'amount' => 50,    'weight' => 40],   //  0.4% rare XP
        ['type' => 'coins', 'amount' => 5,     'weight' => 2199], // 22.0%  (0.1x)
        ['type' => 'coins', 'amount' => 12,    'weight' => 1500], // 15.0%  (0.24x)
        ['type' => 'coins', 'amount' => 25,    'weight' => 1200], // 12.0%  (0.5x)
        ['type' => 'coins', 'amount' => 40,    'weight' => 800],  //  8.0%  (0.8x)
        ['type' => 'coins', 'amount' => 50,    'weight' => 600],  //  6.0%  (1x break-even)
        ['type' => 'coins', 'amount' => 80,    'weight' => 400],  //  4.0%  (1.6x)
        ['type' => 'coins', 'amount' => 100,   'weight' => 300],  //  3.0%  (2x)
        ['type' => 'coins', 'amount' => 250,   'weight' => 200],  //  2.0%  (5x)
        ['type' => 'coins', 'amount' => 500,   'weight' => 100],  //  1.0%  (10x)
        ['type' => 'coins', 'amount' => 1000,  'weight' => 50],   //  0.5%  (20x)
        ['type' => 'coins', 'amount' => 2500,  'weight' => 10],   //  0.1%  (50x!)
        ['type' => 'coins', 'amount' => 5000,  'weight' => 1],    //  0.01% (100x JACKPOT!)
    ],
    'silver' => [ // cost: 150
        ['type' => 'xp',    'amount' => 5,     'weight' => 2000],
        ['type' => 'xp',    'amount' => 15,    'weight' => 500],
        ['type' => 'xp',    'amount' => 35,    'weight' => 100],
        ['type' => 'xp',    'amount' => 80,    'weight' => 40],
        ['type' => 'coins', 'amount' => 15,    'weight' => 2199],
        ['type' => 'coins', 'amount' => 36,    'weight' => 1500],
        ['type' => 'coins', 'amount' => 75,    'weight' => 1200],
        ['type' => 'coins', 'amount' => 120,   'weight' => 800],
        ['type' => 'coins', 'amount' => 150,   'weight' => 600],
        ['type' => 'coins', 'amount' => 240,   'weight' => 400],
        ['type' => 'coins', 'amount' => 300,   'weight' => 300],
        ['type' => 'coins', 'amount' => 750,   'weight' => 200],
        ['type' => 'coins', 'amount' => 1500,  'weight' => 100],  // 10x
        ['type' => 'coins', 'amount' => 3000,  'weight' => 50],   // 20x
        ['type' => 'coins', 'amount' => 7500,  'weight' => 10],   // 50x!
        ['type' => 'coins', 'amount' => 15000, 'weight' => 1],    // 100x JACKPOT!
    ],
    'gold' => [ // cost: 500
        ['type' => 'xp',    'amount' => 10,    'weight' => 2000],
        ['type' => 'xp',    'amount' => 30,    'weight' => 500],
        ['type' => 'xp',    'amount' => 60,    'weight' => 100],
        ['type' => 'xp',    'amount' => 150,   'weight' => 40],
        ['type' => 'coins', 'amount' => 50,    'weight' => 2199],
        ['type' => 'coins', 'amount' => 120,   'weight' => 1500],
        ['type' => 'coins', 'amount' => 250,   'weight' => 1200],
        ['type' => 'coins', 'amount' => 400,   'weight' => 800],
        ['type' => 'coins', 'amount' => 500,   'weight' => 600],
        ['type' => 'coins', 'amount' => 800,   'weight' => 400],
        ['type' => 'coins', 'amount' => 1000,  'weight' => 300],
        ['type' => 'coins', 'amount' => 2500,  'weight' => 200],
        ['type' => 'coins', 'amount' => 5000,  'weight' => 100],  // 10x
        ['type' => 'coins', 'amount' => 10000, 'weight' => 50],   // 20x
        ['type' => 'coins', 'amount' => 25000, 'weight' => 10],   // 50x!
        ['type' => 'coins', 'amount' => 50000, 'weight' => 1],    // 100x JACKPOT!
    ],
    'platinum' => [ // cost: 1500
        ['type' => 'xp',    'amount' => 25,    'weight' => 2000],
        ['type' => 'xp',    'amount' => 60,    'weight' => 500],
        ['type' => 'xp',    'amount' => 120,   'weight' => 100],
        ['type' => 'xp',    'amount' => 300,   'weight' => 40],
        ['type' => 'coins', 'amount' => 150,   'weight' => 2199],
        ['type' => 'coins', 'amount' => 360,   'weight' => 1500],
        ['type' => 'coins', 'amount' => 750,   'weight' => 1200],
        ['type' => 'coins', 'amount' => 1200,  'weight' => 800],
        ['type' => 'coins', 'amount' => 1500,  'weight' => 600],
        ['type' => 'coins', 'amount' => 2400,  'weight' => 400],
        ['type' => 'coins', 'amount' => 3000,  'weight' => 300],
        ['type' => 'coins', 'amount' => 7500,  'weight' => 200],
        ['type' => 'coins', 'amount' => 15000, 'weight' => 100],  // 10x
        ['type' => 'coins', 'amount' => 30000, 'weight' => 50],   // 20x
        ['type' => 'coins', 'amount' => 75000, 'weight' => 10],   // 50x!
        ['type' => 'coins', 'amount' => 150000,'weight' => 1],    // 100x JACKPOT!
    ],
    'diamond' => [ // cost: 5000
        ['type' => 'xp',    'amount' => 50,    'weight' => 2000],
        ['type' => 'xp',    'amount' => 120,   'weight' => 500],
        ['type' => 'xp',    'amount' => 250,   'weight' => 100],
        ['type' => 'xp',    'amount' => 500,   'weight' => 40],
        ['type' => 'coins', 'amount' => 500,   'weight' => 2199],
        ['type' => 'coins', 'amount' => 1200,  'weight' => 1500],
        ['type' => 'coins', 'amount' => 2500,  'weight' => 1200],
        ['type' => 'coins', 'amount' => 4000,  'weight' => 800],
        ['type' => 'coins', 'amount' => 5000,  'weight' => 600],
        ['type' => 'coins', 'amount' => 8000,  'weight' => 400],
        ['type' => 'coins', 'amount' => 10000, 'weight' => 300],
        ['type' => 'coins', 'amount' => 25000, 'weight' => 200],
        ['type' => 'coins', 'amount' => 50000, 'weight' => 100],  // 10x
        ['type' => 'coins', 'amount' => 100000,'weight' => 50],   // 20x
        ['type' => 'coins', 'amount' => 250000,'weight' => 10],   // 50x!
        ['type' => 'coins', 'amount' => 500000,'weight' => 1],    // 100x JACKPOT!
    ],
];

/* ═══════════════════════════════════════════════════════════════════
   PRICE PREDICTION ALGORITHM
   Win/loss determined server-side with streak-aware probability.

   Base win rate: ~43% (gives ~18-27% house edge depending on timeframe).
   Streak adjustment creates exciting patterns:
   - After 3+ losses in a row → boost win chance to ~62%
   - After 4+ losses → boost to ~72% (near-guaranteed "comeback")
   - After 2+ wins in a row → reduce win chance to ~30%
   - After 3+ wins → reduce to ~22% (streak naturally ends)

   Net effect: players experience exciting winning streaks after
   losing runs, keeping engagement high while the math ensures
   the platform profits over time.
   ═══════════════════════════════════════════════════════════════════ */
const PREDICT_MIN_BET = 10;
const PREDICT_MAX_BET = 5000;
const PREDICT_TIMEFRAMES = ['5s', '15s', '30s'];
const PREDICT_PAYOUT_PCT = [
    '5s'  => 90,
    '15s' => 80,
    '30s' => 70,
];
const PREDICT_BASE_WIN_RATE     = 43;  // base 43% win rate
const PREDICT_LOSS_STREAK_BOOST = [    // consecutive losses → win % override
    3 => 62,   // after 3 losses: 62% chance to win
    4 => 72,   // after 4 losses: 72% chance
    5 => 80,   // after 5+ losses: 80% (near-guaranteed win)
];
const PREDICT_WIN_STREAK_NERF = [      // consecutive wins → win % override
    2 => 30,   // after 2 wins: 30% chance to win
    3 => 22,   // after 3 wins: 22%
    4 => 15,   // after 4+ wins: 15% (streak almost certainly ends)
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

/* ══ Server-side weighted random prize selection ══ */
function rollCasePrize(string $caseId): array
{
    $prizes = CASE_PRIZE_TABLES[$caseId];
    $totalWeight = 0;
    foreach ($prizes as $p) {
        $totalWeight += $p['weight'];
    }

    // Use random_int for cryptographic randomness (fair and unpredictable)
    $roll = random_int(1, $totalWeight);
    $cumulative = 0;
    foreach ($prizes as $p) {
        $cumulative += $p['weight'];
        if ($roll <= $cumulative) {
            return ['type' => $p['type'], 'amount' => $p['amount']];
        }
    }
    // Fallback (should never reach here)
    return $prizes[0];
}

/* ══ POST case_open: server determines the prize ══ */
function handleCaseOpen(PDO $pdo, int $userId, array $input): never
{
    $caseId = trim((string)($input['case_id'] ?? ''));

    // Validate case exists
    if (!isset(CASE_COSTS[$caseId])) {
        json_response(['success' => false, 'message' => 'Unknown case'], 400);
    }

    $cost = CASE_COSTS[$caseId];

    // Rate limit
    $rl = get_rate_limit('minigame');
    if (check_rate_limit($pdo, 'minigame:' . $userId, $rl[0], $rl[1])) {
        json_response(['success' => false, 'message' => 'Too many games. Take a short break!'], 429);
    }
    record_rate_limit($pdo, 'minigame:' . $userId);

    // SERVER determines the prize (never trust client)
    $prize = rollCasePrize($caseId);
    $prizeType   = $prize['type'];
    $prizeAmount = $prize['amount'];

    // Check user has enough coins and process transaction
    $stmt = $pdo->prepare('SELECT coin_balance, xp, level FROM users WHERE id=:uid FOR UPDATE');
    $pdo->beginTransaction();
    try {
        $stmt->execute([':uid' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $balance = (int)($user['coin_balance'] ?? 0);

        // Calculate platform game fee
        $gameFee = round($cost * MINIGAME_FEE_PCT / 100, 2);
        $totalCost = $cost + $gameFee;

        if ($balance < $totalCost) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Insufficient coins'], 400);
        }

        // Deduct cost + fee
        $pdo->prepare('UPDATE users SET coin_balance=coin_balance-:cost WHERE id=:uid')
            ->execute([':cost' => $totalCost, ':uid' => $userId]);

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
        'game_fee'     => $gameFee,
        'fee_pct'      => MINIGAME_FEE_PCT,
    ]);
}

/* ══ Streak-aware win probability for price prediction ══ */
function calculatePredictWinRate(): int
{
    $streak = $_SESSION['predict_streak'] ?? 0;  // positive = wins, negative = losses

    if ($streak <= -5) {
        return PREDICT_LOSS_STREAK_BOOST[5];
    }
    if ($streak <= -4) {
        return PREDICT_LOSS_STREAK_BOOST[4];
    }
    if ($streak <= -3) {
        return PREDICT_LOSS_STREAK_BOOST[3];
    }

    if ($streak >= 4) {
        return PREDICT_WIN_STREAK_NERF[4];
    }
    if ($streak >= 3) {
        return PREDICT_WIN_STREAK_NERF[3];
    }
    if ($streak >= 2) {
        return PREDICT_WIN_STREAK_NERF[2];
    }

    return PREDICT_BASE_WIN_RATE;
}

function updatePredictStreak(bool $won): void
{
    $streak = $_SESSION['predict_streak'] ?? 0;

    if ($won) {
        $streak = $streak > 0 ? $streak + 1 : 1;
    } else {
        $streak = $streak < 0 ? $streak - 1 : -1;
    }

    $_SESSION['predict_streak'] = $streak;
}

/* ══ POST price_predict: SERVER determines win/loss ══ */
function handlePricePredict(PDO $pdo, int $userId, array $input): never
{
    $bet       = (int)($input['bet'] ?? 0);
    $direction = trim((string)($input['direction'] ?? ''));
    $timeframe = trim((string)($input['timeframe'] ?? ''));

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

    // Rate limit
    $rl = get_rate_limit('minigame');
    if (check_rate_limit($pdo, 'minigame:' . $userId, $rl[0], $rl[1])) {
        json_response(['success' => false, 'message' => 'Too many games. Take a short break!'], 429);
    }
    record_rate_limit($pdo, 'minigame:' . $userId);

    // SERVER determines outcome using streak-aware probability
    $winRate = calculatePredictWinRate();
    $roll = random_int(1, 100);
    $isCorrect = $roll <= $winRate;

    // Calculate payout
    $payout = $isCorrect ? (int)floor($bet * PREDICT_PAYOUT_PCT[$timeframe] / 100) : 0;

    // Update streak tracking
    updatePredictStreak($isCorrect);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT coin_balance, xp, level FROM users WHERE id=:uid FOR UPDATE');
        $stmt->execute([':uid' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $balance = (int)($user['coin_balance'] ?? 0);

        // Calculate platform game fee
        $gameFee = round($bet * MINIGAME_FEE_PCT / 100, 2);

        if ($balance < $bet + $gameFee) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Insufficient coins'], 400);
        }

        // Always deduct the game fee
        $pdo->prepare('UPDATE users SET coin_balance=coin_balance-:fee WHERE id=:uid')
            ->execute([':fee' => $gameFee, ':uid' => $userId]);

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
        'game_fee'     => $gameFee,
        'fee_pct'      => MINIGAME_FEE_PCT,
    ]);
}

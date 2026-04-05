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
const GAME_MEMORY  = 'memory';
const GAME_COLORTAP = 'colortap';
const ALLOWED_GAMES = [GAME_MEMORY, GAME_COLORTAP];

// XP rewards per game (min/max to allow server-side validation)
const GAME_XP = [
    GAME_MEMORY  => ['min' => 3, 'max' => 15, 'min_duration' => 10],
    GAME_COLORTAP => ['min' => 2, 'max' => 20, 'min_duration' => 8],
];

try {
    if ($method === 'GET') {
        handleGetStats($pdo, $userId);
    } elseif ($method === 'POST') {
        $input = read_json();
        $action = $input['action'] ?? '';
        match ($action) {
            'complete' => handleGameComplete($pdo, $userId, $input),
            default    => json_response(['success' => false, 'message' => 'Unknown action'], 400),
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

    json_response([
        'success' => true,
        'xp'      => (int)$row['xp'],
        'level'   => (int)$row['level'],
        'games'   => array_keys(GAME_XP),
    ]);
}

/* ══ POST complete: award XP for finishing a game ══ */
function handleGameComplete(PDO $pdo, int $userId, array $input): never
{
    $game     = trim((string)($input['game'] ?? ''));
    $score    = (int)($input['score'] ?? 0);
    $duration = (int)($input['duration'] ?? 0); // seconds the game took

    // Validate game name
    if (!in_array($game, ALLOWED_GAMES, true)) {
        json_response(['success' => false, 'message' => 'Unknown game'], 400);
    }

    $cfg = GAME_XP[$game];

    // Anti-cheat: duration must be at least the minimum
    if ($duration < $cfg['min_duration']) {
        json_response(['success' => false, 'message' => 'Invalid game session'], 400);
    }

    // Score validation
    if ($score < 0) {
        json_response(['success' => false, 'message' => 'Invalid score'], 400);
    }

    // Rate limit
    $rl = get_rate_limit('minigame');
    if (check_rate_limit($pdo, 'minigame:' . $userId, $rl[0], $rl[1])) {
        json_response(['success' => false, 'message' => 'Too many games. Take a short break!'], 429);
    }
    record_rate_limit($pdo, 'minigame:' . $userId);

    // Calculate XP based on score, clamped to game limits
    $xpEarned = calculateXp($game, $score);

    // Award XP
    $pdo->beginTransaction();
    try {
        $new = addXp($pdo, $userId, $xpEarned);
        $pdo->commit();
    } catch (\Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    json_response([
        'success'   => true,
        'xp_earned' => $xpEarned,
        'xp'        => $new['xp'],
        'level'     => $new['level'],
        'game'      => $game,
        'score'     => $score,
    ]);
}

function calculateXp(string $game, int $score): int
{
    $cfg = GAME_XP[$game];
    // Memory: XP scales with matched pairs (score = pairs matched)
    // ColorTap: XP scales with correct taps (score = streak)
    $xp = match ($game) {
        GAME_MEMORY  => (int)floor($score * 1.5),
        GAME_COLORTAP => (int)floor($score * 0.5),
        default       => $cfg['min'],
    };
    return max($cfg['min'], min($cfg['max'], $xp));
}

function addXp(PDO $pdo, int $userId, int $amount): array
{
    $pdo->prepare('UPDATE users SET xp=xp+:xp, level=LEAST(12, FLOOR(xp/1000)+1) WHERE id=:uid')
        ->execute([':xp' => $amount, ':uid' => $userId]);
    $stmt = $pdo->prepare('SELECT xp, level FROM users WHERE id=:uid');
    $stmt->execute([':uid' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: ['xp' => 0, 'level' => 1];
    return ['xp' => (int)$row['xp'], 'level' => (int)$row['level']];
}

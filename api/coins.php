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
$pdo = db();

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0) {
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);
}

$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        handleGetCoins($pdo, $userId);
    } elseif ($method === 'POST') {
        $input  = read_json();
        $action = $input['action'] ?? '';

        match ($action) {
            'spend'    => handleSpend($pdo, $userId, $input),
            'tip'      => handleTip($pdo, $userId, $input),
            'history'  => handleSpendingHistory($pdo, $userId),
            default    => json_response(['success' => false, 'message' => 'Unknown action'], 400),
        };
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

// ── Отримання балансу монет ───────────────────────────────────────
function handleGetCoins(PDO $pdo, int $userId): never
{
    // Ініціалізуємо запис якщо немає
    $pdo->prepare('
        INSERT IGNORE INTO user_coins (user_id) VALUES (:uid)
    ')->execute([':uid' => $userId]);

    $stmt = $pdo->prepare('
        SELECT coin_balance, usdt_balance, total_purchased, total_spent, updated_at
        FROM user_coins WHERE user_id = :uid
    ');
    $stmt->execute([':uid' => $userId]);
    $coins = $stmt->fetch(PDO::FETCH_ASSOC);

    // Останні витрати
    $spendStmt = $pdo->prepare('
        SELECT cs.id, cs.amount, cs.type, cs.description, cs.created_at,
               t.title AS task_title
        FROM coin_spending cs
        LEFT JOIN tasks t ON cs.task_id = t.id
        WHERE cs.user_id = :uid
        ORDER BY cs.created_at DESC
        LIMIT 20
    ');
    $spendStmt->execute([':uid' => $userId]);
    $spending = $spendStmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        'success'         => true,
        'coin_balance'    => (float)($coins['coin_balance']    ?? 0),
        'usdt_balance'    => (float)($coins['usdt_balance']    ?? 0),
        'total_purchased' => (float)($coins['total_purchased'] ?? 0),
        'total_spent'     => (float)($coins['total_spent']     ?? 0),
        'updated_at'      => $coins['updated_at'] ?? null,
        'spending_history' => $spending,
    ]);
}

// ── Витрата монет (оплата задачі монетами) ────────────────────────
function handleSpend(PDO $pdo, int $userId, array $input): never
{
    $amount  = round((float)($input['amount'] ?? 0), 2);
    $taskId  = isset($input['task_id']) ? (int)$input['task_id'] : null;
    $type    = in_array($input['type'] ?? '', ['task_payment','premium'], true)
                ? $input['type'] : 'task_payment';
    $desc    = substr(trim((string)($input['description'] ?? '')), 0, 255);

    if ($amount <= 0) {
        json_response(['success' => false, 'message' => 'Amount must be positive'], 400);
    }
    if ($amount > 100000) {
        json_response(['success' => false, 'message' => 'Amount too large (max 100000)'], 400);
    }

    $pdo->beginTransaction();
    try {
        // Блокуємо рядок і перевіряємо баланс
        $pdo->prepare('INSERT IGNORE INTO user_coins (user_id) VALUES (:uid)')->execute([':uid' => $userId]);

        $stmt = $pdo->prepare('SELECT coin_balance FROM user_coins WHERE user_id=:uid FOR UPDATE');
        $stmt->execute([':uid' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $balance = (float)($row['coin_balance'] ?? 0);

        if ($balance < $amount) {
            $pdo->rollBack();
            json_response([
                'success'  => false,
                'message'  => 'Insufficient coins. Balance: ' . $balance . ', Required: ' . $amount,
                'balance'  => $balance,
            ], 400);
        }

        // Списуємо монети
        $pdo->prepare('
            UPDATE user_coins
            SET coin_balance = coin_balance - :amt,
                total_spent  = total_spent  + :amt2,
                updated_at   = NOW()
            WHERE user_id = :uid
        ')->execute([':amt' => $amount, ':amt2' => $amount, ':uid' => $userId]);

        // Логуємо витрату
        $spendStmt = $pdo->prepare('
            INSERT INTO coin_spending (user_id, task_id, amount, type, description)
            VALUES (:uid, :tid, :amt, :type, :desc)
        ');
        $spendStmt->execute([
            ':uid'  => $userId,
            ':tid'  => $taskId,
            ':amt'  => $amount,
            ':type' => $type,
            ':desc' => $desc ?: ucfirst($type) . ' payment',
        ]);

        $pdo->commit();

        // Новий баланс
        $newStmt = $pdo->prepare('SELECT coin_balance, total_spent FROM user_coins WHERE user_id=:uid');
        $newStmt->execute([':uid' => $userId]);
        $newRow = $newStmt->fetch(PDO::FETCH_ASSOC);

        json_response([
            'success'      => true,
            'message'      => $amount . ' coins spent successfully.',
            'coins_spent'  => $amount,
            'coin_balance' => (float)($newRow['coin_balance'] ?? 0),
            'total_spent'  => (float)($newRow['total_spent']  ?? 0),
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// ── Чайові іншому користувачу монетами ───────────────────────────
function handleTip(PDO $pdo, int $userId, array $input): never
{
    $amount     = round((float)($input['amount'] ?? 0), 2);
    $targetUser = (int)($input['target_user_id'] ?? 0);

    if ($amount < 1) {
        json_response(['success' => false, 'message' => 'Amount must be at least 1 coin'], 400);
    }
    if ($amount > 10000) {
        json_response(['success' => false, 'message' => 'Max tip amount is 10000 coins'], 400);
    }
    if ($targetUser <= 0 || $targetUser === $userId) {
        json_response(['success' => false, 'message' => 'Invalid target user'], 400);
    }

    // Rate limit: max 20 tips per user per 60 min (prevent laundering)
    if (check_rate_limit($pdo, 'tip:' . $userId, 20, 60))
        json_response(['success' => false, 'message' => 'Too many tips. Please wait before sending another.'], 429);
    record_rate_limit($pdo, 'tip:' . $userId);

    // Перевіряємо що цільовий користувач існує
    $userCheck = $pdo->prepare('SELECT id, name FROM users WHERE id=:id AND is_active=1 LIMIT 1');
    $userCheck->execute([':id' => $targetUser]);
    $targetRow = $userCheck->fetch(PDO::FETCH_ASSOC);
    if (!$targetRow) {
        json_response(['success' => false, 'message' => 'Target user not found'], 404);
    }

    $pdo->beginTransaction();
    try {
        // Перевіряємо баланс відправника
        $pdo->prepare('INSERT IGNORE INTO user_coins (user_id) VALUES (:uid)')->execute([':uid' => $userId]);
        $stmt = $pdo->prepare('SELECT coin_balance FROM user_coins WHERE user_id=:uid FOR UPDATE');
        $stmt->execute([':uid' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $balance = (float)($row['coin_balance'] ?? 0);

        if ($balance < $amount) {
            $pdo->rollBack();
            json_response(['success' => false, 'message' => 'Insufficient coins', 'balance' => $balance], 400);
        }

        // Списуємо у відправника
        $pdo->prepare('
            UPDATE user_coins SET coin_balance=coin_balance-:amt, total_spent=total_spent+:amt2, updated_at=NOW()
            WHERE user_id=:uid
        ')->execute([':amt' => $amount, ':amt2' => $amount, ':uid' => $userId]);

        // Нараховуємо отримувачу (tips are NOT purchases, don't update total_purchased)
        $pdo->prepare('
            INSERT INTO user_coins (user_id, coin_balance)
            VALUES (:uid, :amt)
            ON DUPLICATE KEY UPDATE coin_balance=coin_balance+:amt2, updated_at=NOW()
        ')->execute([':uid' => $targetUser, ':amt' => $amount, ':amt2' => $amount]);

        // Лог витрати відправника
        $pdo->prepare('
            INSERT INTO coin_spending (user_id, amount, type, description)
            VALUES (:uid, :amt, "tip", :desc)
        ')->execute([':uid' => $userId, ':amt' => $amount, ':desc' => 'Tip to ' . $targetRow['name']]);

        // Сповіщення отримувачу
        $pdo->prepare('
            INSERT INTO notifications (user_id, type, title, content)
            VALUES (:uid, "payment", "You received a tip!", :content)
        ')->execute([':uid' => $targetUser, ':content' => 'You received ' . $amount . ' coins as a tip.']);

        $pdo->commit();

        json_response([
            'success'      => true,
            'message'      => 'Tip of ' . $amount . ' coins sent to ' . $targetRow['name'],
            'coins_sent'   => $amount,
            'recipient'    => $targetRow['name'],
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// ── Повна історія витрат ─────────────────────────────────────────
function handleSpendingHistory(PDO $pdo, int $userId): never
{
    $stmt = $pdo->prepare('
        SELECT cs.id, cs.amount, cs.type, cs.description, cs.created_at,
               t.title AS task_title
        FROM coin_spending cs
        LEFT JOIN tasks t ON cs.task_id = t.id
        WHERE cs.user_id = :uid
        ORDER BY cs.created_at DESC
        LIMIT 100
    ');
    $stmt->execute([':uid' => $userId]);

    json_response([
        'success' => true,
        'history' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
}

<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);

start_secure_session();
$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0)
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);

$userId = (int)$_SESSION['user_id'];

try {
    if ($method === 'GET') {
        $filter = in_array($_GET['filter'] ?? 'open', ['open', 'my', 'taken'], true) ? $_GET['filter'] : 'open';
        $page   = max(1, (int)($_GET['page'] ?? 1));
        $limit  = 20;
        $offset = ($page - 1) * $limit;

        $where = '';
        if ($filter === 'my')    $where = 'AND t.creator_id=:uid';
        elseif ($filter === 'taken') $where = 'AND t.id IN (SELECT task_id FROM task_assignments WHERE user_id=:uid)';
        elseif ($filter === 'open')  $where = 'AND t.status IN ("open","in_progress")
          AND (t.deadline IS NULL OR t.deadline > NOW())
          AND (SELECT COUNT(*) FROM task_assignments ta_open WHERE ta_open.task_id=t.id AND ta_open.status IN ("taken","completed")) < t.slots';

        $stmt = $pdo->prepare("
            SELECT t.id,t.title,t.description,t.category,t.difficulty,t.reward,
                   t.slots,t.deadline,t.status,t.creator_id,t.created_at,
                   u.username AS creator_username,
                   (SELECT COUNT(*) FROM task_assignments ta WHERE ta.task_id=t.id AND ta.status IN ('taken','completed')) AS taken_slots,
                   (SELECT ta2.status FROM task_assignments ta2 WHERE ta2.task_id=t.id AND ta2.user_id=:uid ORDER BY ta2.id DESC LIMIT 1) AS my_assignment_status
            FROM tasks t
            JOIN users u ON u.id=t.creator_id
            WHERE 1=1 $where
            ORDER BY t.created_at DESC
            LIMIT :lim OFFSET :off
        ");
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        json_response(['success' => true, 'tasks' => $stmt->fetchAll(), 'page' => $page]);

    } elseif ($method === 'POST') {
        $input = read_json();

        $title       = trim((string)($input['title']       ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $category    = trim((string)($input['category']    ?? ''));
        $difficulty  = in_array($input['difficulty'] ?? '', ['easy', 'medium', 'hard'], true) ? $input['difficulty'] : 'medium';
        $reward      = (float)($input['reward'] ?? 0);
        $slots       = (int)($input['slots']   ?? 1);
        $deadline    = !empty($input['deadline']) ? $input['deadline'] : null;

        if ($title === '')       json_response(['success' => false, 'message' => 'Title is required'], 400);
        if (mb_strlen($title) > 255) json_response(['success' => false, 'message' => 'Title is too long (max 255)'], 400);
        if ($description === '') json_response(['success' => false, 'message' => 'Description is required'], 400);
        if (mb_strlen($description) > 10000) json_response(['success' => false, 'message' => 'Description is too long (max 10000)'], 400);
        if ($category === '')    json_response(['success' => false, 'message' => 'Category is required'], 400);
        if (mb_strlen($category) > 50) json_response(['success' => false, 'message' => 'Category is too long (max 50)'], 400);
        if ($reward <= 0)        json_response(['success' => false, 'message' => 'Reward must be positive'], 400);
        if ($reward > 10000)     json_response(['success' => false, 'message' => 'Reward is too large (max 10 000)'], 400);
        if ($slots < 1)          json_response(['success' => false, 'message' => 'Slots must be at least 1'], 400);
        if ($slots > 100)        json_response(['success' => false, 'message' => 'Max 100 slots'], 400);

        // Validate deadline format (YYYY-MM-DD or YYYY-MM-DDTHH:MM or YYYY-MM-DD HH:MM:SS)
        if ($deadline !== null) {
            $acceptedFormats = ['Y-m-d', 'Y-m-d H:i:s', 'Y-m-d\TH:i', 'Y-m-d\TH:i:s'];
            $dt = null;
            foreach ($acceptedFormats as $fmt) {
                $dt = \DateTime::createFromFormat($fmt, $deadline);
                if ($dt !== false) break;
            }
            if (!$dt) {
                json_response(['success' => false, 'message' => 'Invalid deadline format. Accepted: YYYY-MM-DD, YYYY-MM-DDTHH:MM, YYYY-MM-DD HH:MM:SS'], 400);
            }
            $deadline = $dt->format('Y-m-d H:i:s');
        }

        $stmt = $pdo->prepare('INSERT INTO tasks(title,description,category,difficulty,reward,slots,deadline,status,creator_id) VALUES(:t,:d,:c,:diff,:r,:s,:dl,"open",:cb)');
        $stmt->execute([':t' => $title, ':d' => $description, ':c' => $category, ':diff' => $difficulty, ':r' => $reward, ':s' => $slots, ':dl' => $deadline, ':cb' => $userId]);
        json_response(['success' => true, 'task_id' => (int)$pdo->lastInsertId(), 'message' => 'Task created']);

    } elseif ($method === 'PUT') {
        $input  = read_json();
        $taskId = (int)($_GET['id'] ?? 0);
        if (!$taskId) json_response(['success' => false, 'message' => 'Missing task ID'], 400);

        $check = $pdo->prepare('SELECT id FROM tasks WHERE id=:id AND creator_id=:uid');
        $check->execute([':id' => $taskId, ':uid' => $userId]);
        if (!$check->fetch()) json_response(['success' => false, 'message' => 'Not authorized'], 403);

        if (isset($input['status'])) {
            $allowed = ['open', 'in_progress', 'completed', 'cancelled'];
            $status  = in_array($input['status'], $allowed, true) ? $input['status'] : null;
            if (!$status) json_response(['success' => false, 'message' => 'Invalid status'], 400);
            $pdo->prepare('UPDATE tasks SET status=:s WHERE id=:id')->execute([':s' => $status, ':id' => $taskId]);
            json_response(['success' => true, 'message' => 'Task updated']);
        }
        json_response(['success' => false, 'message' => 'Nothing to update'], 400);

    } elseif ($method === 'DELETE') {
        $taskId = (int)($_GET['id'] ?? 0);
        if (!$taskId) json_response(['success' => false, 'message' => 'Missing task ID'], 400);

        $check = $pdo->prepare('SELECT id,status FROM tasks WHERE id=:id AND creator_id=:uid');
        $check->execute([':id' => $taskId, ':uid' => $userId]);
        $task  = $check->fetch();
        if (!$task) json_response(['success' => false, 'message' => 'Not authorized'], 403);
        if ($task['status'] !== 'open') json_response(['success' => false, 'message' => 'Can only delete open tasks'], 400);

        $pdo->prepare('DELETE FROM tasks WHERE id=:id')->execute([':id' => $taskId]);
        json_response(['success' => true, 'message' => 'Task deleted']);
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (\Exception $e) {
    error_log('tasks error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['POST', 'OPTIONS']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST')
    json_response(['success' => false, 'message' => 'Method not allowed'], 405);

start_secure_session();
$pdo = db();

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0)
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);

$userId = (int)$_SESSION['user_id'];
$input  = read_json();

if (!isset($input['task_id']))
    json_response(['success' => false, 'message' => 'Missing task_id'], 400);

$taskId = (int)$input['task_id'];
$action = in_array($input['action'] ?? 'submit', ['submit', 'approve'], true) ? $input['action'] : 'submit';

$pdo->beginTransaction();
try {
    // ── SUBMIT ────────────────────────────────────────────────────
    if ($action === 'submit') {
        $assignStmt = $pdo->prepare('
            SELECT ta.id, ta.status, t.reward, t.creator_id, t.title, t.slots
            FROM task_assignments ta
            JOIN tasks t ON ta.task_id = t.id
            WHERE ta.task_id=:tid AND ta.user_id=:uid AND ta.status="taken"
            LIMIT 1
        ');
        $assignStmt->execute([':tid' => $taskId, ':uid' => $userId]);
        $assignment = $assignStmt->fetch();

        if (!$assignment) { $pdo->rollBack(); json_response(['success' => false, 'message' => 'No active assignment found'], 404); }

        $reward = (float)$assignment['reward'];

        $pdo->prepare('UPDATE task_assignments SET status="completed", completed_at=NOW() WHERE task_id=:tid AND user_id=:uid AND status="taken"')
            ->execute([':tid' => $taskId, ':uid' => $userId]);

        // Create pending reward tx (only if not exists)
        $checkTx = $pdo->prepare('SELECT id FROM transactions WHERE user_id=:uid AND task_id=:tid AND type="task_reward" ORDER BY id DESC LIMIT 1');
        $checkTx->execute([':uid' => $userId, ':tid' => $taskId]);
        if (!$checkTx->fetch()) {
            $pdo->prepare('INSERT INTO transactions(user_id,type,amount,task_id,status,description) VALUES(:uid,"task_reward",:amt,:tid,"pending",:desc)')
                ->execute([':uid' => $userId, ':amt' => $reward, ':tid' => $taskId, ':desc' => 'Pending approval: ' . $assignment['title']]);
        }

        // Update task status
        $occStmt = $pdo->prepare('SELECT COUNT(*) FROM task_assignments WHERE task_id=:tid AND status IN ("taken","completed")');
        $occStmt->execute([':tid' => $taskId]);
        $occupied = (int)$occStmt->fetchColumn();
        $slots    = (int)$assignment['slots'];
        $newStatus = $occupied >= $slots ? 'in_progress' : 'open';

        $pdo->prepare('UPDATE tasks SET status=:st, taken_slots=:ts WHERE id=:id')
            ->execute([':st' => $newStatus, ':ts' => $occupied, ':id' => $taskId]);

        // Notify owner
        $pdo->prepare('INSERT INTO notifications(user_id,type,title,content,related_id) VALUES(:uid,"task","Здано задачу",:content,:rid)')
            ->execute([':uid' => (int)$assignment['creator_id'], ':content' => 'Виконавець здав вашу задачу: ' . $assignment['title'], ':rid' => $taskId]);

        $pdo->commit();
        json_response(['success' => true, 'message' => 'Задачу здано. Очікуй підтвердження власника.', 'task_id' => $taskId, 'reward_pending' => $reward]);
    }

    // ── APPROVE ───────────────────────────────────────────────────
    $taskStmt = $pdo->prepare('SELECT id,title,reward,creator_id,slots,difficulty FROM tasks WHERE id=:tid LIMIT 1');
    $taskStmt->execute([':tid' => $taskId]);
    $task = $taskStmt->fetch();

    if (!$task) { $pdo->rollBack(); json_response(['success' => false, 'message' => 'Task not found'], 404); }
    if ((int)$task['creator_id'] !== $userId) { $pdo->rollBack(); json_response(['success' => false, 'message' => 'Only task owner can approve'], 403); }

    // Find worker to approve
    $workerId = isset($input['worker_id']) ? (int)$input['worker_id'] : 0;
    if ($workerId <= 0) {
        $nextStmt = $pdo->prepare("
            SELECT ta.user_id FROM task_assignments ta
            WHERE ta.task_id=:tid AND ta.status='completed'
              AND EXISTS (
                SELECT 1 FROM transactions tx
                WHERE tx.user_id=ta.user_id AND tx.task_id=ta.task_id
                  AND tx.type='task_reward' AND tx.status='pending'
              )
            ORDER BY ta.completed_at ASC, ta.id ASC LIMIT 1
        ");
        $nextStmt->execute([':tid' => $taskId]);
        $next = $nextStmt->fetch();
        if (!$next) { $pdo->rollBack(); json_response(['success' => false, 'message' => 'No pending submissions to approve'], 400); }
        $workerId = (int)$next['user_id'];
    }

    // Get pending tx for this worker
    $txStmt = $pdo->prepare("SELECT id,amount FROM transactions WHERE user_id=:uid AND task_id=:tid AND type='task_reward' AND status='pending' ORDER BY id DESC LIMIT 1");
    $txStmt->execute([':uid' => $workerId, ':tid' => $taskId]);
    $tx = $txStmt->fetch();

    if (!$tx) {
        // Create tx if missing (edge case)
        $pdo->prepare("INSERT INTO transactions(user_id,type,amount,task_id,status,description) VALUES(:uid,'task_reward',:amt,:tid,'pending',:desc)")
            ->execute([':uid' => $workerId, ':amt' => (float)$task['reward'], ':tid' => $taskId, ':desc' => 'Approved: ' . $task['title']]);
        $txId   = (int)$pdo->lastInsertId();
        $reward = (float)$task['reward'];
    } else {
        $txId   = (int)$tx['id'];
        $reward = (float)$tx['amount'];
    }

    // Mark transaction completed
    $pdo->prepare("UPDATE transactions SET status='completed' WHERE id=:id")->execute([':id' => $txId]);

    // XP for difficulty
    $diffXp = ['easy' => 20, 'medium' => 35, 'hard' => 50];
    $bonusXp = $diffXp[$task['difficulty'] ?? 'medium'] ?? 35;
    $totalXp = 100 + $bonusXp; // 100 base + difficulty bonus in ONE query

    // ✅ Single UPDATE — level uses new xp value (MySQL evaluates SET left-to-right)
    $pdo->prepare('
        UPDATE users SET
            completed_tasks = completed_tasks + 1,
            earnings        = earnings + :reward,
            xp              = xp + :xp,
            streak          = streak + 1,
            level           = LEAST(12, FLOOR(xp / 1000) + 1)
        WHERE id = :uid
    ')->execute([':reward' => $reward, ':xp' => $totalXp, ':uid' => $workerId]);

    // Notify worker
    $pdo->prepare("INSERT INTO notifications(user_id,type,title,content,related_id) VALUES(:uid,'payment','Задачу схвалено! 🎉',:content,:rid)")
        ->execute([':uid' => $workerId, ':content' => 'Нараховано ' . $reward . ' монет та ' . $totalXp . ' XP за: ' . $task['title'], ':rid' => $taskId]);

    // Update task status
    $approvedStmt = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE task_id=:tid AND type='task_reward' AND status='completed'");
    $approvedStmt->execute([':tid' => $taskId]);
    $approved = (int)$approvedStmt->fetchColumn();

    $occStmt2 = $pdo->prepare("SELECT COUNT(*) FROM task_assignments WHERE task_id=:tid AND status IN ('taken','completed')");
    $occStmt2->execute([':tid' => $taskId]);
    $occupied2 = (int)$occStmt2->fetchColumn();

    $slots     = (int)$task['slots'];
    $newStatus = $approved >= $slots ? 'completed' : ($occupied2 >= $slots ? 'in_progress' : 'open');

    $pdo->prepare('UPDATE tasks SET status=:st, taken_slots=:ts WHERE id=:id')
        ->execute([':st' => $newStatus, ':ts' => $occupied2, ':id' => $taskId]);

    $pdo->commit();

    json_response([
        'success'   => true,
        'message'   => 'Роботу схвалено. Нараховано винагороду.',
        'reward'    => $reward,
        'xp_earned' => $totalXp,
        'worker_id' => $workerId,
        'task_id'   => $taskId,
    ]);

} catch (\Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('complete-task error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Error processing task action.'], 500);
}

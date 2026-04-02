<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['GET', 'POST', 'OPTIONS']);

start_secure_session();
$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0)
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);

$userId = (int)$_SESSION['user_id'];

try {
    if ($method === 'GET') {
        $threadId = isset($_GET['thread_id']) ? (int)$_GET['thread_id'] : null;

        if ($threadId) {
            // Verify access
            $checkStmt = $pdo->prepare('SELECT id FROM message_threads WHERE id=:tid AND (user1_id=:uid OR user2_id=:uid)');
            $checkStmt->execute([':tid' => $threadId, ':uid' => $userId]);
            if (!$checkStmt->fetch()) json_response(['success' => false, 'message' => 'Not authorized'], 403);

            $page   = max(1, (int)($_GET['page'] ?? 1));
            $limit  = 50;
            $offset = ($page - 1) * $limit;

            $stmt = $pdo->prepare('SELECT id,sender_id,content,read_at,created_at FROM messages WHERE thread_id=:tid ORDER BY created_at ASC LIMIT ' . $limit . ' OFFSET ' . $offset);
            $stmt->execute([':tid' => $threadId]);
            $messages = $stmt->fetchAll();

            // ✅ Mark unread messages as read
            $pdo->prepare("UPDATE messages SET read_at=NOW() WHERE thread_id=:tid AND sender_id!=:uid AND read_at IS NULL")
                ->execute([':tid' => $threadId, ':uid' => $userId]);

            json_response(['success' => true, 'messages' => $messages, 'page' => $page]);
        } else {
            $stmt = $pdo->prepare('
                SELECT mt.id, mt.user1_id, mt.user2_id, mt.last_message_at,
                       u1.name AS user1_name, u1.avatar AS user1_avatar,
                       u2.name AS user2_name, u2.avatar AS user2_avatar,
                       COUNT(m.id) AS unread_count
                FROM message_threads mt
                LEFT JOIN users u1 ON mt.user1_id=u1.id
                LEFT JOIN users u2 ON mt.user2_id=u2.id
                LEFT JOIN messages m ON m.thread_id=mt.id AND m.read_at IS NULL AND m.sender_id!=:uid
                WHERE mt.user1_id=:uid OR mt.user2_id=:uid
                GROUP BY mt.id
                ORDER BY mt.last_message_at DESC
            ');
            $stmt->execute([':uid' => $userId]);
            json_response(['success' => true, 'threads' => $stmt->fetchAll()]);
        }

    } elseif ($method === 'POST') {
        $input       = read_json();
        $recipientId = (int)($input['recipient_id'] ?? 0);
        $content     = trim((string)($input['content'] ?? ''));

        if ($recipientId <= 0 || $content === '') json_response(['success' => false, 'message' => 'Missing required fields'], 400);
        if (mb_strlen($content) > 2000)           json_response(['success' => false, 'message' => 'Message too long (max 2000)'], 400);
        if ($recipientId === $userId)             json_response(['success' => false, 'message' => 'Cannot message yourself'], 400);

        $recStmt = $pdo->prepare('SELECT id,is_active FROM users WHERE id=:rid LIMIT 1');
        $recStmt->execute([':rid' => $recipientId]);
        $recipient = $recStmt->fetch();
        if (!$recipient)             json_response(['success' => false, 'message' => 'Recipient not found'], 404);
        if (!(bool)$recipient['is_active']) json_response(['success' => false, 'message' => 'Recipient not available'], 400);

        // Find or create thread
        $threadStmt = $pdo->prepare('SELECT id FROM message_threads WHERE (user1_id=:u1 AND user2_id=:u2) OR (user1_id=:u2 AND user2_id=:u1) LIMIT 1');
        $threadStmt->execute([':u1' => $userId, ':u2' => $recipientId]);
        $thread   = $threadStmt->fetch();
        $threadId = $thread ? (int)$thread['id'] : null;

        if (!$threadId) {
            $pdo->prepare('INSERT INTO message_threads(user1_id,user2_id,last_message_at) VALUES(:u1,:u2,NOW())')
                ->execute([':u1' => $userId, ':u2' => $recipientId]);
            $threadId = (int)$pdo->lastInsertId();
        }

        $pdo->prepare('INSERT INTO messages(thread_id,sender_id,content) VALUES(:tid,:uid,:content)')
            ->execute([':tid' => $threadId, ':uid' => $userId, ':content' => $content]);
        $messageId = (int)$pdo->lastInsertId();

        $pdo->prepare('UPDATE message_threads SET last_message_at=NOW() WHERE id=:id')->execute([':id' => $threadId]);

        json_response(['success' => true, 'message_id' => $messageId, 'thread_id' => $threadId]);
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (\Exception $e) {
    error_log('messages error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

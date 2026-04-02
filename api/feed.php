<?php
declare(strict_types=1);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host   = $_SERVER['HTTP_HOST']   ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) === $host) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/bootstrap.php';

start_secure_session();

$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

try {
    /* ── GET: paginated feed ─────────────────────────────────── */
    if ($method === 'GET') {
        $page    = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = 20;
        $offset  = ($page - 1) * $perPage;

        $currentUserId = (int) ($_SESSION['user_id'] ?? 0);
        $filterUserId  = isset($_GET['user_id']) ? (int) $_GET['user_id'] : null;

        $where  = '';
        $params = [':limit' => $perPage + 1, ':offset' => $offset];

        if ($filterUserId !== null) {
            $where = 'WHERE fp.user_id = :filter_user_id';
            $params[':filter_user_id'] = $filterUserId;
        }

        $likeJoin = '';
        if ($currentUserId > 0) {
            $likeJoin = 'LEFT JOIN feed_likes fl ON fl.post_id = fp.id AND fl.user_id = :current_user_id';
            $params[':current_user_id'] = $currentUserId;
        }

        $sql = "SELECT fp.id, fp.user_id, u.username, u.avatar AS user_avatar,
                       fp.text, fp.media_url, fp.media_type, fp.likes_count,
                       " . ($currentUserId > 0 ? "IF(fl.id IS NOT NULL, 1, 0)" : "0") . " AS liked_by_me,
                       fp.created_at
                FROM feed_posts fp
                JOIN users u ON u.id = fp.user_id
                {$likeJoin}
                {$where}
                ORDER BY fp.created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);

        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $hasMore = count($rows) > $perPage;
        if ($hasMore) {
            array_pop($rows);
        }

        // Cast numeric fields
        $posts = array_map(static function (array $row): array {
            $row['id']          = (int) $row['id'];
            $row['user_id']     = (int) $row['user_id'];
            $row['likes_count'] = (int) $row['likes_count'];
            $row['liked_by_me'] = (bool) $row['liked_by_me'];
            return $row;
        }, $rows);

        json_response([
            'success'  => true,
            'posts'    => $posts,
            'page'     => $page,
            'has_more' => $hasMore,
        ]);
    }

    /* ── POST: create / like / delete ────────────────────────── */
    if ($method === 'POST') {
        if (!isset($_SESSION['user_id']) || (int) $_SESSION['user_id'] === 0) {
            json_response(['success' => false, 'message' => 'Not authenticated'], 401);
        }

        $userId = (int) $_SESSION['user_id'];
        $input  = read_json();
        $action = trim((string) ($input['action'] ?? ''));

        /* ── create ──────────────────────────────────────────── */
        if ($action === 'create') {
            $text      = trim((string) ($input['text'] ?? ''));
            $mediaUrl  = trim((string) ($input['media_url'] ?? ''));
            $mediaType = trim((string) ($input['media_type'] ?? ''));

            if ($text === '') {
                json_response(['success' => false, 'message' => 'Text is required'], 422);
            }
            if (mb_strlen($text) > 2000) {
                json_response(['success' => false, 'message' => 'Text is too long (max 2000 characters)'], 422);
            }

            $text = htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

            // Validate media
            $safeMediaUrl  = null;
            $safeMediaType = null;

            if ($mediaUrl !== '') {
                if (!filter_var($mediaUrl, FILTER_VALIDATE_URL) || !preg_match('#^https://#i', $mediaUrl)) {
                    json_response(['success' => false, 'message' => 'Invalid media URL (must be HTTPS)'], 422);
                }
                $safeMediaUrl = $mediaUrl;
            }

            $allowedMediaTypes = ['image', 'video'];
            if ($mediaType !== '' && in_array($mediaType, $allowedMediaTypes, true)) {
                $safeMediaType = $mediaType;
            }

            $stmt = $pdo->prepare(
                'INSERT INTO feed_posts (user_id, text, media_url, media_type)
                 VALUES (:user_id, :text, :media_url, :media_type)'
            );
            $stmt->execute([
                ':user_id'    => $userId,
                ':text'       => $text,
                ':media_url'  => $safeMediaUrl,
                ':media_type' => $safeMediaType,
            ]);

            $postId = (int) $pdo->lastInsertId();

            $postStmt = $pdo->prepare(
                'SELECT fp.id, fp.user_id, u.username, u.avatar AS user_avatar,
                        fp.text, fp.media_url, fp.media_type, fp.likes_count,
                        0 AS liked_by_me, fp.created_at
                 FROM feed_posts fp
                 JOIN users u ON u.id = fp.user_id
                 WHERE fp.id = :id'
            );
            $postStmt->execute([':id' => $postId]);
            $post = $postStmt->fetch(PDO::FETCH_ASSOC);

            if ($post) {
                $post['id']          = (int) $post['id'];
                $post['user_id']     = (int) $post['user_id'];
                $post['likes_count'] = (int) $post['likes_count'];
                $post['liked_by_me'] = false;
            }

            json_response([
                'success' => true,
                'message' => 'Post created',
                'post'    => $post,
            ], 201);
        }

        /* ── like (toggle) ───────────────────────────────────── */
        if ($action === 'like') {
            $postId = (int) ($input['post_id'] ?? 0);
            if ($postId <= 0) {
                json_response(['success' => false, 'message' => 'post_id is required'], 422);
            }

            // Verify post exists
            $check = $pdo->prepare('SELECT id FROM feed_posts WHERE id = :id');
            $check->execute([':id' => $postId]);
            if (!$check->fetch()) {
                json_response(['success' => false, 'message' => 'Post not found'], 404);
            }

            // Check if already liked
            $likeCheck = $pdo->prepare(
                'SELECT id FROM feed_likes WHERE post_id = :post_id AND user_id = :user_id'
            );
            $likeCheck->execute([':post_id' => $postId, ':user_id' => $userId]);
            $existing = $likeCheck->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // Unlike
                $del = $pdo->prepare('DELETE FROM feed_likes WHERE id = :id');
                $del->execute([':id' => (int) $existing['id']]);

                $pdo->prepare('UPDATE feed_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = :id')
                    ->execute([':id' => $postId]);
            } else {
                // Like
                $ins = $pdo->prepare(
                    'INSERT INTO feed_likes (post_id, user_id) VALUES (:post_id, :user_id)'
                );
                $ins->execute([':post_id' => $postId, ':user_id' => $userId]);

                $pdo->prepare('UPDATE feed_posts SET likes_count = likes_count + 1 WHERE id = :id')
                    ->execute([':id' => $postId]);
            }

            // Return updated count
            $countStmt = $pdo->prepare('SELECT likes_count FROM feed_posts WHERE id = :id');
            $countStmt->execute([':id' => $postId]);
            $likesCount = (int) $countStmt->fetchColumn();

            json_response([
                'success'     => true,
                'liked'       => !$existing,
                'likes_count' => $likesCount,
            ]);
        }

        /* ── delete ──────────────────────────────────────────── */
        if ($action === 'delete') {
            $postId = (int) ($input['post_id'] ?? 0);
            if ($postId <= 0) {
                json_response(['success' => false, 'message' => 'post_id is required'], 422);
            }

            $check = $pdo->prepare('SELECT id, user_id FROM feed_posts WHERE id = :id');
            $check->execute([':id' => $postId]);
            $post = $check->fetch(PDO::FETCH_ASSOC);

            if (!$post) {
                json_response(['success' => false, 'message' => 'Post not found'], 404);
            }
            if ((int) $post['user_id'] !== $userId) {
                json_response(['success' => false, 'message' => 'Forbidden'], 403);
            }

            $del = $pdo->prepare('DELETE FROM feed_posts WHERE id = :id');
            $del->execute([':id' => $postId]);

            json_response(['success' => true, 'message' => 'Post deleted']);
        }

        json_response(['success' => false, 'message' => 'Unknown action'], 400);
    }

    json_response(['success' => false, 'message' => 'Method not allowed'], 405);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

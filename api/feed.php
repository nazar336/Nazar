<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['GET', 'POST', 'DELETE', 'OPTIONS']);

start_secure_session();
$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0)
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);

$userId = (int)$_SESSION['user_id'];

// ── XP Reward Constants ───────────────────────────────────────────
const FEED_POST_XP       = 5;
const FEED_MAX_POSTS_DAY = 3;     // max 3 posts/day = 15 XP
const FEED_LIKE_XP       = 1;     // 1 XP per 10 likes received
const FEED_LIKE_THRESHOLD = 10;
const FEED_MAX_LIKE_XP_DAY = 5;
const FEED_COOLDOWN_SEC  = 60;    // 60 sec between posts

try {
    // ── GET — list feed posts ─────────────────────────────────────
    if ($method === 'GET') {
        $page   = max(1, (int)($_GET['page'] ?? 1));
        $limit  = 30;
        $offset = ($page - 1) * $limit;
        $filter = $_GET['filter'] ?? 'all'; // all | mine

        $where = '';
        $params = [];
        if ($filter === 'mine') {
            $where = 'WHERE fp.user_id = :uid';
            $params[':uid'] = $userId;
        }

        $stmt = $pdo->prepare("
            SELECT fp.id, fp.user_id, fp.content, fp.media_url, fp.category,
                   fp.likes_count, fp.created_at,
                   u.name AS author_name, u.username AS author_username, u.avatar,
                   (SELECT COUNT(*) FROM feed_likes fl WHERE fl.post_id = fp.id AND fl.user_id = :me) AS my_like
            FROM feed_posts fp
            JOIN users u ON u.id = fp.user_id
            $where
            ORDER BY fp.created_at DESC
            LIMIT :lim OFFSET :off
        ");
        $params[':me']  = $userId;
        $params[':lim'] = $limit;
        $params[':off'] = $offset;

        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        $posts = $stmt->fetchAll();

        // Sanitize output
        foreach ($posts as &$p) {
            $p['content']     = htmlspecialchars((string)$p['content'], ENT_QUOTES, 'UTF-8');
            $p['author_name'] = htmlspecialchars((string)$p['author_name'], ENT_QUOTES, 'UTF-8');
            $p['likes_count'] = (int)$p['likes_count'];
            $p['my_like']     = (int)$p['my_like'] > 0;
        }
        unset($p);

        json_response(['success' => true, 'posts' => $posts, 'page' => $page]);
    }

    // ── POST — create / like / unlike ─────────────────────────────
    if ($method === 'POST') {
        $input  = read_json();
        $action = $input['action'] ?? 'create';

        // ── CREATE POST ───────────────────────────────────────────
        if ($action === 'create') {
            $content  = trim((string)($input['content'] ?? ''));
            $mediaUrl = trim((string)($input['media_url'] ?? ''));
            $category = (string)($input['category'] ?? 'other');

            if ($content === '')
                json_response(['success' => false, 'message' => 'Content is required'], 400);
            if (mb_strlen($content) > 2000)
                json_response(['success' => false, 'message' => 'Content too long (max 2000 chars)'], 400);

            // Validate media URL (must be HTTPS if provided)
            if ($mediaUrl !== '') {
                if (mb_strlen($mediaUrl) > 500)
                    json_response(['success' => false, 'message' => 'Media URL too long'], 400);
                if (!preg_match('#^https://#i', $mediaUrl))
                    json_response(['success' => false, 'message' => 'Media URL must be HTTPS'], 400);
                // Block dangerous schemes
                if (preg_match('#^(javascript|data):#i', $mediaUrl))
                    json_response(['success' => false, 'message' => 'Invalid media URL'], 400);
            }

            $allowedCategories = ['task', 'achievement', 'wallet', 'other'];
            if (!in_array($category, $allowedCategories, true))
                $category = 'other';

            // Anti-abuse: cooldown
            $lastPost = $pdo->prepare('SELECT created_at FROM feed_posts WHERE user_id=:uid ORDER BY created_at DESC LIMIT 1');
            $lastPost->execute([':uid' => $userId]);
            $lastRow = $lastPost->fetch();
            if ($lastRow && (time() - strtotime($lastRow['created_at'])) < FEED_COOLDOWN_SEC)
                json_response(['success' => false, 'message' => 'Please wait before posting again'], 429);

            // Insert post
            $stmt = $pdo->prepare('INSERT INTO feed_posts (user_id, content, media_url, category) VALUES (:uid, :content, :media, :cat)');
            $stmt->execute([
                ':uid'     => $userId,
                ':content' => $content,
                ':media'   => $mediaUrl ?: null,
                ':cat'     => $category,
            ]);
            $postId = (int)$pdo->lastInsertId();

            // XP reward: 5 XP per post, max 3/day
            $todayCount = $pdo->prepare("SELECT COUNT(*) FROM feed_posts WHERE user_id=:uid AND DATE(created_at)=CURDATE()");
            $todayCount->execute([':uid' => $userId]);
            if ((int)$todayCount->fetchColumn() <= FEED_MAX_POSTS_DAY) {
                addXp($pdo, $userId, FEED_POST_XP);
            }

            // Return created post
            $getStmt = $pdo->prepare("
                SELECT fp.id, fp.user_id, fp.content, fp.media_url, fp.category,
                       fp.likes_count, fp.created_at,
                       u.name AS author_name, u.username AS author_username, u.avatar
                FROM feed_posts fp JOIN users u ON u.id = fp.user_id
                WHERE fp.id = :id
            ");
            $getStmt->execute([':id' => $postId]);
            $post = $getStmt->fetch();
            $post['content']     = htmlspecialchars((string)$post['content'], ENT_QUOTES, 'UTF-8');
            $post['author_name'] = htmlspecialchars((string)$post['author_name'], ENT_QUOTES, 'UTF-8');
            $post['likes_count'] = (int)$post['likes_count'];
            $post['my_like']     = false;

            json_response(['success' => true, 'message' => 'Post created', 'post' => $post], 201);
        }

        // ── LIKE ──────────────────────────────────────────────────
        if ($action === 'like') {
            $postId = (int)($input['post_id'] ?? 0);
            if (!$postId) json_response(['success' => false, 'message' => 'Missing post_id'], 400);

            // Check post exists
            $check = $pdo->prepare('SELECT user_id FROM feed_posts WHERE id=:id');
            $check->execute([':id' => $postId]);
            $postOwner = $check->fetch();
            if (!$postOwner) json_response(['success' => false, 'message' => 'Post not found'], 404);

            // No self-likes
            if ((int)$postOwner['user_id'] === $userId)
                json_response(['success' => false, 'message' => 'Cannot like your own post'], 400);

            // Insert like (UNIQUE constraint prevents duplicates)
            try {
                $pdo->prepare('INSERT INTO feed_likes (post_id, user_id) VALUES (:pid, :uid)')
                    ->execute([':pid' => $postId, ':uid' => $userId]);
                $pdo->prepare('UPDATE feed_posts SET likes_count = likes_count + 1 WHERE id=:id')
                    ->execute([':id' => $postId]);

                // XP reward to post owner: 1 XP per 10 likes (max 5/day)
                $totalLikes = $pdo->prepare('SELECT likes_count FROM feed_posts WHERE id=:id');
                $totalLikes->execute([':id' => $postId]);
                $count = (int)$totalLikes->fetchColumn();
                if ($count > 0 && $count % FEED_LIKE_THRESHOLD === 0) {
                    // Check daily limit for post owner
                    $ownerId = (int)$postOwner['user_id'];
                    addXp($pdo, $ownerId, FEED_LIKE_XP);
                }
            } catch (\PDOException $e) {
                // Duplicate — already liked, ignore
                if ((int)$e->getCode() === 23000) {
                    json_response(['success' => false, 'message' => 'Already liked'], 409);
                }
                throw $e;
            }

            $newCount = $pdo->prepare('SELECT likes_count FROM feed_posts WHERE id=:id');
            $newCount->execute([':id' => $postId]);
            json_response(['success' => true, 'likes_count' => (int)$newCount->fetchColumn()]);
        }

        // ── UNLIKE ────────────────────────────────────────────────
        if ($action === 'unlike') {
            $postId = (int)($input['post_id'] ?? 0);
            if (!$postId) json_response(['success' => false, 'message' => 'Missing post_id'], 400);

            $del = $pdo->prepare('DELETE FROM feed_likes WHERE post_id=:pid AND user_id=:uid');
            $del->execute([':pid' => $postId, ':uid' => $userId]);

            if ($del->rowCount() > 0) {
                $pdo->prepare('UPDATE feed_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id=:id')
                    ->execute([':id' => $postId]);
            }

            $newCount = $pdo->prepare('SELECT likes_count FROM feed_posts WHERE id=:id');
            $newCount->execute([':id' => $postId]);
            json_response(['success' => true, 'likes_count' => (int)$newCount->fetchColumn()]);
        }

        json_response(['success' => false, 'message' => 'Unknown action'], 400);
    }

    // ── DELETE — delete own post ───────────────────────────────────
    if ($method === 'DELETE') {
        $postId = (int)($_GET['id'] ?? 0);
        if (!$postId) json_response(['success' => false, 'message' => 'Missing post id'], 400);

        $check = $pdo->prepare('SELECT id FROM feed_posts WHERE id=:id AND user_id=:uid');
        $check->execute([':id' => $postId, ':uid' => $userId]);
        if (!$check->fetch()) json_response(['success' => false, 'message' => 'Not authorized'], 403);

        // No XP refund on delete
        $pdo->prepare('DELETE FROM feed_posts WHERE id=:id')->execute([':id' => $postId]);
        json_response(['success' => true, 'message' => 'Post deleted']);
    }

    json_response(['success' => false, 'message' => 'Method not allowed'], 405);
} catch (\Throwable $e) {
    error_log('feed error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

// ── Helper: add XP to user ────────────────────────────────────────
function addXp(PDO $pdo, int $userId, int $amount): void {
    $pdo->prepare('UPDATE users SET xp = xp + :xp, level = LEAST(12, FLOOR((xp + :xp2) / 1000) + 1) WHERE id = :uid')
        ->execute([':xp' => $amount, ':xp2' => $amount, ':uid' => $userId]);
}

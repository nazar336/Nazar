<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['GET', 'POST', 'DELETE', 'OPTIONS']);

start_secure_session();
$pdo    = db();
$method = $_SERVER['REQUEST_METHOD'];
csrf_validate();

/* ─────── Constants: Feed Rewards & Limits ─────── */
const FEED_XP_PER_POST       = 5;    // XP earned per new post
const FEED_MAX_POSTS_PER_DAY = 3;    // Max posts per user per day (earns XP)
const FEED_POST_COOLDOWN_SEC = 60;   // Min seconds between posts
const FEED_XP_PER_LIKE_BATCH = 1;    // XP per batch of likes received
const FEED_LIKES_PER_BATCH   = 10;   // How many likes = 1 XP batch
const FEED_MAX_LIKE_XP_DAY   = 5;    // Max XP from likes per day
const FEED_TEXT_MIN_LEN       = 3;   // Min post text length
const FEED_TEXT_MAX_LEN       = 2000; // Max post text length
const FEED_MEDIA_URL_MAX_LEN  = 500; // Max media URL length

/* ─────── Auth check ─────── */
$isAuth = isset($_SESSION['user_id']) && (int)$_SESSION['user_id'] > 0;
$userId = $isAuth ? (int)$_SESSION['user_id'] : 0;

try {
    if ($method === 'GET') {
        handleList($pdo, $userId);
    } elseif ($method === 'POST') {
        if (!$isAuth) json_response(['success' => false, 'message' => 'Not authenticated'], 401);
        $input  = read_json();
        $action = $input['action'] ?? 'create';
        match ($action) {
            'create' => handleCreate($pdo, $userId, $input),
            'like'   => handleLike($pdo, $userId, $input),
            'unlike' => handleUnlike($pdo, $userId, $input),
            default  => json_response(['success' => false, 'message' => 'Unknown action'], 400),
        };
    } elseif ($method === 'DELETE') {
        if (!$isAuth) json_response(['success' => false, 'message' => 'Not authenticated'], 401);
        handleDelete($pdo, $userId);
    } else {
        json_response(['success' => false, 'message' => 'Method not allowed'], 405);
    }
} catch (\Exception $e) {
    error_log('feed error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

/* ══════════════════════════════════════════════════════════════════
   GET  — List feed posts (paginated, newest first)
   ?page=1&limit=20
   ══════════════════════════════════════════════════════════════════ */
function handleList(PDO $pdo, int $userId): never
{
    $page  = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $stmt = $pdo->prepare("
        SELECT fp.id, fp.user_id, fp.text, fp.media_url, fp.media_type, fp.post_type,
               fp.likes_count, fp.created_at,
               u.username, u.name, u.level, u.avatar,
               " . ($userId > 0 ? "(SELECT 1 FROM feed_likes fl WHERE fl.post_id=fp.id AND fl.user_id=:uid LIMIT 1)" : "0") . " AS liked_by_me
        FROM feed_posts fp
        JOIN users u ON u.id = fp.user_id
        ORDER BY fp.created_at DESC
        LIMIT :lim OFFSET :off
    ");
    if ($userId > 0) $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($posts as &$p) {
        $p['id']          = (int)$p['id'];
        $p['user_id']     = (int)$p['user_id'];
        $p['likes_count'] = (int)$p['likes_count'];
        $p['level']       = (int)$p['level'];
        $p['liked_by_me'] = (bool)$p['liked_by_me'];
        $p['is_own']      = $userId > 0 && (int)$p['user_id'] === $userId;
        // Sanitize text for safe HTML display
        $p['text']        = htmlspecialchars((string)$p['text'], ENT_QUOTES, 'UTF-8');
    }
    unset($p);

    // Today's post count for current user
    $todayPosts = 0;
    if ($userId > 0) {
        $cpStmt = $pdo->prepare("SELECT COUNT(*) FROM feed_posts WHERE user_id=:uid AND DATE(created_at)=CURDATE()");
        $cpStmt->execute([':uid' => $userId]);
        $todayPosts = (int)$cpStmt->fetchColumn();
    }

    json_response([
        'success'      => true,
        'posts'        => $posts,
        'page'         => $page,
        'today_posts'  => $todayPosts,
        'max_posts_day'=> FEED_MAX_POSTS_PER_DAY,
        'xp_per_post'  => FEED_XP_PER_POST,
    ]);
}

/* ══════════════════════════════════════════════════════════════════
   POST create — Create a new feed post with XP reward
   ══════════════════════════════════════════════════════════════════ */
function handleCreate(PDO $pdo, int $userId, array $input): never
{
    $text      = trim((string)($input['text'] ?? ''));
    $mediaUrl  = trim((string)($input['media_url'] ?? ''));
    $mediaType = in_array($input['media_type'] ?? '', ['image', 'video'], true) ? $input['media_type'] : '';
    $postType  = in_array($input['post_type'] ?? 'text', ['text', 'task', 'achievement', 'wallet'], true)
                 ? $input['post_type'] : 'text';

    // ── Text validation ──
    if (mb_strlen($text) < FEED_TEXT_MIN_LEN) {
        json_response(['success' => false, 'message' => 'Post text too short (min ' . FEED_TEXT_MIN_LEN . ' chars)'], 400);
    }
    if (mb_strlen($text) > FEED_TEXT_MAX_LEN) {
        json_response(['success' => false, 'message' => 'Post text too long (max ' . FEED_TEXT_MAX_LEN . ' chars)'], 400);
    }

    // ── Media URL validation ──
    if ($mediaUrl !== '') {
        if (mb_strlen($mediaUrl) > FEED_MEDIA_URL_MAX_LEN) {
            json_response(['success' => false, 'message' => 'Media URL too long'], 400);
        }
        if (!preg_match('#^https://#i', $mediaUrl)) {
            json_response(['success' => false, 'message' => 'Media URL must use HTTPS'], 400);
        }
        // Prevent javascript: / data: and other schemes hidden in URL
        $parsedUrl = parse_url($mediaUrl);
        if (!$parsedUrl || !isset($parsedUrl['scheme']) || strtolower($parsedUrl['scheme']) !== 'https') {
            json_response(['success' => false, 'message' => 'Invalid media URL'], 400);
        }
    }

    // ── Level-gated media check ──
    $lvlStmt = $pdo->prepare('SELECT level FROM users WHERE id=:uid');
    $lvlStmt->execute([':uid' => $userId]);
    $userLevel = (int)($lvlStmt->fetchColumn() ?: 1);

    // Level privilege map for feed media
    $feedMediaByLevel = [
        1 => 'none', 2 => 'image', 3 => 'image', 4 => 'video', 5 => 'video',
        6 => 'all', 7 => 'all', 8 => 'all', 9 => 'all', 10 => 'all', 11 => 'all', 12 => 'all'
    ];
    $allowedMedia = $feedMediaByLevel[$userLevel] ?? 'none';

    if ($mediaUrl !== '' && $mediaType !== '') {
        if ($allowedMedia === 'none') {
            json_response(['success' => false, 'message' => 'Media not allowed at your level. Level 2+ for images.'], 403);
        }
        if ($mediaType === 'video' && !in_array($allowedMedia, ['video', 'all'], true)) {
            json_response(['success' => false, 'message' => 'Video not allowed at your level. Level 4+ for video.'], 403);
        }
    }

    // ── Rate limit: cooldown ──
    $cooldownStmt = $pdo->prepare("
        SELECT created_at FROM feed_posts 
        WHERE user_id=:uid 
        ORDER BY created_at DESC LIMIT 1
    ");
    $cooldownStmt->execute([':uid' => $userId]);
    $lastPost = $cooldownStmt->fetchColumn();
    if ($lastPost && (time() - strtotime($lastPost)) < FEED_POST_COOLDOWN_SEC) {
        $wait = FEED_POST_COOLDOWN_SEC - (time() - strtotime($lastPost));
        json_response(['success' => false, 'message' => 'Please wait ' . $wait . ' seconds before posting again'], 429);
    }

    // ── Rate limit: daily posts ──
    $dayCountStmt = $pdo->prepare("SELECT COUNT(*) FROM feed_posts WHERE user_id=:uid AND DATE(created_at)=CURDATE()");
    $dayCountStmt->execute([':uid' => $userId]);
    $todayCount = (int)$dayCountStmt->fetchColumn();

    // Allow posting beyond limit, but no XP reward
    $earnXp = $todayCount < FEED_MAX_POSTS_PER_DAY;

    // ── Insert post (store raw text; sanitize only on output/display) ──
    $pdo->beginTransaction();
    try {
        $insertStmt = $pdo->prepare("
            INSERT INTO feed_posts (user_id, text, media_url, media_type, post_type, created_at)
            VALUES (:uid, :text, :media, :mtype, :ptype, NOW())
        ");
        $insertStmt->execute([
            ':uid'   => $userId,
            ':text'  => $text,
            ':media' => $mediaUrl !== '' ? $mediaUrl : null,
            ':mtype' => $mediaType !== '' ? $mediaType : null,
            ':ptype' => $postType,
        ]);
        $postId = (int)$pdo->lastInsertId();

        // ── XP reward (only if under daily cap) ──
        $xpEarned = 0;
        if ($earnXp) {
            $xpEarned = FEED_XP_PER_POST;
            $pdo->prepare('UPDATE users SET xp=xp+:xp, level=LEAST(12, FLOOR((xp+:xp2)/1000)+1) WHERE id=:uid')
                ->execute([':xp' => $xpEarned, ':xp2' => $xpEarned, ':uid' => $userId]);
        }

        $pdo->commit();

        // Fetch new user state
        $userStmt = $pdo->prepare('SELECT xp, level FROM users WHERE id=:uid');
        $userStmt->execute([':uid' => $userId]);
        $userRow = $userStmt->fetch(PDO::FETCH_ASSOC) ?: ['xp' => 0, 'level' => 1];

        json_response([
            'success'    => true,
            'post_id'    => $postId,
            'xp_earned'  => $xpEarned,
            'xp'         => (int)$userRow['xp'],
            'level'      => (int)$userRow['level'],
            'posts_today'=> $todayCount + 1,
            'message'    => $earnXp
                ? 'Post published! +' . $xpEarned . ' XP'
                : 'Post published! (Daily XP limit reached)',
        ]);
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

/* ══════════════════════════════════════════════════════════════════
   POST like / unlike — Toggle like on a post
   ══════════════════════════════════════════════════════════════════ */
function handleLike(PDO $pdo, int $userId, array $input): never
{
    $postId = (int)($input['post_id'] ?? 0);
    if ($postId <= 0) json_response(['success' => false, 'message' => 'Invalid post_id'], 400);

    // ── Verify post exists & prevent self-like ──
    $postStmt = $pdo->prepare('SELECT id, user_id, likes_count FROM feed_posts WHERE id=:pid');
    $postStmt->execute([':pid' => $postId]);
    $post = $postStmt->fetch();
    if (!$post) json_response(['success' => false, 'message' => 'Post not found'], 404);

    if ((int)$post['user_id'] === $userId) {
        json_response(['success' => false, 'message' => 'Cannot like your own post'], 400);
    }

    // ── Check already liked ──
    $checkStmt = $pdo->prepare('SELECT id FROM feed_likes WHERE post_id=:pid AND user_id=:uid LIMIT 1');
    $checkStmt->execute([':pid' => $postId, ':uid' => $userId]);
    if ($checkStmt->fetch()) {
        json_response(['success' => false, 'message' => 'Already liked'], 409);
    }

    $pdo->beginTransaction();
    try {
        // Insert like
        $pdo->prepare('INSERT INTO feed_likes (post_id, user_id) VALUES (:pid, :uid)')
            ->execute([':pid' => $postId, ':uid' => $userId]);

        // Increment counter
        $pdo->prepare('UPDATE feed_posts SET likes_count=likes_count+1 WHERE id=:pid')
            ->execute([':pid' => $postId]);

        // ── XP reward for post author (batched: 1 XP per 10 likes received) ──
        $authorId  = (int)$post['user_id'];
        $newLikes  = (int)$post['likes_count'] + 1;
        $xpEarned  = 0;

        // Check if this like pushes to a new batch of 10
        if ($newLikes % FEED_LIKES_PER_BATCH === 0) {
            // Check daily XP cap from likes for the author
            $likeXpToday = $pdo->prepare("
                SELECT COUNT(*) FROM feed_likes fl
                JOIN feed_posts fp ON fp.id = fl.post_id
                WHERE fp.user_id = :author 
                AND DATE(fl.created_at) = CURDATE()
            ");
            $likeXpToday->execute([':author' => $authorId]);
            $todayLikeCount = (int)$likeXpToday->fetchColumn();
            // Count how many 10-like batches happened today
            $batchesEarnedToday = (int)floor($todayLikeCount / FEED_LIKES_PER_BATCH);
            $xpFromLikesToday = $batchesEarnedToday * FEED_XP_PER_LIKE_BATCH;

            if ($xpFromLikesToday < FEED_MAX_LIKE_XP_DAY) {
                $xpEarned = FEED_XP_PER_LIKE_BATCH;
                $pdo->prepare('UPDATE users SET xp=xp+:xp, level=LEAST(12, FLOOR((xp+:xp2)/1000)+1) WHERE id=:uid')
                    ->execute([':xp' => $xpEarned, ':xp2' => $xpEarned, ':uid' => $authorId]);
            }
        }

        $pdo->commit();

        json_response([
            'success'     => true,
            'likes_count' => $newLikes,
            'author_xp'   => $xpEarned,
            'message'     => 'Liked!',
        ]);
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ((int)$e->getCode() === 23000) {
            // Duplicate like (race condition)
            json_response(['success' => false, 'message' => 'Already liked'], 409);
        }
        throw $e;
    }
}

function handleUnlike(PDO $pdo, int $userId, array $input): never
{
    $postId = (int)($input['post_id'] ?? 0);
    if ($postId <= 0) json_response(['success' => false, 'message' => 'Invalid post_id'], 400);

    $pdo->beginTransaction();
    try {
        $del = $pdo->prepare('DELETE FROM feed_likes WHERE post_id=:pid AND user_id=:uid');
        $del->execute([':pid' => $postId, ':uid' => $userId]);

        if ($del->rowCount() > 0) {
            $pdo->prepare('UPDATE feed_posts SET likes_count=GREATEST(0, likes_count-1) WHERE id=:pid')
                ->execute([':pid' => $postId]);
        }

        $pdo->commit();

        // Get updated count
        $cntStmt = $pdo->prepare('SELECT likes_count FROM feed_posts WHERE id=:pid');
        $cntStmt->execute([':pid' => $postId]);
        $count = (int)($cntStmt->fetchColumn() ?: 0);

        json_response([
            'success'     => true,
            'likes_count' => $count,
            'message'     => 'Unliked',
        ]);
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}

/* ══════════════════════════════════════════════════════════════════
   DELETE — Delete own post
   ?id=123
   ══════════════════════════════════════════════════════════════════ */
function handleDelete(PDO $pdo, int $userId): never
{
    $postId = (int)($_GET['id'] ?? 0);
    if ($postId <= 0) json_response(['success' => false, 'message' => 'Invalid post id'], 400);

    $stmt = $pdo->prepare('SELECT id, user_id FROM feed_posts WHERE id=:pid');
    $stmt->execute([':pid' => $postId]);
    $post = $stmt->fetch();
    if (!$post) json_response(['success' => false, 'message' => 'Post not found'], 404);
    if ((int)$post['user_id'] !== $userId) json_response(['success' => false, 'message' => 'Not authorized'], 403);

    // Note: no XP refund on deletion (prevents abuse: post→earn XP→delete→repeat)
    $pdo->prepare('DELETE FROM feed_posts WHERE id=:pid AND user_id=:uid')
        ->execute([':pid' => $postId, ':uid' => $userId]);

    json_response(['success' => true, 'message' => 'Post deleted']);
}

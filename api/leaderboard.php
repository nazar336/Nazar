<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
cors_headers(['GET', 'OPTIONS']);

start_secure_session();
$pdo = db();

// Guest access allowed (shows leaderboard without user position)
$currentUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;

try {
    $period = in_array($_GET['period'] ?? 'all-time', ['all-time', 'monthly', 'weekly'], true)
        ? $_GET['period'] : 'all-time';
    $limit  = min(100, max(1, (int)($_GET['limit'] ?? 100)));

    $dateFilter = match($period) {
        'monthly' => 'AND t.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)',
        'weekly'  => 'AND t.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)',
        default   => '',
    };
    $dateFilterTa = match($period) {
        'monthly' => 'AND ta.assigned_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)',
        'weekly'  => 'AND ta.assigned_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)',
        default   => '',
    };

    $stmt = $pdo->prepare("
        SELECT
            u.id, u.name, u.username, u.avatar, u.level, u.xp, u.streak,
            COALESCE(SUM(CASE WHEN t.type IN ('task_reward') THEN t.amount ELSE 0 END), 0) AS earnings,
            COUNT(DISTINCT ta.id) AS completed_tasks,
            (u.level * 1000
             + COALESCE(SUM(CASE WHEN t.type='task_reward' THEN t.amount ELSE 0 END), 0) * 0.5
             + COUNT(DISTINCT ta.id) * 10
             + u.streak * 5
            ) AS score
        FROM users u
        LEFT JOIN transactions t
            ON t.user_id = u.id AND t.type = 'task_reward' AND t.status = 'completed' $dateFilter
        LEFT JOIN task_assignments ta
            ON ta.user_id = u.id AND ta.status = 'completed' $dateFilterTa
        WHERE u.is_active = TRUE
        GROUP BY u.id, u.name, u.username, u.avatar, u.level, u.xp, u.streak
        ORDER BY score DESC
        LIMIT :limit
    ");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $leaderboard = $stmt->fetchAll();

    foreach ($leaderboard as $i => &$entry) {
        $entry['position']   = $i + 1;
        $entry['earnings']   = (float)$entry['earnings'];
        $entry['score']      = (float)$entry['score'];
    }
    unset($entry);

    // Find current user's position
    $userPosition = null;
    if ($currentUserId > 0) {
        foreach ($leaderboard as $entry) {
            if ((int)$entry['id'] === $currentUserId) {
                $userPosition = $entry['position'];
                break;
            }
        }
        if ($userPosition === null) {
            $rankStmt = $pdo->prepare("
                SELECT COUNT(*) + 1 AS rank FROM (
                    SELECT u2.id,
                        (u2.level * 1000
                         + COALESCE(SUM(CASE WHEN t2.type='task_reward' AND t2.status='completed' THEN t2.amount ELSE 0 END),0) * 0.5
                         + COUNT(DISTINCT ta2.id) * 10
                         + u2.streak * 5
                        ) AS score
                    FROM users u2
                    LEFT JOIN transactions t2 ON t2.user_id=u2.id $dateFilter
                    LEFT JOIN task_assignments ta2 ON ta2.user_id=u2.id AND ta2.status='completed' $dateFilterTa
                    WHERE u2.is_active=TRUE
                    GROUP BY u2.id
                    HAVING score > (
                        SELECT (u3.level * 1000
                                + COALESCE(SUM(CASE WHEN t3.type='task_reward' AND t3.status='completed' THEN t3.amount ELSE 0 END),0) * 0.5
                                + COUNT(DISTINCT ta3.id) * 10
                                + u3.streak * 5)
                        FROM users u3
                        LEFT JOIN transactions t3 ON t3.user_id=u3.id $dateFilter
                        LEFT JOIN task_assignments ta3 ON ta3.user_id=u3.id AND ta3.status='completed' $dateFilterTa
                        WHERE u3.id=:uid AND u3.is_active=TRUE
                        GROUP BY u3.id
                    )
                ) ranked
            ");
            $rankStmt->execute([':uid' => $currentUserId]);
            $userPosition = (int)($rankStmt->fetchColumn() ?? 0);
        }
    }

    json_response([
        'success'       => true,
        'period'        => $period,
        'leaderboard'   => $leaderboard,
        'user_position' => $userPosition,
    ]);

} catch (\Exception $e) {
    error_log('leaderboard error: ' . $e->getMessage());
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

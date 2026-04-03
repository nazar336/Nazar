<?php
declare(strict_types=1);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) === $host) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/bootstrap.php';

start_secure_session();
csrf_validate();

if (!isset($_SESSION['user_id']) || (int)$_SESSION['user_id'] === 0) {
    json_response(['success' => false, 'message' => 'Not authenticated'], 401);
}

$pdo = db();
$userId = (int) $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $stmt = $pdo->prepare('SELECT id, subject, description, category, priority, status, created_at, updated_at FROM support_tickets WHERE user_id = :user_id ORDER BY created_at DESC, id DESC');
        $stmt->execute([':user_id' => $userId]);

        json_response([
            'success' => true,
            'tickets' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        ]);
    }

    if ($method === 'POST') {
        $input = read_json();

        // Rate limit: max 10 tickets per user per 60 min
        if (check_rate_limit($pdo, 'support:' . $userId, 10, 60))
            json_response(['success' => false, 'message' => 'Too many tickets. Please wait before creating another.'], 429);

        $subject = trim((string) ($input['subject'] ?? ''));
        $description = trim((string) ($input['description'] ?? ''));
        $category = (string) ($input['category'] ?? 'general');
        $priority = (string) ($input['priority'] ?? 'normal');

        $allowedCategories = ['billing', 'technical', 'account', 'general'];
        $allowedPriorities = ['low', 'normal', 'high', 'critical'];

        if ($subject === '') {
            json_response(['success' => false, 'message' => 'Subject is required'], 422);
        }

        if (mb_strlen($subject) > 255) {
            json_response(['success' => false, 'message' => 'Subject is too long'], 422);
        }

        if ($description === '') {
            $description = $subject;
        }

        if (mb_strlen($description) > 5000) {
            json_response(['success' => false, 'message' => 'Description is too long (max 5000 characters)'], 422);
        }

        if (!in_array($category, $allowedCategories, true)) {
            $category = 'general';
        }

        if (!in_array($priority, $allowedPriorities, true)) {
            $priority = 'normal';
        }

        $stmt = $pdo->prepare('INSERT INTO support_tickets (user_id, subject, description, category, priority, status) VALUES (:user_id, :subject, :description, :category, :priority, "open")');
        $stmt->execute([
            ':user_id' => $userId,
            ':subject' => $subject,
            ':description' => $description,
            ':category' => $category,
            ':priority' => $priority,
        ]);

        $ticketId = (int) $pdo->lastInsertId();
        record_rate_limit($pdo, 'support:' . $userId);

        $ticketStmt = $pdo->prepare('SELECT id, subject, description, category, priority, status, created_at, updated_at FROM support_tickets WHERE id = :id AND user_id = :user_id LIMIT 1');
        $ticketStmt->execute([':id' => $ticketId, ':user_id' => $userId]);

        json_response([
            'success' => true,
            'message' => 'Ticket created successfully',
            'ticket' => $ticketStmt->fetch(PDO::FETCH_ASSOC),
        ], 201);
    }

    json_response(['success' => false, 'message' => 'Method not allowed'], 405);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error'], 500);
}

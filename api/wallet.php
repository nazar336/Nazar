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

if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(200);exit;}

require_once __DIR__.'/bootstrap.php';

start_secure_session();
$pdo=db();
$method=$_SERVER['REQUEST_METHOD'];
csrf_validate();

if(!isset($_SESSION['user_id']) || (int)$_SESSION['user_id']===0){
  json_response(['success'=>false,'message'=>'Not authenticated'],401);
  exit;
}

$userId=(int)$_SESSION['user_id'];

try{
  if($method==='GET'){
    // Get wallet info (balance & transaction history)
    $page=(int)($_GET['page']??1);
    $limit=20;
    $offset=($page-1)*$limit;
    
    // Calculate balance
    $stmt=$pdo->prepare('
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ("deposit","transfer_received","task_reward") THEN amount ELSE 0 END) - SUM(CASE WHEN type IN ("withdraw","transfer_sent") THEN amount ELSE 0 END), 0) as balance
      FROM transactions 
      WHERE user_id=:uid AND status="completed"
    ');
    $stmt->execute([':uid'=>$userId]);
    $result=$stmt->fetch(PDO::FETCH_ASSOC);
    $balance=(float)($result['balance']??0);
    
    // Get pending balance
    $pendingStmt=$pdo->prepare('
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ("deposit","transfer_received","task_reward") THEN amount ELSE 0 END) - SUM(CASE WHEN type IN ("withdraw","transfer_sent") THEN amount ELSE 0 END), 0) as pending_balance
      FROM transactions 
      WHERE user_id=:uid AND status="pending"
    ');
    $pendingStmt->execute([':uid'=>$userId]);
    $pending=$pendingStmt->fetch(PDO::FETCH_ASSOC);
    $pendingBalance=(float)($pending['pending_balance']??0);
    
    // Get transaction history
    $historyStmt=$pdo->prepare('
      SELECT id,type,amount,description,status,created_at
      FROM transactions
      WHERE user_id=:uid
      ORDER BY created_at DESC
      LIMIT :lim OFFSET :off
    ');
    $historyStmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $historyStmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $historyStmt->bindValue(':off', $offset, PDO::PARAM_INT);
    $historyStmt->execute();
    $history=$historyStmt->fetchAll(PDO::FETCH_ASSOC);

    // Coin balance
    $pdo->prepare('INSERT IGNORE INTO user_coins (user_id) VALUES (:uid)')->execute([':uid'=>$userId]);
    $coinStmt=$pdo->prepare('SELECT coin_balance,total_purchased,total_spent FROM user_coins WHERE user_id=:uid');
    $coinStmt->execute([':uid'=>$userId]);
    $coinRow=$coinStmt->fetch(PDO::FETCH_ASSOC);

    // Pending crypto deposits
    $cryptoStmt=$pdo->prepare('
      SELECT COUNT(*) as pending_count, COALESCE(SUM(amount_usdt),0) as pending_usdt
      FROM crypto_deposits WHERE user_id=:uid AND status="pending" AND expires_at>NOW()
    ');
    $cryptoStmt->execute([':uid'=>$userId]);
    $cryptoRow=$cryptoStmt->fetch(PDO::FETCH_ASSOC);

    json_response([
      'success'=>true,
      'balance'=>$balance,
      'pending_balance'=>$pendingBalance,
      'total_balance'=>$balance+$pendingBalance,
      'transactions'=>$history,
      'page'=>$page,
      'coin_balance'=>(float)($coinRow['coin_balance']??0),
      'coins_purchased'=>(float)($coinRow['total_purchased']??0),
      'coins_spent'=>(float)($coinRow['total_spent']??0),
      'crypto_pending_count'=>(int)($cryptoRow['pending_count']??0),
      'crypto_pending_usdt'=>(float)($cryptoRow['pending_usdt']??0),
    ]);
  } elseif($method==='POST'){
    // Legacy fiat deposit/withdraw endpoint is disabled.
    // Use /api/crypto-deposit.php for all fund operations.
    json_response([
      'success'=>false,
      'message'=>'This endpoint is disabled. Use /api/crypto-deposit.php to deposit USDT, ETH, BTC or SOL.'
    ],410);
    exit;
  }
} catch(Exception $e){
  json_response(['success'=>false,'message'=>'Server error'],500);
}
?>

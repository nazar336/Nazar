<?php
declare(strict_types=1);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) === $host) {
header('Access-Control-Allow-Origin: ' . $origin);
header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(200);exit;}

require_once __DIR__.'/bootstrap.php';

start_secure_session();
$pdo=db();

if(!isset($_SESSION['user_id']) || (int)$_SESSION['user_id']===0){
  json_response(['success'=>false,'message'=>'Not authenticated'],401);
  exit;
}

$userId=(int)$_SESSION['user_id'];

try{
  $input=read_json();
  
  if(!isset($input['task_id'])){
    json_response(['success'=>false,'message'=>'Missing task_id'],400);
    exit;
  }
  
  $taskId=(int)$input['task_id'];
  
  // ── Level privilege: check user level for difficulty & max active tasks ──
  $lvlStmt=$pdo->prepare('SELECT level FROM users WHERE id=:uid');
  $lvlStmt->execute([':uid'=>$userId]);
  $userLevel=(int)($lvlStmt->fetchColumn()?:1);

  // Max active tasks by level: lvl1=3, lvl2=5, lvl3=7, ..., lvl12=unlimited
  $maxTasksByLevel=[1=>3,2=>5,3=>7,4=>10,5=>13,6=>16,7=>20,8=>25,9=>30,10=>40,11=>50,12=>999];
  $maxActiveTasks=$maxTasksByLevel[$userLevel]??3;

  // Difficulty allowed by level: lvl1=easy, lvl2+=medium, lvl5+=hard
  $allowedDifficulty=['easy'];
  if($userLevel>=2) $allowedDifficulty[]='medium';
  if($userLevel>=5) $allowedDifficulty[]='hard';

  // Check max active tasks before starting transaction
  $activeCountStmt=$pdo->prepare('SELECT COUNT(*) FROM task_assignments WHERE user_id=:uid AND status="taken"');
  $activeCountStmt->execute([':uid'=>$userId]);
  $activeCount=(int)$activeCountStmt->fetchColumn();
  if($activeCount>=$maxActiveTasks){
    json_response(['success'=>false,'message'=>'Max active tasks at level '.$userLevel.' is '.$maxActiveTasks.'. Complete tasks or level up!'],400);
    exit;
  }

  $pdo->beginTransaction();
  try{
    // Lock task row to avoid slot race conditions
    $taskStmt=$pdo->prepare('
      SELECT id,slots,status,reward,creator_id,deadline,difficulty
      FROM tasks
      WHERE id=:id
      FOR UPDATE
    ');
    $taskStmt->execute([':id'=>$taskId]);
    $task=$taskStmt->fetch(PDO::FETCH_ASSOC);
    
    if(!$task){
      $pdo->rollBack();
      json_response(['success'=>false,'message'=>'Task not found'],404);
      exit;
    }

    // ── Level privilege: check difficulty restriction ──
    $taskDifficulty=$task['difficulty']??'medium';
    if(!in_array($taskDifficulty,$allowedDifficulty,true)){
      $pdo->rollBack();
      $reqLevel=$taskDifficulty==='hard'?5:2;
      json_response(['success'=>false,'message'=>ucfirst($taskDifficulty).' tasks require level '.$reqLevel.'+. Current level: '.$userLevel],403);
      exit;
    }
    
    if(!in_array($task['status'],['open','in_progress'],true)){
      $pdo->rollBack();
      json_response(['success'=>false,'message'=>'Task is not available'],400);
      exit;
    }

    if(!empty($task['deadline']) && strtotime((string)$task['deadline'])<=time()){
      $pdo->rollBack();
      json_response(['success'=>false,'message'=>'Task deadline has passed'],400);
      exit;
    }
    
    if((int)$task['creator_id']===$userId){
      $pdo->rollBack();
      json_response(['success'=>false,'message'=>'Cannot take your own task'],400);
      exit;
    }
    
    $checkStmt=$pdo->prepare('
      SELECT id FROM task_assignments 
      WHERE task_id=:tid AND user_id=:uid AND status IN ("taken","completed")
      LIMIT 1
    ');
    $checkStmt->execute([':tid'=>$taskId,':uid'=>$userId]);
    if($checkStmt->fetch()){
      $pdo->rollBack();
      json_response(['success'=>false,'message'=>'You already took this task'],400);
      exit;
    }

    $slotStmt=$pdo->prepare('
      SELECT COUNT(*) as taken FROM task_assignments 
      WHERE task_id=:tid AND status IN ("taken","completed")
    ');
    $slotStmt->execute([':tid'=>$taskId]);
    $slotResult=$slotStmt->fetch(PDO::FETCH_ASSOC);
    $taken=(int)($slotResult['taken']??0);
    
    if($taken>=(int)$task['slots']){
      $pdo->rollBack();
      json_response(['success'=>false,'message'=>'No slots available'],400);
      exit;
    }
  
    $assignStmt=$pdo->prepare('
      INSERT INTO task_assignments(task_id,user_id,status)
      VALUES(:tid,:uid,"taken")
    ');
    $assignStmt->execute([':tid'=>$taskId,':uid'=>$userId]);
    $assignmentId=$pdo->lastInsertId();

    $occupied=$taken+1;
    $newStatus=$occupied>=(int)$task['slots']?'in_progress':'open';
    $updateStmt=$pdo->prepare('UPDATE tasks SET status=:st, taken_slots=:ts WHERE id=:id');
    $updateStmt->execute([':st'=>$newStatus,':ts'=>$occupied,':id'=>$taskId]);
    
    $pdo->commit();
    json_response([
      'success'=>true,
      'message'=>'Task taken successfully',
      'assignment_id'=>$assignmentId,
      'task_id'=>$taskId
    ]);
  } catch(Exception $e){
    if($pdo->inTransaction()) $pdo->rollBack();
    throw $e;
  }
} catch(Exception $e){
  json_response(['success'=>false,'message'=>'Server error'],500);
}
?>

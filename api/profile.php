<?php
declare(strict_types=1);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) === $host) {
header('Access-Control-Allow-Origin: ' . $origin);
header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(200);exit;}

require_once __DIR__.'/bootstrap.php';

start_secure_session();
$pdo=db();
$method=$_SERVER['REQUEST_METHOD'];

if(!isset($_SESSION['user_id']) || (int)$_SESSION['user_id']===0){
  json_response(['success'=>false,'message'=>'Not authenticated'],401);
  exit;
}

$userId=(int)$_SESSION['user_id'];

try{
  if($method==='GET'){
    // Get user profile
    $stmt=$pdo->prepare('
            SELECT id,name,username,email,avatar,bio,website,location,role,skills,
             level,xp,earnings,balance,completed_tasks,streak,
             is_active,created_at
      FROM users WHERE id=:id
    ');
    $stmt->execute([':id'=>$userId]);
    $user=$stmt->fetch(PDO::FETCH_ASSOC);
    
    if(!$user){
      json_response(['success'=>false,'message'=>'User not found'],404);
      exit;
    }
    
    // Remove sensitive data
    unset($user['password_hash']);
    
    // Get user stats from task_assignments
    $statsStmt=$pdo->prepare('
      SELECT 
        COUNT(CASE WHEN status="completed" THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status="taken" THEN 1 END) as active_tasks
      FROM task_assignments WHERE user_id=:uid
    ');
    $statsStmt->execute([':uid'=>$userId]);
    $stats=$statsStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get earnings from transactions
    $earningsStmt=$pdo->prepare('
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ("deposit","transfer_received","task_reward") THEN amount ELSE 0 END),0) as total_earnings,
        COALESCE(SUM(CASE WHEN type IN ("withdraw","transfer_sent") THEN amount ELSE 0 END),0) as total_spent
      FROM transactions WHERE user_id=:uid AND status="completed"
    ');
    $earningsStmt->execute([':uid'=>$userId]);
    $earnings=$earningsStmt->fetch(PDO::FETCH_ASSOC);
    
    $profile=array_merge($user, $stats??[], $earnings??[]);
    json_response(['success'=>true,'user'=>$profile]);
    
  } elseif($method==='POST' || $method==='PUT'){
    // Update profile
    $input=read_json();
    $allowed=['name','username','bio','website','location','avatar','role','skills'];
    $updates=[];
    $params=[':id'=>$userId];
    
    foreach($allowed as $field){
      if(isset($input[$field])){
        $updates[]="$field=:$field";
        $params[":$field"]=$input[$field];
      }
    }
    
    if(empty($updates)){
      json_response(['success'=>false,'message'=>'No fields to update'],400);
      exit;
    }
    
    // Validate username uniqueness/format if changing
    if(isset($input['username'])){
      $newUsername=trim((string)$input['username']);
      if(!preg_match('/^[a-zA-Z0-9_]{3,32}$/',$newUsername)){
        json_response(['success'=>false,'message'=>'Invalid username format'],422);
        exit;
      }
      $params[':username']=$newUsername;
      foreach($updates as $i=>$u){ if(str_starts_with($u,'username=')) $updates[$i]='username=:username'; }
      $check=$pdo->prepare('SELECT id FROM users WHERE username=:u AND id!=:id LIMIT 1');
      $check->execute([':u'=>$newUsername,':id'=>$userId]);
      if($check->fetch()){
        json_response(['success'=>false,'message'=>'Username already taken'],409);
        exit;
      }
    }

    if(isset($input['name'])){
      $newName=trim((string)$input['name']);
      if(mb_strlen($newName)<2 || mb_strlen($newName)>80){
        json_response(['success'=>false,'message'=>'Name must be 2-80 characters'],422);
        exit;
      }
      $params[':name']=$newName;
      foreach($updates as $i=>$u){ if(str_starts_with($u,'name=')) $updates[$i]='name=:name'; }
    }

    // ── Validate bio (max 2000 chars) ──
    if(isset($input['bio'])){
      $bio=trim((string)$input['bio']);
      if(mb_strlen($bio)>2000){
        json_response(['success'=>false,'message'=>'Bio is too long (max 2000 characters)'],422);
        exit;
      }
      $params[':bio']=$bio;
      foreach($updates as $i=>$u){ if(str_starts_with($u,'bio=')) $updates[$i]='bio=:bio'; }
    }

    // ── Validate website (max 255, must be valid URL if non-empty) ──
    if(isset($input['website'])){
      $website=trim((string)$input['website']);
      if($website!==''){
        if(mb_strlen($website)>255){
          json_response(['success'=>false,'message'=>'Website URL is too long (max 255)'],422);
          exit;
        }
        // Block javascript: and data: schemes
        $scheme=strtolower(parse_url($website, PHP_URL_SCHEME) ?? '');
        if($scheme!=='' && !in_array($scheme,['http','https'],true)){
          json_response(['success'=>false,'message'=>'Website must use http:// or https://'],422);
          exit;
        }
      }
      $params[':website']=$website;
      foreach($updates as $i=>$u){ if(str_starts_with($u,'website=')) $updates[$i]='website=:website'; }
    }

    // ── Validate avatar URL (max 500, must be https if non-empty) ──
    if(isset($input['avatar'])){
      $avatar=trim((string)$input['avatar']);
      if($avatar!==''){
        if(mb_strlen($avatar)>500){
          json_response(['success'=>false,'message'=>'Avatar URL is too long (max 500)'],422);
          exit;
        }
        $scheme=strtolower(parse_url($avatar, PHP_URL_SCHEME) ?? '');
        if($scheme!=='' && !in_array($scheme,['http','https'],true)){
          json_response(['success'=>false,'message'=>'Avatar URL must use http:// or https://'],422);
          exit;
        }
      }
      $params[':avatar']=$avatar;
      foreach($updates as $i=>$u){ if(str_starts_with($u,'avatar=')) $updates[$i]='avatar=:avatar'; }
    }

    // ── Validate role (max 100 chars) ──
    if(isset($input['role'])){
      $role=trim((string)$input['role']);
      if(mb_strlen($role)>100){
        json_response(['success'=>false,'message'=>'Role is too long (max 100 characters)'],422);
        exit;
      }
      $params[':role']=$role;
      foreach($updates as $i=>$u){ if(str_starts_with($u,'role=')) $updates[$i]='role=:role'; }
    }

    // ── Validate skills (max 500 chars) ──
    if(isset($input['skills'])){
      $skills=trim((string)$input['skills']);
      if(mb_strlen($skills)>500){
        json_response(['success'=>false,'message'=>'Skills is too long (max 500 characters)'],422);
        exit;
      }
      $params[':skills']=$skills;
      foreach($updates as $i=>$u){ if(str_starts_with($u,'skills=')) $updates[$i]='skills=:skills'; }
    }

    // ── Validate location (max 150 chars) ──
    if(isset($input['location'])){
      $location=trim((string)$input['location']);
      if(mb_strlen($location)>150){
        json_response(['success'=>false,'message'=>'Location is too long (max 150 characters)'],422);
        exit;
      }
      $params[':location']=$location;
      foreach($updates as $i=>$u){ if(str_starts_with($u,'location=')) $updates[$i]='location=:location'; }
    }
    
    $sql='UPDATE users SET '.implode(',',$updates).' WHERE id=:id';
    $stmt=$pdo->prepare($sql);
    $stmt->execute($params);
    
    // Return updated profile
    $getStmt=$pdo->prepare('
            SELECT id,name,username,email,avatar,bio,website,location,role,skills,
             level,xp,earnings,balance,completed_tasks,streak,
             is_active,created_at
      FROM users WHERE id=:id
    ');
    $getStmt->execute([':id'=>$userId]);
    $updated=$getStmt->fetch(PDO::FETCH_ASSOC);
    
    json_response(['success'=>true,'user'=>$updated]);
  }
} catch(Exception $e){
  json_response(['success'=>false,'message'=>'Server error'],500);
}
?>

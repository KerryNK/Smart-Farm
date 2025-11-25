<?php
// Irrigation Control API
require_once '../config/config.php';

if (!isLoggedIn()) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'start':
        startIrrigation();
        break;
    case 'stop':
        stopIrrigation();
        break;
    case 'status':
        getIrrigationStatus();
        break;
    case 'settings':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            getSettings();
        } else {
            updateSettings();
        }
        break;
    case 'history':
        getIrrigationHistory();
        break;
    case 'stats':
        getIrrigationStats();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}

function startIrrigation() {
    $userId = getCurrentUserId();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $duration = intval($data['duration'] ?? DEFAULT_IRRIGATION_DURATION);
    $waterAmount = $duration * 10; // Estimate 10L per minute
    
    $conn = getDBConnection();
    
    // Check if already irrigating
    $current = fetchRow($conn,
        "SELECT * FROM irrigation_logs WHERE user_id = ? AND action = 'start' 
         AND timestamp > (SELECT MAX(timestamp) FROM irrigation_logs WHERE user_id = ? AND action = 'stop')
         ORDER BY timestamp DESC LIMIT 1",
        "ii", [$userId, $userId]
    );
    
    if ($current) {
        jsonResponse(['success' => false, 'message' => 'Irrigation already running'], 400);
    }
    
    $sql = "INSERT INTO irrigation_logs (user_id, action, water_amount, duration, auto_triggered, trigger_reason) 
            VALUES (?, 'start', ?, ?, FALSE, 'Manual start')";
    
    $id = insertQuery($conn, $sql, "idi", [$userId, $waterAmount, $duration]);
    
    if ($id) {
        // Create notification
        $notifSql = "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)";
        $message = "Irrigation started manually for {$duration} minutes.";
        insertQuery($conn, $notifSql, "isss", [$userId, "Irrigation Started", $message, 'irrigation']);
        
        jsonResponse(['success' => true, 'message' => 'Irrigation started', 'duration' => $duration]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Failed to start irrigation'], 500);
    }
    
    closeDBConnection($conn);
}

function stopIrrigation() {
    $userId = getCurrentUserId();
    $conn = getDBConnection();
    
    // Get last start
    $lastStart = fetchRow($conn,
        "SELECT * FROM irrigation_logs WHERE user_id = ? AND action = 'start' 
         ORDER BY timestamp DESC LIMIT 1",
        "i", [$userId]
    );
    
    if (!$lastStart) {
        jsonResponse(['success' => false, 'message' => 'No active irrigation found'], 400);
    }
    
    // Check if already stopped
    $lastStop = fetchRow($conn,
        "SELECT * FROM irrigation_logs WHERE user_id = ? AND action = 'stop' 
         ORDER BY timestamp DESC LIMIT 1",
        "i", [$userId]
    );
    
    if ($lastStop && strtotime($lastStop['timestamp']) > strtotime($lastStart['timestamp'])) {
        jsonResponse(['success' => false, 'message' => 'Irrigation already stopped'], 400);
    }
    
    // Calculate actual duration
    $startTime = strtotime($lastStart['timestamp']);
    $stopTime = time();
    $actualDuration = round(($stopTime - $startTime) / 60);
    $actualWater = $actualDuration * 10;
    
    $sql = "INSERT INTO irrigation_logs (user_id, action, water_amount, duration, auto_triggered) 
            VALUES (?, 'stop', ?, ?, FALSE)";
    
    $id = insertQuery($conn, $sql, "idi", [$userId, $actualWater, $actualDuration]);
    
    if ($id) {
        // Create notification
        $notifSql = "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)";
        $message = "Irrigation stopped after {$actualDuration} minutes.";
        insertQuery($conn, $notifSql, "isss", [$userId, "Irrigation Stopped", $message, 'irrigation']);
        
        jsonResponse(['success' => true, 'message' => 'Irrigation stopped', 'duration' => $actualDuration]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Failed to stop irrigation'], 500);
    }
    
    closeDBConnection($conn);
}

function getIrrigationStatus() {
    $userId = getCurrentUserId();
    $conn = getDBConnection();
    
    $lastStart = fetchRow($conn,
        "SELECT * FROM irrigation_logs WHERE user_id = ? AND action = 'start' 
         ORDER BY timestamp DESC LIMIT 1",
        "i", [$userId]
    );
    
    $lastStop = fetchRow($conn,
        "SELECT * FROM irrigation_logs WHERE user_id = ? AND action = 'stop' 
         ORDER BY timestamp DESC LIMIT 1",
        "i", [$userId]
    );
    
    $isActive = false;
    $currentSession = null;
    
    if ($lastStart) {
        if (!$lastStop || strtotime($lastStart['timestamp']) > strtotime($lastStop['timestamp'])) {
            $isActive = true;
            $startTime = strtotime($lastStart['timestamp']);
            $elapsed = round((time() - $startTime) / 60);
            $currentSession = [
                'start_time' => $lastStart['timestamp'],
                'elapsed_minutes' => $elapsed,
                'planned_duration' => $lastStart['duration'],
                'auto_triggered' => $lastStart['auto_triggered']
            ];
        }
    }
    
    closeDBConnection($conn);
    
    jsonResponse([
        'success' => true,
        'is_active' => $isActive,
        'current_session' => $currentSession
    ]);
}

function getSettings() {
    $userId = getCurrentUserId();
    $conn = getDBConnection();
    
    $settings = fetchRow($conn, "SELECT * FROM irrigation_settings WHERE user_id = ?", "i", [$userId]);
    
    closeDBConnection($conn);
    
    if ($settings) {
        jsonResponse(['success' => true, 'data' => $settings]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Settings not found'], 404);
    }
}

function updateSettings() {
    $userId = getCurrentUserId();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $autoMode = isset($data['auto_mode']) ? ($data['auto_mode'] ? 1 : 0) : null;
    $moistureThreshold = isset($data['moisture_threshold']) ? floatval($data['moisture_threshold']) : null;
    $duration = isset($data['irrigation_duration']) ? intval($data['irrigation_duration']) : null;
    $scheduleTime = isset($data['schedule_time']) ? $data['schedule_time'] : null;
    $useSchedule = isset($data['use_schedule']) ? ($data['use_schedule'] ? 1 : 0) : null;
    
    $conn = getDBConnection();
    
    $updates = [];
    $types = "";
    $params = [];
    
    if ($autoMode !== null) {
        $updates[] = "auto_mode = ?";
        $types .= "i";
        $params[] = $autoMode;
    }
    if ($moistureThreshold !== null) {
        $updates[] = "moisture_threshold = ?";
        $types .= "d";
        $params[] = $moistureThreshold;
    }
    if ($duration !== null) {
        $updates[] = "irrigation_duration = ?";
        $types .= "i";
        $params[] = $duration;
    }
    if ($scheduleTime !== null) {
        $updates[] = "schedule_time = ?";
        $types .= "s";
        $params[] = $scheduleTime;
    }
    if ($useSchedule !== null) {
        $updates[] = "use_schedule = ?";
        $types .= "i";
        $params[] = $useSchedule;
    }
    
    if (empty($updates)) {
        jsonResponse(['success' => false, 'message' => 'No settings to update'], 400);
    }
    
    $types .= "i";
    $params[] = $userId;
    
    $sql = "UPDATE irrigation_settings SET " . implode(", ", $updates) . " WHERE user_id = ?";
    
    $success = modifyQuery($conn, $sql, $types, $params);
    
    closeDBConnection($conn);
    
    if ($success) {
        jsonResponse(['success' => true, 'message' => 'Settings updated successfully']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Failed to update settings'], 500);
    }
}

function getIrrigationHistory() {
    $userId = getCurrentUserId();
    $days = intval($_GET['days'] ?? 7);
    $limit = intval($_GET['limit'] ?? 50);
    
    $conn = getDBConnection();
    
    $sql = "SELECT * FROM irrigation_logs 
            WHERE user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY timestamp DESC LIMIT ?";
    
    $history = fetchAll($conn, $sql, "iii", [$userId, $days, $limit]);
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'data' => $history, 'count' => count($history)]);
}

function getIrrigationStats() {
    $userId = getCurrentUserId();
    $days = intval($_GET['days'] ?? 7);
    
    $conn = getDBConnection();
    
    $sql = "SELECT 
                COUNT(DISTINCT DATE(timestamp)) as irrigation_days,
                SUM(CASE WHEN action = 'start' THEN 1 ELSE 0 END) as total_sessions,
                SUM(CASE WHEN auto_triggered = TRUE THEN 1 ELSE 0 END) as auto_sessions,
                SUM(water_amount) as total_water_used,
                AVG(duration) as avg_duration
            FROM irrigation_logs 
            WHERE user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)";
    
    $stats = fetchRow($conn, $sql, "ii", [$userId, $days]);
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'data' => $stats]);
}
?>



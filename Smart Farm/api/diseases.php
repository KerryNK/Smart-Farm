<?php
// Crop Diseases API
require_once '../config/config.php';

if (!isLoggedIn()) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        listDiseases();
        break;
    case 'get':
        getDisease();
        break;
    case 'alerts':
        getDiseaseAlerts();
        break;
    case 'mark_read':
        markAlertRead();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}

function listDiseases() {
    $cropType = $_GET['crop_type'] ?? '';
    $conn = getDBConnection();
    
    if ($cropType) {
        $sql = "SELECT * FROM crop_diseases WHERE crop_type = ? OR crop_type = 'Various' ORDER BY severity_level DESC, disease_name ASC";
        $diseases = fetchAll($conn, $sql, "s", [$cropType]);
    } else {
        $diseases = fetchAll($conn, "SELECT * FROM crop_diseases ORDER BY severity_level DESC, disease_name ASC", "");
    }
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'data' => $diseases, 'count' => count($diseases)]);
}

function getDisease() {
    $id = intval($_GET['id'] ?? 0);
    
    if (!$id) {
        jsonResponse(['success' => false, 'message' => 'Disease ID required'], 400);
    }
    
    $conn = getDBConnection();
    $disease = fetchRow($conn, "SELECT * FROM crop_diseases WHERE id = ?", "i", [$id]);
    closeDBConnection($conn);
    
    if ($disease) {
        jsonResponse(['success' => true, 'data' => $disease]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Disease not found'], 404);
    }
}

function getDiseaseAlerts() {
    $userId = getCurrentUserId();
    $unreadOnly = isset($_GET['unread']) && $_GET['unread'] === 'true';
    
    $conn = getDBConnection();
    
    $sql = "SELECT da.*, cd.disease_name, cd.crop_type, cd.severity_level as disease_severity
            FROM disease_alerts da
            JOIN crop_diseases cd ON da.disease_id = cd.id
            WHERE da.user_id = ?";
    
    if ($unreadOnly) {
        $sql .= " AND da.is_read = FALSE";
    }
    
    $sql .= " ORDER BY da.created_at DESC LIMIT 20";
    
    $alerts = fetchAll($conn, $sql, "i", [$userId]);
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'data' => $alerts, 'count' => count($alerts)]);
}

function markAlertRead() {
    $userId = getCurrentUserId();
    $data = json_decode(file_get_contents('php://input'), true);
    $alertId = intval($data['alert_id'] ?? 0);
    
    if (!$alertId) {
        jsonResponse(['success' => false, 'message' => 'Alert ID required'], 400);
    }
    
    $conn = getDBConnection();
    
    $sql = "UPDATE disease_alerts SET is_read = TRUE WHERE id = ? AND user_id = ?";
    $success = modifyQuery($conn, $sql, "ii", [$alertId, $userId]);
    
    closeDBConnection($conn);
    
    if ($success) {
        jsonResponse(['success' => true, 'message' => 'Alert marked as read']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Failed to update alert'], 500);
    }
}
?>



<?php
// Notifications API
require_once '../config/config.php';

if (!isLoggedIn()) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        listNotifications();
        break;
    case 'unread_count':
        getUnreadCount();
        break;
    case 'mark_read':
        markAsRead();
        break;
    case 'mark_all_read':
        markAllAsRead();
        break;
    case 'delete':
        deleteNotification();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}

function listNotifications() {
    $userId = getCurrentUserId();
    $limit = intval($_GET['limit'] ?? 20);
    $unreadOnly = isset($_GET['unread']) && $_GET['unread'] === 'true';
    
    $conn = getDBConnection();
    
    $sql = "SELECT * FROM notifications WHERE user_id = ?";
    
    if ($unreadOnly) {
        $sql .= " AND is_read = FALSE";
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT ?";
    
    $notifications = fetchAll($conn, $sql, "ii", [$userId, $limit]);
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'data' => $notifications, 'count' => count($notifications)]);
}

function getUnreadCount() {
    $userId = getCurrentUserId();
    $conn = getDBConnection();
    
    $result = fetchRow($conn, "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE", "i", [$userId]);
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'count' => $result['count'] ?? 0]);
}

function markAsRead() {
    $userId = getCurrentUserId();
    $data = json_decode(file_get_contents('php://input'), true);
    $notificationId = intval($data['notification_id'] ?? 0);
    
    if (!$notificationId) {
        jsonResponse(['success' => false, 'message' => 'Notification ID required'], 400);
    }
    
    $conn = getDBConnection();
    
    $sql = "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?";
    $success = modifyQuery($conn, $sql, "ii", [$notificationId, $userId]);
    
    closeDBConnection($conn);
    
    if ($success) {
        jsonResponse(['success' => true, 'message' => 'Notification marked as read']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Failed to update notification'], 500);
    }
}

function markAllAsRead() {
    $userId = getCurrentUserId();
    $conn = getDBConnection();
    
    $sql = "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE";
    $success = modifyQuery($conn, $sql, "i", [$userId]);
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'message' => 'All notifications marked as read']);
}

function deleteNotification() {
    $userId = getCurrentUserId();
    $data = json_decode(file_get_contents('php://input'), true);
    $notificationId = intval($data['notification_id'] ?? 0);
    
    if (!$notificationId) {
        jsonResponse(['success' => false, 'message' => 'Notification ID required'], 400);
    }
    
    $conn = getDBConnection();
    
    $sql = "DELETE FROM notifications WHERE id = ? AND user_id = ?";
    $success = modifyQuery($conn, $sql, "ii", [$notificationId, $userId]);
    
    closeDBConnection($conn);
    
    if ($success) {
        jsonResponse(['success' => true, 'message' => 'Notification deleted']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Failed to delete notification'], 500);
    }
}
?>



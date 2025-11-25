<?php
// General configuration for ShambaSmart

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Timezone
date_default_timezone_set('Africa/Nairobi');

// Application settings
define('APP_NAME', 'ShambaSmart');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'http://localhost/Smart%20Farm');

// Security settings
define('PASSWORD_HASH_ALGO', PASSWORD_BCRYPT);
define('PASSWORD_HASH_COST', 10);

// Sensor thresholds (for alerts)
define('MOISTURE_LOW_THRESHOLD', 30.0);
define('MOISTURE_HIGH_THRESHOLD', 80.0);
define('TEMP_LOW_THRESHOLD', 10.0);
define('TEMP_HIGH_THRESHOLD', 35.0);
define('HUMIDITY_LOW_THRESHOLD', 40.0);
define('HUMIDITY_HIGH_THRESHOLD', 85.0);

// Irrigation settings
define('DEFAULT_IRRIGATION_DURATION', 30); // minutes
define('MIN_IRRIGATION_INTERVAL', 120); // minutes between irrigations

// Include database configuration
require_once __DIR__ . '/database.php';

// Helper function to check if user is logged in
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// Helper function to get current user ID
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

// Helper function to get current user data
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    $conn = getDBConnection();
    $user = fetchRow($conn, "SELECT id, username, email, full_name, phone, farm_location, farm_size FROM users WHERE id = ?", "i", [getCurrentUserId()]);
    closeDBConnection($conn);
    
    return $user;
}

// Helper function to redirect
function redirect($url) {
    header("Location: $url");
    exit();
}

// Helper function to return JSON response
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

// Helper function to sanitize input
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
?>



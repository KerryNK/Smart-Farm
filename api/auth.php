<?php
// Authentication API
require_once '../config/config.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'register':
        handleRegister();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'check':
        checkAuth();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}

function handleLogin() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = sanitizeInput($data['username'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'Username and password are required'], 400);
    }
    
    $conn = getDBConnection();
    $user = fetchRow($conn, "SELECT * FROM users WHERE username = ? OR email = ?", "ss", [$username, $username]);
    
    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['full_name'] = $user['full_name'];
        
        jsonResponse([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'email' => $user['email']
            ]
        ]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Invalid credentials'], 401);
    }
    
    closeDBConnection($conn);
}

function handleRegister() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = sanitizeInput($data['username'] ?? '');
    $email = sanitizeInput($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $full_name = sanitizeInput($data['full_name'] ?? '');
    $phone = sanitizeInput($data['phone'] ?? '');
    $farm_location = sanitizeInput($data['farm_location'] ?? '');
    $farm_size = floatval($data['farm_size'] ?? 0);
    
    if (empty($username) || empty($email) || empty($password) || empty($full_name)) {
        jsonResponse(['success' => false, 'message' => 'All required fields must be filled'], 400);
    }
    
    if (strlen($password) < 6) {
        jsonResponse(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
    }
    
    $conn = getDBConnection();
    
    // Check if username or email already exists
    $existing = fetchRow($conn, "SELECT id FROM users WHERE username = ? OR email = ?", "ss", [$username, $email]);
    if ($existing) {
        jsonResponse(['success' => false, 'message' => 'Username or email already exists'], 409);
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_HASH_ALGO, ['cost' => PASSWORD_HASH_COST]);
    
    // Insert user
    $sql = "INSERT INTO users (username, email, password, full_name, phone, farm_location, farm_size) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $userId = insertQuery($conn, $sql, "ssssssd", [$username, $email, $hashedPassword, $full_name, $phone, $farm_location, $farm_size]);
    
    if ($userId) {
        // Create default irrigation settings
        $settingsSql = "INSERT INTO irrigation_settings (user_id) VALUES (?)";
        modifyQuery($conn, $settingsSql, "i", [$userId]);
        
        $_SESSION['user_id'] = $userId;
        $_SESSION['username'] = $username;
        $_SESSION['full_name'] = $full_name;
        
        jsonResponse([
            'success' => true,
            'message' => 'Registration successful',
            'user' => [
                'id' => $userId,
                'username' => $username,
                'full_name' => $full_name,
                'email' => $email
            ]
        ]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Registration failed'], 500);
    }
    
    closeDBConnection($conn);
}

function handleLogout() {
    session_destroy();
    jsonResponse(['success' => true, 'message' => 'Logged out successfully']);
}

function checkAuth() {
    if (isLoggedIn()) {
        $user = getCurrentUser();
        jsonResponse(['success' => true, 'authenticated' => true, 'user' => $user]);
    } else {
        jsonResponse(['success' => true, 'authenticated' => false]);
    }
}
?>



<?php
// Database configuration for ShambaSmart

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'shambasmart');

// Create connection
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    return $conn;
}

// Close connection
function closeDBConnection($conn) {
    if ($conn) {
        $conn->close();
    }
}

// Execute query and return result
function executeQuery($conn, $sql, $types = "", $params = []) {
    if (empty($params)) {
        $result = $conn->query($sql);
        return $result;
    }
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return false;
    }
    
    if (!empty($types) && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();
    
    return $result;
}

// Get single row
function fetchRow($conn, $sql, $types = "", $params = []) {
    $result = executeQuery($conn, $sql, $types, $params);
    if ($result && $result->num_rows > 0) {
        return $result->fetch_assoc();
    }
    return null;
}

// Get all rows
function fetchAll($conn, $sql, $types = "", $params = []) {
    $result = executeQuery($conn, $sql, $types, $params);
    $rows = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
    }
    return $rows;
}

// Insert and return last insert ID
function insertQuery($conn, $sql, $types, $params) {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return false;
    }
    
    $stmt->bind_param($types, ...$params);
    $success = $stmt->execute();
    $insertId = $stmt->insert_id;
    $stmt->close();
    
    return $success ? $insertId : false;
}

// Update/Delete query
function modifyQuery($conn, $sql, $types = "", $params = []) {
    if (empty($params)) {
        return $conn->query($sql);
    }
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return false;
    }
    
    $stmt->bind_param($types, ...$params);
    $success = $stmt->execute();
    $stmt->close();
    
    return $success;
}
?>



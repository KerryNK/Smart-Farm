<?php
// Sensor Data API
require_once '../config/config.php';

if (!isLoggedIn()) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'latest':
        getLatestReadings();
        break;
    case 'history':
        getSensorHistory();
        break;
    case 'add':
        addSensorReading();
        break;
    case 'stats':
        getSensorStats();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}

function getLatestReadings() {
    $userId = getCurrentUserId();
    $conn = getDBConnection();
    
    $reading = fetchRow($conn, 
        "SELECT * FROM sensor_data WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1", 
        "i", [$userId]
    );
    
    closeDBConnection($conn);
    
    if ($reading) {
        jsonResponse(['success' => true, 'data' => $reading]);
    } else {
        jsonResponse(['success' => true, 'data' => null, 'message' => 'No sensor data available']);
    }
}

function getSensorHistory() {
    $userId = getCurrentUserId();
    $hours = intval($_GET['hours'] ?? 24);
    $limit = intval($_GET['limit'] ?? 100);
    
    $conn = getDBConnection();
    
    $sql = "SELECT * FROM sensor_data 
            WHERE user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            ORDER BY timestamp DESC LIMIT ?";
    
    $readings = fetchAll($conn, $sql, "iii", [$userId, $hours, $limit]);
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'data' => array_reverse($readings), 'count' => count($readings)]);
}

function addSensorReading() {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = getCurrentUserId();
    
    $soil_moisture = floatval($data['soil_moisture'] ?? 0);
    $temperature = floatval($data['temperature'] ?? 0);
    $humidity = floatval($data['humidity'] ?? 0);
    $light_intensity = floatval($data['light_intensity'] ?? 0);
    $ph_level = floatval($data['ph_level'] ?? 7.0);
    
    $conn = getDBConnection();
    
    $sql = "INSERT INTO sensor_data (user_id, soil_moisture, temperature, humidity, light_intensity, ph_level) 
            VALUES (?, ?, ?, ?, ?, ?)";
    
    $id = insertQuery($conn, $sql, "iddddd", [$userId, $soil_moisture, $temperature, $humidity, $light_intensity, $ph_level]);
    
    if ($id) {
        // Check if irrigation is needed
        checkAndTriggerIrrigation($conn, $userId, $soil_moisture);
        
        // Check for disease conditions
        checkDiseaseConditions($conn, $userId, $temperature, $humidity, $soil_moisture);
        
        jsonResponse(['success' => true, 'message' => 'Sensor reading added', 'id' => $id]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Failed to add reading'], 500);
    }
    
    closeDBConnection($conn);
}

function getSensorStats() {
    $userId = getCurrentUserId();
    $hours = intval($_GET['hours'] ?? 24);
    
    $conn = getDBConnection();
    
    $sql = "SELECT 
                AVG(soil_moisture) as avg_moisture,
                MIN(soil_moisture) as min_moisture,
                MAX(soil_moisture) as max_moisture,
                AVG(temperature) as avg_temp,
                MIN(temperature) as min_temp,
                MAX(temperature) as max_temp,
                AVG(humidity) as avg_humidity,
                MIN(humidity) as min_humidity,
                MAX(humidity) as max_humidity,
                AVG(ph_level) as avg_ph
            FROM sensor_data 
            WHERE user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)";
    
    $stats = fetchRow($conn, $sql, "ii", [$userId, $hours]);
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'data' => $stats]);
}

function checkAndTriggerIrrigation($conn, $userId, $moisture) {
    // Get irrigation settings
    $settings = fetchRow($conn, "SELECT * FROM irrigation_settings WHERE user_id = ?", "i", [$userId]);
    
    if (!$settings || !$settings['auto_mode']) {
        return;
    }
    
    // Check if moisture is below threshold
    if ($moisture < $settings['moisture_threshold']) {
        // Check last irrigation time to avoid over-irrigation
        $lastIrrigation = fetchRow($conn, 
            "SELECT timestamp FROM irrigation_logs WHERE user_id = ? AND action = 'start' ORDER BY timestamp DESC LIMIT 1",
            "i", [$userId]
        );
        
        if ($lastIrrigation) {
            $lastTime = strtotime($lastIrrigation['timestamp']);
            $now = time();
            $minutesSince = ($now - $lastTime) / 60;
            
            if ($minutesSince < MIN_IRRIGATION_INTERVAL) {
                return; // Too soon to irrigate again
            }
        }
        
        // Trigger irrigation
        $waterAmount = $settings['irrigation_duration'] * 10; // Estimate 10L per minute
        $sql = "INSERT INTO irrigation_logs (user_id, action, water_amount, duration, auto_triggered, trigger_reason) 
                VALUES (?, 'start', ?, ?, TRUE, ?)";
        $reason = "Low soil moisture detected: {$moisture}%";
        insertQuery($conn, $sql, "idis", [$userId, $waterAmount, $settings['irrigation_duration'], $reason]);
        
        // Create notification
        $notifSql = "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)";
        $title = "Automatic Irrigation Started";
        $message = "Soil moisture is low ({$moisture}%). Automatic irrigation has been started for {$settings['irrigation_duration']} minutes.";
        insertQuery($conn, $notifSql, "isss", [$userId, $title, $message, 'irrigation']);
    }
}

function checkDiseaseConditions($conn, $userId, $temperature, $humidity, $moisture) {
    $alerts = [];
    
    // Check for blight conditions
    if ($humidity > 80 && $temperature >= 15 && $temperature <= 25) {
        $disease = fetchRow($conn, "SELECT * FROM crop_diseases WHERE disease_name = 'Blight'", "");
        if ($disease) {
            createDiseaseAlert($conn, $userId, $disease['id'], 'high', 
                "High risk of Blight detected! Humidity: {$humidity}%, Temperature: {$temperature}°C. Take preventive measures.");
        }
    }
    
    // Check for root rot conditions
    if ($moisture > 80) {
        $disease = fetchRow($conn, "SELECT * FROM crop_diseases WHERE disease_name = 'Root Rot'", "");
        if ($disease) {
            createDiseaseAlert($conn, $userId, $disease['id'], 'medium', 
                "Risk of Root Rot! Soil moisture very high ({$moisture}%). Check drainage and reduce watering.");
        }
    }
    
    // Check for powdery mildew conditions
    if ($humidity > 70 && $temperature >= 20 && $temperature <= 25) {
        $disease = fetchRow($conn, "SELECT * FROM crop_diseases WHERE disease_name = 'Powdery Mildew'", "");
        if ($disease) {
            createDiseaseAlert($conn, $userId, $disease['id'], 'medium', 
                "Favorable conditions for Powdery Mildew. Monitor crops closely.");
        }
    }
}

function createDiseaseAlert($conn, $userId, $diseaseId, $riskLevel, $message) {
    // Check if similar alert exists in last 24 hours
    $existing = fetchRow($conn, 
        "SELECT id FROM disease_alerts WHERE user_id = ? AND disease_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)",
        "ii", [$userId, $diseaseId]
    );
    
    if ($existing) {
        return; // Don't create duplicate alerts
    }
    
    $sql = "INSERT INTO disease_alerts (user_id, disease_id, risk_level, alert_message) VALUES (?, ?, ?, ?)";
    insertQuery($conn, $sql, "iiss", [$userId, $diseaseId, $riskLevel, $message]);
    
    // Also create notification
    $notifSql = "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)";
    insertQuery($conn, $notifSql, "isss", [$userId, "Disease Alert", $message, 'disease']);
}
?>



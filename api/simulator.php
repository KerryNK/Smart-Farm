<?php
// Sensor Data Simulator - For Testing/Demo Purposes
// This script simulates IoT sensor readings

require_once '../config/config.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'generate_continuous':
        generateContinuousData();
        break;
    case 'simulate_conditions':
        simulateSpecificConditions();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}

// Generate continuous sensor data (simulates 24 hours of readings)
function generateContinuousData() {
    $userId = getCurrentUserId();
    $conn = getDBConnection();
    
    $count = 0;
    $startTime = strtotime('-24 hours');
    
    // Generate data points every 30 minutes for last 24 hours
    for ($i = 0; $i < 48; $i++) {
        $timestamp = date('Y-m-d H:i:s', $startTime + ($i * 1800)); // 30 min intervals
        
        // Simulate realistic daily patterns
        $hour = date('H', $startTime + ($i * 1800));
        
        // Soil moisture: decreases during day, increases at night
        $baseMoisture = 50;
        if ($hour >= 6 && $hour <= 18) {
            $baseMoisture -= ($hour - 6) * 1.5; // Decreases during day
        }
        $moisture = $baseMoisture + rand(-5, 5);
        $moisture = max(20, min(80, $moisture)); // Keep between 20-80%
        
        // Temperature: cooler at night, warmer during day
        $baseTemp = 22;
        if ($hour >= 10 && $hour <= 16) {
            $baseTemp += ($hour - 10) * 2; // Peaks midday
        } elseif ($hour >= 0 && $hour <= 6) {
            $baseTemp -= (6 - $hour) * 1.5; // Coolest before dawn
        }
        $temperature = $baseTemp + rand(-2, 2);
        $temperature = max(10, min(40, $temperature));
        
        // Humidity: inverse of temperature
        $humidity = 85 - ($temperature - 15) * 1.5 + rand(-5, 5);
        $humidity = max(40, min(95, $humidity));
        
        // Light intensity: based on time of day
        $light = 0;
        if ($hour >= 6 && $hour <= 18) {
            $light = 5000 + (12 - abs($hour - 12)) * 1500 + rand(-1000, 1000);
        }
        $light = max(0, $light);
        
        // pH: relatively stable
        $ph = 6.5 + (rand(-10, 10) / 20);
        $ph = max(5.0, min(8.0, $ph));
        
        $sql = "INSERT INTO sensor_data (user_id, soil_moisture, temperature, humidity, light_intensity, ph_level, timestamp) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        if (insertQuery($conn, $sql, "iddddds", [$userId, $moisture, $temperature, $humidity, $light, $ph, $timestamp])) {
            $count++;
        }
    }
    
    closeDBConnection($conn);
    
    jsonResponse([
        'success' => true, 
        'message' => 'Generated 24 hours of sensor data',
        'records_created' => $count
    ]);
}

// Simulate specific environmental conditions
function simulateSpecificConditions() {
    $data = json_decode(file_get_contents('php://input'), true);
    $condition = $data['condition'] ?? 'normal';
    
    $userId = getCurrentUserId();
    $conn = getDBConnection();
    
    // Define condition presets
    $conditions = [
        'normal' => [
            'moisture' => 50 + rand(-10, 10),
            'temperature' => 25 + rand(-3, 3),
            'humidity' => 65 + rand(-10, 10),
            'light' => 8000 + rand(-2000, 2000),
            'ph' => 6.5 + (rand(-5, 5) / 10)
        ],
        'drought' => [
            'moisture' => 20 + rand(-5, 5),
            'temperature' => 35 + rand(-2, 2),
            'humidity' => 30 + rand(-5, 5),
            'light' => 12000 + rand(-1000, 1000),
            'ph' => 6.8 + (rand(-3, 3) / 10)
        ],
        'wet' => [
            'moisture' => 85 + rand(-5, 5),
            'temperature' => 20 + rand(-2, 2),
            'humidity' => 90 + rand(-5, 5),
            'light' => 3000 + rand(-1000, 1000),
            'ph' => 6.2 + (rand(-3, 3) / 10)
        ],
        'disease_risk' => [
            'moisture' => 75 + rand(-5, 5),
            'temperature' => 22 + rand(-2, 2),
            'humidity' => 85 + rand(-5, 5),
            'light' => 5000 + rand(-1000, 1000),
            'ph' => 6.5 + (rand(-3, 3) / 10)
        ],
        'optimal' => [
            'moisture' => 60 + rand(-5, 5),
            'temperature' => 24 + rand(-2, 2),
            'humidity' => 60 + rand(-5, 5),
            'light' => 8000 + rand(-1000, 1000),
            'ph' => 6.5 + (rand(-2, 2) / 10)
        ]
    ];
    
    $values = $conditions[$condition] ?? $conditions['normal'];
    
    $sql = "INSERT INTO sensor_data (user_id, soil_moisture, temperature, humidity, light_intensity, ph_level) 
            VALUES (?, ?, ?, ?, ?, ?)";
    
    $id = insertQuery($conn, $sql, "iddddd", [
        $userId,
        $values['moisture'],
        $values['temperature'],
        $values['humidity'],
        $values['light'],
        $values['ph']
    ]);
    
    if ($id) {
        // Check if irrigation or disease alerts should be triggered
        if ($condition === 'drought') {
            // This will trigger irrigation if auto-mode is on
            checkAndTriggerIrrigation($conn, $userId, $values['moisture']);
        } elseif ($condition === 'disease_risk') {
            // This will create disease alerts
            checkDiseaseConditions($conn, $userId, $values['temperature'], $values['humidity'], $values['moisture']);
        }
    }
    
    closeDBConnection($conn);
    
    jsonResponse([
        'success' => true,
        'message' => "Simulated {$condition} conditions",
        'data' => $values
    ]);
}

// Helper function from sensors.php - checking irrigation
function checkAndTriggerIrrigation($conn, $userId, $moisture) {
    $settings = fetchRow($conn, "SELECT * FROM irrigation_settings WHERE user_id = ?", "i", [$userId]);
    
    if (!$settings || !$settings['auto_mode']) {
        return;
    }
    
    if ($moisture < $settings['moisture_threshold']) {
        $lastIrrigation = fetchRow($conn, 
            "SELECT timestamp FROM irrigation_logs WHERE user_id = ? AND action = 'start' ORDER BY timestamp DESC LIMIT 1",
            "i", [$userId]
        );
        
        if ($lastIrrigation) {
            $lastTime = strtotime($lastIrrigation['timestamp']);
            $now = time();
            $minutesSince = ($now - $lastTime) / 60;
            
            if ($minutesSince < 120) {
                return;
            }
        }
        
        $waterAmount = $settings['irrigation_duration'] * 10;
        $sql = "INSERT INTO irrigation_logs (user_id, action, water_amount, duration, auto_triggered, trigger_reason) 
                VALUES (?, 'start', ?, ?, TRUE, ?)";
        $reason = "Low soil moisture detected: {$moisture}%";
        insertQuery($conn, $sql, "idis", [$userId, $waterAmount, $settings['irrigation_duration'], $reason]);
        
        $notifSql = "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)";
        $title = "Automatic Irrigation Started";
        $message = "Soil moisture is low ({$moisture}%). Automatic irrigation has been started.";
        insertQuery($conn, $notifSql, "isss", [$userId, $title, $message, 'irrigation']);
    }
}

// Helper function from sensors.php - checking disease conditions
function checkDiseaseConditions($conn, $userId, $temperature, $humidity, $moisture) {
    if ($humidity > 80 && $temperature >= 15 && $temperature <= 25) {
        $disease = fetchRow($conn, "SELECT * FROM crop_diseases WHERE disease_name = 'Blight'", "");
        if ($disease) {
            $existing = fetchRow($conn, 
                "SELECT id FROM disease_alerts WHERE user_id = ? AND disease_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)",
                "ii", [$userId, $disease['id']]
            );
            
            if (!$existing) {
                $sql = "INSERT INTO disease_alerts (user_id, disease_id, risk_level, alert_message) VALUES (?, ?, ?, ?)";
                $message = "High risk of Blight detected! Humidity: {$humidity}%, Temperature: {$temperature}°C.";
                insertQuery($conn, $sql, "iiss", [$userId, $disease['id'], 'high', $message]);
                
                $notifSql = "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)";
                insertQuery($conn, $notifSql, "isss", [$userId, "Disease Alert", $message, 'disease']);
            }
        }
    }
}
?>



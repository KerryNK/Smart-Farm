<?php
// Weather and Alerts API
require_once '../config/config.php';

if (!isLoggedIn()) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'forecast':
        getWeatherForecast();
        break;
    case 'alerts':
        getWeatherAlerts();
        break;
    case 'generate':
        generateWeatherData();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action'], 400);
}

function getWeatherForecast() {
    $user = getCurrentUser();
    $location = $user['farm_location'] ?? 'Unknown';
    $days = intval($_GET['days'] ?? 7);
    
    $conn = getDBConnection();
    
    $sql = "SELECT * FROM weather_predictions 
            WHERE location LIKE ? AND date >= CURDATE() AND date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ORDER BY date ASC";
    
    $forecast = fetchAll($conn, $sql, "si", ["%{$location}%", $days]);
    
    // If no forecast data, generate sample data
    if (empty($forecast)) {
        generateSampleWeatherData($conn, $location, $days);
        $forecast = fetchAll($conn, $sql, "si", ["%{$location}%", $days]);
    }
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'data' => $forecast, 'location' => $location]);
}

function getWeatherAlerts() {
    $userId = getCurrentUserId();
    $conn = getDBConnection();
    
    $sql = "SELECT * FROM weather_alerts 
            WHERE user_id = ? 
            ORDER BY created_at DESC LIMIT 20";
    
    $alerts = fetchAll($conn, $sql, "i", [$userId]);
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'data' => $alerts, 'count' => count($alerts)]);
}

function generateWeatherData() {
    $user = getCurrentUser();
    $location = $user['farm_location'] ?? 'Unknown';
    $userId = getCurrentUserId();
    
    $conn = getDBConnection();
    
    // Delete old predictions
    modifyQuery($conn, "DELETE FROM weather_predictions WHERE location = ?", "s", [$location]);
    
    // Generate 7 days forecast
    generateSampleWeatherData($conn, $location, 7);
    
    // Check and create alerts based on forecast
    checkWeatherConditions($conn, $userId, $location);
    
    closeDBConnection($conn);
    
    jsonResponse(['success' => true, 'message' => 'Weather data generated successfully']);
}

function generateSampleWeatherData($conn, $location, $days) {
    $conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorm'];
    
    for ($i = 0; $i < $days; $i++) {
        $date = date('Y-m-d', strtotime("+{$i} days"));
        
        // Simulate realistic weather patterns
        $baseTemp = 25 + rand(-5, 5);
        $tempMin = $baseTemp + rand(-3, 0);
        $tempMax = $baseTemp + rand(3, 8);
        $humidity = rand(50, 90);
        
        // Rain probability and amount
        $rainfallProb = rand(0, 100);
        $rainfallAmount = 0;
        $condition = $conditions[0];
        
        if ($rainfallProb > 70) {
            $rainfallAmount = rand(5, 50);
            $condition = $rainfallAmount > 25 ? $conditions[4] : $conditions[3];
            $humidity = rand(75, 95);
        } elseif ($rainfallProb > 50) {
            $condition = $conditions[2];
            $humidity = rand(65, 85);
        } elseif ($rainfallProb > 30) {
            $condition = $conditions[1];
        }
        
        if ($rainfallProb > 85 && $rainfallAmount > 30) {
            $condition = $conditions[5]; // Thunderstorm
        }
        
        $sql = "INSERT INTO weather_predictions (location, date, temperature_min, temperature_max, humidity, rainfall_probability, rainfall_amount, weather_condition) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        insertQuery($conn, $sql, "ssddddds", [$location, $date, $tempMin, $tempMax, $humidity, $rainfallProb, $rainfallAmount, $condition]);
    }
}

function checkWeatherConditions($conn, $userId, $location) {
    // Get forecast for next 3 days
    $sql = "SELECT * FROM weather_predictions 
            WHERE location = ? AND date >= CURDATE() AND date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
            ORDER BY date ASC";
    
    $forecast = fetchAll($conn, $sql, "s", [$location]);
    
    foreach ($forecast as $day) {
        // Check for rain
        if ($day['rainfall_probability'] > 70) {
            $dateFormatted = date('l, M j', strtotime($day['date']));
            $message = "High chance of rain on {$dateFormatted}! Rainfall probability: {$day['rainfall_probability']}%. Expected amount: {$day['rainfall_amount']}mm. Plan your farming activities accordingly.";
            
            createWeatherAlert($conn, $userId, 'rain', $message, 'info');
        }
        
        // Check for heavy rain
        if ($day['rainfall_amount'] > 30) {
            $dateFormatted = date('l, M j', strtotime($day['date']));
            $message = "Heavy rainfall expected on {$dateFormatted}! Expected amount: {$day['rainfall_amount']}mm. Ensure proper drainage and protect crops.";
            
            createWeatherAlert($conn, $userId, 'heavy_rain', $message, 'warning');
        }
        
        // Check for drought conditions
        if ($day['rainfall_probability'] < 10 && $day['temperature_max'] > 32) {
            $dateFormatted = date('l, M j', strtotime($day['date']));
            $message = "Hot and dry conditions expected on {$dateFormatted}. Temperature: {$day['temperature_max']}°C. Ensure adequate irrigation.";
            
            createWeatherAlert($conn, $userId, 'drought', $message, 'warning');
        }
        
        // Check for extreme temperatures
        if ($day['temperature_max'] > 35) {
            $dateFormatted = date('l, M j', strtotime($day['date']));
            $message = "Extreme heat warning for {$dateFormatted}! Temperature may reach {$day['temperature_max']}°C. Protect sensitive crops.";
            
            createWeatherAlert($conn, $userId, 'heat', $message, 'danger');
        }
    }
}

function createWeatherAlert($conn, $userId, $alertType, $message, $severity) {
    // Check if similar alert exists
    $existing = fetchRow($conn,
        "SELECT id FROM weather_alerts WHERE user_id = ? AND alert_type = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)",
        "is", [$userId, $alertType]
    );
    
    if ($existing) {
        return; // Don't create duplicate
    }
    
    $sql = "INSERT INTO weather_alerts (user_id, alert_type, message, severity) VALUES (?, ?, ?, ?)";
    insertQuery($conn, $sql, "isss", [$userId, $alertType, $message, $severity]);
    
    // Also create notification
    $notifSql = "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)";
    $title = "Weather Alert";
    insertQuery($conn, $notifSql, "isss", [$userId, $title, $message, 'weather']);
}
?>



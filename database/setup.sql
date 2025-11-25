-- ShambaSmart Database Setup
-- Smart Farm System Database Schema

CREATE DATABASE IF NOT EXISTS shambasmart;
USE shambasmart;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    farm_location VARCHAR(255),
    farm_size DECIMAL(10,2) COMMENT 'in acres',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sensor data table
CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    soil_moisture DECIMAL(5,2) COMMENT 'percentage',
    temperature DECIMAL(5,2) COMMENT 'celsius',
    humidity DECIMAL(5,2) COMMENT 'percentage',
    light_intensity DECIMAL(8,2) COMMENT 'lux',
    ph_level DECIMAL(4,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp)
);

-- Irrigation logs table
CREATE TABLE IF NOT EXISTS irrigation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(20) NOT NULL COMMENT 'start/stop',
    water_amount DECIMAL(10,2) COMMENT 'liters',
    duration INT COMMENT 'minutes',
    auto_triggered BOOLEAN DEFAULT FALSE,
    trigger_reason VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp)
);

-- Weather predictions table
CREATE TABLE IF NOT EXISTS weather_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    humidity DECIMAL(5,2),
    rainfall_probability DECIMAL(5,2) COMMENT 'percentage',
    rainfall_amount DECIMAL(8,2) COMMENT 'mm',
    weather_condition VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_location_date (location, date)
);

-- Crop diseases table
CREATE TABLE IF NOT EXISTS crop_diseases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    disease_name VARCHAR(100) NOT NULL,
    crop_type VARCHAR(50),
    symptoms TEXT,
    causes TEXT,
    prevention TEXT,
    treatment TEXT,
    severity_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    conditions TEXT COMMENT 'Favorable conditions for disease',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disease alerts table
CREATE TABLE IF NOT EXISTS disease_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    disease_id INT NOT NULL,
    risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    alert_message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (disease_id) REFERENCES crop_diseases(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at)
);

-- Weather alerts table
CREATE TABLE IF NOT EXISTS weather_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    alert_type VARCHAR(50) NOT NULL COMMENT 'rain, drought, frost, etc',
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'danger') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at)
);

-- Irrigation settings table
CREATE TABLE IF NOT EXISTS irrigation_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    auto_mode BOOLEAN DEFAULT TRUE,
    moisture_threshold DECIMAL(5,2) DEFAULT 30.0 COMMENT 'Start irrigation below this',
    irrigation_duration INT DEFAULT 30 COMMENT 'minutes',
    schedule_time TIME COMMENT 'Daily irrigation time if scheduled',
    use_schedule BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'irrigation, weather, disease, system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at, is_read)
);

-- Insert sample crop diseases
INSERT INTO crop_diseases (disease_name, crop_type, symptoms, causes, prevention, treatment, severity_level, conditions) VALUES
('Blight', 'Tomato', 'Dark spots on leaves, wilting, fruit rot', 'Fungal infection (Phytophthora infestans)', 'Use resistant varieties, proper spacing, avoid overhead watering', 'Apply copper-based fungicides, remove infected plants', 'high', 'High humidity (>80%), temperature 15-25°C, prolonged leaf wetness'),
('Powdery Mildew', 'Various', 'White powdery coating on leaves, stunted growth', 'Fungal infection', 'Good air circulation, avoid overcrowding', 'Apply sulfur-based fungicides, neem oil spray', 'medium', 'High humidity, moderate temperature 20-25°C'),
('Root Rot', 'Various', 'Yellowing leaves, wilting, dark mushy roots', 'Overwatering, poor drainage, fungal pathogens', 'Improve drainage, avoid overwatering', 'Reduce watering, apply fungicide to soil', 'high', 'Waterlogged soil, poor drainage, high soil moisture'),
('Leaf Rust', 'Beans', 'Orange-brown pustules on leaves, yellowing', 'Fungal infection (Uromyces appendiculatus)', 'Use disease-free seeds, crop rotation', 'Apply fungicides, remove infected leaves', 'medium', 'High humidity (>80%), temperature 20-27°C'),
('Bacterial Wilt', 'Various', 'Rapid wilting, yellowing, plant death', 'Bacterial infection spread by insects', 'Control insect vectors, crop rotation', 'Remove infected plants, use bactericides', 'critical', 'Warm temperature (>25°C), insect activity'),
('Anthracnose', 'Fruits', 'Dark sunken spots on fruits and leaves', 'Fungal infection', 'Remove plant debris, avoid overhead watering', 'Apply copper fungicides', 'medium', 'Warm humid weather, rain splash'),
('Downy Mildew', 'Cucurbits', 'Yellow patches on upper leaf, gray mold below', 'Oomycete pathogen', 'Good drainage, resistant varieties', 'Apply fungicides early, improve air flow', 'high', 'Cool nights, warm days, high humidity'),
('Fusarium Wilt', 'Various', 'Yellowing, wilting, vascular discoloration', 'Soil-borne fungus', 'Use resistant varieties, soil solarization', 'No cure, remove infected plants', 'high', 'Warm soil temperature (25-30°C), acidic soil');

-- Insert default admin user (password: admin123)
-- Note: If login fails, run reset_admin_password.php to reset the password
INSERT INTO users (username, email, password, full_name, phone, farm_location, farm_size) VALUES
('admin', 'admin@shambasmart.com', '$2y$10$YjNhMDNkZWRkMWRkMGRmM.8FzS3vE1qvZKGvN8vQ8FqvZKGvN8vQ8e', 'System Administrator', '+254700000000', 'Nairobi, Kenya', 10.00);

-- Insert default irrigation settings for admin
INSERT INTO irrigation_settings (user_id, auto_mode, moisture_threshold, irrigation_duration) VALUES
(1, TRUE, 30.0, 30);

-- Create view for latest sensor readings
CREATE OR REPLACE VIEW latest_sensor_readings AS
SELECT 
    sd.*,
    u.username,
    u.farm_location
FROM sensor_data sd
INNER JOIN (
    SELECT user_id, MAX(timestamp) as max_timestamp
    FROM sensor_data
    GROUP BY user_id
) latest ON sd.user_id = latest.user_id AND sd.timestamp = latest.max_timestamp
INNER JOIN users u ON sd.user_id = u.id;

-- Create view for irrigation statistics
CREATE OR REPLACE VIEW irrigation_statistics AS
SELECT 
    user_id,
    COUNT(*) as total_irrigations,
    SUM(CASE WHEN action = 'start' THEN 1 ELSE 0 END) as irrigation_starts,
    SUM(CASE WHEN auto_triggered = TRUE THEN 1 ELSE 0 END) as auto_irrigations,
    SUM(water_amount) as total_water_used,
    AVG(duration) as avg_duration
FROM irrigation_logs
GROUP BY user_id;


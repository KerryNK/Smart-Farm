# ShambaSmart - System Architecture

## 📐 System Overview

ShambaSmart is a web-based smart farming system built with a three-tier architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│         (HTML, CSS, JavaScript, Bootstrap)              │
│  - User Interface                                       │
│  - Data Visualization (Chart.js)                        │
│  - Client-side Logic                                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/AJAX
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│              (PHP RESTful API)                          │
│  - Business Logic                                       │
│  - Authentication & Authorization                       │
│  - Data Processing                                      │
│  - Alert Generation                                     │
└────────────────────┬────────────────────────────────────┘
                     │ SQL Queries
                     ▼
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│                  (MySQL Database)                        │
│  - Data Storage                                         │
│  - Data Relationships                                   │
│  - Data Integrity                                       │
└─────────────────────────────────────────────────────────┘
```

## 🏗️ Architecture Layers

### 1. Presentation Layer (Frontend)

**Technologies:**
- HTML5
- CSS3 + Bootstrap 5
- Vanilla JavaScript (ES6+)
- Chart.js for visualizations
- Bootstrap Icons

**Components:**

#### Pages
- `login.html` - Authentication
- `register.html` - User registration
- `index.html` - Main dashboard
- `irrigation.html` - Irrigation control
- `weather.html` - Weather forecast
- `diseases.html` - Disease management
- `notifications.html` - Alerts center

#### JavaScript Modules
- `auth.js` - Authentication logic
- `app.js` - Main application logic
- `irrigation.js` - Irrigation controls
- `weather.js` - Weather display
- `diseases.js` - Disease management
- `notifications.js` - Notification handling

#### Styling
- `style.css` - Custom styles
- Bootstrap 5 - Responsive framework

### 2. Application Layer (Backend)

**Technology:** PHP 8.x

**API Endpoints:**

#### Authentication API (`api/auth.php`)
```php
GET  /api/auth.php?action=check        // Check auth status
POST /api/auth.php?action=login        // User login
POST /api/auth.php?action=register     // User registration
POST /api/auth.php?action=logout       // User logout
```

#### Sensors API (`api/sensors.php`)
```php
GET  /api/sensors.php?action=latest    // Get latest readings
GET  /api/sensors.php?action=history   // Get sensor history
POST /api/sensors.php?action=add       // Add sensor reading
GET  /api/sensors.php?action=stats     // Get statistics
```

#### Irrigation API (`api/irrigation.php`)
```php
POST /api/irrigation.php?action=start      // Start irrigation
POST /api/irrigation.php?action=stop       // Stop irrigation
GET  /api/irrigation.php?action=status     // Get status
GET  /api/irrigation.php?action=settings   // Get settings
POST /api/irrigation.php?action=settings   // Update settings
GET  /api/irrigation.php?action=history    // Get history
GET  /api/irrigation.php?action=stats      // Get statistics
```

#### Weather API (`api/weather.php`)
```php
GET  /api/weather.php?action=forecast      // Get forecast
GET  /api/weather.php?action=alerts        // Get weather alerts
POST /api/weather.php?action=generate      // Generate data
```

#### Diseases API (`api/diseases.php`)
```php
GET  /api/diseases.php?action=list         // List diseases
GET  /api/diseases.php?action=get          // Get disease detail
GET  /api/diseases.php?action=alerts       // Get disease alerts
POST /api/diseases.php?action=mark_read    // Mark alert read
```

#### Notifications API (`api/notifications.php`)
```php
GET  /api/notifications.php?action=list            // List notifications
GET  /api/notifications.php?action=unread_count    // Get unread count
POST /api/notifications.php?action=mark_read       // Mark as read
POST /api/notifications.php?action=mark_all_read   // Mark all read
POST /api/notifications.php?action=delete          // Delete notification
```

#### Simulator API (`api/simulator.php`)
```php
POST /api/simulator.php?action=generate_continuous   // Generate 24h data
POST /api/simulator.php?action=simulate_conditions   // Simulate conditions
```

### 3. Data Layer (Database)

**Technology:** MySQL 8.x

**Database Schema:**

#### Core Tables

**1. users**
```sql
- id (PK)
- username
- email
- password (hashed)
- full_name
- phone
- farm_location
- farm_size
- created_at, updated_at
```

**2. sensor_data**
```sql
- id (PK)
- user_id (FK)
- soil_moisture
- temperature
- humidity
- light_intensity
- ph_level
- timestamp
```

**3. irrigation_logs**
```sql
- id (PK)
- user_id (FK)
- action (start/stop)
- water_amount
- duration
- auto_triggered (boolean)
- trigger_reason
- timestamp
```

**4. irrigation_settings**
```sql
- id (PK)
- user_id (FK, UNIQUE)
- auto_mode (boolean)
- moisture_threshold
- irrigation_duration
- schedule_time
- use_schedule (boolean)
```

**5. weather_predictions**
```sql
- id (PK)
- location
- date
- temperature_min, temperature_max
- humidity
- rainfall_probability
- rainfall_amount
- weather_condition
- created_at
```

**6. weather_alerts**
```sql
- id (PK)
- user_id (FK)
- alert_type
- message
- severity (info/warning/danger)
- is_read (boolean)
- created_at
```

**7. crop_diseases**
```sql
- id (PK)
- disease_name
- crop_type
- symptoms
- causes
- prevention
- treatment
- severity_level
- conditions
- created_at
```

**8. disease_alerts**
```sql
- id (PK)
- user_id (FK)
- disease_id (FK)
- risk_level
- alert_message
- is_read (boolean)
- created_at
```

**9. notifications**
```sql
- id (PK)
- user_id (FK)
- title
- message
- type (irrigation/weather/disease/system)
- is_read (boolean)
- created_at
```

#### Database Views

**latest_sensor_readings**
```sql
-- Shows most recent sensor reading per user
SELECT sd.*, u.username, u.farm_location
FROM sensor_data sd
JOIN users u ON sd.user_id = u.id
WHERE timestamp = MAX(timestamp) per user
```

**irrigation_statistics**
```sql
-- Aggregated irrigation statistics per user
SELECT user_id, 
       COUNT(*) as total_irrigations,
       SUM(water_amount) as total_water_used,
       AVG(duration) as avg_duration
FROM irrigation_logs
GROUP BY user_id
```

## 🔄 Data Flow

### Sensor Data Flow
```
Sensor Reading
    ↓
Frontend: Generate Data button clicked
    ↓
JavaScript: Collect sensor values
    ↓
API: POST /api/sensors.php?action=add
    ↓
Backend: Process data
    ↓
    ├─→ Insert into sensor_data table
    ├─→ Check irrigation conditions
    │   └─→ Trigger auto-irrigation if needed
    └─→ Check disease conditions
        └─→ Create disease alerts if needed
    ↓
Response: Success/Failure
    ↓
Frontend: Update display, refresh charts
```

### Irrigation Flow
```
User Action (Start/Stop)
    ↓
Frontend: Button click
    ↓
API: POST /api/irrigation.php?action=start
    ↓
Backend: Validate request
    ↓
    ├─→ Check current status
    ├─→ Insert log entry
    └─→ Create notification
    ↓
Response: Success with details
    ↓
Frontend: Update status display
```

### Weather Alert Flow
```
Weather Generation
    ↓
API: POST /api/weather.php?action=generate
    ↓
Backend: Generate 7-day forecast
    ↓
    ├─→ Create weather predictions
    └─→ Analyze conditions
        ├─→ Rain probability > 70%? → Create rain alert
        ├─→ Heavy rain expected? → Create warning
        └─→ Extreme temp? → Create danger alert
    ↓
Response: Forecast created
    ↓
Frontend: Display forecast and alerts
```

### Disease Detection Flow
```
Sensor Reading Added
    ↓
Backend: checkDiseaseConditions()
    ↓
Evaluate environmental conditions
    ↓
    ├─→ High humidity + correct temp?
    │   └─→ Check for blight conditions
    ├─→ High moisture?
    │   └─→ Check for root rot
    └─→ Other conditions...
    ↓
Create disease alert if conditions met
    ↓
Create notification
    ↓
Frontend: Display alert on dashboard
```

## 🔒 Security Architecture

### Authentication
- **Session-based** authentication
- **Password hashing** using PHP's `password_hash()` with bcrypt
- **Session management** with secure cookies
- **Input sanitization** on all user inputs

### Authorization
- **User-level isolation** - users only see their own data
- **API authentication** - all API calls check session
- **SQL injection prevention** - prepared statements
- **XSS prevention** - output escaping

### Security Headers
```apache
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```

## 📊 Key Design Patterns

### 1. MVC Pattern (Modified)
- **Model**: Database tables and API endpoints
- **View**: HTML templates
- **Controller**: JavaScript + PHP API

### 2. RESTful API Design
- Resource-based URLs
- HTTP methods (GET, POST)
- JSON responses
- Stateless operations (session managed separately)

### 3. Repository Pattern
- Database abstraction in `config/database.php`
- Helper functions for queries
- Connection management

### 4. Observer Pattern
- Sensor data triggers automated actions
- Event-driven notifications
- Automatic alert generation

## 🔧 Configuration Management

### Environment Configuration
```php
config/config.php
├─ Application settings
│  ├─ APP_NAME
│  ├─ APP_VERSION
│  └─ APP_URL
├─ Security settings
│  ├─ Password algorithm
│  └─ Hash cost
├─ Sensor thresholds
│  ├─ Moisture limits
│  ├─ Temperature limits
│  └─ Humidity limits
└─ Irrigation settings
   ├─ Default duration
   └─ Min interval
```

### Database Configuration
```php
config/database.php
├─ Connection settings
│  ├─ DB_HOST
│  ├─ DB_USER
│  ├─ DB_PASS
│  └─ DB_NAME
└─ Helper functions
   ├─ getDBConnection()
   ├─ executeQuery()
   ├─ insertQuery()
   └─ modifyQuery()
```

## 📈 Scalability Considerations

### Current Architecture (v1.0)
- Single server deployment
- Direct database connections
- Session-based authentication
- Suitable for: Small farms, demo purposes

### Future Enhancements (v2.0+)
- **Load balancing** - Multiple app servers
- **Database replication** - Master-slave setup
- **Caching** - Redis/Memcached for sessions
- **API Gateway** - Rate limiting, load distribution
- **Microservices** - Separate services for sensors, irrigation, etc.
- **Message Queue** - RabbitMQ for async processing
- **Cloud deployment** - AWS/Azure/Google Cloud

## 🧪 Testing Strategy

### Manual Testing
- User acceptance testing
- Feature testing via UI
- Cross-browser testing

### Future Automated Testing
- **Unit tests** - PHP functions
- **Integration tests** - API endpoints
- **E2E tests** - User workflows
- **Performance tests** - Load testing

## 📱 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

## 🔄 State Management

### Client-side State
- Stored in JavaScript variables
- Refreshed periodically (30 seconds)
- No local storage used (privacy)

### Server-side State
- PHP sessions for authentication
- Database for persistent data
- No in-memory caching (v1.0)

## 🎯 Performance Optimization

### Current Optimizations
- Database indexes on frequently queried columns
- Limited query results (LIMIT clauses)
- CDN for Bootstrap and Chart.js
- Gzip compression (.htaccess)

### Future Optimizations
- Query result caching
- API response caching
- Image optimization
- Lazy loading
- Code minification

## 📦 Deployment Architecture

```
Production Server
├── Web Server (Apache)
│   ├── Virtual Host Configuration
│   ├── .htaccess Rules
│   └── SSL Certificate
├── PHP Runtime
│   ├── PHP 8.x
│   ├── Extensions (mysqli, json)
│   └── php.ini Configuration
├── Database Server (MySQL)
│   ├── Database: shambasmart
│   ├── User Permissions
│   └── Backup Strategy
└── File System
    ├── Application Files
    ├── Logs Directory
    └── Session Storage
```

## 🔍 Monitoring & Logging

### Current Logging
- Apache access logs
- Apache error logs
- MySQL error logs
- PHP error logs

### Future Monitoring
- Application performance monitoring
- Database query monitoring
- User activity tracking
- Error tracking and reporting
- Uptime monitoring

## 🚀 Deployment Process

1. **Prepare Server**
   - Install LAMP stack
   - Configure PHP settings
   - Secure MySQL

2. **Deploy Code**
   - Upload application files
   - Set file permissions
   - Configure .htaccess

3. **Setup Database**
   - Create database
   - Import schema
   - Set up users

4. **Configure Application**
   - Update config files
   - Set production settings
   - Enable security features

5. **Test**
   - Verify all features
   - Test user flows
   - Check security

6. **Go Live**
   - Point domain to server
   - Enable SSL
   - Monitor logs

---

## 📚 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | HTML5 | - | Structure |
| | CSS3 | - | Styling |
| | JavaScript | ES6+ | Logic |
| | Bootstrap | 5.3.0 | UI Framework |
| | Chart.js | 4.4.0 | Data Visualization |
| Backend | PHP | 8.x | Server Logic |
| Database | MySQL | 8.x | Data Storage |
| Web Server | Apache | 2.4+ | HTTP Server |

---

**This architecture provides a solid foundation for a scalable, maintainable smart farming system.**



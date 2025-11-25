# Quick Reference - ShambaSmart Data Loading

## 🚀 Quick Start

### For Users
1. Open browser → Navigate to `http://localhost/Smart%20Farm/`
2. Login with credentials
3. Click **"Generate Data"** on dashboard
4. Click **"Generate Forecast"** for weather
5. Navigate through all pages to verify data appears

### For Developers
```javascript
// New page template - always check for currentUser
document.addEventListener('DOMContentLoaded', function() {
    const checkUser = setInterval(() => {
        if (typeof currentUser !== 'undefined' && currentUser !== null) {
            clearInterval(checkUser);
            // Your initialization here
        }
    }, 100);
});
```

---

## 📁 File Structure

```
Smart Farm/
├── index.html              (Dashboard)
├── irrigation.html         (Irrigation Control)
├── weather.html           (Weather Forecast)
├── diseases.html          (Disease Management)
├── notifications.html     (Notifications)
│
├── assets/
│   └── js/
│       ├── app.js         (Main app - loads FIRST)
│       ├── irrigation.js  (Irrigation page logic)
│       ├── weather.js     (Weather page logic)
│       ├── diseases.js    (Diseases page logic)
│       └── notifications.js (Notifications page logic)
│
└── api/
    ├── auth.php           (Authentication)
    ├── sensors.php        (Sensor data)
    ├── irrigation.php     (Irrigation control)
    ├── weather.php        (Weather forecasts)
    ├── diseases.php       (Disease database)
    └── notifications.php  (Notifications)
```

---

## 🔗 API Endpoints Cheat Sheet

### Sensors
```
GET  /api/sensors.php?action=latest
GET  /api/sensors.php?action=history&hours=24&limit=50
POST /api/sensors.php?action=add
GET  /api/sensors.php?action=stats&hours=24
```

### Irrigation
```
GET  /api/irrigation.php?action=status
POST /api/irrigation.php?action=start    (body: {duration: 30})
POST /api/irrigation.php?action=stop
GET  /api/irrigation.php?action=settings
POST /api/irrigation.php?action=settings (body: {auto_mode: true, ...})
GET  /api/irrigation.php?action=history&days=7&limit=20
GET  /api/irrigation.php?action=stats&days=7
```

### Weather
```
GET  /api/weather.php?action=forecast&days=7
POST /api/weather.php?action=generate
GET  /api/weather.php?action=alerts
```

### Diseases
```
GET  /api/diseases.php?action=list
GET  /api/diseases.php?action=get&id={id}
GET  /api/diseases.php?action=alerts&unread=true
POST /api/diseases.php?action=mark_read (body: {alert_id: 1})
```

### Notifications
```
GET  /api/notifications.php?action=list&limit=50
GET  /api/notifications.php?action=unread_count
POST /api/notifications.php?action=mark_read (body: {notification_id: 1})
POST /api/notifications.php?action=mark_all_read
POST /api/notifications.php?action=delete (body: {notification_id: 1})
```

---

## 🎯 Common Tasks

### Generate Sample Data
```javascript
// Dashboard
document.getElementById('generateDataBtn').click();
// Generates: Sensor readings

// Weather page
document.getElementById('generateWeatherBtn').click();
// Generates: 7-day forecast
```

### Start Irrigation
```javascript
// Irrigation page
const duration = 30; // minutes
fetch('api/irrigation.php?action=start', {
    method: 'POST',
    body: JSON.stringify({duration: duration})
});
```

### Load Latest Sensor Data
```javascript
const response = await fetch('api/sensors.php?action=latest');
const result = await response.json();
if (result.success && result.data) {
    console.log('Temperature:', result.data.temperature);
    console.log('Moisture:', result.data.soil_moisture);
}
```

### Display Toast Notification
```javascript
showToast('Operation successful', 'success'); // green
showToast('Warning message', 'warning');      // yellow
showToast('Error occurred', 'danger');        // red
showToast('Information', 'info');             // blue
```

---

## 🐛 Debugging Checklist

### Page Not Loading Data?
1. ✅ Open browser console (F12)
2. ✅ Check for red error messages
3. ✅ Verify `currentUser` is defined: `console.log(window.currentUser)`
4. ✅ Check Network tab for API failures
5. ✅ Try manually calling API: `fetch('api/sensors.php?action=latest')`

### Authentication Issues?
```javascript
// Check in console
console.log('Authenticated:', typeof currentUser !== 'undefined');
console.log('User:', currentUser);

// Re-authenticate
// Clear cookies, reload page, login again
```

### API Returning Errors?
```bash
# Check PHP error log
tail -f /xampp/logs/php_error_log

# Test API directly in browser
http://localhost/Smart%20Farm/api/sensors.php?action=latest
```

### Data Not Updating?
```javascript
// Force refresh
location.reload();

// Or manually reload data
loadDashboardData(); // Dashboard
loadIrrigationData(); // Irrigation page
loadWeatherData(); // Weather page
```

---

## 🎨 UI State Classes

### Status Badges
```html
<span class="badge bg-success">Active</span>
<span class="badge bg-secondary">Inactive</span>
<span class="badge bg-primary">Running</span>
<span class="badge bg-danger">Critical</span>
<span class="badge bg-warning">Warning</span>
<span class="badge bg-info">Info</span>
```

### Alerts
```html
<div class="alert alert-success">Success message</div>
<div class="alert alert-danger">Error message</div>
<div class="alert alert-warning">Warning message</div>
<div class="alert alert-info">Info message</div>
```

### Loading State
```html
<div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
</div>
```

---

## 📊 Database Tables Quick Ref

### sensor_data
- `id`, `user_id`, `soil_moisture`, `temperature`, `humidity`, 
- `light_intensity`, `ph_level`, `timestamp`

### irrigation_logs
- `id`, `user_id`, `action` (start/stop), `water_amount`, 
- `duration`, `auto_triggered`, `trigger_reason`, `timestamp`

### irrigation_settings
- `id`, `user_id`, `auto_mode`, `moisture_threshold`, 
- `irrigation_duration`, `use_schedule`, `schedule_time`

### weather_forecasts
- `id`, `user_id`, `date`, `weather_condition`, 
- `temperature_min`, `temperature_max`, `rainfall_probability`, 
- `rainfall_amount`, `humidity`, `wind_speed`

### diseases
- `id`, `disease_name`, `crop_type`, `symptoms`, `causes`, 
- `prevention`, `treatment`, `severity_level`, `conditions`

### disease_alerts
- `id`, `user_id`, `disease_id`, `risk_level`, 
- `alert_message`, `is_read`, `created_at`

### notifications
- `id`, `user_id`, `title`, `message`, `type`, 
- `is_read`, `created_at`

---

## ⚡ Performance Tips

### Optimize API Calls
```javascript
// ❌ Bad: Multiple separate calls
const sensors = await fetch('api/sensors.php?action=latest');
const irrigation = await fetch('api/irrigation.php?action=status');
const weather = await fetch('api/weather.php?action=forecast');

// ✅ Good: Parallel calls
const [sensors, irrigation, weather] = await Promise.all([
    fetch('api/sensors.php?action=latest'),
    fetch('api/irrigation.php?action=status'),
    fetch('api/weather.php?action=forecast')
]);
```

### Debounce User Input
```javascript
let timeout;
input.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        // API call here
    }, 500); // Wait 500ms after user stops typing
});
```

### Cache Static Data
```javascript
// Cache diseases list (doesn't change often)
let cachedDiseases = null;
async function loadDiseases() {
    if (cachedDiseases) return cachedDiseases;
    const response = await fetch('api/diseases.php?action=list');
    cachedDiseases = await response.json();
    return cachedDiseases;
}
```

---

## 🔒 Security Best Practices

### Client-Side
```javascript
// ✅ Always check authentication
if (!currentUser) {
    window.location.href = 'login.html';
    return;
}

// ✅ Validate user input
const duration = parseInt(input.value);
if (duration < 5 || duration > 120) {
    showToast('Invalid duration', 'warning');
    return;
}

// ✅ Never store sensitive data in localStorage
// Use session storage or cookies (HTTP-only)
```

### Server-Side
```php
// ✅ Always check authentication (already implemented)
if (!isLoggedIn()) {
    jsonResponse(['success' => false, 'message' => 'Unauthorized'], 401);
}

// ✅ Use prepared statements (already implemented)
$stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
```

---

## 📝 Commit Message Convention

When making changes, use clear commit messages:

```bash
# Feature additions
git commit -m "feat: Add weather forecast generation"

# Bug fixes
git commit -m "fix: Resolve data loading race condition"

# Documentation
git commit -m "docs: Update API endpoint documentation"

# Performance improvements
git commit -m "perf: Optimize sensor data queries"

# Refactoring
git commit -m "refactor: Improve error handling in weather.js"
```

---

## 🎓 Learning Resources

### JavaScript Concepts Used
- Async/await for API calls
- Promises and Promise.all
- SetInterval/setTimeout for polling
- Event listeners (DOMContentLoaded, click, etc.)
- Template literals for HTML generation
- Arrow functions
- Destructuring

### Libraries Used
- **Bootstrap 5.3**: UI framework
- **Chart.js 4.4**: Data visualization
- **Bootstrap Icons**: Icon library

### PHP Concepts Used
- Session management
- MySQL prepared statements
- JSON responses
- RESTful API design

---

## 🆘 Support & Help

### Where to Find Information
1. **DATA_LOADING_IMPROVEMENTS.md** - Technical details of changes
2. **TESTING_GUIDE.md** - Complete testing procedures
3. **DATA_FLOW_DIAGRAM.txt** - Visual system architecture
4. **CHANGES_SUMMARY.txt** - Summary of modifications
5. **QUICK_REFERENCE.md** - This file!

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Unauthorized" | Not logged in | Login again |
| "No data available" | Database empty | Use generate buttons |
| "Failed to fetch" | API not responding | Check server running |
| "currentUser is undefined" | Auth not complete | Wait or refresh page |
| "Invalid action" | Wrong API endpoint | Check URL/parameters |

---

## 🏁 Final Checklist

Before considering work complete:

- [ ] All 5 pages load without errors
- [ ] Authentication works properly
- [ ] Data generates successfully
- [ ] Empty states display correctly
- [ ] Error messages are user-friendly
- [ ] No console errors
- [ ] Network tab shows 200 responses
- [ ] Auto-refresh works on dashboard
- [ ] Navigation between pages works
- [ ] Can logout and login again
- [ ] Tested in Chrome/Firefox/Edge
- [ ] Mobile responsive design works

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Console shows no errors  
✅ All pages load data or show "Generate" prompts  
✅ Clicking buttons provides immediate feedback  
✅ Toast notifications appear for actions  
✅ Charts render properly  
✅ Irrigation can start/stop successfully  
✅ Weather forecast displays 7 days  
✅ Disease risk assessment shows  
✅ Notifications load and can be managed  
✅ Dashboard auto-refreshes every 30 seconds  

---

**Last Updated:** November 24, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready


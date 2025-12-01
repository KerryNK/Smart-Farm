// Main Application JavaScript

// Global variables
let currentUser = null;
let sensorDataChart = null;
let updateInterval = null;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

// Check if user is authenticated
async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth.php?action=check');
        const result = await response.json();

        if (result.authenticated) {
            currentUser = result.user;
            // Mark currentUser as available for other scripts
            window.currentUser = currentUser;
            // If user is on the login or register page, redirect to dashboard
            const isLoginPage = window.location.pathname.endsWith('/public/login.html') || window.location.pathname.endsWith('/login.html');
            const isRegisterPage = window.location.pathname.endsWith('/public/register.html') || window.location.pathname.endsWith('/register.html');
            if (isLoginPage || isRegisterPage) {
                window.location.href = '/public/index.html';
                return;
            }
            initializeApp();
        } else {
            window.location.href = '/public/login.html';
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = '/public/login.html';
    }
}

// Initialize application
function initializeApp() {
    // Update user info in navbar
    if (document.getElementById('userFullName')) {
        document.getElementById('userFullName').textContent = currentUser.full_name;
    }

    // Load initial data - check if we're on the dashboard
    const isDashboard = window.location.pathname.endsWith('/public/index.html') || 
                        window.location.pathname.endsWith('/') || 
                        window.location.pathname === '/Smart%20Farm/' ||
                        document.getElementById('sensorChart') !== null;
    
    if (isDashboard) {
        loadDashboardData();
    }
    
    // Always load notifications for badge
    loadNotifications();

    // Set up auto-refresh only for dashboard
    if (isDashboard) {
        updateInterval = setInterval(() => {
            loadDashboardData();
            loadNotifications();
        }, 30000); // Refresh every 30 seconds
    }

    // Set up event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadDashboardData();
            showToast('Data refreshed successfully', 'success');
        });
    }

    // Generate sensor data button
    const generateDataBtn = document.getElementById('generateDataBtn');
    if (generateDataBtn) {
        generateDataBtn.addEventListener('click', generateSensorData);
    }

    // Generate multiple sensor data button
    const generateMultipleDataBtn = document.getElementById('generateMultipleDataBtn');
    if (generateMultipleDataBtn) {
        generateMultipleDataBtn.addEventListener('click', generateMultipleSensorData);
    }

    // Generate weather data button
    const generateWeatherBtn = document.getElementById('generateWeatherBtn');
    if (generateWeatherBtn) {
        generateWeatherBtn.addEventListener('click', generateWeatherData);
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadLatestSensorData(),
            loadSensorStats(),
            loadIrrigationStatus(),
            loadWeatherForecast()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Some dashboard data failed to load', 'warning');
    }
}

// Load latest sensor readings
async function loadLatestSensorData() {
    try {
        const response = await fetch('api/sensors.php?action=latest');
        const result = await response.json();

        if (result.success && result.data) {
            try {
                updateSensorDisplay(result.data);
                loadSensorHistory(); // Load chart data
            } catch (displayError) {
                console.error('Error displaying sensor data:', displayError);
                console.log('Data received:', result.data);
                showNoSensorDataPrompt();
            }
        } else {
            console.log('No sensor data available - showing empty state');
            showNoSensorDataPrompt();
        }
    } catch (error) {
        console.error('Error loading sensor data:', error);
        showNoSensorDataPrompt();
    }
}

// Show helpful prompt when no sensor data exists
function showNoSensorDataPrompt() {
    // Add a helpful banner if it doesn't exist
    const sensorRow = document.querySelector('.row.g-4.mb-4');
    if (sensorRow) {
        const existingBanner = document.getElementById('noSensorDataBanner');
        if (!existingBanner) {
            const banner = document.createElement('div');
            banner.id = 'noSensorDataBanner';
            banner.className = 'col-12 mb-3';
            banner.innerHTML = `
                <div class="alert alert-info alert-dismissible fade show" role="alert">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>No sensor data found!</strong> Click the "Generate Data" button above to create sample sensor readings.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            sensorRow.parentElement.insertBefore(banner, sensorRow);
        }
    }
}

// Update sensor displays
function updateSensorDisplay(data) {
    // Parse values to ensure they're numbers
    const moisture = data.soil_moisture ? parseFloat(data.soil_moisture) : null;
    const temperature = data.temperature ? parseFloat(data.temperature) : null;
    const humidity = data.humidity ? parseFloat(data.humidity) : null;
    const ph = data.ph_level ? parseFloat(data.ph_level) : null;
    
    // Update moisture
    updateSensorCard('moisture', moisture, '%', 30, 80);
    
    // Update temperature
    updateSensorCard('temperature', temperature, '°C', 10, 35);
    
    // Update humidity
    updateSensorCard('humidity', humidity, '%', 40, 85);
    
    // Update pH level
    updateSensorCard('ph', ph, '', 5.5, 7.5);

    // Update last update time
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        lastUpdate.textContent = formatDateTime(data.timestamp);
    }
}

// Update individual sensor card
function updateSensorCard(sensorType, value, unit, minGood, maxGood) {
    const valueElement = document.getElementById(`${sensorType}Value`);
    const gaugeElement = document.getElementById(`${sensorType}Gauge`);
    const statusElement = document.getElementById(`${sensorType}Status`);

    // Check if value is a valid number
    const isValidValue = value !== null && value !== undefined && !isNaN(value) && typeof value === 'number';

    if (valueElement) {
        if (isValidValue) {
            valueElement.textContent = value.toFixed(1) + unit;
            valueElement.style.color = ''; // Reset color
        } else {
            valueElement.textContent = '--';
            valueElement.style.color = '#6c757d'; // Muted color
        }
    }

    if (gaugeElement) {
        if (isValidValue) {
            // Determine gauge fill percentage and color
            let fillPercent = 0;
            let fillColor = '';

            if (sensorType === 'moisture' || sensorType === 'humidity') {
                fillPercent = value;
                if (value < minGood) {
                    fillColor = '#dc3545'; // danger
                } else if (value > maxGood) {
                    fillColor = '#ffc107'; // warning
                } else {
                    fillColor = '#28a745'; // success
                }
            } else if (sensorType === 'temperature') {
                fillPercent = ((value - 0) / 50) * 100;
                if (value < minGood || value > maxGood) {
                    fillColor = '#ffc107';
                } else {
                    fillColor = '#28a745';
                }
            } else if (sensorType === 'ph') {
                fillPercent = ((value - 0) / 14) * 100;
                if (value < minGood || value > maxGood) {
                    fillColor = '#ffc107';
                } else {
                    fillColor = '#28a745';
                }
            }

            gaugeElement.style.width = fillPercent + '%';
            gaugeElement.style.backgroundColor = fillColor;
            gaugeElement.style.opacity = '1';
        } else {
            // No data - show empty gauge
            gaugeElement.style.width = '0%';
            gaugeElement.style.backgroundColor = '#e9ecef';
            gaugeElement.style.opacity = '0.3';
        }
    }

    if (statusElement) {
        if (isValidValue) {
            let status = 'Good';
            let statusClass = 'status-good';

            if (value < minGood) {
                status = 'Low';
                statusClass = 'status-danger';
            } else if (value > maxGood) {
                status = 'High';
                statusClass = 'status-warning';
            }

            statusElement.innerHTML = `<span class="status-indicator ${statusClass}"></span> ${status}`;
        } else {
            statusElement.innerHTML = '<small class="text-muted">No data</small>';
        }
    }
}

// Load sensor statistics
async function loadSensorStats() {
    try {
        const response = await fetch('api/sensors.php?action=stats&hours=24');
        const result = await response.json();

        if (result.success && result.data) {
            // Update stats display if elements exist
            const avgMoisture = document.getElementById('avgMoisture');
            if (avgMoisture && result.data.avg_moisture) {
                avgMoisture.textContent = result.data.avg_moisture.toFixed(1) + '%';
            }

            const avgTemp = document.getElementById('avgTemp');
            if (avgTemp && result.data.avg_temp) {
                avgTemp.textContent = result.data.avg_temp.toFixed(1) + '°C';
            }
        }
    } catch (error) {
        console.error('Error loading sensor stats:', error);
    }
}

// Load sensor history for chart
async function loadSensorHistory() {
    try {
        const response = await fetch('api/sensors.php?action=history&hours=24&limit=50');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            renderSensorChart(result.data);
        } else {
            showNoChartData();
        }
    } catch (error) {
        console.error('Error loading sensor history:', error);
        showNoChartData();
    }
}

// Show message when no chart data available
function showNoChartData() {
    const chartContainer = document.getElementById('sensorChart');
    if (chartContainer) {
        const parent = chartContainer.parentElement;
        if (parent && parent.classList.contains('chart-container')) {
            parent.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-graph-up" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p class="mt-3">No historical data available</p>
                    <small>Generate sensor data to see trends</small>
                </div>
            `;
        }
    }
}

// Render sensor chart
function renderSensorChart(data) {
    const ctx = document.getElementById('sensorChart');
    if (!ctx) return;

    const labels = data.map(d => formatTime(d.timestamp));
    const moistureData = data.map(d => parseFloat(d.soil_moisture));
    const tempData = data.map(d => parseFloat(d.temperature));
    const humidityData = data.map(d => parseFloat(d.humidity));

    if (sensorDataChart) {
        sensorDataChart.destroy();
    }

    sensorDataChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Soil Moisture (%)',
                    data: moistureData,
                    borderColor: '#17a2b8',
                    backgroundColor: 'rgba(23, 162, 184, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Humidity (%)',
                    data: humidityData,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Load irrigation status
async function loadIrrigationStatus() {
    try {
        const response = await fetch('api/irrigation.php?action=status');
        const result = await response.json();

        if (result.success) {
            updateIrrigationDisplay(result.is_active, result.current_session);
        }
    } catch (error) {
        console.error('Error loading irrigation status:', error);
    }
}

// Update irrigation display
function updateIrrigationDisplay(isActive, session) {
    const statusElement = document.getElementById('irrigationStatus');
    const detailsElement = document.getElementById('irrigationDetails');

    if (statusElement) {
        if (isActive) {
            statusElement.innerHTML = '<span class="status-indicator status-good status-pulse"></span> Active';
            statusElement.className = 'badge bg-success';
            
            if (session && detailsElement) {
                detailsElement.innerHTML = `
                    <small class="text-muted">
                        Running for ${session.elapsed_minutes} min
                        ${session.auto_triggered ? '(Auto)' : '(Manual)'}
                    </small>
                `;
            }
        } else {
            statusElement.innerHTML = '<span class="status-indicator"></span> Inactive';
            statusElement.className = 'badge bg-secondary';
            
            if (detailsElement) {
                detailsElement.innerHTML = '<small class="text-muted">No active irrigation</small>';
            }
        }
    }
}

// Load weather forecast
async function loadWeatherForecast() {
    try {
        const response = await fetch('api/weather.php?action=forecast&days=7');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            displayWeatherForecast(result.data);
        } else {
            // Show no forecast message on dashboard
            const container = document.getElementById('weatherForecast');
            if (container) {
                container.innerHTML = `
                    <div class="text-center text-white">
                        <i class="bi bi-cloud-slash" style="font-size: 3rem;"></i>
                        <p class="mt-2">No forecast available</p>
                        <small>Click "Generate Forecast" to load data</small>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading weather forecast:', error);
    }
}

// Display weather forecast
function displayWeatherForecast(forecast) {
    const container = document.getElementById('weatherForecast');
    if (!container) return;

    const today = forecast[0];
    
    // Update main weather display
    const weatherIcon = getWeatherIcon(today.weather_condition);
    const weatherHtml = `
        <div class="text-center">
            <i class="bi ${weatherIcon} weather-icon"></i>
            <div class="weather-temp">${today.temperature_max}°</div>
            <p class="mb-2">${today.weather_condition}</p>
            <small>High: ${today.temperature_max}° | Low: ${today.temperature_min}°</small>
            <div class="mt-3">
                <small><i class="bi bi-droplet"></i> Rain: ${today.rainfall_probability}%</small>
                <small class="ms-3"><i class="bi bi-moisture"></i> Humidity: ${today.humidity}%</small>
            </div>
        </div>
    `;
    
    container.innerHTML = weatherHtml;

    // Update forecast list
    const forecastList = document.getElementById('forecastList');
    if (forecastList && forecast.length > 1) {
        let forecastHtml = '';
        for (let i = 1; i < Math.min(forecast.length, 4); i++) {
            const day = forecast[i];
            const dayName = formatDate(day.date, true);
            forecastHtml += `
                <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <div>
                        <strong>${dayName}</strong><br>
                        <small class="text-muted">${day.weather_condition}</small>
                    </div>
                    <div class="text-end">
                        <i class="bi ${getWeatherIcon(day.weather_condition)} fs-4"></i><br>
                        <small>${day.temperature_min}° - ${day.temperature_max}°</small>
                    </div>
                </div>
            `;
        }
        forecastList.innerHTML = forecastHtml;
    }
}

// Get weather icon based on condition
function getWeatherIcon(condition) {
    const icons = {
        'Sunny': 'bi-sun-fill text-warning',
        'Partly Cloudy': 'bi-cloud-sun-fill text-info',
        'Cloudy': 'bi-cloud-fill text-secondary',
        'Light Rain': 'bi-cloud-drizzle-fill text-primary',
        'Heavy Rain': 'bi-cloud-rain-heavy-fill text-primary',
        'Thunderstorm': 'bi-cloud-lightning-rain-fill text-danger'
    };
    return icons[condition] || 'bi-cloud-fill';
}

// Load notifications
async function loadNotifications() {
    try {
        const response = await fetch('api/notifications.php?action=unread_count');
        const result = await response.json();

        if (result.success) {
            updateNotificationBadge(result.count);
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Update notification badge
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    }
}

// Generate sample sensor data (for demo purposes)
async function generateSensorData() {
    const btn = document.getElementById('generateDataBtn');
    const originalHtml = btn.innerHTML;
    
    // Disable button and show loading
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
    
    const moisture = (Math.random() * 50 + 30).toFixed(2);
    const temperature = (Math.random() * 15 + 20).toFixed(2);
    const humidity = (Math.random() * 30 + 60).toFixed(2);
    const light = (Math.random() * 5000 + 5000).toFixed(2);
    const ph = (Math.random() * 2 + 6).toFixed(2);

    const data = {
        soil_moisture: parseFloat(moisture),
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        light_intensity: parseFloat(light),
        ph_level: parseFloat(ph)
    };

    try {
        const response = await fetch('api/sensors.php?action=add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showToast('✓ Sensor data generated successfully!', 'success');
            
            // Remove the "no data" banner if it exists
            const banner = document.getElementById('noSensorDataBanner');
            if (banner) {
                banner.remove();
            }
            
            // Reload dashboard data
            await loadDashboardData();
            
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        } else {
            showToast('Failed to add sensor data: ' + (result.message || 'Unknown error'), 'danger');
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    } catch (error) {
        console.error('Error generating sensor data:', error);
        showToast('Error adding sensor data. Check console for details.', 'danger');
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

// Generate multiple sensor readings for better charts
async function generateMultipleSensorData() {
    const btn = document.getElementById('generateMultipleDataBtn');
    const originalHtml = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
    
    try {
        let successCount = 0;
        
        // Generate 10 data points
        for (let i = 0; i < 10; i++) {
            const moisture = (Math.random() * 50 + 30).toFixed(2);
            const temperature = (Math.random() * 15 + 20).toFixed(2);
            const humidity = (Math.random() * 30 + 60).toFixed(2);
            const light = (Math.random() * 5000 + 5000).toFixed(2);
            const ph = (Math.random() * 2 + 6).toFixed(2);

            const data = {
                soil_moisture: parseFloat(moisture),
                temperature: parseFloat(temperature),
                humidity: parseFloat(humidity),
                light_intensity: parseFloat(light),
                ph_level: parseFloat(ph)
            };

            const response = await fetch('api/sensors.php?action=add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.success) successCount++;
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (successCount > 0) {
            showToast(`✓ Generated ${successCount} sensor readings successfully!`, 'success');
            
            // Remove the "no data" banner if it exists
            const banner = document.getElementById('noSensorDataBanner');
            if (banner) {
                banner.remove();
            }
            
            // Reload dashboard data
            await loadDashboardData();
        } else {
            showToast('Failed to generate sensor data', 'danger');
        }
    } catch (error) {
        console.error('Error generating multiple sensor data:', error);
        showToast('Error generating sensor data', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

// Generate weather data
async function generateWeatherData() {
    const btn = document.getElementById('generateWeatherBtn');
    if (btn) {
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
    }
    
    try {
        const response = await fetch('api/weather.php?action=generate', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showToast('✓ Weather forecast generated successfully!', 'success');
            loadWeatherForecast();
        } else {
            showToast('Failed to generate weather data', 'danger');
        }
    } catch (error) {
        console.error('Error generating weather data:', error);
        showToast('Error generating weather data', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }
}

// Handle logout
async function handleLogout(e) {
    e.preventDefault();
    
    try {
        await fetch('api/auth.php?action=logout');
        window.location.href = '/public/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/public/login.html';
    }
}

// Utility functions
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString, shortName = false) {
    const date = new Date(dateString);
    if (shortName) {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function showNoDataMessage(type) {
    console.log(`No ${type} data available`);
}

function showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});



// Weather Page JavaScript

let rainfallChart = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for currentUser to be available
    const checkUser = setInterval(() => {
        if (typeof currentUser !== 'undefined' && currentUser !== null) {
            clearInterval(checkUser);
            loadWeatherData();
            setupWeatherListeners();
        }
    }, 100);
});

function setupWeatherListeners() {
    document.getElementById('generateWeatherBtn').addEventListener('click', generateWeatherForecast);
}

function loadWeatherData() {
    loadForecast();
    loadWeatherAlerts();
}

async function loadForecast() {
    try {
        const response = await fetch('api/weather.php?action=forecast&days=7');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            displayForecast(result.data);
            displayTodayWeather(result.data[0]);
            displayRainProbability(result.data);
            displayFarmingTips(result.data);
            renderRainfallChart(result.data);
        } else {
            showNoForecastMessage();
            showNoTodayWeather();
            showNoRainProbability();
            showDefaultTips();
        }
    } catch (error) {
        console.error('Error loading forecast:', error);
        showNoForecastMessage();
        showToast('Failed to load weather forecast', 'warning');
    }
}

function displayForecast(forecast) {
    const container = document.getElementById('forecastContainer');
    
    let html = '<div class="row g-3">';
    
    forecast.forEach((day, index) => {
        const date = new Date(day.date);
        const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const icon = getWeatherIcon(day.weather_condition);
        
        // Determine rain alert class
        let rainClass = '';
        if (day.rainfall_probability > 70) {
            rainClass = 'border-primary';
        }
        
        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 ${rainClass}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h6 class="fw-bold mb-0">${dayName}</h6>
                                <small class="text-muted">${dateStr}</small>
                            </div>
                            <i class="bi ${icon} fs-2"></i>
                        </div>
                        
                        <div class="mb-3">
                            <h4 class="mb-0">${day.temperature_max}° / ${day.temperature_min}°</h4>
                            <small class="text-muted">${day.weather_condition}</small>
                        </div>
                        
                        <div class="d-flex justify-content-between text-sm">
                            <div>
                                <i class="bi bi-droplet text-primary"></i>
                                <small>Rain: ${day.rainfall_probability}%</small>
                            </div>
                            <div>
                                <i class="bi bi-moisture text-info"></i>
                                <small>Humidity: ${day.humidity}%</small>
                            </div>
                        </div>
                        
                        ${day.rainfall_amount > 0 ? `
                            <div class="mt-2">
                                <div class="alert alert-info py-1 px-2 mb-0">
                                    <small><i class="bi bi-cloud-rain"></i> Expected: ${day.rainfall_amount}mm</small>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${day.rainfall_probability > 70 ? `
                            <div class="mt-2">
                                <span class="badge bg-primary">
                                    <i class="bi bi-exclamation-triangle"></i> High Rain Chance
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function displayTodayWeather(today) {
    const container = document.getElementById('todayWeather');
    const icon = getWeatherIcon(today.weather_condition);
    
    const html = `
        <div class="text-center text-white">
            <i class="bi ${icon} weather-icon"></i>
            <div class="weather-temp">${today.temperature_max}°</div>
            <p class="mb-2">${today.weather_condition}</p>
            <div class="row text-center">
                <div class="col-6">
                    <small>High</small>
                    <p class="h5 mb-0">${today.temperature_max}°</p>
                </div>
                <div class="col-6">
                    <small>Low</small>
                    <p class="h5 mb-0">${today.temperature_min}°</p>
                </div>
            </div>
            <hr class="bg-white opacity-25">
            <div class="row text-center">
                <div class="col-6">
                    <i class="bi bi-droplet"></i>
                    <p class="mb-0"><small>Rain: ${today.rainfall_probability}%</small></p>
                </div>
                <div class="col-6">
                    <i class="bi bi-moisture"></i>
                    <p class="mb-0"><small>Humidity: ${today.humidity}%</small></p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function displayRainProbability(forecast) {
    const container = document.getElementById('rainProbability');
    
    let html = '';
    forecast.slice(0, 3).forEach((day, index) => {
        const date = new Date(day.date);
        const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const prob = day.rainfall_probability;
        
        let progressClass = 'bg-success';
        if (prob > 70) progressClass = 'bg-danger';
        else if (prob > 40) progressClass = 'bg-warning';
        
        html += `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <small class="fw-bold">${dayName}</small>
                    <small class="text-primary">${prob}%</small>
                </div>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${prob}%" 
                         aria-valuenow="${prob}" aria-valuemin="0" aria-valuemax="100">
                        ${prob > 15 ? prob + '%' : ''}
                    </div>
                </div>
                ${day.rainfall_amount > 0 ? `<small class="text-muted">Expected: ${day.rainfall_amount}mm</small>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function displayFarmingTips(forecast) {
    const container = document.getElementById('tipsContent');
    const today = forecast[0];
    const tomorrow = forecast[1];
    
    let tips = [];
    
    // Rain-based tips
    if (today.rainfall_probability > 70) {
        tips.push({
            icon: 'bi-umbrella',
            text: 'High chance of rain today. Skip irrigation and prepare drainage.',
            type: 'primary'
        });
    } else if (today.rainfall_probability < 20 && today.temperature_max > 30) {
        tips.push({
            icon: 'bi-droplet-fill',
            text: 'Hot and dry conditions. Ensure adequate irrigation.',
            type: 'warning'
        });
    }
    
    if (tomorrow && tomorrow.rainfall_probability > 70) {
        tips.push({
            icon: 'bi-cloud-rain',
            text: 'Rain expected tomorrow. Plan harvesting or spraying activities for today.',
            type: 'info'
        });
    }
    
    // Temperature-based tips
    if (today.temperature_max > 35) {
        tips.push({
            icon: 'bi-thermometer-sun',
            text: 'Extreme heat expected. Provide shade for sensitive crops.',
            type: 'danger'
        });
    } else if (today.temperature_min < 10) {
        tips.push({
            icon: 'bi-snow',
            text: 'Low temperatures. Protect crops from potential frost damage.',
            type: 'warning'
        });
    }
    
    // Humidity-based tips
    if (today.humidity > 80 && today.temperature_max > 20) {
        tips.push({
            icon: 'bi-bug',
            text: 'High humidity and warm temps favor disease. Monitor crops closely.',
            type: 'warning'
        });
    }
    
    // General tip
    tips.push({
        icon: 'bi-check-circle',
        text: 'Best irrigation times: Early morning (5-7 AM) or evening (5-7 PM).',
        type: 'success'
    });
    
    let html = '';
    tips.forEach(tip => {
        html += `
            <div class="alert alert-${tip.type} py-2 px-3 mb-2">
                <i class="bi ${tip.icon}"></i>
                <small>${tip.text}</small>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function renderRainfallChart(forecast) {
    const ctx = document.getElementById('rainfallChart');
    if (!ctx) return;
    
    const labels = forecast.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const rainfallData = forecast.map(d => parseFloat(d.rainfall_amount));
    const probabilityData = forecast.map(d => parseFloat(d.rainfall_probability));
    
    if (rainfallChart) {
        rainfallChart.destroy();
    }
    
    rainfallChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Rainfall Amount (mm)',
                    data: rainfallData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Rain Probability (%)',
                    data: probabilityData,
                    type: 'line',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
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
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Rainfall (mm)'
                    },
                    beginAtZero: true
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Probability (%)'
                    },
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

async function loadWeatherAlerts() {
    try {
        const response = await fetch('api/weather.php?action=alerts');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            displayWeatherAlerts(result.data);
        }
    } catch (error) {
        console.error('Error loading weather alerts:', error);
    }
}

function displayWeatherAlerts(alerts) {
    const container = document.getElementById('weatherAlertsContainer');
    
    // Show only unread alerts or most recent 3
    const displayAlerts = alerts.filter(a => !a.is_read).slice(0, 3);
    
    if (displayAlerts.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="col-12">';
    
    displayAlerts.forEach(alert => {
        const severityClass = {
            'info': 'alert-info',
            'warning': 'alert-warning',
            'danger': 'alert-danger'
        }[alert.severity] || 'alert-info';
        
        const icon = {
            'info': 'bi-info-circle',
            'warning': 'bi-exclamation-triangle',
            'danger': 'bi-exclamation-octagon'
        }[alert.severity] || 'bi-info-circle';
        
        html += `
            <div class="alert ${severityClass} alert-dismissible fade show">
                <i class="bi ${icon} me-2"></i>
                <strong>${alert.alert_type.toUpperCase()}:</strong> ${alert.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

async function generateWeatherForecast() {
    const btn = document.getElementById('generateWeatherBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generating...';
    
    try {
        const response = await fetch('api/weather.php?action=generate', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Weather forecast generated successfully', 'success');
            loadWeatherData();
        } else {
            showToast('Failed to generate forecast', 'danger');
        }
    } catch (error) {
        console.error('Error generating forecast:', error);
        showToast('Error generating forecast', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Generate Forecast';
    }
}

function showNoForecastMessage() {
    const container = document.getElementById('forecastContainer');
    container.innerHTML = `
        <div class="text-center py-5">
            <i class="bi bi-cloud-slash text-muted" style="font-size: 4rem;"></i>
            <p class="mt-3 text-muted">No forecast data available. Click "Generate Forecast" to load data.</p>
        </div>
    `;
}

function showNoTodayWeather() {
    const container = document.getElementById('todayWeather');
    if (container) {
        container.innerHTML = `
            <div class="text-center text-white">
                <i class="bi bi-cloud-slash" style="font-size: 3rem;"></i>
                <p class="mt-2">No weather data</p>
            </div>
        `;
    }
}

function showNoRainProbability() {
    const container = document.getElementById('rainProbability');
    if (container) {
        container.innerHTML = '<p class="text-muted text-center">No rain data available</p>';
    }
}

function showDefaultTips() {
    const container = document.getElementById('tipsContent');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-info py-2 px-3 mb-2">
                <i class="bi bi-check-circle"></i>
                <small>Best irrigation times: Early morning (5-7 AM) or evening (5-7 PM).</small>
            </div>
            <div class="alert alert-success py-2 px-3 mb-2">
                <i class="bi bi-droplet-fill"></i>
                <small>Monitor soil moisture regularly to optimize water usage.</small>
            </div>
        `;
    }
}



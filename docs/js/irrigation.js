// Irrigation Control JavaScript

let currentStatus = null;
let settings = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for currentUser to be available
    const checkUser = setInterval(() => {
        if (typeof currentUser !== 'undefined' && currentUser !== null) {
            clearInterval(checkUser);
            loadIrrigationData();
            setupIrrigationListeners();
            
            // Auto-refresh every 10 seconds
            setInterval(loadIrrigationStatus, 10000);
        }
    }, 100);
});

function setupIrrigationListeners() {
    // Start irrigation button
    document.getElementById('startIrrigationBtn').addEventListener('click', startIrrigation);
    
    // Stop irrigation button
    document.getElementById('stopIrrigationBtn').addEventListener('click', stopIrrigation);
    
    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    
    // Refresh history button
    document.getElementById('refreshHistoryBtn').addEventListener('click', loadIrrigationHistory);
}

function loadIrrigationData() {
    loadIrrigationStatus();
    loadIrrigationSettings();
    loadIrrigationHistory();
    loadIrrigationStats();
}

async function loadIrrigationStatus() {
    try {
        const response = await fetch('api/irrigation.php?action=status');
        const result = await response.json();

        if (result.success) {
            currentStatus = result;
            updateStatusDisplay(result.is_active, result.current_session);
        } else {
            console.error('Failed to load irrigation status:', result.message);
        }
    } catch (error) {
        console.error('Error loading irrigation status:', error);
        showToast('Failed to load irrigation status', 'danger');
    }
}

function updateStatusDisplay(isActive, session) {
    const statusText = document.getElementById('statusText');
    const statusBadge = document.getElementById('statusBadge');
    const statusIcon = document.getElementById('statusIcon');
    const sessionInfo = document.getElementById('sessionInfo');
    const startBtn = document.getElementById('startIrrigationBtn');
    const stopBtn = document.getElementById('stopIrrigationBtn');

    if (isActive) {
        statusText.textContent = 'Irrigation Active';
        statusBadge.className = 'badge bg-success';
        statusBadge.innerHTML = '<span class="status-indicator status-good status-pulse"></span> Running';
        statusIcon.style.color = '#28a745';
        
        if (session) {
            const type = session.auto_triggered ? 'Automatic' : 'Manual';
            sessionInfo.innerHTML = `
                <div class="alert alert-success">
                    <strong>Running for ${session.elapsed_minutes} minutes</strong><br>
                    <small>Type: ${type} | Planned Duration: ${session.planned_duration} min</small>
                </div>
            `;
        }
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        statusText.textContent = 'Irrigation Inactive';
        statusBadge.className = 'badge bg-secondary';
        statusBadge.innerHTML = '<span class="status-indicator"></span> Stopped';
        statusIcon.style.color = '#6c757d';
        sessionInfo.innerHTML = '<p class="text-muted">No active irrigation session</p>';
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

async function startIrrigation() {
    const duration = parseInt(document.getElementById('durationInput').value);
    
    if (duration < 5 || duration > 120) {
        showToast('Duration must be between 5 and 120 minutes', 'warning');
        return;
    }
    
    const btn = document.getElementById('startIrrigationBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Starting...';
    
    try {
        const response = await fetch('api/irrigation.php?action=start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration: duration })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Irrigation started successfully', 'success');
            loadIrrigationData();
        } else {
            showToast(result.message || 'Failed to start irrigation', 'danger');
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-play-fill"></i> Start Irrigation';
        }
    } catch (error) {
        console.error('Error starting irrigation:', error);
        showToast('Error starting irrigation', 'danger');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-play-fill"></i> Start Irrigation';
    }
}

async function stopIrrigation() {
    const btn = document.getElementById('stopIrrigationBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Stopping...';
    
    try {
        const response = await fetch('api/irrigation.php?action=stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Irrigation stopped successfully', 'success');
            loadIrrigationData();
        } else {
            showToast(result.message || 'Failed to stop irrigation', 'danger');
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-stop-fill"></i> Stop Irrigation';
        }
    } catch (error) {
        console.error('Error stopping irrigation:', error);
        showToast('Error stopping irrigation', 'danger');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-stop-fill"></i> Stop Irrigation';
    }
}

async function loadIrrigationSettings() {
    try {
        const response = await fetch('api/irrigation.php?action=settings');
        const result = await response.json();

        if (result.success && result.data) {
            settings = result.data;
            populateSettingsForm(result.data);
        } else {
            console.log('Using default settings');
        }
    } catch (error) {
        console.error('Error loading irrigation settings:', error);
        showToast('Failed to load settings', 'warning');
    }
}

function populateSettingsForm(data) {
    document.getElementById('autoModeSwitch').checked = data.auto_mode == 1;
    document.getElementById('useScheduleSwitch').checked = data.use_schedule == 1;
    document.getElementById('moistureThreshold').value = data.moisture_threshold;
    document.getElementById('defaultDuration').value = data.irrigation_duration;
    
    if (data.schedule_time) {
        document.getElementById('scheduleTime').value = data.schedule_time;
    }
}

async function saveSettings(e) {
    e.preventDefault();
    
    const formData = {
        auto_mode: document.getElementById('autoModeSwitch').checked,
        use_schedule: document.getElementById('useScheduleSwitch').checked,
        moisture_threshold: parseFloat(document.getElementById('moistureThreshold').value),
        irrigation_duration: parseInt(document.getElementById('defaultDuration').value),
        schedule_time: document.getElementById('scheduleTime').value
    };
    
    try {
        const response = await fetch('api/irrigation.php?action=settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Settings saved successfully', 'success');
            settings = formData;
        } else {
            showToast(result.message || 'Failed to save settings', 'danger');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings', 'danger');
    }
}

async function loadIrrigationHistory() {
    try {
        const response = await fetch('api/irrigation.php?action=history&days=7&limit=20');
        const result = await response.json();

        if (result.success) {
            displayHistory(result.data || []);
        } else {
            displayHistory([]);
        }
    } catch (error) {
        console.error('Error loading irrigation history:', error);
        displayHistory([]);
    }
}

function displayHistory(history) {
    const tbody = document.getElementById('historyTableBody');
    
    if (!history || history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No irrigation history found</td></tr>';
        return;
    }
    
    let html = '';
    history.forEach(record => {
        const actionIcon = record.action === 'start' ? 'bi-play-fill text-success' : 'bi-stop-fill text-danger';
        const actionText = record.action === 'start' ? 'Started' : 'Stopped';
        const type = record.auto_triggered == 1 ? 
            '<span class="badge bg-info">Auto</span>' : 
            '<span class="badge bg-secondary">Manual</span>';
        
        html += `
            <tr>
                <td>${formatDateTime(record.timestamp)}</td>
                <td><i class="bi ${actionIcon}"></i> ${actionText}</td>
                <td>${record.duration || '--'} min</td>
                <td>${record.water_amount ? record.water_amount.toFixed(1) : '--'} L</td>
                <td>${type}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

async function loadIrrigationStats() {
    try {
        const response = await fetch('api/irrigation.php?action=stats&days=7');
        const result = await response.json();

        if (result.success && result.data) {
            displayStats(result.data);
        } else {
            // Set default values
            displayStats({
                total_water_used: 0,
                total_sessions: 0,
                auto_sessions: 0,
                avg_duration: 0
            });
        }
    } catch (error) {
        console.error('Error loading irrigation stats:', error);
    }
}

function displayStats(stats) {
    const totalWater = document.getElementById('totalWater');
    const totalSessions = document.getElementById('totalSessions');
    const autoSessions = document.getElementById('autoSessions');
    const avgDuration = document.getElementById('avgDuration');
    const waterProgress = document.getElementById('waterProgress');
    
    if (totalWater) {
        const water = stats.total_water_used ? parseFloat(stats.total_water_used).toFixed(1) : '0';
        totalWater.textContent = water + ' L';
        
        // Calculate progress (assuming 5000L is max for 7 days)
        const progress = Math.min((parseFloat(water) / 5000) * 100, 100);
        waterProgress.style.width = progress + '%';
        
        if (progress > 75) {
            waterProgress.className = 'progress-bar bg-danger';
        } else if (progress > 50) {
            waterProgress.className = 'progress-bar bg-warning';
        } else {
            waterProgress.className = 'progress-bar bg-success';
        }
    }
    
    if (totalSessions) {
        totalSessions.textContent = stats.total_sessions || '0';
    }
    
    if (autoSessions) {
        autoSessions.textContent = stats.auto_sessions || '0';
    }
    
    if (avgDuration) {
        const avg = stats.avg_duration ? parseFloat(stats.avg_duration).toFixed(1) : '0';
        avgDuration.textContent = avg + ' min';
    }
}



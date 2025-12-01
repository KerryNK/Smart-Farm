// Diseases Page JavaScript

let allDiseases = [];
let diseaseModal = null;

document.addEventListener('DOMContentLoaded', function() {
    // Wait for currentUser to be available
    const checkUser = setInterval(() => {
        if (typeof currentUser !== 'undefined' && currentUser !== null) {
            clearInterval(checkUser);
            diseaseModal = new bootstrap.Modal(document.getElementById('diseaseModal'));
            loadDiseaseData();
            setupDiseaseListeners();
        }
    }, 100);
});

function setupDiseaseListeners() {
    document.getElementById('cropFilter').addEventListener('change', filterDiseases);
}

function loadDiseaseData() {
    loadDiseases();
    loadDiseaseAlerts();
    loadRiskAssessment();
    loadEnvironmentalFactors();
}

async function loadDiseases() {
    try {
        const response = await fetch('api/diseases.php?action=list');
        const result = await response.json();

        if (result.success && result.data) {
            allDiseases = result.data;
            displayDiseases(allDiseases);
        } else {
            allDiseases = [];
            displayDiseases([]);
        }
    } catch (error) {
        console.error('Error loading diseases:', error);
        showToast('Failed to load disease database', 'warning');
        displayDiseases([]);
    }
}

function displayDiseases(diseases) {
    const container = document.getElementById('diseaseListContainer');
    
    if (diseases.length === 0) {
        container.innerHTML = '<p class="text-center text-muted py-5">No diseases found</p>';
        return;
    }
    
    let html = '<div class="accordion" id="diseaseAccordion">';
    
    diseases.forEach((disease, index) => {
        const severityBadge = {
            'low': 'badge bg-success',
            'medium': 'badge bg-warning',
            'high': 'badge bg-danger',
            'critical': 'badge bg-dark'
        }[disease.severity_level] || 'badge bg-secondary';
        
        html += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                        <div class="d-flex w-100 justify-content-between align-items-center">
                            <span>
                                <i class="bi bi-bug-fill text-warning me-2"></i>
                                <strong>${disease.disease_name}</strong>
                            </span>
                            <span class="${severityBadge} me-2">${disease.severity_level.toUpperCase()}</span>
                        </div>
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
                     data-bs-parent="#diseaseAccordion">
                    <div class="accordion-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Crop Type:</strong> <span class="badge bg-info">${disease.crop_type}</span></p>
                                
                                <p><strong>Symptoms:</strong></p>
                                <p class="text-muted">${disease.symptoms || 'N/A'}</p>
                                
                                <p><strong>Causes:</strong></p>
                                <p class="text-muted">${disease.causes || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Prevention:</strong></p>
                                <p class="text-muted">${disease.prevention || 'N/A'}</p>
                                
                                <p><strong>Treatment:</strong></p>
                                <p class="text-muted">${disease.treatment || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div class="alert alert-info mt-3">
                            <strong><i class="bi bi-info-circle"></i> Favorable Conditions:</strong><br>
                            ${disease.conditions || 'N/A'}
                        </div>
                        
                        <button class="btn btn-sm btn-outline-primary" onclick="showDiseaseDetail(${disease.id})">
                            <i class="bi bi-eye"></i> View Full Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function filterDiseases() {
    const cropType = document.getElementById('cropFilter').value;
    
    if (!cropType) {
        displayDiseases(allDiseases);
        return;
    }
    
    const filtered = allDiseases.filter(d => d.crop_type === cropType || d.crop_type === 'Various');
    displayDiseases(filtered);
}

async function showDiseaseDetail(diseaseId) {
    try {
        const response = await fetch(`api/diseases.php?action=get&id=${diseaseId}`);
        const result = await response.json();

        if (result.success && result.data) {
            displayDiseaseModal(result.data);
        }
    } catch (error) {
        console.error('Error loading disease detail:', error);
    }
}

function displayDiseaseModal(disease) {
    const title = document.getElementById('diseaseModalTitle');
    const body = document.getElementById('diseaseModalBody');
    
    title.textContent = disease.disease_name;
    
    const severityBadge = {
        'low': 'badge bg-success',
        'medium': 'badge bg-warning',
        'high': 'badge bg-danger',
        'critical': 'badge bg-dark'
    }[disease.severity_level] || 'badge bg-secondary';
    
    body.innerHTML = `
        <div class="mb-3">
            <span class="${severityBadge}">${disease.severity_level.toUpperCase()} Risk</span>
            <span class="badge bg-info ms-2">${disease.crop_type}</span>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-warning text-dark">
                        <strong><i class="bi bi-exclamation-triangle"></i> Symptoms</strong>
                    </div>
                    <div class="card-body">
                        ${disease.symptoms || 'No information available'}
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header bg-danger text-white">
                        <strong><i class="bi bi-virus"></i> Causes</strong>
                    </div>
                    <div class="card-body">
                        ${disease.causes || 'No information available'}
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card mb-3">
                    <div class="card-header bg-success text-white">
                        <strong><i class="bi bi-shield-check"></i> Prevention</strong>
                    </div>
                    <div class="card-body">
                        ${disease.prevention || 'No information available'}
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header bg-primary text-white">
                        <strong><i class="bi bi-bandaid"></i> Treatment</strong>
                    </div>
                    <div class="card-body">
                        ${disease.treatment || 'No information available'}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="alert alert-info">
            <strong><i class="bi bi-cloud-rain"></i> Favorable Conditions for Disease Development:</strong><br>
            ${disease.conditions || 'No information available'}
        </div>
    `;
    
    diseaseModal.show();
}

async function loadDiseaseAlerts() {
    try {
        const response = await fetch('api/diseases.php?action=alerts&unread=true');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            displayDiseaseAlerts(result.data);
        } else {
            // No alerts - clear the container
            const container = document.getElementById('diseaseAlertsContainer');
            if (container) {
                container.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Error loading disease alerts:', error);
    }
}

function displayDiseaseAlerts(alerts) {
    const container = document.getElementById('diseaseAlertsContainer');
    
    let html = '<div class="col-12">';
    
    alerts.slice(0, 3).forEach(alert => {
        const riskClass = {
            'low': 'alert-info',
            'medium': 'alert-warning',
            'high': 'alert-danger',
            'critical': 'alert-dark'
        }[alert.risk_level] || 'alert-warning';
        
        html += `
            <div class="alert ${riskClass} alert-dismissible fade show">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>${alert.disease_name} Alert (${alert.risk_level.toUpperCase()} Risk):</strong> 
                ${alert.alert_message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" 
                        onclick="markAlertRead(${alert.id})"></button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

async function markAlertRead(alertId) {
    try {
        await fetch('api/diseases.php?action=mark_read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alert_id: alertId })
        });
    } catch (error) {
        console.error('Error marking alert as read:', error);
    }
}

async function loadRiskAssessment() {
    try {
        // Get latest sensor data to assess risk
        const response = await fetch('api/sensors.php?action=latest');
        const result = await response.json();

        if (result.success && result.data) {
            assessDiseaseRisk(result.data);
        } else {
            showNoRiskData();
        }
    } catch (error) {
        console.error('Error loading risk assessment:', error);
        showNoRiskData();
    }
}

function showNoRiskData() {
    const container = document.getElementById('riskAssessment');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-3">
                <i class="bi bi-shield-exclamation text-muted" style="font-size: 3rem;"></i>
                <p class="mt-2 text-muted">No sensor data available for risk assessment</p>
            </div>
        `;
    }
}

function assessDiseaseRisk(sensorData) {
    const container = document.getElementById('riskAssessment');
    
    const moisture = parseFloat(sensorData.soil_moisture);
    const temp = parseFloat(sensorData.temperature);
    const humidity = parseFloat(sensorData.humidity);
    
    let riskLevel = 'Low';
    let riskClass = 'success';
    let riskIcon = 'bi-shield-check';
    let risks = [];
    
    // Check for high-risk conditions
    if (humidity > 80 && temp >= 15 && temp <= 25) {
        risks.push('High risk for fungal diseases (Blight, Mildew)');
        riskLevel = 'High';
        riskClass = 'danger';
        riskIcon = 'bi-shield-exclamation';
    }
    
    if (moisture > 80) {
        risks.push('Waterlogged conditions favor root rot');
        if (riskLevel === 'Low') {
            riskLevel = 'Medium';
            riskClass = 'warning';
            riskIcon = 'bi-shield-fill-exclamation';
        }
    }
    
    if (humidity > 70 && temp >= 20 && temp <= 25) {
        risks.push('Moderate risk for powdery mildew');
        if (riskLevel === 'Low') {
            riskLevel = 'Medium';
            riskClass = 'warning';
            riskIcon = 'bi-shield-fill-exclamation';
        }
    }
    
    if (risks.length === 0) {
        risks.push('Current conditions are favorable for healthy crops');
    }
    
    const html = `
        <div class="text-center mb-3">
            <i class="bi ${riskIcon} text-${riskClass}" style="font-size: 3rem;"></i>
            <h4 class="mt-2 text-${riskClass}">${riskLevel} Risk</h4>
        </div>
        
        <div class="alert alert-${riskClass}">
            <strong>Current Conditions:</strong>
            <ul class="mb-0 mt-2">
                <li>Temperature: ${temp.toFixed(1)}°C</li>
                <li>Humidity: ${humidity.toFixed(1)}%</li>
                <li>Soil Moisture: ${moisture.toFixed(1)}%</li>
            </ul>
        </div>
        
        <div class="mt-3">
            <strong>Risk Factors:</strong>
            <ul class="mt-2">
                ${risks.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>
    `;
    
    container.innerHTML = html;
}

async function loadEnvironmentalFactors() {
    const container = document.getElementById('environmentalFactors');
    
    try {
        const response = await fetch('api/sensors.php?action=latest');
        const result = await response.json();

        if (result.success && result.data) {
            const data = result.data;
            
            const html = `
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Temperature</span>
                        <strong>${parseFloat(data.temperature).toFixed(1)}°C</strong>
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-danger" style="width: ${(data.temperature / 50) * 100}%"></div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Humidity</span>
                        <strong>${parseFloat(data.humidity).toFixed(1)}%</strong>
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-info" style="width: ${data.humidity}%"></div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Soil Moisture</span>
                        <strong>${parseFloat(data.soil_moisture).toFixed(1)}%</strong>
                    </div>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-primary" style="width: ${data.soil_moisture}%"></div>
                    </div>
                </div>
                
                <small class="text-muted">
                    <i class="bi bi-clock"></i> Updated: ${formatDateTime(data.timestamp)}
                </small>
            `;
            
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading environmental factors:', error);
        container.innerHTML = '<p class="text-muted">Unable to load environmental data</p>';
    }
}



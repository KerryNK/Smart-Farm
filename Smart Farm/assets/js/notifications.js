// Notifications Page JavaScript

let allNotifications = [];

document.addEventListener('DOMContentLoaded', function() {
    // Wait for currentUser to be available
    const checkUser = setInterval(() => {
        if (typeof currentUser !== 'undefined' && currentUser !== null) {
            clearInterval(checkUser);
            loadNotificationsPage();
            setupNotificationListeners();
        }
    }, 100);
});

function setupNotificationListeners() {
    document.getElementById('markAllReadBtn').addEventListener('click', markAllAsRead);
    document.getElementById('refreshNotificationsBtn').addEventListener('click', loadNotificationsPage);
    
    // Tab listeners
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            const target = e.target.getAttribute('data-bs-target');
            if (target === '#unread') {
                displayFilteredNotifications('unread');
            } else if (target === '#irrigation') {
                displayFilteredNotifications('irrigation');
            } else if (target === '#weather') {
                displayFilteredNotifications('weather');
            } else if (target === '#disease') {
                displayFilteredNotifications('disease');
            }
        });
    });
}

async function loadNotificationsPage() {
    try {
        const response = await fetch('api/notifications.php?action=list&limit=50');
        const result = await response.json();

        if (result.success) {
            allNotifications = result.data || [];
            displayAllNotifications(allNotifications);
            updateUnreadCount();
        } else {
            allNotifications = [];
            displayAllNotifications([]);
            updateUnreadCount();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        showErrorMessage('allNotificationsContainer');
        showToast('Failed to load notifications', 'warning');
    }
}

function displayAllNotifications(notifications) {
    const container = document.getElementById('allNotificationsContainer');
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-bell-slash text-muted" style="font-size: 3rem;"></i>
                <p class="mt-3 text-muted">No notifications yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = renderNotifications(notifications);
}

function displayFilteredNotifications(filter) {
    let filtered = [];
    let containerId = '';
    
    switch(filter) {
        case 'unread':
            filtered = allNotifications.filter(n => !n.is_read || n.is_read == 0);
            containerId = 'unreadNotificationsContainer';
            break;
        case 'irrigation':
            filtered = allNotifications.filter(n => n.type === 'irrigation');
            containerId = 'irrigationNotificationsContainer';
            break;
        case 'weather':
            filtered = allNotifications.filter(n => n.type === 'weather');
            containerId = 'weatherNotificationsContainer';
            break;
        case 'disease':
            filtered = allNotifications.filter(n => n.type === 'disease');
            containerId = 'diseaseNotificationsContainer';
            break;
    }
    
    const container = document.getElementById(containerId);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
                <p class="mt-3 text-muted">No ${filter} notifications</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = renderNotifications(filtered);
}

function renderNotifications(notifications) {
    let html = '<div class="timeline">';
    
    notifications.forEach(notification => {
        const isUnread = !notification.is_read || notification.is_read == 0;
        const bgClass = isUnread ? 'bg-light' : '';
        
        const typeIcon = {
            'irrigation': 'bi-droplet-fill text-primary',
            'weather': 'bi-cloud-sun-fill text-info',
            'disease': 'bi-bug-fill text-warning',
            'system': 'bi-gear-fill text-secondary'
        }[notification.type] || 'bi-info-circle-fill text-secondary';
        
        html += `
            <div class="timeline-item">
                <div class="card ${bgClass} mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="bi ${typeIcon} fs-5 me-2"></i>
                                    <h6 class="mb-0 fw-bold">${notification.title}</h6>
                                    ${isUnread ? '<span class="badge bg-primary ms-2">New</span>' : ''}
                                </div>
                                <p class="mb-2">${notification.message}</p>
                                <small class="text-muted">
                                    <i class="bi bi-clock"></i> ${formatDateTime(notification.created_at)}
                                </small>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-sm btn-link text-muted" type="button" data-bs-toggle="dropdown">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    ${isUnread ? `
                                        <li>
                                            <a class="dropdown-item" href="#" onclick="markNotificationRead(${notification.id})">
                                                <i class="bi bi-check"></i> Mark as Read
                                            </a>
                                        </li>
                                    ` : ''}
                                    <li>
                                        <a class="dropdown-item text-danger" href="#" onclick="deleteNotification(${notification.id})">
                                            <i class="bi bi-trash"></i> Delete
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

async function markNotificationRead(notificationId) {
    try {
        const response = await fetch('api/notifications.php?action=mark_read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: notificationId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Notification marked as read', 'success');
            loadNotificationsPage();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllAsRead() {
    const btn = document.getElementById('markAllReadBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Marking...';
    
    try {
        const response = await fetch('api/notifications.php?action=mark_all_read', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('All notifications marked as read', 'success');
            loadNotificationsPage();
        }
    } catch (error) {
        console.error('Error marking all as read:', error);
        showToast('Error marking notifications as read', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check-all"></i> Mark All as Read';
    }
}

async function deleteNotification(notificationId) {
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }
    
    try {
        const response = await fetch('api/notifications.php?action=delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: notificationId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Notification deleted', 'success');
            loadNotificationsPage();
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        showToast('Error deleting notification', 'danger');
    }
}

async function updateUnreadCount() {
    try {
        const response = await fetch('api/notifications.php?action=unread_count');
        const result = await response.json();

        if (result.success) {
            const badge = document.getElementById('unreadCount');
            if (badge) {
                badge.textContent = result.count;
                if (result.count > 0) {
                    badge.classList.remove('d-none');
                } else {
                    badge.classList.add('d-none');
                }
            }
        }
    } catch (error) {
        console.error('Error updating unread count:', error);
    }
}

function showErrorMessage(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                <p class="mt-3 text-muted">Failed to load notifications</p>
                <button class="btn btn-primary" onclick="loadNotificationsPage()">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                </button>
            </div>
        `;
    }
}



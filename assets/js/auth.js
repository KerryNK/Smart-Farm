// Authentication JavaScript

// Check if on login page
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('bi-eye');
        this.querySelector('i').classList.toggle('bi-eye-slash');
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        };

        // Show loading state
        loginBtn.disabled = true;
        loginBtn.querySelector('.spinner-border').classList.remove('d-none');
        loginBtn.querySelector('.btn-text').textContent = 'Logging in...';

        try {
            const response = await fetch('api/auth.php?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                showAlert('success', 'Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showAlert('danger', result.message || 'Login failed');
                resetButton();
            }
        } catch (error) {
            showAlert('danger', 'An error occurred. Please try again.');
            resetButton();
        }
    });

    function resetButton() {
        loginBtn.disabled = false;
        loginBtn.querySelector('.spinner-border').classList.add('d-none');
        loginBtn.querySelector('.btn-text').textContent = 'Login';
    }
}

// Check if on register page
if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');

    // Handle registration form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            showAlert('danger', 'Passwords do not match!');
            return;
        }

        // Validate password length
        if (password.length < 6) {
            showAlert('danger', 'Password must be at least 6 characters long!');
            return;
        }

        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: password,
            full_name: document.getElementById('full_name').value,
            phone: document.getElementById('phone').value,
            farm_location: document.getElementById('farm_location').value,
            farm_size: document.getElementById('farm_size').value
        };

        // Show loading state
        registerBtn.disabled = true;
        registerBtn.querySelector('.spinner-border').classList.remove('d-none');
        registerBtn.querySelector('.btn-text').textContent = 'Creating Account...';

        try {
            const response = await fetch('api/auth.php?action=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                showAlert('success', 'Registration successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showAlert('danger', result.message || 'Registration failed');
                resetButton();
            }
        } catch (error) {
            showAlert('danger', 'An error occurred. Please try again.');
            resetButton();
        }
    });

    function resetButton() {
        registerBtn.disabled = false;
        registerBtn.querySelector('.spinner-border').classList.add('d-none');
        registerBtn.querySelector('.btn-text').textContent = 'Create Account';
    }
}

// Show alert message
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}



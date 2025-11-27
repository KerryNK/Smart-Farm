<?php
// Main entry point - redirect to login or dashboard
session_start();

// Change destinations to .php to allow for dynamic content and session checks
$dashboard_url = '/public/index.html'; // Or dashboard.php
$login_url = '/public/login.html';

if (isset($_SESSION['user_id'])) {
    // User is logged in, send them to the main protected page.
    header('Location: ' . $dashboard_url);
} else {
    // User not logged in, send them to the page where they can log in.
    header('Location: ' . $login_url);
}
exit();
?>
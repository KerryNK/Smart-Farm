<?php
// Main entry point - redirect to login or dashboard
session_start();

if (isset($_SESSION['user_id'])) {
    // User is logged in, redirect to dashboard
    header('Location: index.html');
} else {
    // User not logged in, redirect to login page
    header('Location: login.html');
}
exit();
?>



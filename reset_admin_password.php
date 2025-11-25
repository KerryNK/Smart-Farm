<?php
// Reset Admin Password Script
// Run this once to reset the admin password to: admin123

require_once 'config/database.php';

// The password we want
$password = 'admin123';

// Hash it using the same method as registration
$hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

echo "New password hash: " . $hashedPassword . "\n\n";

// Update the database
$conn = getDBConnection();

$sql = "UPDATE users SET password = ? WHERE username = 'admin'";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $hashedPassword);

if ($stmt->execute()) {
    echo "✅ SUCCESS! Admin password has been reset.\n\n";
    echo "You can now login with:\n";
    echo "Username: admin\n";
    echo "Password: admin123\n\n";
    echo "Please delete this file after use for security.\n";
} else {
    echo "❌ ERROR: Could not update password.\n";
    echo "Error: " . $conn->error . "\n";
}

$stmt->close();
closeDBConnection($conn);
?>



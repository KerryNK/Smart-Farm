# ShambaSmart Installation Guide

This guide will walk you through setting up ShambaSmart on your local machine using XAMPP.

## 📦 Requirements

- **XAMPP** (includes Apache, MySQL, PHP)
  - Download from: https://www.apachefriends.org/
  - Version: 8.0 or higher recommended
- **Web Browser** (Chrome, Firefox, Edge, or Safari)
- **Operating System**: Windows, macOS, or Linux

## 🔽 Step 1: Install XAMPP

1. Download XAMPP from the official website
2. Run the installer
3. Select components:
   - ✅ Apache
   - ✅ MySQL
   - ✅ PHP
   - ✅ phpMyAdmin
4. Complete the installation (default location: `C:\xampp`)

## 📁 Step 2: Setup Project Files

1. **Locate your XAMPP htdocs folder**:
   - Windows: `C:\xampp\htdocs\`
   - macOS: `/Applications/XAMPP/htdocs/`
   - Linux: `/opt/lampp/htdocs/`

2. **Copy project files**:
   - Place the entire `Smart Farm` folder into `htdocs`
   - Final path should be: `C:\xampp\htdocs\Smart Farm\`

## 🗄️ Step 3: Database Setup

### Option A: Automatic Setup (Recommended)

1. **Start XAMPP Control Panel**
2. **Start Apache and MySQL** services (click "Start" buttons)
3. **Open phpMyAdmin**:
   - Go to: `http://localhost/phpmyadmin`
4. **Import Database**:
   - Click "SQL" tab at the top
   - Open the file `database/setup.sql` in a text editor
   - Copy all contents
   - Paste into the SQL query box in phpMyAdmin
   - Click "Go" button
5. **Verify**:
   - Database `shambasmart` should appear in the left sidebar
   - Check that all tables are created

### Option B: Manual Setup

1. **Create Database**:
   ```sql
   CREATE DATABASE shambasmart;
   ```

2. **Import SQL File**:
   - Click on `shambasmart` database
   - Click "Import" tab
   - Click "Choose File" and select `database/setup.sql`
   - Click "Go"

## ⚙️ Step 4: Configuration

### Verify Database Configuration

Open `config/database.php` and verify these settings:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Empty for default XAMPP
define('DB_NAME', 'shambasmart');
```

**Note**: Default XAMPP MySQL credentials:
- Username: `root`
- Password: (empty/blank)

If you changed your MySQL password, update `DB_PASS` accordingly.

## 🚀 Step 5: Launch Application

1. **Ensure XAMPP services are running**:
   - Apache: ✅ Running (green)
   - MySQL: ✅ Running (green)

2. **Open your web browser**

3. **Navigate to**:
   ```
   http://localhost/Smart%20Farm/login.html
   ```
   
   Or simply:
   ```
   http://localhost/Smart Farm/login.html
   ```

4. **Login with demo account**:
   - Username: `admin`
   - Password: `admin123`

## ✅ Step 6: Verify Installation

### Test the System

1. **Dashboard Access**:
   - After login, you should see the dashboard
   - Initially, there will be no sensor data

2. **Generate Sample Data**:
   - Click "Generate Data" button on dashboard
   - This creates sample sensor readings
   - Charts should populate with data

3. **Test Weather Forecast**:
   - Navigate to Weather page
   - Click "Generate Forecast"
   - 7-day forecast should appear

4. **Test Irrigation**:
   - Go to Irrigation page
   - Try starting irrigation manually
   - Check irrigation history

5. **Check Diseases**:
   - Visit Diseases page
   - Browse the disease database
   - View disease details

## 🔧 Troubleshooting

### Problem: "Connection failed" error

**Solution**:
- Ensure MySQL is running in XAMPP Control Panel
- Check database credentials in `config/database.php`
- Verify database `shambasmart` exists in phpMyAdmin

### Problem: Blank page or "404 Not Found"

**Solution**:
- Verify Apache is running
- Check project path: `C:\xampp\htdocs\Smart Farm\`
- Try: `http://localhost/Smart%20Farm/login.html` (with %20 for space)

### Problem: "Session error" or login not working

**Solution**:
- Clear browser cache and cookies
- Check PHP session settings in `php.ini`
- Ensure `session.save_path` is writable
- Try in incognito/private browsing mode

### Problem: SQL import fails

**Solution**:
- Check MySQL is running
- Increase `max_allowed_packet` in MySQL config
- Import in smaller chunks
- Check for syntax errors in SQL file

### Problem: Charts not showing

**Solution**:
- Generate sample data first
- Check browser console (F12) for JavaScript errors
- Verify Chart.js CDN is accessible
- Clear browser cache

### Problem: Apache won't start (Port 80 in use)

**Solution**:
- Check if IIS or Skype is using port 80
- Stop conflicting service
- Or change Apache port in `httpd.conf`:
  ```
  Listen 8080
  ```
  Then access: `http://localhost:8080/Smart Farm/login.html`

### Problem: PHP errors showing

**Solution**:
- For production, set in `php.ini`:
  ```
  display_errors = Off
  ```
- For development, keep:
  ```
  display_errors = On
  error_reporting = E_ALL
  ```

## 🔒 Security Recommendations

### For Production Use

1. **Change Default Password**:
   - Login as admin
   - Update password immediately

2. **Update Database Credentials**:
   - Set a strong MySQL root password
   - Update `config/database.php`

3. **Enable HTTPS**:
   - Install SSL certificate
   - Force HTTPS in Apache config

4. **File Permissions**:
   - Restrict write permissions
   - Protect config files

5. **Disable Error Display**:
   ```php
   display_errors = Off
   log_errors = On
   ```

## 📱 Creating Additional Users

1. **Via Registration Page**:
   - Go to `http://localhost/Smart Farm/register.html`
   - Fill in the form
   - Submit to create account

2. **Via Database** (phpMyAdmin):
   - Password must be hashed using PHP's `password_hash()`
   - Don't insert plain text passwords

## 🌐 Network Access

### Access from Other Devices (Optional)

1. **Find your computer's IP address**:
   - Windows: `ipconfig` in Command Prompt
   - macOS/Linux: `ifconfig` in Terminal

2. **Configure XAMPP**:
   - Edit `httpd.conf`
   - Allow access from network

3. **Access from another device**:
   ```
   http://YOUR_IP_ADDRESS/Smart Farm/login.html
   ```

4. **Firewall**:
   - Allow incoming connections on port 80
   - Or port 8080 if you changed it

## 📊 Database Backup

### Regular Backups

1. **Via phpMyAdmin**:
   - Select `shambasmart` database
   - Click "Export"
   - Choose format (SQL recommended)
   - Download file

2. **Via Command Line**:
   ```bash
   mysqldump -u root -p shambasmart > backup.sql
   ```

### Restore Backup

1. **Via phpMyAdmin**:
   - Select database
   - Click "Import"
   - Choose backup file
   - Click "Go"

2. **Via Command Line**:
   ```bash
   mysql -u root -p shambasmart < backup.sql
   ```

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review `README.md`
3. Check XAMPP logs:
   - Apache: `xampp/apache/logs/error.log`
   - MySQL: `xampp/mysql/data/*.err`
4. Check browser console (F12 → Console tab)
5. Verify all files are properly copied

## ✨ Next Steps

After successful installation:

1. **Explore Features**:
   - Generate sample data
   - Test all pages
   - Try different features

2. **Customize**:
   - Update user profile
   - Set farm location
   - Configure irrigation settings

3. **Add Data**:
   - Generate sensor readings regularly
   - Monitor trends
   - Test automation

4. **Learn**:
   - Read disease information
   - Check weather forecasts
   - Review irrigation tips

## 🎉 Installation Complete!

Your ShambaSmart system is now ready to use. Happy farming! 🌾

For questions or issues, refer to the main README.md file.



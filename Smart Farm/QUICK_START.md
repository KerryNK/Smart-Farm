# 🚀 ShambaSmart - Quick Start Guide

Get up and running in 5 minutes!

## 1️⃣ Installation (2 minutes)

### Prerequisites
- ✅ XAMPP installed
- ✅ Apache and MySQL running

### Setup Steps

1. **Copy files to XAMPP**
   ```
   Copy "Smart Farm" folder → C:\xampp\htdocs\
   ```

2. **Setup database**
   - Open: `http://localhost/phpmyadmin`
   - Click "SQL" tab
   - Copy contents from `database/setup.sql`
   - Paste and click "Go"

3. **Access application**
   ```
   http://localhost/Smart%20Farm/login.html
   ```

## 2️⃣ First Login (30 seconds)

**Demo Account:**
- Username: `admin`
- Password: `admin123`

Click "Login" ✅

## 3️⃣ Generate Sample Data (1 minute)

After login, you'll see the dashboard with no data.

### Generate Sensor Data
1. Click **"Generate Data"** button on dashboard
2. Wait 2 seconds
3. Dashboard will populate with sensor readings
4. Charts will show data

**Tip:** Click "Generate Data" multiple times to create more history!

### Generate Weather Forecast
1. Go to **Weather** page (navigation bar)
2. Click **"Generate Forecast"** button
3. 7-day forecast will appear
4. Rain alerts may be created

## 4️⃣ Explore Features (2 minutes)

### Dashboard
- ✅ View real-time sensor readings
- ✅ Check irrigation status
- ✅ See weather today
- ✅ Monitor all farm data

### Irrigation Control
1. Click **Irrigation** in navigation
2. Try **manual control**:
   - Set duration (30 min default)
   - Click "Start Irrigation"
   - Click "Stop Irrigation"
3. Configure **automation**:
   - Toggle "Automatic Mode"
   - Set moisture threshold (30% default)
   - Save settings

### Weather Forecast
1. Click **Weather** in navigation
2. View 7-day forecast
3. Check rain probability
4. Read farming tips

### Disease Management
1. Click **Diseases** in navigation
2. Browse disease database
3. Click on any disease to expand
4. View "Full Details" for complete info
5. Check current risk level

### Notifications
1. Click **Notifications** in navigation
2. View all system alerts
3. Filter by type
4. Mark as read or delete

## 5️⃣ Test Automation (1 minute)

### Auto Irrigation Test

1. **Enable auto mode**:
   - Go to Irrigation page
   - Toggle "Automatic Mode" ON
   - Set threshold to 40%
   - Save settings

2. **Simulate low moisture**:
   - Go to Dashboard
   - Keep clicking "Generate Data" until moisture drops below 40%
   - System will auto-start irrigation
   - You'll get a notification

### Disease Alert Test

1. Go to Dashboard
2. Click "Generate Data" repeatedly
3. When conditions are right (high humidity + right temp):
   - Disease alert appears
   - Notification created
   - Risk level updates

## 📱 Quick Navigation

| Page | URL | Purpose |
|------|-----|---------|
| Login | `/login.html` | User authentication |
| Dashboard | `/index.html` | Main overview |
| Irrigation | `/irrigation.html` | Control irrigation |
| Weather | `/weather.html` | Weather forecast |
| Diseases | `/diseases.html` | Disease info & alerts |
| Notifications | `/notifications.html` | All system alerts |
| Register | `/register.html` | Create new account |

## 🎯 Common Tasks

### Generate More Data
```
Dashboard → "Generate Data" button → Click multiple times
```

### Start Irrigation Manually
```
Irrigation → Set duration → "Start Irrigation"
```

### Check Weather
```
Weather → "Generate Forecast" (first time only) → View forecast
```

### View Disease Info
```
Diseases → Click any disease → "View Full Details"
```

### Check Notifications
```
Notifications → View alerts → Filter by type
```

## 🔧 Troubleshooting

### ❌ "No data available"
**Fix:** Click "Generate Data" button on dashboard

### ❌ "Connection failed"
**Fix:** Start MySQL in XAMPP Control Panel

### ❌ Blank page
**Fix:** Check Apache is running, verify URL spelling

### ❌ Login not working
**Fix:** 
- Username: `admin` (lowercase)
- Password: `admin123`
- Clear browser cache

### ❌ Charts not showing
**Fix:** 
- Generate data first
- Refresh page (F5)
- Clear cache

## 💡 Pro Tips

### For Best Experience

1. **Generate data regularly** - Click "Generate Data" every few minutes to see trends

2. **Enable auto-refresh** - Dashboard updates every 30 seconds automatically

3. **Check notifications daily** - Stay informed about farm conditions

4. **Review disease database** - Learn about common diseases

5. **Monitor irrigation stats** - Track water usage weekly

### Keyboard Shortcuts

- `F5` - Refresh current page
- `Ctrl + F5` - Hard refresh (clear cache)
- `F12` - Open developer console (for troubleshooting)

## 📊 Understanding the Data

### Sensor Readings

| Sensor | Good Range | Action Needed |
|--------|------------|---------------|
| Soil Moisture | 30-80% | <30%: Irrigate |
| Temperature | 15-30°C | >35°C: Provide shade |
| Humidity | 40-85% | >85%: Risk of disease |
| pH Level | 6.0-7.0 | Outside: Adjust soil |

### Alert Colors

- 🟢 **Green (Good)**: Conditions optimal
- 🟡 **Yellow (Warning)**: Monitor closely
- 🔴 **Red (Danger)**: Take action now

### Irrigation Status

- **Active** (Green): Irrigation running
- **Inactive** (Gray): System stopped
- **Auto** (Blue badge): Started automatically
- **Manual** (Gray badge): Started manually

## 🎓 Learning Path

### Day 1 - Basics
1. ✅ Login and explore dashboard
2. ✅ Generate sample data
3. ✅ Try manual irrigation
4. ✅ View weather forecast

### Day 2 - Automation
1. ✅ Configure auto irrigation
2. ✅ Test automation with low moisture
3. ✅ Review irrigation history
4. ✅ Check water usage stats

### Day 3 - Monitoring
1. ✅ Browse disease database
2. ✅ Understand disease conditions
3. ✅ Monitor risk levels
4. ✅ Read prevention tips

### Day 4 - Advanced
1. ✅ Set up scheduled irrigation
2. ✅ Analyze sensor trends
3. ✅ Review all notifications
4. ✅ Customize settings

## 🆘 Need Help?

1. **Check documentation**:
   - `README.md` - Full documentation
   - `INSTALLATION.md` - Detailed setup guide
   - `CHANGELOG.md` - Version history

2. **Review troubleshooting**:
   - See "Troubleshooting" section above
   - Check `INSTALLATION.md` troubleshooting

3. **Test with demo account**:
   - Always test features with admin account first

## ✨ What's Next?

After mastering the basics:

1. **Create your own account**:
   - Go to Register page
   - Fill in your farm details
   - Start fresh with your data

2. **Customize settings**:
   - Set your irrigation preferences
   - Configure automation thresholds
   - Set your location for weather

3. **Regular monitoring**:
   - Check dashboard daily
   - Review notifications
   - Monitor trends weekly

4. **Learn continuously**:
   - Read disease information
   - Follow farming tips
   - Understand weather patterns

## 🌟 Success Checklist

- [ ] Logged in successfully
- [ ] Generated sensor data
- [ ] Viewed dashboard with data
- [ ] Generated weather forecast
- [ ] Started irrigation manually
- [ ] Enabled automatic irrigation
- [ ] Browsed disease database
- [ ] Checked notifications
- [ ] Understood all features

## 🎉 You're Ready!

Congratulations! You now know how to use ShambaSmart.

**Remember:**
- Monitor regularly
- Act on alerts
- Learn from data
- Optimize irrigation
- Prevent diseases

**Happy Smart Farming! 🌾**

---

For detailed information, see `README.md` and `INSTALLATION.md`



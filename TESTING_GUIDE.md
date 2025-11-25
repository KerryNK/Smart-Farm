# Testing Guide - ShambaSmart Data Loading

## Quick Test Steps

### 1. Test Index.html (Dashboard)

**URL:** `http://localhost/Smart%20Farm/index.html`

**What to Check:**
- ✅ Sensor readings display (or show "No data")
- ✅ Weather forecast shows (or "Generate Forecast" message)
- ✅ Irrigation status displays correctly
- ✅ "Generate Data" button works
- ✅ "Generate Forecast" button works
- ✅ Chart renders or shows appropriate message
- ✅ Notification badge updates correctly

**Test Actions:**
1. Load page - verify all sections load
2. Click "Generate Data" - verify sensor data appears
3. Click "Generate Forecast" - verify weather updates
4. Click "Refresh" - verify data reloads
5. Wait 30 seconds - verify auto-refresh works

---

### 2. Test irrigation.html

**URL:** `http://localhost/Smart%20Farm/irrigation.html`

**What to Check:**
- ✅ Current irrigation status displays
- ✅ Start/Stop buttons work correctly
- ✅ Settings form loads and saves
- ✅ History table shows data or "No history found"
- ✅ Statistics display (with zeros if no data)
- ✅ Manual control duration input works

**Test Actions:**
1. Load page - verify status shows as "Inactive" or "Active"
2. Set duration to 15 minutes
3. Click "Start Irrigation" - verify starts successfully
4. Wait a few seconds, click "Stop Irrigation" - verify stops
5. Check history table - verify start/stop logs appear
6. Modify settings - click "Save Settings" - verify saves
7. Click "Refresh" button - verify history reloads

---

### 3. Test weather.html

**URL:** `http://localhost/Smart%20Farm/weather.html`

**What to Check:**
- ✅ 7-day forecast displays or shows "No forecast" message
- ✅ Today's weather card shows current conditions
- ✅ Rain probability bars display
- ✅ Rainfall chart renders
- ✅ Farming tips display
- ✅ Weather alerts show (if any)

**Test Actions:**
1. Load page - verify forecast loads or shows generate message
2. Click "Generate Forecast" - verify 7 days of weather appear
3. Check today's weather card - verify shows temperature and conditions
4. Scroll down - verify rainfall chart displays
5. Check farming tips - verify context-appropriate tips show
6. Verify rain probability bars show for next 3 days

---

### 4. Test diseases.html

**URL:** `http://localhost/Smart%20Farm/diseases.html`

**What to Check:**
- ✅ Disease database loads (accordion style)
- ✅ Risk assessment displays current risk level
- ✅ Environmental factors show sensor data
- ✅ Disease alerts display (if any)
- ✅ Filter by crop type works
- ✅ "View Full Details" modal works

**Test Actions:**
1. Load page - verify disease accordion displays
2. Click on a disease - verify expands to show details
3. Click "View Full Details" - verify modal opens with complete info
4. Use crop filter dropdown - select "Tomato" - verify filters work
5. Check risk assessment card - verify shows risk level
6. Check environmental factors - verify shows sensor readings
7. If alerts exist, verify they display at top

---

### 5. Test notifications.html

**URL:** `http://localhost/Smart%20Farm/notifications.html`

**What to Check:**
- ✅ All notifications display or show "No notifications yet"
- ✅ Unread count badge updates
- ✅ Filter tabs work (All, Unread, Irrigation, Weather, Disease)
- ✅ "Mark as Read" works for individual notifications
- ✅ "Mark All as Read" button works
- ✅ Delete notification works
- ✅ Refresh button works

**Test Actions:**
1. Load page - verify notifications list displays
2. Check unread count badge - verify shows correct number
3. Click "Unread" tab - verify shows only unread notifications
4. Click "Irrigation" tab - verify filters to irrigation notifications
5. Click "Weather" tab - verify filters to weather notifications
6. Click "Disease" tab - verify filters to disease notifications
7. Click "Mark All as Read" - verify all marked as read
8. Click three-dot menu on notification - click "Delete" - verify deletes
9. Click "Refresh" - verify reloads notifications

---

## Expected Data Flow

### Initial Load (No Data Scenario)
```
1. User visits any page
2. Authentication check runs
3. Page detects no data
4. Shows helpful empty state messages:
   - Dashboard: "No data" with -- values
   - Irrigation: Zero statistics, empty history
   - Weather: "Click Generate Forecast" message
   - Diseases: Displays disease database (static data)
   - Notifications: "No notifications yet"
```

### After Generating Data
```
1. User clicks "Generate Data" (dashboard) or "Generate Forecast" (weather)
2. API creates sample data
3. Page automatically refreshes display
4. Data appears in all relevant sections
5. Notifications may be created for certain events
```

### Auto-Refresh Behavior
```
1. Dashboard refreshes every 30 seconds
2. Irrigation page refreshes status every 10 seconds
3. Other pages refresh only on manual action
4. Notification badge updates across all pages
```

---

## Common Test Scenarios

### Scenario 1: Brand New User
**Steps:**
1. Register new account
2. Login
3. Visit dashboard → Should see "No data" with generate button
4. Visit irrigation → Should show inactive status, zero stats
5. Visit weather → Should show "Generate Forecast" message
6. Visit diseases → Should show disease database
7. Visit notifications → Should show "No notifications yet"

**Expected:** All pages load gracefully with empty states

---

### Scenario 2: Generate Initial Data
**Steps:**
1. On dashboard, click "Generate Data" button
2. Wait for success message
3. Verify sensor readings appear
4. Visit irrigation page
5. Verify environmental data now shows in disease page
6. Click "Generate Forecast" on dashboard
7. Visit weather page
8. Verify 7-day forecast now displays

**Expected:** Data appears immediately after generation

---

### Scenario 3: Test Irrigation Flow
**Steps:**
1. Visit irrigation page
2. Set duration to 20 minutes
3. Click "Start Irrigation"
4. Verify status changes to "Active"
5. Check notifications page
6. Verify "Irrigation Started" notification appears
7. Return to irrigation page
8. Click "Stop Irrigation"
9. Verify status changes to "Inactive"
10. Check history table
11. Verify start and stop entries appear

**Expected:** Complete irrigation cycle with proper logging

---

### Scenario 4: Test Settings Persistence
**Steps:**
1. Visit irrigation page
2. Enable "Automatic Mode"
3. Set moisture threshold to 25%
4. Set default duration to 45 minutes
5. Click "Save Settings"
6. Navigate away from page
7. Return to irrigation page
8. Verify settings are still as configured

**Expected:** Settings persist across page loads

---

### Scenario 5: Test Disease Risk Assessment
**Steps:**
1. Ensure sensor data exists (generate if needed)
2. Visit diseases page
3. Check "Current Risk Level" card
4. Verify shows risk assessment based on sensor data
5. Check "Environmental Factors" card
6. Verify shows latest sensor readings
7. Filter diseases by crop type
8. Verify list updates correctly

**Expected:** Risk assessment reflects current conditions

---

## Browser Console Checks

Open Developer Tools (F12) → Console tab

### ✅ Should See:
- No red error messages
- Authentication confirmation
- Data loading confirmations
- API response logs (if in debug mode)

### ❌ Should NOT See:
- "Uncaught TypeError"
- "Cannot read property of undefined"
- "Failed to fetch" (unless intentionally testing error handling)
- "404 Not Found" errors
- CORS errors

---

## Network Tab Checks

Open Developer Tools (F12) → Network tab

### ✅ Verify:
- All API calls return 200 status (or 401 if not logged in)
- Responses contain proper JSON data
- No 404 or 500 errors
- API calls complete in reasonable time (< 1 second)

### Common API Endpoints to Monitor:
- `api/auth.php?action=check`
- `api/sensors.php?action=latest`
- `api/irrigation.php?action=status`
- `api/weather.php?action=forecast&days=7`
- `api/diseases.php?action=list`
- `api/notifications.php?action=list`

---

## Troubleshooting

### Problem: "Loading..." shows indefinitely
**Solution:** 
- Check browser console for errors
- Verify API endpoints are responding
- Check database connection
- Clear browser cache and reload

### Problem: "Unauthorized" error
**Solution:**
- Clear cookies
- Login again
- Check session in PHP

### Problem: No data appears after generating
**Solution:**
- Check browser console
- Verify database tables exist
- Check API responses in Network tab
- Verify PHP errors in server logs

### Problem: Chart doesn't render
**Solution:**
- Verify Chart.js library loaded
- Check console for canvas errors
- Ensure data array is not empty
- Check canvas element exists in HTML

### Problem: Buttons don't work
**Solution:**
- Check console for JavaScript errors
- Verify event listeners are attached
- Ensure currentUser is defined
- Check API endpoints are correct

---

## Success Criteria

✅ **All pages must:**
1. Load without JavaScript errors
2. Display data when available
3. Show appropriate empty states when no data
4. Handle API errors gracefully
5. Provide user feedback for actions
6. Maintain responsive design
7. Work in Chrome, Firefox, Edge, Safari

✅ **User must be able to:**
1. Navigate between all pages
2. Generate sample data
3. Start/stop irrigation
4. View weather forecasts
5. Browse disease database
6. Manage notifications
7. Update settings
8. See real-time updates

---

## Final Checklist

Before considering testing complete, verify:

- [ ] Login and authentication work
- [ ] Dashboard loads and displays all sections
- [ ] Irrigation control panel fully functional
- [ ] Weather forecast generation works
- [ ] Disease database displays properly
- [ ] Notifications load and can be managed
- [ ] All buttons perform their intended actions
- [ ] All forms save data correctly
- [ ] Auto-refresh works on dashboard
- [ ] No console errors on any page
- [ ] All API endpoints respond correctly
- [ ] Empty states display appropriately
- [ ] Error messages show for failures
- [ ] Navigation between pages works
- [ ] User can logout successfully

---

## Performance Benchmarks

**Expected Load Times:**
- Initial page load: < 2 seconds
- API response time: < 500ms
- Data refresh: < 1 second
- Button actions: Immediate feedback
- Modal opens: Instant

**Browser Support:**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

**Mobile Support:**
- Responsive design works on tablets
- Touch interactions function properly
- No horizontal scrolling required

---

## Contact & Support

If you encounter issues during testing:
1. Document the error message
2. Note which page and action caused it
3. Check browser console for details
4. Review network tab for API failures
5. Check PHP error logs if available

All improvements have been implemented to ensure robust data loading across the entire application.


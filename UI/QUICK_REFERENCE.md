# Sailing AI - Quick Reference Card
## One-Page Guide for All Features

---

## 🚀 Quick Start

### 1. **Login/Register**
- Email & password authentication
- Navigate to register if new user
- Select "Sign In" or "Create Account"

### 2. **Plan Route** (⛵ Sailing Tab)
- Enter start point (GPS/Map/Manual)
- Enter end point
- Enter wind data
- Tap "Plan Route"

### 3. **Manage Waypoints** (🗺️ Route Tab)
- Add/edit waypoints
- Set sail configuration per waypoint
- Export as GPX/KML/CSV
- Save to profile

### 4. **Monitor Weather** (🌤️ Weather Tab)
- Enable monitoring
- Set wind/wave thresholds
- Configure notifications
- Monitor active alerts

---

## 📱 Tab Guide

| Tab | Screen | Main Features |
|-----|--------|---------------|
| ⛵ | Sailing | Route planning, weather, recommendations |
| 🗺️ | Route | Waypoint management, export/import |
| 🧭 | Polar | Sail performance analysis |
| 🌤️ | Weather | Alert configuration, monitoring |
| 👤 | Profile | Account info, features list |
| ⚙️ | Settings | API keys, export format |

---

## 💨 Wind & Sailing Terms

| Term | Meaning | Range |
|------|---------|-------|
| TWA | True Wind Angle | 0-360° (angle to wind) |
| AWA | Apparent Wind Angle | 0-360° (from boat perspective) |
| COG | Course Over Ground | 0-360° (actual direction traveling) |
| SOG | Speed Over Ground | knots (actual speed) |
| Knots | Speed unit | 1 nm/hour |

---

## 📍 Coordinate Formats

**Decimal:** `25.7617, -80.1918`

**DMS:** `25°45.7'N, 80°11.5'W`

**Location Name:** `Miami` (geocoded)

**Required:** Latitude range -90°...+90°, Longitude range -180°...+180°

---

## 🪁 Sail Configurations

| Config | Use Case | Wind Range |
|--------|----------|------------|
| Main + Jib | Standard cruising | 5-20 kts |
| Main + Genoa | Light wind | 3-10 kts |
| Asymmetrical | Downwind | 8-20 kts |
| Spinnaker | Broad reach/downwind | 10-25 kts |
| Code Zero | Very light wind | 2-8 kts |
| Storm Jib + Reefed Main | Heavy wind | 20-35+ kts |
| Engine | Calm/light wind | <3 kts |

---

## ⚠️ Alert Types & Thresholds

| Alert Type | Default | When Triggered |
|------------|---------|-----------------|
| High Wind | 35 kts | Exceeds max wind |
| Large Waves | 3 m | Exceeds max wave height |
| Storm | - | Storm detected on route |
| Night Arrival | - | ETA after sunset |
| Low Wind | 3 kts | Below engine threshold |

---

## 🗺️ Features by Tab

### ⛵ **Sailing Tab**
```
Route Planning
  ├─ Start Point (GPS/Map/Manual)
  ├─ End Point (Map)
  └─ Start Date (YYYY-MM-DD)

Wind & Weather
  ├─ Wind Speed (knots)
  ├─ True Wind Angle (°)
  └─ Get Forecast (Windy.com)

Route Options
  ├─ Plan Route (generates waypoints)
  ├─ Load Simulation (demo route)
  ├─ Simulation Toggle (Real/Sim)
  └─ Start/Stop Simulation (advance hour)

Map View (with zoom/pan)
Sail Recommendations
Waypoint Details
```

### 🗺️ **Route Tab**
```
Route Statistics
  ├─ Total Distance
  ├─ Avg Wind Speed
  ├─ Max Wind Speed
  ├─ Avg Waves
  └─ Max Waves

Waypoint Management
  ├─ Add Waypoint (+)
  ├─ Edit Waypoint (tap card)
  ├─ Delete Waypoint (✕)
  ├─ Reorder (↑↓)
  ├─ Show Times/Distances
  ├─ Show Wind Data
  ├─ Show Sail Config
  └─ Show ETA

File Operations
  ├─ Import GPX
  └─ Export (GPX/KML/CSV)
```

### 🧭 **Polar Tab**
```
Engine Settings
  └─ Wind Threshold (3 kts)

Diagram Controls
  ├─ Wind Speed Slider
  └─ TWA Input (°)

Output
  ├─ Interactive Polar Chart
  ├─ Current Position Marker
  └─ Performance Values
```

### 🌤️ **Weather Tab**
```
Monitoring Control
  └─ Enable/Disable Toggle

Configuration
  ├─ Interval (4 hrs)
  ├─ Forecast Days (3)
  ├─ Max Wind (35 kts)
  ├─ Max Waves (3 m)
  ├─ Avoid Storms (toggle)
  └─ Daylight Arrival (toggle)

Alerts
  ├─ Last Check Time
  ├─ Active Alerts List
  ├─ Alert Details
  └─ Acknowledgment

Notifications
  ├─ Push (enabled)
  ├─ SMS (with phone)
  └─ Email (with email)
```

### 👤 **Profile Tab**
```
User Info
  ├─ Avatar (initial)
  ├─ Name
  ├─ Email
  └─ User ID

Account Details
  ├─ Email
  └─ Name

Features
  ├─ Real-time Recommendations ✓
  ├─ Route Planning ✓
  ├─ Weather Monitoring ✓
  ├─ Cloud Sync ✓
  ├─ GPX Import/Export ✓
  └─ Polar Analysis ✓

Sign Out Button
```

### ⚙️ **Settings Tab**
```
Windy.com API
  ├─ Paste API Key
  ├─ Validate (tests connection)
  ├─ Save (encrypt & store)
  ├─ Clear (remove key)
  └─ Status (✓ valid / ✗ invalid)

Export Format
  ├─ GPX (default, most compatible)
  ├─ KML (Google Earth)
  ├─ KMZ (compressed)
  └─ CSV (spreadsheet)
```

---

## 🎯 Common Workflows

### **Planning a Route**
1. Tap ⛵ Sailing tab
2. Enter "Starting Point" (use GPS or Map button)
3. Enter "End Point" (use Map button)
4. Enter wind speed/angle OR tap "Get Wind Forecast"
5. Tap "Plan Route"
6. Review waypoints in Route tab
7. Adjust if needed
8. Export as GPX

### **Adding a Waypoint**
1. Go to 🗺️ Route tab
2. Tap "+ Add Waypoint"
3. Enter name, lat, lon
4. Select sail config or engine
5. Tap "Save"
6. Route auto-calculates times

### **Setting Up Alerts**
1. Go to 🌤️ Weather tab
2. Tap toggle to enable
3. Adjust thresholds (wind, waves)
4. Enter phone/email for SMS/Email alerts
5. Toggle notification channels
6. Save auto-applies

### **Getting Sail Recommendations**
1. Go to ⛵ Sailing tab
2. Enter wind speed
3. Enter true wind angle
4. View sail config in "Sail Recommendations"
5. Or check 🧭 Polar diagram for details

### **Analyzing Performance**
1. Go to 🧭 Polar tab
2. Enter current wind speed
3. Adjust TWA slider
4. View speed at different angles
5. Compare with route waypoints

---

## 🔑 Keyboard Shortcuts (Desktop)

| Action | Desktop | Mobile |
|--------|---------|--------|
| Next Field | Tab | Swipe Right |
| Submit | Enter | Tap Button |
| Close Modal | Esc | Tap X |
| Zoom Map | +/- | Pinch |
| Pan Map | Arrows | Drag |

---

## 📊 Data Inputs Quick Reference

| Input | Format | Example | Range |
|-------|--------|---------|-------|
| Latitude | Decimal | 25.7617 | -90 to 90 |
| Longitude | Decimal | -80.1918 | -180 to 180 |
| Date | YYYY-MM-DD | 2026-03-31 | Any future date |
| Wind Speed | Knots | 12 | 0-50+ |
| Angle | Degrees | 45 | 0-360 |
| Time | HH:MM | 14:30 | 00:00-23:59 |
| Phone | Format | +1-555-0123 | Valid number |
| Email | Format | user@example.com | Valid email |

---

## 🎨 UI Responsiveness

```
Mobile (<600px)
├─ Single column
├─ Stacked sections
├─ Large buttons (44px)
└─ Full-width inputs

Tablet (600-900px)
├─ Two columns
├─ Side-by-side sections
├─ Medium buttons (48px)
└─ Optimized spacing

Desktop (>900px)
├─ Multi-column grid
├─ Efficient layout
├─ Small buttons
└─ Full responsive design
```

---

## 🚨 Troubleshooting Quick Guide

| Issue | Solution |
|-------|----------|
| Can't login | Check internet, verify email/password |
| Weather not loading | Validate Windy API key in Settings |
| GPS not working | Enable location permissions, wait for lock |
| Route won't export | Check storage space, try different format |
| Simulation won't start | Plan route first, check coordinates valid |
| Map button not working | Enter starting point first |

---

## 📈 Performance Tips

✓ Plan routes with realistic wind speeds  
✓ Set weather thresholds for your boat  
✓ Export routes as backup  
✓ Update Windy API key regularly  
✓ Close app if unresponsive  
✓ Keep storage space available  
✓ Use GPS when planning for accuracy  

---

## 📚 Resources

**API Setup:** https://www.windy.com/  
**GPX Format:** https://www.topografix.com/gpx.asp  
**Coordinate Formats:** DDM (Degrees Decimal Minutes)  
**Wind Terms:** Common sailing terminology  

---

## 🔐 Data Privacy

- Emails: Encrypted storage
- Routes: Local device + cloud sync
- API Keys: Encrypted in AsyncStorage
- Location: Only used when activated
- Credentials: Secure authentication

---

## 📱 Navigation Map

```
Login/Register Screen
        ↓
===== MAIN APP (6 Tabs) =====
⛵ Sailing → Plan routes
🗺️ Route → Edit waypoints
🧭 Polar → Analyze performance
🌤️ Weather → Set alerts
👤 Profile → View account
⚙️ Settings → Configure API
```

---

**Quick Version:** 1.0  
**Last Updated:** March 31, 2026  
**Status:** Ready to Use

---

## 💡 Pro Tips

1. **Use Map buttons** for visual location selection
2. **Enable daylight arrival** for safer navigation
3. **Review polar diagram** before new weather
4. **Export routes** as backup before sailing
5. **Set conservative thresholds** for weather alerts
6. **Check Windy forecast** for accuracy before departing
7. **Use simulation mode** to test routes safely
8. **Keep API key updated** for current weather
9. **Save frequent routes** to quickly re-plan
10. **Configure phone alerts** for critical weather

---

**Need Help?** Check USER_GUIDE.md for detailed documentation  
**Want Details?** See SCREEN_REFERENCE.md for all features  
**Building Apps?** Review COMPONENTS_REFERENCE.md for developers

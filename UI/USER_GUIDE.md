# Sailing AI - Complete User Guide
## Lagoon 440 Navigation Assistant

**Version:** 1.0.0  
**Last Updated:** March 31, 2026

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Screen Overview](#screen-overview)
3. [Sailing Screen](#sailing-screen)
4. [Route Management Screen](#route-management-screen)
5. [Polar Diagram Screen](#polar-diagram-screen)
6. [Weather Monitor Screen](#weather-monitor-screen)
7. [Profile Screen](#profile-screen)
8. [Settings Screen](#settings-screen)
9. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### Login Screen

**Purpose:** Authenticate with your Sailing AI account

**Features:**
- 📧 Email-based authentication
- 🔐 Secure password login
- Account creation option

**How to Use:**
1. Enter your email address
2. Enter your password
3. Tap "Sign In"
4. On first use, tap "Create Account" to register

**Important Notes:**
- Email must be valid format (e.g., user@example.com)
- Password must be at least 6 characters
- Account credentials are securely stored

---

### Registration Screen

**Purpose:** Create a new Sailing AI account

**Required Information:**
- 👤 Full Name
- 📧 Email Address
- 🔐 Password (minimum 6 characters)
- ✓ Confirm Password

**How to Use:**
1. Enter your full name
2. Enter a valid email address
3. Create a password (at least 6 characters)
4. Confirm your password
5. Tap "Create Account"
6. You'll be automatically logged in after registration

**Validation Rules:**
- Name: Required, any text
- Email: Must be valid format
- Password: Minimum 6 characters, must match confirmation

---

## Screen Overview

The main application has 6 tabs accessible from the bottom navigation:

| Tab | Name | Function |
|-----|------|----------|
| ⛵ | Sailing | Route planning, weather, sailing recommendations |
| 🗺️ | Route | Waypoint management, route editing, export |
| 🧭 | Polar | Polar diagram analysis, sail configuration |
| 🌤️ | Weather | Weather monitoring and alert configuration |
| 👤 | Profile | User account information and features |
| ⚙️ | Settings | API configuration and app preferences |

---

## Sailing Screen

**Purpose:** Plan sailing routes, get wind recommendations, and perform route simulations

### Section 1: Route Planning

#### Starting Point Input
**Description:** Define your departure location

**Input Methods:**
1. **Manual Coordinates:** Enter lat/lon in decimal (25.7617, -80.1918) or DMS format (25°45.7'N, 80°11.5'W)
2. **GPS Button:** Use current GPS location (requires location permission)
3. **Map Button:** Open Google Maps to select location visually

**Buttons:**
- **?** - Show coordinate format help
- **GPS** - Use current device location
- **Open Map** - Launch Google Maps for location selection

#### End Point Input
**Description:** Define your sailing end point

**Input Methods:**
- Same as Starting Point
- Can use "Open Map" to select end point on map

**Key Fields:**
- `End Point` - Main end coordinates
- `Parsed coordinates` - Shows interpreted location

#### Start Date
**Description:** Set planned departure date

**Format:** YYYY-MM-DD (e.g., 2026-03-31)

**Purpose:** Used for weather forecasting and route planning calculations

#### Reverse Route Button
**Function:** Swap start and end point coordinates

**Useful For:** Planning return routes quickly

---

### Section 2: Sailing Data Input

#### Wind Data
**Wind Speed (knots)**
- Range: 0-50 knots recommended
- Default: 10 knots
- Used in sail configuration recommendations

**True Wind Angle (degrees)**
- Range: 0-360°
- Default: 90° (beam reach)
- Angle between boat heading and true wind direction

**Get Wind Forecast Button:**
- Fetches real-time data from Windy.com
- Requires valid Windy API key (set in Settings)
- Updates wind speed and displays:
  - Current wind speed
  - Wind direction
  - Gust speed
  - Wave height

---

### Section 3: Route Corridor Weather

**When Displayed:** After planning a route

**Information Shown:**
- 🌊 Wave heights along corridor
- 💨 Wind speeds at waypoints
- 🌊 Current speeds and directions
- ⚠️ Weather alerts and warnings

**Data Source:** Windy.com API (with valid API key)

---

### Section 4: Route Planning & Simulation

#### Plan Route Button
**Function:** Generate optimal sailing route between points

**Requirements:**
- Valid start and end point coordinates
- Wind speed input
- True wind angle input

**Output:**
- List of waypoints
- Estimated sailing time
- Recommended sail configurations
- Weather information at each waypoint

#### Simulation Controls

**Load Simulation Route:**
- Pre-loads a demo route (Bermuda)
- Useful for testing features

**Toggle Simulation/Real GPS:**
- Simulation Mode: Shows non-real GPS tracking
- Real GPS Mode: Uses actual device location

**Start/Stop Simulation:**
- Advances route simulation hour by hour
- Shows simulated weather conditions
- Updates storm alerts
- Displays position on route map

#### Simulation Status Display
**Shows During Simulation:**
- 📅 Current day
- ⏰ Current hour
- 💨 Wind speed and direction
- 🌊 Wave height
- ⚠️ Weather conditions (calm, rough, storm)

---

### Section 5: Sail Recommendations

#### Automatic Calculation
**Triggered When:**
- Wind speed is entered
- True wind angle is entered

**Output Includes:**
- 🪁 Sail configuration (Main+Jib, Asymmetrical, etc.)
- 📊 Expected boat speed
- ⚙️ Trim recommendations
- 💪 Reefing suggestions for high winds

---

### Section 6: Route Actions

**Save Route to Profile:**
- Available after planning route
- Stores route in your account
- Can be loaded later

**Load Saved Routes Modal:**
- View previously saved routes
- Re-plan routes using saved waypoints
- Delete saved routes

---

## Route Management Screen

**Purpose:** Detailed route editing, waypoint management, and file operations

### Waypoint Management

#### Add Waypoint
**Steps:**
1. Tap "+ Add Waypoint" button
2. Enter waypoint name
3. Enter latitude and longitude
4. Choose sail configuration or engine mode
5. Tap "Save"

**Waypoint Fields:**
- 📍 Name (e.g., "Bermuda North")
- 📐 Latitude (e.g., 32.2949)
- 📐 Longitude (e.g., -64.7814)
- ⚙️ Engine Mode Toggle (gas engine vs. sails)
- 🪁 Sail Configuration (if not using engine)

#### Waypoint Card Information

Each waypoint displays:

**Header Section:**
- Waypoint number
- Location name
- Coordinates in DDM format
- Mode indicator (⛵ sail / ⚙️ engine)

**Data Grid (4 rows of metrics):**

*Row 1 - Time & Distance:*
- Total Time - Cumulative sailing time
- Leg Time - Time to this waypoint
- Total Distance - From start
- Leg Distance - To this waypoint

*Row 2 - Navigation:*
- Heading - Direction to waypoint
- Speed - Expected boat speed
- COG - Course over ground
- SOG - Speed over ground

*Row 3 - Wind Data:*
- Wind Speed - Expected conditions
- Wind Direction
- TWA - True wind angle
- AWA - Apparent wind angle

*Row 4 - Current:*
- Current Speed
- Current Direction
- Mode (Engine/Sail)
- Sail Configuration

**Sail Config Box:**
- Shows active sail configuration
- Displays trim angle relative to apparent wind

**ETA Box:**
- Estimated arrival time
- 🌙 Night arrival warning if applicable

**Warning Box:**
- Shows daylight arrival conflicts
- Alert icon for timing issues

#### Waypoint Actions

**↑ Up Arrow:**
- Move waypoint earlier in route
- Disabled for first waypoint

**↓ Down Arrow:**
- Move waypoint later in route
- Disabled for last waypoint

**✎ Edit:**
- Opens waypoint modal to modify
- Can change coordinates, name, mode

**✕ Delete:**
- Removes waypoint from route
- Confirmation required

---

### Route Statistics Panel

Displays when route has waypoints:
- **Total Distance:** Sum of all legs (nm)
- **Avg Wind:** Average wind speed along route
- **Max Wind:** Maximum wind encountered
- **Avg Waves:** Average wave height
- **Max Waves:** Highest waves expected

---

### Route Operations

#### Import GPX
**Function:** Load route from GPX file

**Steps:**
1. Tap "Import GPX"
2. Select .gpx file from device
3. Waypoints are automatically extracted
4. Route ready for viewing/editing

**Supported Format:** Standard GPS Exchange Format (.gpx)

#### Export Route
**Function:** Save route to device in multiple formats

**Supported Formats:**
- GPX - GPS Exchange Format
- KML - Keyhole Markup Language
- KMZ - Compressed KML
- CSV - Comma Separated Values

**Filename Format:**
- `Route_[Start]_to_[End]_[Date].ext`
- Example: `Route_25.76_-80.19_to_32.29_-64.78_2026-03-31.gpx`

**Export Dialog:**
- Confirm export format (set in Settings)
- File is generated and saved to device storage
- Share via email, cloud storage, etc.

---

## Polar Diagram Screen

**Purpose:** Analyze sail performance in different wind conditions

### Engine Activation Settings

**Wind Speed Threshold:**
- Default: 3 knots
- When wind drops below this, engine auto-activates
- Used in route planning calculations
- Adjustable via "Save" button

**Description:** "When wind speed falls below this threshold, the engine will be automatically activated during route planning."

---

### Polar Diagram Controls

#### Input Parameters

**Wind Speed (knots):**
- Current wind condition
- Range: 0-50+ knots
- Default: 12 knots

**Current TWA (degrees):**
- True Wind Angle - direction relative to bow
- Range: 0-360°
- Default: 90° (beam reach)

**Current Speed (knots):**
- Display only field
- Shows boat's expected speed
- Calculated based on other inputs

---

### Polar Chart Visualization

**Chart Type:** Interactive polar diagram

**Shows:**
- Boat speed capabilities at different angles
- Wind speed contours
- True wind angle from center (0-360°)
- Speed arcs (5kts, 10kts, 15kts, etc.)

**Current Position Marker:**
- Red dot shows your current sailing angle
- Intersection with speed curve shows expected speed

**Interactive:**
- Can adjust wind speed, TWA to see real-time changes
- Tap "View Details" for technical information

---

### Quick Reference

Common sailing scenarios with expected boat speeds:
- Upwind (close-hauled, 45° TWA)
- Beam Reach (90° TWA)
- Downwind (180° TWA)
- Running before wind (upwind vs downwind variations)

---

## Weather Monitor Screen

**Purpose:** Continuous weather monitoring along planned route with alert configuration

### Monitoring Configuration

#### Enable/Disable Monitoring
**Toggle Switch:** Activate continuous weather monitoring

**Prerequisites:**
- Active route must exist (exported from Sailing tab)
- GPS location enabled
- Weather monitoring needs active route to function

#### Monitoring Interval
**Setting:** How often to check weather

**Default:** Every 4 hours

**Options:** 1-24 hours

#### Forecast Period
**Setting:** Days ahead to forecast

**Default:** 3 days

#### Weather Thresholds

**Maximum Wind Speed:**
- Alert triggers when exceeded
- Default: 35 knots
- Typical warning threshold for small craft

**Maximum Wave Height:**
- Alert triggers when exceeded
- Default: 3 meters
- Safety limit for boat capabilities

---

### Safety Features

#### Avoid Storms
**Toggle:** Enable/Disable storm avoidance

**When Active:**
- Alerts on storm detection
- May suggest route modifications
- Marks danger zones on map

#### Ensure Daylight Arrival
**Toggle:** Require daytime port arrival

**When Active:**
- Calculates estimated arrival time
- Alerts if arriving after sunset
- Can adjust in Settings

**Arrival Time Window:**
- Start Hour: 6 (6:00 AM default)
- End Hour: 17 (5:00 PM default)
- Any arrival outside this window triggers alert

---

### Notification Preferences

#### Notification Channels

**Push Notifications:** ✓ Enabled by default
- Instant alerts on device

**SMS Notifications:** (Requires phone number)
- Add phone number to receive text alerts
- Toggle to enable/disable

**Email Notifications:** (Requires email)
- Add email address to receive alert emails
- Toggle to enable/disable

#### Contact Information
- Phone Number: Enter for SMS alerts
- Email: Enter for email alerts

---

### Active Monitoring Status

**Last Check Time:**
- Shows when weather was last checked
- Updates based on monitoring interval

**Active Alerts:**
- Lists current weather alerts
- Color-coded by severity
- Shows affected waypoint and conditions

#### Alert Information
Each alert displays:
- ⚠️ Alert type (storm, high wind, waves)
- 📍 Location affected
- 💨 Wind/wave conditions
- ⏰ Duration or forecast

**Acknowledgment Required:**
- User confirms understanding of alert
- Auto-closes after timeout if not acknowledged

---

## Profile Screen

**Purpose:** View account information and app features

### User Information

**Avatar:** Large initial of your name (first letter)

**User Details:**
- Name: From account registration
- Email: Your account email

---

### Account Information Section

| Field | Description |
|-------|-------------|
| User ID | Unique identifier (shown as N/A if not displayed) |
| Email | Associated email address |
| Name | Full name on account |

---

### Application Info

**Application Name:** Sailing AI

**Description:** Lagoon 440 Navigation Assistant

**Version:** 1.0.0

---

### Your Features

All available features in your account:

✓ **Real-time Sailing Recommendations**
- Instant sail configuration suggestions based on wind

✓ **Automated Route Planning**
- AI-powered route generation with waypoint optimization

✓ **Weather Monitoring & Alerts**
- Continuous monitoring with storm/hazard warnings

✓ **Cloud Sync & Storage**
- Routes and settings synchronized across devices

✓ **GPX Import/Export**
- Full compatibility with standard navigation formats

✓ **Polar Diagram Analysis**
- Dynamic sail performance analysis tool

---

### Sign Out

**Button:** "Sign Out"

**Confirmation:** Required to prevent accidental logout

**Effect:** Returns to login screen, clears session

---

## Settings Screen

**Purpose:** Configure API keys and application preferences

### Windy.com API Configuration

#### About Windy.com
Real-time weather and wind data provider

**Get API Key:**
1. Visit: https://www.windy.com/
2. Sign up for free account
3. Navigate to API section
4. Generate API key
5. Copy key

#### API Key Management

**Enter API Key:**
- Text input field for Windy API key
- Field is hidden after saving

**Validate API Key:**
1. Enter your API key
2. Tap "Validate API Key"
3. System tests connection with sample location (Miami)
4. Success shows real wind conditions from Miami

**Validation Feedback:**
- ✓ Valid: Green confirmation, shows sample data
- ✗ Invalid: Red error, check key format
- Shows real conditions if valid (e.g., "Wind: 8.5 kts, Waves: 0.5 m")

**Save API Key:**
1. Paste or type API key
2. Tap "Save"
3. Key is encrypted and stored locally
4. Input cleared after successful save

**Retrieve Saved Key:**
- Tap input field after saving to view saved key

**Clear API Key:**
1. Tap "Clear"
2. Confirm deletion
3. Must re-enter key to use Windy features again

---

### Route Export Format

**Select Default Format:**
- **GPX** (GPS Exchange Format) - Most compatible
- **KML** (Keyhole Markup Language) - Google Earth
- **KMZ** (Compressed KML) - Smaller file size
- **CSV** (Comma Separated Values) - Spreadsheet compatible

**Default:** GPX

**Usage:** Selected format used when exporting routes from Route Management tab

**Details for Each Format:**

| Format | File Size | Compatibility | Best For |
|--------|-----------|---------------|----------|
| GPX | Medium | All GPS devices | General use |
| KML | Small-Medium | Google Earth, Maps | Visual mapping |
| KMZ | Smallest | Compressed archives | Email/storage |
| CSV | Smallest | Spreadsheets | Analysis |

---

### Application Features Summary

- 📍 Multi-point route planning
- 🌩️ Real-time weather integration
- 📱 Responsive design (mobile/tablet/desktop)
- 🔐 Secure authentication
- ☁️ Cloud storage (future)
- 📊 Performance analytics

---

## Tips & Tricks

### Efficient Route Planning

1. **Use GPS Button:** Quick way to set current location as start point
2. **Map Integration:** Visual selection is faster than typing coordinates
3. **Save Frequent Routes:** Store routes you sail regularly
4. **Check Wind First:** Get Windy forecast before planning route

### Weather & Safety

1. **Monitor Regularly:** Check Weather Monitor tab before departure
2. **Set Conservative Thresholds:** Prefer safety over speed
3. **Daylight Arrival:** Enable to avoid night navigation stress
4. **Storm Alerts:** Enable notifications for critical weather

### Sail Configuration

1. **Review Polar Diagram:** Understand boat capabilities before sailing
2. **Use Recommendations:** Follow sail config suggestions from route planning
3. **Document Tweaks:** Note any modifications you make to configurations
4. **Reference Wind Angle:** Check True Wind Angle for trim adjustments

### Route Management

1. **Test Import:** Import sample GPX files to practice workflow
2. **Export Backups:** Keep backup copies of routes as GPX files
3. **Use Labels:** Name waypoints clearly (e.g., "Bermuda North Harbor")
4. **Review Statistics:** Check average wind/waves before departure

### Performance Tips

1. **Clear Old Routes:** Delete routes you no longer need
2. **Update Settings:** Keep Windy API key current
3. **Check Location:** Verify GPS accuracy before critical decisions
4. **Restart if Issues:** Close and reopen app if unresponsive

---

## Troubleshooting

### Can't Login
- ✓ Check internet connection
- ✓ Verify email and password
- ✓ Reset password via registration (if available)
- ✓ Clear app cache and try again

### Weather Data Not Loading
- ✓ Check Windy API key in Settings
- ✓ Validate API key (tap "Validate")
- ✓ Check internet connection
- ✓ Ensure coordinates are in valid range

### GPS Not Working
- ✓ Check location permissions in app settings
- ✓ Enable location services on device
- ✓ Wait for GPS lock (can take 30-40 seconds)
- ✓ Try outdoor for better signal

### Routes Not Saving
- ✓ Check available device storage
- ✓ Ensure app has storage permissions
- ✓ Try exporting in different format (GPX as default)

### Simulation Not Starting
- ✓ Must have a planned route first
- ✓ Check "Load Simulation Route" to use demo
- ✓ Ensure coordinates are valid

---

## Support & Contact

**Application:** Sailing AI v1.0.0
**For Lagoon 440 Sailboats**
**Made with ❤️ for sailors**

© 2025 Sailing AI. All rights reserved.

---

## Appendix: Keyboard Shortcuts & Controls

### Desktop Navigation
- **Tab Key:** Cycle through input fields
- **Enter:** Submit forms
- **Escape:** Close modals

### Mobile Gestures
- **Swipe Right:** Open navigation menu
- **Long Press:** Copy coordinate text
- **Pinch:** Zoom on maps

### Responsive Design
- **Mobile** (<600px): Single column, stacked sections
- **Tablet** (600-900px): Two columns, side-by-side
- **Desktop** (>900px): Full responsive layout

---

**Last Updated:** March 31, 2026  
**Version:** 1.0.0  
**Status:** Production

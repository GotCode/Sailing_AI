# Screen Reference Guide
## Quick Overview of All Application Screens

---

## 🔐 Authentication Screens

### Login Screen
**Location:** First screen when not authenticated

**Key Functions:**
- User authentication via email/password
- Navigation to registration screen
- Shows app features and benefits

**Main Buttons:**
- "Sign In" - Authenticate user
- "Create Account" - Go to registration

**Validation:**
- Email format validation
- Password required field

---

### Register Screen
**Location:** Accessed from Login screen

**Key Functions:**
- Create new user account
- Validate user information
- Auto-login after registration

**Main Buttons:**
- "Create Account" - Register new user
- "Back to Login" - Return to login

**Required Fields:**
- Full Name
- Email Address
- Password (min 6 chars)
- Confirm Password

**Validation Rules:**
- Name: Non-empty text
- Email: Valid format (user@example.com)
- Password: Minimum 6 characters, must match confirmation

---

## 📱 Main Application Screens

### 1. ⛵ Sailing Screen (SailingScreenEnhanced)

**Location:** Tab 1 - Main navigation

**Primary Purpose:** Route planning, weather data management, sailing recommendations

#### Major Sections:

**A. Route Planning**
- Starting Point input (GPS, Manual, Map)
- End Point input (Map selection)
- Start Date (YYYY-MM-DD format)
- Reverse Route button
- Save Route to Profile option

**B. Sailing Data**
- Wind Speed input (knots)
- True Wind Angle input (degrees)
- Get Wind Forecast button (Windy.com)
- Wind forecast display (speed, direction, gusts)

**C. Route Planning & Simulation**
- Plan Route button → generates waypoints
- Load Simulation Route (demo)
- Simulation toggle (Real GPS vs. Simulation)
- Start/Stop Simulation buttons
- Simulation status display

**D. Map View**
- Visual route representation
- Waypoint markers
- Storm/hazard locations
- Current position indicator
- Zoom controls

**E. Waypoint Details**
- Expandable waypoint cards
- Weather information at each point
- Tide/current data
- Sail configuration

**F. Sail Recommendations**
- Automatic sail config calculation
- Expected boat speed
- Trim recommendations

**Key Features:**
- ✓ Responsive design (mobile/tablet/desktop)
- ✓ Google Maps integration
- ✓ Consolidated "Open Map" button
- ✓ Real-time weather fetch
- ✓ Simulation with storm alerts

**Data Inputs Required:**
- Coordinates (decimal or DMS format)
- Wind speed and angle
- Sailing mode preference

**Outputs:**
- Route waypoints with times
- Sail configuration recommendations
- Weather forecasts
- Navigation guidance

---

### 2. 🗺️ Route Screen (RouteScreenEnhanced)

**Location:** Tab 2 - Navigation

**Primary Purpose:** Detailed route management and waypoint editing

#### Major Functions:

**A. Route Information Display**
- Route name
- Number of waypoints
- Departure date/time
- Arrival date/time
- Route statistics (total distance, avg wind, max waves)

**B. Waypoint Management**
- Add Waypoint button
- Waypoint list with cards
- Each card shows:
  - Waypoint number and name
  - Coordinates (DDM format)
  - Time data (total/leg)
  - Distance data
  - Navigation (heading, speed, COG, SOG)
  - Wind data (speed, direction, TWA, AWA)
  - Current data
  - Sail configuration
  - ETA with daylight warning

**C. Waypoint Actions**
- Move up/down in route
- Edit waypoint details
- Delete waypoint
- Click to select and view details

**D. Route Operations**
- Import GPX button
- Export button (multiple formats)
- Statistics panel

**E. Route Statistics Panel**
- Total Distance (nm)
- Average Wind Speed
- Maximum Wind Speed
- Average Wave Height
- Maximum Wave Height

**Key Features:**
- ✓ Drag to reorder waypoints
- ✓ Engine vs. Sail mode toggle per waypoint
- ✓ Daylight arrival warnings
- ✓ Multi-format export (GPX, KML, KMZ, CSV)
- ✓ GPX import functionality

**Data Managed:**
- Waypoint coordinates
- Arrival times
- Weather forecasts
- Sail configurations
- Engine usage

---

### 3. 🧭 Polar Screen (PolarScreen)

**Location:** Tab 3 - Navigation

**Primary Purpose:** Analyze sail performance in different wind conditions

#### Major Sections:

**A. Engine Activation Settings**
- Wind threshold input (knots)
- Save button
- Description: engine activation when below threshold

**B. Polar Diagram Controls**
- Wind Speed slider/input (0-50+ knots)
- Current TWA input (0-360 degrees)
- Current Speed display (calculated)
- View Details button

**C. Polar Chart**
- Interactive diagram showing:
  - Boat speed at different wind angles
  - Current position marker (red dot)
  - Speed arcs/contours
  - Wind direction indicators

**D. Quick Reference**
- Common sailing scenarios
- Expected speeds for each scenario
- Performance benchmarks

**Key Features:**
- ✓ Real-time chart updates
- ✓ Hover/tap for detailed values
- ✓ Engine threshold configuration
- ✓ Performance analysis tools

**Data Used:**
- Polar performance table (Lagoon 440)
- Wind speed conditions
- True wind angle
- Calculated boat speed

---

### 4. 🌤️ Weather Monitor Screen (WeatherMonitorScreen)

**Location:** Tab 4 - Navigation

**Primary Purpose:** Continuous weather monitoring with alert configuration

#### Major Sections:

**A. Monitoring Toggle**
- Enable/Disable monitoring switch
- Status indicator (Active/Inactive)
- Prerequisites check

**B. Configuration Options**
- Monitoring interval (hours)
- Forecast days (3-7 days ahead)
- Max wind speed threshold
- Max wave height threshold
- Storm avoidance toggle
- Daylight arrival toggle

**C. Notification Preferences**
- Push notifications toggle
- SMS notifications toggle (with phone input)
- Email notifications toggle (with email input)
- Contact information fields

**D. Active Monitoring Status**
- Last check time display
- Current active alerts list
- Alert details (severity, location, conditions, duration)
- Acknowledgment required for each alert

**E. Alert Indicators**
- Color coding by severity
- Location on route
- Estimated impact time
- Recommended actions

**Key Features:**
- ✓ Real-time weather monitoring
- ✓ Multi-channel notifications
- ✓ Auto-detection of route hazards
- ✓ Daylight arrival enforcement
- ✓ Storm tracking and warnings
- ✓ Tide/current integration

**Data Monitored:**
- Wind speed/direction
- Wave heights
- Storm locations
- Tide information
- Visibility conditions

---

### 5. 👤 Profile Screen (ProfileScreen)

**Location:** Tab 5 - Navigation

**Primary Purpose:** View account information and features

#### Major Sections:

**A. User Header**
- Avatar (initial of name)
- User name display
- Email address display

**B. Account Information**
- User ID
- Email address
- Full name

**C. Application Info**
- App name: "Sailing AI"
- App description: "Lagoon 440 Navigation Assistant"
- App version: "1.0.0"

**D. Your Features (Agent Features)**
- Real-time Sailing Recommendations ✓
- Automated Route Planning ✓
- Weather Monitoring & Alerts ✓
- Cloud Sync & Storage ✓
- GPX Import/Export ✓
- Polar Diagram Analysis ✓

**E. Sign Out Section**
- Sign Out button (red/destructive style)
- Confirmation dialog

**F. Footer**
- "Made with ❤️ for sailors"
- Copyright notice

**Key Features:**
- ✓ User identity display
- ✓ Account details summary
- ✓ Feature enumeration
- ✓ Secure logout

---

### 6. ⚙️ Settings Screen (SettingsScreen)

**Location:** Tab 6 - Navigation

**Primary Purpose:** Configure API keys and app preferences

#### Major Sections:

**A. Windy.com API Configuration**

*API Key Management:*
- Text input for API key
- Validate API Key button
- Save API Key button
- Clear API Key button
- Status indicator (valid/invalid)

*Validation Features:*
- Tests API with sample location (Miami)
- Shows real wind/wave data if valid
- Error messages for invalid keys
- Connection status feedback

*Help Section:*
- Link to get API key (https://www.windy.com/)
- Instructions for creating account
- Steps to generate API key

**B. Route Export Format Selection**

*Available Formats:*
- GPX (GPS Exchange Format) - Default
- KML (Keyhole Markup Language)
- KMZ (Compressed KML)
- CSV (Comma Separated Values)

*Selection Method:*
- Radio buttons for each format
- Preview of file extension
- Description of use cases
- MIME type information

**C. Additional Settings** (expandable/future)
- Arrival time window customization
- Notification preferences
- Performance settings

**Key Features:**
- ✓ API key validation with real data
- ✓ Format selection for exports
- ✓ Secure key storage
- ✓ Help and documentation links
- ✓ Status indicators

**Data Configured:**
- Windy.com API key
- Export format preference
- Notification channels
- Performance thresholds

---

## Data Flow Between Screens

```
Login/Register
    ↓
Sailing Screen (Plan Route)
    ↓
Route Management (Edit Waypoints)
    ↓
Weather Monitor (Set Alerts)
    ↓
Execute Route
    ↓
Polar Screen (Analyze Performance)
```

---

## Component Hierarchy

```
App.tsx (Main Navigator)
├── Login Screen
├── Register Screen
└── MainNavigator (TabBar)
    ├── Sailing Screen
    │   ├── SailConfigDisplay
    │   ├── ErrorPanel
    │   ├── SailingRose
    │   └── RouteMapView
    ├── Route Management
    │   └── RouteMapView
    ├── Polar Screen
    │   ├── PolarChart
    │   └── ErrorPanel
    ├── Weather Monitor
    │   └── AlertCards
    ├── Profile Screen
    └── Settings Screen
```

---

## Key Services Used

| Service | Screens | Function |
|---------|---------|----------|
| windyService | Sailing, Settings | Fetch real-time weather |
| routePlanningService | Sailing, Route | Generate optimal routes |
| navigationService | Sailing, Route | Calculate waypoint metrics |
| simulationService | Sailing | Run route simulations |
| weatherMonitoringService | Weather Monitor | Continuous monitoring |
| googleMapsService | Sailing | Map integration |

---

## Input/Output Summary

### Input Types
- 📍 GPS Coordinates (decimal, DMS, text)
- 💨 Wind data (speed, angle, direction)
- 📅 Dates (YYYY-MM-DD format)
- 🔤 Text (names, API keys, emails)
- 🔘 Toggles (mode selection, feature enable)

### Output Types
- 📊 Waypoint lists
- 🗺️ Route maps
- 📈 Performance metrics
- ⚠️ Alert notifications
- 📄 File exports (GPX, KML, CSV)
- 📱 Screen displays

---

## Responsive Design

### Mobile (<600px width)
- Single column layout
- Stacked sections
- Large touch targets
- Full-width buttons

### Tablet (600-900px width)
- Two column layout
- Side-by-side sections
- Medium touch targets
- Optimized spacing

### Desktop (>900px width)
- Multi-column layout
- Responsive grids
- Small touch targets
- Efficient use of space

---

## Screen Navigation Map

```
┌─────────┐
│ Login   │
└────┬────┘
     │
┌────▼─────────┐
│ Register      │
└────┬─────────┘
     │
┌────▼──────────────────────────────┐
│   Main App (Tab Navigation)        │
├──────┬──────┬──────┬──────┬──────┬─┤
│⛵Sail│🗺️Route│🧭Polar│🌤️Wthr│👤Prof│⚙️Set│
└──────┴──────┴──────┴──────┴──────┴──┘
```

---

**Document Version:** 1.0  
**Last Updated:** March 31, 2026  
**Status:** Reference Guide

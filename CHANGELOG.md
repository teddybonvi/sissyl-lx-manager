# Changelog

All notable changes to Sister Sylvester LX Manager will be documented in this file.

## [1.1.4] - 2026-04-08

### Added
- README.md with comprehensive documentation
- CHANGELOG.md for version tracking
- DMG configuration for better installation layout

### Changed
- Improved documentation and project organization
- Cleaned up build configuration

---

## [1.1.3] - 2026-04-08

### Added
- **Installation assignment for bridges**
  - Dropdown selector on each bridge card
  - Assign bridges to installations (CST, DB, etc.)
- **Installation-based remote monitoring**
  - Remote monitor groups bridges by installation
  - "Select an installation" dropdown instead of individual bridges

### Changed
- Remote monitor now shows bridge headers separating groups from different bridges

---

## [1.1.2] - 2026-04-08

### Added
- **Installation assignment for bridges**
  - Dropdown selector on each bridge card
  - Assign bridges to installations (CST, DB, etc.)
- **Installation-based remote monitoring**
  - Remote monitor groups bridges by installation
  - "Select an installation" dropdown instead of individual bridges

### Changed
- Remote monitor now shows bridge headers separating groups from different bridges

---

## [1.1.1] - 2026-04-08

### Added
- **Remote Monitoring Dashboard** (accessible from any device on network)
  - Live monitor at `http://[COMPUTER_IP]:3001/monitor`
  - Real-time updates every 2 seconds
  - Individual bulb color indicators with glow effects
  - Color gradient brightness bars
  - Mobile-optimized touch interface
- **Bi-directional Qlab OSC Integration**
  - OSC server listening on port 53000
  - OSC client sending to Qlab on port 53001
  - Qlab Sync Panel showing connection status
  - GO/STOP buttons to control Qlab from app
  - Live cue and workspace display

### Fixed
- Remote monitor blinking issue (elements now update in place)
- Bridge loading optimization with sequential timeouts
- Color display for "unreachable" bulbs that are actually on

---

## [1.1.0] - 2026-04-07

### Added
- **Network Diagnostics** integrated into Bridge Manager
  - Bridge reachability tests with response time
  - API response speed testing (pass/warning/fail indicators)
  - Light discovery and count verification
  - Network information display (IP, subnet)
  - Color-coded results (green/yellow/red/blue)
- **Fleet Manager enhancements**
  - Offline bulb tracking from fleet database
  - Group membership display per bulb
  - Region detection (US/EU/UK) with color coding
  - Shows all bulbs even when bridges offline
- **Live Monitor improvements**
  - Auto-refresh every 2 seconds
  - Visual brightness bars with gradients
  - Individual bulb color indicators (XY/CT to RGB conversion)
  - Group status badges (ON/OFF)
  - Per-bulb glow effects

### Changed
- Sequential bridge loading prevents one timeout from blocking others
- Groups auto-save to fleet database when bridges connect
- Removed reachable filter to show colors for all bulbs

---

## [1.0.0] - 2026-04-06

### Added
- **Bridge Manager**
  - Discover and connect to Philips Hue bridges
  - Manual bridge addition via IP address
  - Bridge connection status indicators
  - Load lights and groups from bridges
- **Qlab Generator**
  - Export Qlab-compatible AppleScript templates
  - Copy-paste bridge IP, group ID, and API key
  - Line number references for easy template integration
  - Export as .txt file
- **Fleet Management**
  - Register bulbs with Fleet IDs
  - Track installations and regions
  - Bulb metadata storage (v1 ID, model, installation)
  - Recognize fleet bulbs across bridges
- **Live Monitor (In-App)**
  - Real-time group monitoring
  - Brightness control
  - Individual light status
- **Core Infrastructure**
  - Electron app with embedded Express server (port 3001)
  - Hue v2 API proxy endpoints
  - LocalStorage-based data persistence
  - Multiple installations support

### Technical Details
- Built with Electron 28.3.3
- React for UI
- Express server for API proxy and remote monitoring
- OSC library for Qlab integration
- Supports macOS (arm64 and x64)

---

## Installation

### Easy Method (Recommended)
1. Download the latest `.dmg` from [Releases](https://github.com/teddybonvi/sissyl-lx-manager/releases)
2. Open the DMG
3. Double-click `install-sissyl.command`
4. Launch from Applications

### Manual Method
1. Download the latest `.dmg` from [Releases](https://github.com/teddybonvi/sissyl-lx-manager/releases)
2. Drag "Sister Sylvester LX Manager" to Applications
3. Right-click the app → Open → Open again
4. Launch normally from then on

---

## Remote Monitor Access

From any phone or tablet on the same network:
1. Find your computer's IP address (System Settings → Network)
2. Open browser and go to: `http://YOUR_COMPUTER_IP:3001/monitor`
3. Select an installation to view live groups

---

## Qlab Integration

### OSC Control (Automatic)
Configure Qlab workspace:
- **OSC Controls** → Enable "Use OSC Controls"
- **Destination:** `localhost`
- **Port:** `53000`

Message format: `/hue/BRIDGE_IP/GROUP_ID/ACTION`

### AppleScript Export (Legacy)
Use the Qlab Generator tab to export templates for manual integration.

---

## Data Storage

All data stored in browser localStorage:
- `hue_bridges` - Bridge configurations
- `fleet_database` - Bulb metadata
- `installations` - Venue list
- `group_v2_ids` - v1 to v2 ID mappings

---

## Support

For issues or questions, contact the Sister Sylvester technical team.

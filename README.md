# Sister Sylvester LX Manager

A professional lighting control system for Philips Hue bridges, designed for Sister Sylvester productions.

## Features

### Bridge Management
- Discover and connect to multiple Philips Hue bridges
- Manual bridge configuration via IP address
- Real-time connection status monitoring
- Assign bridges to installations (venues)

### Fleet Management
- Register and track bulbs with unique Fleet IDs
- Track bulb installations and regions (US/EU/UK)
- View all bulbs (online and offline) across your fleet
- Region detection based on bulb models

### Remote Monitoring
- Access live lighting status from any device on your network
- Real-time updates every 2 seconds
- Individual bulb color indicators with glow effects
- Color gradient brightness bars
- Mobile-optimized interface
- Group by installation for easy venue management

### Qlab Integration
- OSC Control: Direct lighting control from Qlab cues
- Bi-directional sync with live cue tracking
- GO/STOP buttons to control Qlab from the app
- AppleScript Export: Generate templates for manual integration

### Network Diagnostics
- Bridge reachability testing
- API response speed analysis
- Light discovery verification
- Network information display

### Live Monitor
- In-app real-time group monitoring
- Visual brightness bars with color gradients
- Individual bulb status indicators
- Auto-refresh every 2 seconds

## Installation

### Via Resilio Sync (Recommended)
1. Sync the latest DMG from the team folder
2. Open the DMG
3. Drag "Sister Sylvester LX Manager" to Applications
4. Launch from Applications

### Via GitHub Releases (Public Download)
1. Download the latest `.dmg` from [Releases](https://github.com/teddybonvi/sissyl-lx-manager/releases)
2. Open the DMG
3. Drag "Sister Sylvester LX Manager" to Applications
4. Right-click the app → Open → Open (first launch only)
5. Launch normally from then on

## Quick Start

### 1. Connect Your Bridges
1. Open the app
2. Go to Bridge Manager tab
3. Click Add Bridge or let it auto-discover
4. Press the button on your Hue bridge
5. Click Connect in the app

### 2. Assign Installations
1. In Bridge Manager, use the dropdown on each bridge card
2. Select the installation (venue) for each bridge
3. Settings save automatically

### 3. Access Remote Monitor
1. Find your computer's IP address (System Settings → Network)
2. On your phone/tablet, open browser to: http://YOUR_COMPUTER_IP:3001/monitor
3. Select an installation to view live groups

### 4. Set Up Qlab Integration
1. Open Qlab
2. Go to Workspace Settings → OSC Controls
3. Enable Use OSC Controls
4. Set Destination: localhost
5. Set Port: 53000
6. Use OSC messages in cues: /hue/BRIDGE_IP/GROUP_ID/ACTION

## Remote Monitor Access

The remote monitor lets you view live lighting status from any device on your network.

Access URL: http://YOUR_COMPUTER_IP:3001/monitor

Features:
- Select installation to view all bridges in that venue
- Live group status updates every 2 seconds
- Color-coded brightness bars
- Individual bulb indicators with actual colors
- Works on phones, tablets, and computers

## Qlab OSC Commands

Control lights directly from Qlab using OSC messages:

Turn On: /hue/192.168.1.71/1/on
Turn Off: /hue/192.168.1.71/1/off
Set Brightness (0-254): /hue/192.168.1.71/1/brightness 200
Set Color (hue, saturation): /hue/192.168.1.71/1/color 25000 254

## Data Storage

All configuration data is stored locally in browser localStorage:
- hue_bridges: Bridge configurations and credentials
- fleet_database: Bulb metadata and Fleet IDs
- installations: Venue/installation list
- group_v2_ids: Hue API v1 to v2 ID mappings

Backup Recommendation: Export your configurations periodically using the built-in export feature.

## Development

Prerequisites:
- Node.js 18+
- npm or yarn

Setup:
git clone https://github.com/teddybonvi/sissyl-lx-manager.git
cd sissyl-lx-manager
npm install
npm run electron:dev

Build:
npm run electron:build:mac
npm run electron:build:mac -- --publish always

## Technical Details

- Platform: Electron 28.3.3
- UI Framework: React
- Server: Express (port 3001)
- OSC Server: Port 53000 (receives from Qlab)
- OSC Client: Port 53001 (sends to Qlab)
- Supported Platforms: macOS (arm64, x64)

## Troubleshooting

### App is damaged Error
Run this command in Terminal:
xattr -cr "/Applications/Sister Sylvester LX Manager.app"

Or use the install-sissyl.command installer included in the DMG.

### Remote Monitor Not Loading
1. Ensure your device is on the same Wi-Fi network as the computer
2. Check that port 3001 is not blocked by firewall
3. Verify the computer's IP address hasn't changed

### Qlab Not Responding to OSC
1. Check Qlab OSC settings (Workspace Settings → OSC Controls)
2. Ensure Use OSC Controls is enabled
3. Verify destination is localhost and port is 53000
4. Check the Qlab Sync panel in the app for connection status

### Bridge Won't Connect
1. Ensure the bridge is powered on and connected to the network
2. Press the physical button on the bridge before clicking Connect
3. Check that your computer is on the same network as the bridge
4. Try running Network Diagnostics from the bridge card

## Version History

See CHANGELOG.md for detailed version history.

## License

Proprietary - Sister Sylvester Productions

## Support

For issues or questions, contact the Sister Sylvester technical team.

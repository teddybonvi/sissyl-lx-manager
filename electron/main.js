import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { spawn } from 'child_process'
import { writeFileSync, readFileSync } from 'fs'
import express from 'express'
import cors from 'cors'
import https from 'https'
import pkg from 'electron-updater'
import osc from 'osc'

const { autoUpdater } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow
let serverProcess
// Shared data store for remote monitoring
let monitorData = {
  bridges: []
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')  // Add preload script
    },
    title: 'Sister Sylvester LX Manager',
    icon: join(__dirname, 'assets', 'icon.png')
  })

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load the built files
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

function startProxyServer() {
  const expressApp = express()
  expressApp.use(cors())
  expressApp.use(express.json())

  // GET - Fetch v2 grouped_light IDs
  expressApp.get('/api/hue-v2/:bridgeIp/grouped-light', async (req, res) => {
    const { bridgeIp } = req.params
    const apiKey = req.headers['hue-application-key']
    
    if (!apiKey) {
      return res.status(400).json({ error: 'hue-application-key header required' })
    }
    
    const options = {
      hostname: bridgeIp,
      port: 443,
      path: '/clip/v2/resource/grouped_light',
      method: 'GET',
      headers: {
        'hue-application-key': apiKey
      },
      rejectUnauthorized: false
    }
    
    const proxyReq = https.request(options, (proxyRes) => {
      let data = ''
      proxyRes.on('data', chunk => data += chunk)
      proxyRes.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          const mapping = {}
          parsed.data.forEach(item => {
            if (item.id_v1) {
              const v1Id = item.id_v1.replace('/groups/', '')
              mapping[v1Id] = item.id
            }
          })
          res.json({ success: true, mapping })
        } catch (e) {
          res.status(500).json({ success: false, error: e.message })
        }
      })
    })
    
    proxyReq.on('error', (err) => {
      console.error('Proxy GET error:', err)
      res.status(500).json({ error: err.message })
    })
    
    proxyReq.end()
  })

  // PUT - Control grouped light
  expressApp.put('/api/hue-v2/:bridgeIp/grouped-light/:groupedLightId', async (req, res) => {
    const { bridgeIp, groupedLightId } = req.params
    const apiKey = req.headers['hue-application-key']
    const payload = req.body
    
    const options = {
      hostname: bridgeIp,
      port: 443,
      path: `/clip/v2/resource/grouped_light/${groupedLightId}`,
      method: 'PUT',
      headers: {
        'hue-application-key': apiKey,
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false
    }
    
    const proxyReq = https.request(options, (proxyRes) => {
      let data = ''
      proxyRes.on('data', chunk => data += chunk)
      proxyRes.on('end', () => {
        res.status(proxyRes.statusCode).send(data)
      })
    })
    
    proxyReq.on('error', (err) => {
      console.error('Proxy PUT error:', err)
      res.status(500).json({ error: err.message })
    })
    
    proxyReq.write(JSON.stringify(payload))
    proxyReq.end()
  })

// Get live light data for a specific bridge
expressApp.get('/api/bridge/:bridgeIp/lights', async (req, res) => {
  const { bridgeIp } = req.params
  const { username } = req.query
  
  if (!username) {
    return res.status(400).json({ error: 'username query parameter required' })
  }
  
  try {
    const response = await fetch(`http://${bridgeIp}/api/${username}/lights`)
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get groups for a specific bridge
expressApp.get('/api/bridge/:bridgeIp/groups', async (req, res) => {
  const { bridgeIp } = req.params
  const { username } = req.query
  
  if (!username) {
    return res.status(400).json({ error: 'username query parameter required' })
  }
  
  try {
    const response = await fetch(`http://${bridgeIp}/api/${username}/groups`)
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

 expressApp.get('/monitor', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Sister Sylvester - Remote Monitor</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f3f4f6;
      padding: 12px;
      -webkit-tap-highlight-color: transparent;
    }
    .header {
      background: white;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 { font-size: 18px; margin-bottom: 4px; font-weight: 700; }
    .status { 
      font-size: 11px; 
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    
    .bridge-selector {
      background: white;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    select {
      width: 100%;
      padding: 10px;
      font-size: 14px;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      background: white;
    }
    
    .group-card {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 2px solid #e5e7eb;
      transition: border-color 0.3s;
    }
    .group-card.on { border-color: #10b981; }
    
    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .group-name { font-size: 16px; font-weight: 600; }
    .group-status {
      padding: 4px 12px;
      border-radius: 12px;
      fontSize: 11px;
      font-weight: 600;
    }
    .group-status.on {
      background: #d1fae5;
      color: #065f46;
    }
    .group-status.off {
      background: #f3f4f6;
      color: #6b7280;
    }
    
    .brightness-bar {
      height: 24px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
      margin-bottom: 12px;
    }
    .brightness-fill {
      height: 100%;
      transition: width 0.3s, background 0.3s;
      position: relative;
    }
    .brightness-text {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: 600;
      color: #1f2937;
      text-shadow: 0 0 4px white;
    }
    
    .bulbs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }
    .bulb {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 4px 8px;
    }
    .bulb-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid #d1d5db;
      transition: all 0.3s;
    }
    .bulb-name {
      font-size: 10px;
      font-weight: 500;
      color: #374151;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .group-info {
      font-size: 11px;
      color: #6b7280;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
    }
    
    .offline-message {
      text-align: center;
      padding: 40px;
      color: #9ca3af;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1> Sister Sylvester - Remote LX Monitor</h1>
    <div class="status">
      <div class="live-dot"></div>
      <span id="status-text">Connecting...</span>
    </div>
  </div>
  
  <div class="bridge-selector">
    <select id="installation-select">
      <option value="">Select an installation...</option>
    </select>
  </div>
  
  <div id="groups"></div>
  
  <script>
    let installations = []
    let selectedBridge = null
    let updateInterval = null
    
    // XY to RGB conversion
    function xyToRgb(x, y, brightness = 254) {
      const z = 1 - x - y
      let r = x * 3.2406 + y * -1.5372 + z * -0.4986
      let g = x * -0.9689 + y * 1.8758 + z * 0.0415
      let b = x * 0.0557 + y * -0.2040 + z * 1.0570
      
      r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r
      g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g
      b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b
      
      r = Math.max(0, Math.min(1, r)) * 255
      g = Math.max(0, Math.min(1, g)) * 255
      b = Math.max(0, Math.min(1, b)) * 255
      
      return \`rgb(\${Math.round(r)}, \${Math.round(g)}, \${Math.round(b)})\`
    }
    
    function getColorFromLight(light) {
      if (!light.state.on) return '#4b5563'
      
      if (light.state.xy) {
        return xyToRgb(light.state.xy[0], light.state.xy[1], light.state.bri)
      }
      
      if (light.state.ct) {
        const kelvin = 1000000 / light.state.ct
        if (kelvin < 3500) {
          const warmness = Math.max(0, Math.min(1, (3500 - kelvin) / 1000))
          return \`rgb(255, \${Math.round(200 - warmness * 50)}, \${Math.round(100 - warmness * 50)})\`
        } else if (kelvin > 5000) {
          const coolness = Math.max(0, Math.min(1, (kelvin - 5000) / 1500))
          return \`rgb(\${Math.round(230 - coolness * 30)}, \${Math.round(240 - coolness * 20)}, 255)\`
        }
        return '#fff8dc'
      }
      
      return '#fbbf24'
    }
    
    async function loadInstallations() {
      try {
        const response = await fetch('/monitor/data')
        const data = await response.json()
        installations = data.installations || {}
        
        const select = document.getElementById('installation-select')
        select.innerHTML = '<option value="">Select an installation...</option>' +
          Object.keys(installations).map(inst => 
            \`<option value="\${inst}">\${inst} (\${installations[inst].length} bridge\${installations[inst].length !== 1 ? 's' : ''})</option>\`
          ).join('')
        
        const onlineCount = Object.values(installations)
          .flat()
          .filter(b => b.online).length
        
        document.getElementById('status-text').textContent = 
          \`\${onlineCount} bridge\${onlineCount !== 1 ? 's' : ''} online\`
      } catch (error) {
        console.error('Failed to load installations:', error)
        document.getElementById('status-text').textContent = 'Connection error'
      }
    }
    
   async function updateGroups() {
    if (selectedBridges.length === 0) return
    
    const container = document.getElementById('groups')
    container.innerHTML = ''
    
    for (const bridge of selectedBridges) {
      if (!bridge.online) continue
      
      try {
        const lightsResponse = await fetch(\`/api/bridge/\${bridge.ip}/lights?username=\${bridge.username}\`)
        const lights = await lightsResponse.json()
        
        const groupsResponse = await fetch(\`/api/bridge/\${bridge.ip}/groups?username=\${bridge.username}\`)
        const groups = await groupsResponse.json()
        
        // Add bridge header
        const bridgeHeader = document.createElement('div')
        bridgeHeader.style.cssText = 'background: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);'
        bridgeHeader.innerHTML = \`🟢 \${bridge.name}\`
        container.appendChild(bridgeHeader)
        
        renderGroups(groups, lights, container)
      } catch (error) {
        console.error(\`Failed to update \${bridge.name}:\`, error)
      }
    }
    
    document.getElementById('status-text').textContent = \`Live • \${new Date().toLocaleTimeString()}\`
  }
  
  function renderGroups(groups, lights, container) {
    Object.entries(groups).forEach(([groupId, group]) => {
      const groupLights = (group.lights || [])
        .map(lightId => ({ id: lightId, ...lights[lightId] }))
        .filter(Boolean)
      
      const avgBri = groupLights.length > 0
        ? Math.round(groupLights.reduce((sum, l) => sum + (l.state?.bri || 0), 0) / groupLights.length)
        : 0
      
      const brightnessPercent = Math.round((avgBri / 254) * 100)
      
      const colors = groupLights
        .filter(l => l.state.on)
        .map(l => getColorFromLight(l))
      
      const gradient = colors.length > 1 
        ? \`linear-gradient(to right, \${colors.join(', ')})\`
        : colors[0] || '#9ca3af'
      
      const groupCard = document.createElement('div')
      groupCard.className = \`group-card \${group.state?.any_on ? 'on' : ''}\`
      groupCard.innerHTML = \`
        <div class="group-header">
          <div class="group-name">\${group.name}</div>
          <div class="group-status \${group.state?.any_on ? 'on' : 'off'}">
            \${group.state?.any_on ? '● ON' : '○ OFF'}
          </div>
        </div>
        
        <div class="brightness-bar">
          <div class="brightness-fill" style="width: \${brightnessPercent}%; background: \${gradient}">
            <div class="brightness-text">\${brightnessPercent}%</div>
          </div>
        </div>
        
        <div class="bulbs">
          \${groupLights.map(light => {
            const color = getColorFromLight(light)
            return \`
              <div class="bulb">
                <div class="bulb-indicator" style="background: \${color}; box-shadow: \${light.state.on ? \`0 0 6px \${color}\` : 'none'}"></div>
                <div class="bulb-name">\${light.name}</div>
              </div>
            \`
          }).join('')}
        </div>
        
        <div class="group-info">
          \${groupLights.length} light\${groupLights.length !== 1 ? 's' : ''}
        </div>
      \`
      
      container.appendChild(groupCard)
    })
  }
  
  document.getElementById('installation-select').addEventListener('change', (e) => {
    const installation = e.target.value
    if (installation === '') {
      selectedBridges = []
      clearInterval(updateInterval)
      document.getElementById('groups').innerHTML = '<div class="offline-message">Select an installation to view groups</div>'
      return
    }
    
    selectedBridges = installations[installation] || []
    
    clearInterval(updateInterval)
    updateGroups()
    updateInterval = setInterval(updateGroups, 2000)
  })
  
  // Initial load
  loadInstallations()
  setInterval(loadInstallations, 10000)
</script>
</body>
</html>
  `)
})

// API endpoint for monitor data
expressApp.get('/monitor/data', async (req, res) => {
  res.json(monitorData)
})

  const server = expressApp.listen(3001, () => {
    console.log('Proxy server running on port 3001')
  })
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('Port 3001 already in use - continuing...')
    } else {
      console.error('Server error:', err)
    }
  })
}

function startOSCServer() {
  // Server (receives from Qlab)
  const oscServer = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 53002,
    metadata: true
  })

  // Client (sends to Qlab)
  const oscClient = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 0,  // Use any available port
    remoteAddress: "127.0.0.1",  // Qlab runs on same computer
    remotePort: 53001,  // Default Qlab OSC port
    metadata: true
  })

oscServer.on("message", async (oscMsg) => {
  // Ignore invalid/malformed messages
  if (!oscMsg || !oscMsg.address || typeof oscMsg.address !== 'string') {
    return  // Silently ignore junk packets
  }
  
  console.log("OSC Message received:", oscMsg.address, oscMsg.args)
    
    // Handle incoming messages from Qlab
    if (oscMsg.address.startsWith('/reply')) {
      // This is a reply from Qlab
      handleQlabReply(oscMsg)
      return
    }
    
    // Parse message format: /hue/bridge_ip/group_id/action
    const parts = oscMsg.address.split('/')
    
    if (parts[1] === 'hue' && parts.length >= 5) {
      const bridgeIp = parts[2]
      const groupId = parts[3]
      const action = parts[4]
      
      // Get bridge credentials
      const bridgesData = mainWindow?.webContents.executeJavaScript(
        'localStorage.getItem("hue_bridges")'
      )
      const bridges = JSON.parse(await bridgesData || '[]')
      const bridge = bridges.find(b => b.ip === bridgeIp)
      
      if (!bridge) {
        console.error(`Bridge not found: ${bridgeIp}`)
        return
      }
      
      // Handle different actions
      if (action === 'on') {
        await controlGroup(bridgeIp, bridge.username, groupId, { on: true })
      } else if (action === 'off') {
        await controlGroup(bridgeIp, bridge.username, groupId, { on: false })
      } else if (action === 'brightness') {
        const bri = oscMsg.args[0]?.value || 254
        await controlGroup(bridgeIp, bridge.username, groupId, { on: true, bri: Math.round(bri) })
      } else if (action === 'color') {
        const hue = oscMsg.args[0]?.value || 0
        const sat = oscMsg.args[1]?.value || 254
        await controlGroup(bridgeIp, bridge.username, groupId, { on: true, hue: Math.round(hue), sat: Math.round(sat) })
      }
    }
  })

  oscServer.on("ready", () => {
    console.log("OSC Server listening on port 53000")
  })

  oscClient.on("ready", () => {
    console.log("OSC Client ready to send to Qlab on port 53001")
    
    // Query Qlab status every 2 seconds
    setInterval(() => {
      queryQlabStatus(oscClient)
    }, 2000)
  })

  oscServer.open()
  oscClient.open()
  
  // Store client globally so we can use it elsewhere
  global.oscClient = oscClient
}

function queryQlabStatus(oscClient) {
  // Ask Qlab what cue is selected
  oscClient.send({
    address: "/cue/selected/uniqueID",
    args: []
  })
  
  // Ask Qlab what workspace is active
  oscClient.send({
    address: "/workspace/selected",
    args: []
  })
}

function handleQlabReply(oscMsg) {
  // Parse Qlab's response
  console.log("Qlab reply:", oscMsg)
  
  // Send to renderer process
  if (mainWindow) {
    mainWindow.webContents.send('qlab-status', {
      address: oscMsg.address,
      data: oscMsg.args[0]?.value
    })
  }
}

async function controlGroup(bridgeIp, username, groupId, state) {
  try {
    const response = await fetch(`http://${bridgeIp}/api/${username}/groups/${groupId}/action`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    })
    const result = await response.json()
    console.log(`Group ${groupId} updated:`, result)
  } catch (error) {
    console.error(`Failed to control group ${groupId}:`, error)
  }
}

ipcMain.handle('update-monitor-data', async (event, data) => {
  monitorData = data
  return { success: true }
})

ipcMain.handle('save-file', async (event, filename, content) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  
  if (filePath) {
    writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  }
  
  return { success: false }
})

ipcMain.handle('read-config-file', async (event, filePath) => {
  try {
    const content = readFileSync(filePath, 'utf-8')
    return { success: true, content: JSON.parse(content) }
  } catch (error) {
    // File doesn't exist yet or can't be read
    return { success: false, error: error.message }
  }
})

ipcMain.handle('write-config-file', async (event, filePath, data) => {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('open-file', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  
  if (filePaths && filePaths.length > 0) {
    const content = readFileSync(filePaths[0], 'utf-8')
    return { success: true, content }
  }
  
  return { success: false }
})

app.whenReady().then(() => {
  startProxyServer()
  startOSCServer()
  
  // Wait a bit for server to start, then create window
  setTimeout(createWindow, 2000)
  
autoUpdater.checkForUpdatesAndNotify()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})

ipcMain.handle('send-osc-to-qlab', async (event, address, args) => {
  if (global.oscClient) {
    global.oscClient.send({
      address: address,
      args: args || []
    })
    return { success: true }
  }
  return { success: false, error: 'OSC client not ready' }
})
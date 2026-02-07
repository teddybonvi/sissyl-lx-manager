import React from 'react'
import ReactDOM from 'react-dom/client'
import hueService from './services/hueApi.js'

const ColorWheel = ({ color, onChange }) => {
  const canvasRef = React.useRef(null)
  const [isDragging, setIsDragging] = React.useState(false)
  
  const size = 200
  const centerX = size / 2
  const centerY = size / 2
  const radius = size / 2 - 10
  
  const rgbToHsv = (r, g, b) => {
    r /= 255
    g /= 255
    b /= 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    
    let h = 0
    if (delta !== 0) {
      if (max === r) {
        h = 60 * (((g - b) / delta) % 6)
      } else if (max === g) {
        h = 60 * (((b - r) / delta) + 2)
      } else {
        h = 60 * (((r - g) / delta) + 4)
      }
    }
    if (h < 0) h += 360
    
    const s = max === 0 ? 0 : delta / max
    const v = max
    
    return { h, s, v }
  }
  
  const hsvToRgb = (h, s, v) => {
    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c
    
    let r, g, b
    if (h < 60) {
      [r, g, b] = [c, x, 0]
    } else if (h < 120) {
      [r, g, b] = [x, c, 0]
    } else if (h < 180) {
      [r, g, b] = [0, c, x]
    } else if (h < 240) {
      [r, g, b] = [0, x, c]
    } else if (h < 300) {
      [r, g, b] = [x, 0, c]
    } else {
      [r, g, b] = [c, 0, x]
    }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    }
  }
  
  const handleColorSelect = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const dx = x - centerX
    const dy = y - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist > radius) return
    
    let angle = Math.atan2(dy, dx) * 180 / Math.PI
    if (angle < 0) angle += 360
    
    const saturation = Math.min(dist / radius, 1)
    const value = 1
    
    const rgb = hsvToRgb(angle, saturation, value)
    onChange(rgb)
  }
  
  const handleMouseDown = (e) => {
    setIsDragging(true)
    handleColorSelect(e)
  }
  
  const handleMouseMove = (e) => {
    if (!isDragging) return
    handleColorSelect(e)
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  // Draw the color wheel
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size)
    
    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 1) * Math.PI / 180
      const endAngle = angle * Math.PI / 180
      
      for (let r = 0; r < radius; r += 1) {
        const saturation = r / radius
        const hue = angle
        const value = 1
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, r, startAngle, endAngle)
        ctx.strokeStyle = `hsl(${hue}, ${saturation * 100}%, ${value * 50}%)`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
    
    // Draw current color indicator
    const { r, g, b } = color
    const hsv = rgbToHsv(r, g, b)
    const angle = hsv.h * Math.PI / 180
    const dist = hsv.s * radius
    const x = centerX + dist * Math.cos(angle)
    const y = centerY + dist * Math.sin(angle)
    
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, 2 * Math.PI)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.stroke()
    
  }, [color, centerX, centerY, radius, size])
  
  React.useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    const handleGlobalMouseMove = (e) => {
      if (isDragging) handleMouseMove(e)
    }
    
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mousemove', handleGlobalMouseMove)
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [isDragging])
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onMouseDown={handleMouseDown}
        style={{
          cursor: 'crosshair',
          borderRadius: '50%',
          border: '2px solid #cbd5e0'
        }}
      />
    </div>
  )
}

// Bulb Registration Modal Component
const BulbRegistrationModal = ({ 
  bulbs, 
  installations,
  onRegister, 
  onSkip, 
  onClose 
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [formData, setFormData] = React.useState({
    fleetId: '',
    preferredName: '',
    installation: 'CST Theatre',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  if (bulbs.length === 0 || currentIndex >= bulbs.length) {
    return null
  }
  
  const currentBulb = bulbs[currentIndex]
  const progress = `${currentIndex + 1} of ${bulbs.length}`
  
  const handleRegister = () => {
    onRegister(currentBulb.light.uniqueid, formData)
    
    // Move to next bulb or close
    if (currentIndex < bulbs.length - 1) {
      setCurrentIndex(currentIndex + 1)
      // Reset form for next bulb
      setFormData({
        fleetId: '',
        preferredName: '',
        installation: formData.installation, // Keep installation
        purchaseDate: formData.purchaseDate, // Keep date
        notes: ''
      })
    } else {
      onClose()
    }
  }
  
  const handleSkip = () => {
    onSkip(currentBulb.light.uniqueid)
    
    if (currentIndex < bulbs.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onClose()
    }
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>Register Fleet Bulb</h2>
          <span style={{ color: '#666', fontSize: '14px' }}>{progress}</span>
        </div>
        
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Current Name:</div>
          <div style={{ fontWeight: '600' }}>{currentBulb.light.name}</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '8px', fontFamily: 'monospace' }}>
            ID: {currentBulb.light.uniqueid}
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            Model: {currentBulb.light.productname}
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
            Fleet ID *
          </label>
          <input
            type="text"
            placeholder="e.g., SL-042"
            value={formData.fleetId}
            onChange={(e) => setFormData({ ...formData, fleetId: e.target.value.toUpperCase() })}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #cbd5e0',
              borderRadius: '6px'
            }}
          />
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            Match this to the physical label on the bulb
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
            Preferred Name *
          </label>
          <input
            type="text"
            placeholder="e.g., CST BULB 4"
            value={formData.preferredName}
            onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #cbd5e0',
              borderRadius: '6px'
            }}
          />
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            This bulb will be renamed to this on all bridges
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
            Current Installation
          </label>
          <select
            value={formData.installation}
            onChange={(e) => setFormData({ ...formData, installation: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #cbd5e0',
              borderRadius: '6px'
            }}
          >
            {installations.map(installation => (
              <option key={installation} value={installation}>{installation}</option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
            Purchase Date
          </label>
          <input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #cbd5e0',
              borderRadius: '6px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
            Notes (optional)
          </label>
          <textarea
            placeholder="e.g., Tends to drop offline in cold weather"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleRegister}
            disabled={!formData.fleetId || !formData.preferredName}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: (formData.fleetId && formData.preferredName) ? '#4CAF50' : '#cbd5e0',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (formData.fleetId && formData.preferredName) ? 'pointer' : 'not-allowed'
            }}
          >
            Register
          </button>
          
          <button
            onClick={handleSkip}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#ffffff',
              color: '#666',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Skip This Bulb
          </button>
        </div>
        
        <button
          onClick={onClose}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '8px',
            backgroundColor: 'transparent',
            color: '#999',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Close (Skip All)
        </button>
      </div>
    </div>
  )
}

  {/* Qlab Generator Page Component */}
  
const QlabGeneratorPage = ({ 
  bridges, 
  allLoadedGroups, 
  loadAllBridgeGroups, 
  groupV2Ids, 
  setCurrentPage 
}) => {
  const [selectedGroupName, setSelectedGroupName] = React.useState('')
  const [onOff, setOnOff] = React.useState('on')
  const [brightness, setBrightness] = React.useState(100)
  const [duration, setDuration] = React.useState(1000)
  const [colorMode, setColorMode] = React.useState('none')
  const [colorTemp, setColorTemp] = React.useState(370)
  const [rgbColor, setRgbColor] = React.useState({ r: 255, g: 255, b: 255 })
const hasLoaded = React.useRef(false)
    
React.useEffect(() => {
  if (!hasLoaded.current) {
    hasLoaded.current = true
    console.log('Loading all bridge groups - ONCE')
    loadAllBridgeGroups()
  }
}, [])

const allBridgeGroups = React.useMemo(() => {
  const result = []
  
  bridges.forEach(bridge => {
    const bridgeGroups = allLoadedGroups[bridge.ip]
    
    if (bridgeGroups) {
      Object.entries(bridgeGroups).forEach(([groupId, group]) => {
        result.push({
          bridge,
          groupId,
          group,
          v2Id: groupV2Ids[bridge.ip]?.[groupId]
        })
      })
    }
  })
  
  console.log('All bridge groups:', result)
  return result
}, [bridges, allLoadedGroups, groupV2Ids])

  // Find group by name
  const groupInfo = React.useMemo(() => {
    if (!selectedGroupName) return null
    
    const found = allBridgeGroups.find(item => 
      item.group.name.toLowerCase() === selectedGroupName.toLowerCase()
    )
    
    console.log('Looking for:', selectedGroupName)
    console.log('Found:', found)
    
    return found || null
  }, [selectedGroupName, allBridgeGroups])
  
  // Get all unique group names
  const allGroupNames = React.useMemo(() => {
    return [...new Set(allBridgeGroups.map(item => item.group.name))]
  }, [allBridgeGroups])
  
  const rgbToXy = (r, g, b) => {
    r = r / 255
    g = g / 255
    b = b / 255
    
    r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : (r / 12.92)
    g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : (g / 12.92)
    b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : (b / 12.92)
    
    const X = r * 0.649926 + g * 0.103455 + b * 0.197109
    const Y = r * 0.234327 + g * 0.743075 + b * 0.022598
    const Z = r * 0.000000 + g * 0.053077 + b * 1.035763
    
    const x = X / (X + Y + Z)
    const y = Y / (X + Y + Z)
    
    return { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) }
  }
  
  const getMirekColor = (mirek) => {
  const kelvin = 1000000 / mirek
  
  let r, g, b
  
  if (kelvin <= 2000) {
    r = 255
    g = 147
    b = 41
  } else if (kelvin <= 2700) {
    r = 255
    g = 197
    b = 143
  } else if (kelvin <= 3000) {
    r = 255
    g = 214
    b = 170
  } else if (kelvin <= 4000) {
    r = 255
    g = 241
    b = 224
  } else if (kelvin <= 5000) {
    r = 255
    g = 250
    b = 244
  } else {
    r = 201
    g = 226
    b = 255
  }
  
  return `rgb(${r}, ${g}, ${b})`
}

  const generateCurlCommand = () => {
    if (!groupInfo || !groupInfo.v2Id) {
      return '// Enter a group name to generate code'
    }
    
    const { bridge, v2Id } = groupInfo
    
    let payload = {
      on: { on: onOff === 'on' }
    }
    
    if (onOff === 'on') {
      payload.dimming = { brightness: brightness }
      payload.dynamics = { duration: duration }
      
      if (colorMode === 'temp') {
        payload.color_temperature = { mirek: colorTemp }
      } else if (colorMode === 'rgb') {
        const xy = rgbToXy(rgbColor.r, rgbColor.g, rgbColor.b)
        payload.color = { xy: xy }
      }
    }
    
    const payloadStr = JSON.stringify(payload).replace(/"/g, '\\"')
    
    const script = `do shell script "curl -k -X \\"PUT\\" \\"https://${bridge.ip}/clip/v2/resource/grouped_light/${v2Id}\\" \\\\
     -H 'hue-application-key: ${bridge.username}' \\\\
     -H 'Content-Type: application/json' \\\\
     -d '${payloadStr}'"`
    
    return script
  }
  
  const handleTestCue = async () => {
    if (!groupInfo || !groupInfo.v2Id) {
      alert('Please select a valid group first')
      return
    }
    
    const { bridge, v2Id } = groupInfo
    
    try {
      let payload = {
        on: { on: onOff === 'on' }
      }
      
      if (onOff === 'on') {
        payload.dimming = { brightness: brightness }
        payload.dynamics = { duration: duration }
        
        if (colorMode === 'temp') {
          payload.color_temperature = { mirek: colorTemp }
        } else if (colorMode === 'rgb') {
          const xy = rgbToXy(rgbColor.r, rgbColor.g, rgbColor.b)
          payload.color = { xy: xy }
        }
      }
      
      const response = await fetch(`http://localhost:3001/api/hue-v2/${bridge.ip}/grouped-light/${v2Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'hue-application-key': bridge.username
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
      } else {
        alert('Failed to execute cue')
      }
    } catch (error) {
      console.error('Test error:', error)
      alert('Error testing cue: ' + error.message)
    }
  }
  
  return (
    <div>
        <div style={{ marginBottom: '24px' }}>
          <button 
              onClick={() => {
                setSelectedBridge(null)
                setHasRunRecognition(false)
                setHasShownRegistrationModal(false)
                }}
            style={{
              backgroundColor: '#ffffff',
              color: '#4a5568',
              border: '1px solid #e2e8f0',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>←</span> Back to Bridges
          </button>
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Qlab Cue Generator
        </h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Create custom lighting cues for Qlab with precise control over brightness, fade time, and color.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Left: Controls */}
          <div>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0 }}>Cue Parameters</h3>
              
              {/* Group Name Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  Group Name
                </label>
                <input
                  type="text"
                  list="group-names"
                  value={selectedGroupName}
                  onChange={(e) => setSelectedGroupName(e.target.value)}
                  placeholder="Type or select a group..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '6px'
                  }}
                />
                <datalist id="group-names">
                  {allGroupNames.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                {groupInfo && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#4CAF50' }}>
                    ✓ Found on {groupInfo.bridge.name}
                  </div>
                )}
                {selectedGroupName && !groupInfo && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#ff4444' }}>
                    Group not found
                  </div>
                )}
              </div>
              
              {/* ON/OFF */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                  State
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setOnOff('on')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: onOff === 'on' ? '#4CAF50' : '#f0f0f0',
                      color: onOff === 'on' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ON
                  </button>
                  <button
                    onClick={() => setOnOff('off')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: onOff === 'off' ? '#666' : '#f0f0f0',
                      color: onOff === 'off' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    OFF
                  </button>
                </div>
              </div>
              
              {onOff === 'on' && (
                <>
                  {/* Brightness */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                      Brightness: {brightness}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  {/* Duration */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                      Fade Duration: {(duration / 1000).toFixed(1)}s
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  {/* Color Mode */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                      Color
                    </label>
                    <select
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        border: '1px solid #cbd5e0',
                        borderRadius: '6px'
                      }}
                    >
                      <option value="none">Default (No change)</option>
                      <option value="temp">Color Temperature</option>
                      <option value="rgb">RGB Color</option>
                    </select>
                  </div>
                  
{/* Color Temperature */}
{colorMode === 'temp' && (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
      Temperature: {Math.round(1000000 / colorTemp)}K
    </label>
    
    {/* Temperature preview swatch */}
    <div style={{
      width: '100%',
      height: '40px',
      backgroundColor: getMirekColor(colorTemp),
      borderRadius: '6px',
      border: '2px solid #cbd5e0',
      marginBottom: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }} />
    
    {/* Gradient bar showing temperature range */}
    <div style={{
      width: '100%',
      height: '20px',
      background: 'linear-gradient(to right, #a8d5ff 0%, #d4e5ff 20%, #ffffff 40%, #fff9f0 60%, #ffe4c4 80%, #ffb366 100%)',
      borderRadius: '10px',
      border: '1px solid #cbd5e0',
      position: 'relative',
      marginBottom: '8px'
    }}>
      {/* Triangle indicator */}
      <div style={{
        position: 'absolute',
        left: `${((colorTemp - 153) / (500 - 153)) * 100}%`,
        top: '-8px',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '8px solid #1976d2'
      }} />
      <div style={{
        position: 'absolute',
        left: `${((colorTemp - 153) / (500 - 153)) * 100}%`,
        bottom: '-8px',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: '8px solid #1976d2'
      }} />
    </div>
    
    <input
      type="range"
      min="153"
      max="500"
      value={colorTemp}
      onChange={(e) => setColorTemp(parseInt(e.target.value))}
      style={{ width: '100%', marginBottom: '8px' }}
    />
    
    <div style={{ fontSize: '11px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
      <span>Cool (6500K)</span>
      <span>Neutral (4000K)</span>
      <span>Warm (2000K)</span>
    </div>
  </div>
)}
                  
{/* RGB Color */}
{colorMode === 'rgb' && (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
      RGB Color
    </label>
    
    <ColorWheel 
      color={rgbColor}
      onChange={setRgbColor}
    />
    
    <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
      <div>RGB: {rgbColor.r}, {rgbColor.g}, {rgbColor.b}</div>
      <div style={{ marginTop: '4px' }}>
        Hex: #{rgbColor.r.toString(16).padStart(2, '0')}{rgbColor.g.toString(16).padStart(2, '0')}{rgbColor.b.toString(16).padStart(2, '0')}
      </div>
    </div>
  </div>
)}
                </>
              )}
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={handleTestCue}
                  disabled={!groupInfo}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: groupInfo ? '#2196F3' : '#cbd5e0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: groupInfo ? 'pointer' : 'not-allowed'
                  }}
                >
                  ▶ Test Cue
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateCurlCommand())
                    alert('Code copied to clipboard!')
                  }}
                  disabled={!groupInfo}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: groupInfo ? '#4CAF50' : '#cbd5e0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: groupInfo ? 'pointer' : 'not-allowed'
                  }}
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
          
          {/* Right: Code Preview */}
          <div>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0 }}>Generated Code</h3>
              
              {groupInfo && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '6px', fontSize: '12px' }}>
                  <div><strong>Group:</strong> {groupInfo.group.name}</div>
                  <div><strong>Bridge:</strong> {groupInfo.bridge.name} ({groupInfo.bridge.ip})</div>
                  <div style={{ wordBreak: 'break-all' }}><strong>v2 ID:</strong> {groupInfo.v2Id || 'Not available'}</div>
                </div>
              )}
              
              <pre style={{
                backgroundColor: '#2d3748',
                color: '#e2e8f0',
                padding: '16px',
                borderRadius: '6px',
                fontSize: '11px',
                overflow: 'auto',
                margin: 0,
                fontFamily: 'Monaco, Consolas, monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                lineHeight: '1.6',
                minHeight: '200px'
              }}>
                {generateCurlCommand()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  {/*Fleet Management Page Component*/}
  {/*Fleet Management Page Component*/}
const FleetManagementPage = ({ 
  fleetDatabase, 
  onUpdateBulb,
  onDeleteBulb,
  setCurrentPage,
  installations,
  onAddInstallation,
  onRemoveInstallation
}) => {
  const [editingBulb, setEditingBulb] = React.useState(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterInstallation, setFilterInstallation] = React.useState('all')
  const [newInstallation, setNewInstallation] = React.useState('')
  const [showInstallationManager, setShowInstallationManager] = React.useState(false)
  
  const bulbEntries = Object.entries(fleetDatabase)
  
  const filteredBulbs = bulbEntries.filter(([uniqueId, bulb]) => {
    const matchesSearch = 
      bulb.fleetId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bulb.preferredName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesInstallation = 
      filterInstallation === 'all' || bulb.currentInstallation === filterInstallation
    
    return matchesSearch && matchesInstallation
  })
  
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => setCurrentPage('bridges')}
          style={{
            backgroundColor: '#ffffff',
            color: '#4a5568',
            border: '1px solid #e2e8f0',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <span>←</span> Back to Bridges
        </button>
      </div>
      
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
        Fleet Manager
      </h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        Manage your bulb inventory across all installations ({bulbEntries.length} bulbs)
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search by Fleet ID or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #cbd5e0',
            borderRadius: '6px'
          }}
        />
        
        <select
          value={filterInstallation}
          onChange={(e) => setFilterInstallation(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #cbd5e0',
            borderRadius: '6px'
          }}
        >
          <option value="all">All Installations</option>
          {installations.map(installation => (
            <option key={installation} value={installation}>{installation}</option>
          ))}
        </select>
        
        <button
          onClick={() => setShowInstallationManager(!showInstallationManager)}
          style={{
            padding: '10px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Manage Installation
        </button>
      </div>
      
      {showInstallationManager && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Installation List</h3>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="New installation name..."
              value={newInstallation}
              onChange={(e) => setNewInstallation(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newInstallation.trim()) {
                  onAddInstallation(newInstallation.trim())
                  setNewInstallation('')
                }
              }}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px'
              }}
            />
            <button
              onClick={() => {
                if (newInstallation.trim()) {
                  onAddInstallation(newInstallation.trim())
                  setNewInstallation('')
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Installation
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {installations.map(installation => (
              <div key={installation} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '4px'
              }}>
                <span>{installation}</span>
                <button
                  onClick={() => {
                    if (confirm(`Remove installation "${installation}"? Bulbs at this installation will keep their installation assignment.`)) {
                      onRemoveInstallation(installation)
                    }
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredBulbs.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            {bulbEntries.length === 0 
              ? 'No bulbs registered yet. Use "Recognize Fleet Bulbs" to register bulbs.'
              : 'No bulbs found. Try a different search term.'}
          </p>
        ) : (
          filteredBulbs.map(([uniqueId, bulb]) => (
            <BulbCard
              key={uniqueId}
              uniqueId={uniqueId}
              bulb={bulb}
              installations={installations}
              isEditing={editingBulb === uniqueId}
              onEdit={() => setEditingBulb(uniqueId)}
              onSave={(updates) => {
                onUpdateBulb(uniqueId, updates)
                setEditingBulb(null)
              }}
              onCancel={() => setEditingBulb(null)}
              onDelete={() => {
                if (confirm(`Delete ${bulb.fleetId} from fleet database?`)) {
                  onDeleteBulb(uniqueId)
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

{/*Bulb Card Component*/}
{/*Bulb Card Component*/}
const BulbCard = ({ uniqueId, bulb, installations, isEditing, onEdit, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = React.useState({
    fleetId: bulb.fleetId,
    preferredName: bulb.preferredName,
    currentInstallation: bulb.currentInstallation,
    purchaseDate: bulb.purchaseDate,
    notes: bulb.notes || ''
  })
  
  if (isEditing) {
    return (
      <div style={{
        backgroundColor: '#fff3cd',
        border: '2px solid #ffc107',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Editing {bulb.fleetId}</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>
              Fleet ID
            </label>
            <input
              type="text"
              value={formData.fleetId}
              onChange={(e) => setFormData({ ...formData, fleetId: e.target.value.toUpperCase() })}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>
              Preferred Name
            </label>
            <input
              type="text"
              value={formData.preferredName}
              onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>
              Current Installation
            </label>
            <select
              value={formData.currentInstallation}
              onChange={(e) => setFormData({ ...formData, currentInstallation: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px'
              }}
            >
              {installations.map(installation => (
                <option key={installation} value={installation}>{installation}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>
              Purchase Date
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #cbd5e0',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #cbd5e0',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onSave(formData)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save Changes
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }
  
  const age = bulb.purchaseDate ? 
    Math.floor((new Date() - new Date(bulb.purchaseDate)) / (1000 * 60 * 60 * 24 * 30)) : 
    null
  
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      padding: '20px',
      borderRadius: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
            {bulb.fleetId} • {bulb.preferredName}
          </h3>
          <div style={{ fontSize: '13px', color: '#666' }}>
            📍 {bulb.currentInstallation} • {bulb.currentBridge || 'Unknown bridge'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEdit}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>
      
{/* Bridge and Light ID Info */}
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
  gap: '12px',
  fontSize: '13px',
  marginBottom: '12px',
  paddingBottom: '12px',
  borderBottom: '1px solid #e2e8f0'
}}>
  <div>
    <div style={{ color: '#999', fontSize: '11px' }}>Current Bridge</div>
    <div style={{ fontWeight: '600' }}>{bulb.currentBridge || 'Unknown'}</div>
  </div>
  <div>
    <div style={{ color: '#999', fontSize: '11px' }}>Light ID on Bridge</div>
    <div style={{ fontWeight: '600', fontFamily: 'monospace' }}>{bulb.currentLightId || 'N/A'}</div>
  </div>
</div>

{/* Stats Grid */}
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
  gap: '12px',
  fontSize: '13px'
}}>
  <div>
    <div style={{ color: '#999', fontSize: '11px' }}>Offline Count</div>
    <div style={{ fontWeight: '600' }}>{bulb.timesOffline || 0} times</div>
  </div>
  <div>
    <div style={{ color: '#999', fontSize: '11px' }}>Age</div>
    <div style={{ fontWeight: '600' }}>{age ? `${age} months` : 'Unknown'}</div>
  </div>
  <div>
    <div style={{ color: '#999', fontSize: '11px' }}>Purchase Date</div>
    <div style={{ fontWeight: '600' }}>{bulb.purchaseDate || 'Not set'}</div>
  </div>
  <div>
    <div style={{ color: '#999', fontSize: '11px' }}>Last Seen</div>
    <div style={{ fontWeight: '600' }}>
      {bulb.lastSeen ? new Date(bulb.lastSeen).toLocaleDateString() : 'Never'}
    </div>
  </div>
</div>

{bulb.notes && (
  <div style={{ 
    marginTop: '12px', 
    padding: '12px', 
    backgroundColor: '#f8f9fa', 
    borderRadius: '4px',
    fontSize: '13px'
  }}>
    <strong>Notes:</strong> {bulb.notes}
  </div>
)}

<div style={{ 
  marginTop: '12px',
  fontSize: '11px',
  color: '#999',
  fontFamily: 'monospace'
}}>
  Hardware ID: {uniqueId}
</div>
      
      {bulb.notes && (
        <div style={{ 
          marginTop: '12px', 
          padding: '12px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          <strong>Notes:</strong> {bulb.notes}
        </div>
      )}
    </div>
  )
}
function App() {

const style = document.createElement('style')
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`
document.head.appendChild(style)

//State Declarations
  const [bridges, setBridges] = React.useState([])
  const [manualIP, setManualIP] = React.useState('')
  const [manualName, setManualName] = React.useState('')
  const [selectedBridge, setSelectedBridge] = React.useState(null)
  const [lights, setLights] = React.useState({})
  const [groups, setGroups] = React.useState({})
  const [newGroupName, setNewGroupName] = React.useState('')
  const [editingLight, setEditingLight] = React.useState(null)
  const [editName, setEditName] = React.useState('')
  const [showImportDialog, setShowImportDialog] = React.useState(false)
  const [showAddLightsPanel, setShowAddLightsPanel] = React.useState(false)
  const [addLightMethod, setAddLightMethod] = React.useState('touchlink') // 'touchlink' or 'manual'
  const [touchlinkActive, setTouchlinkActive] = React.useState(false)
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanResults, setScanResults] = React.useState(null);'/'
  const [showQlabScript, setShowQlabScript] = React.useState({})
  const [currentPage, setCurrentPage] = React.useState('bridges') // 'bridges', 'lights', 'generator'
  const [allLoadedGroups, setAllLoadedGroups] = React.useState({})
  const [bridgeConnections, setBridgeConnections] = React.useState({})
  const [groupV2Ids, setGroupV2Ids] = React.useState({})
  const [installations, setInstallations] = React.useState([])
  const recognitionInProgress = React.useRef(false)
  const [hasRunRecognition, setHasRunRecognition] = React.useState(false)
  const [hasShownRegistrationModal, setHasShownRegistrationModal] = React.useState(false)
  // Fleet management states
  const [fleetDatabase, setFleetDatabase] = React.useState({})
  const [showFleetPage, setShowFleetPage] = React.useState(false)
  const [unregisteredBulbs, setUnregisteredBulbs] = React.useState([])
  const [showRegistrationModal, setShowRegistrationModal] = React.useState(false)


  React.useEffect(() => {
  const saved = hueService.getAllBridges()
  setBridges(saved)
  
  const cachedV2Ids = localStorage.getItem('group_v2_ids')
  if (cachedV2Ids) {
    setGroupV2Ids(JSON.parse(cachedV2Ids))
  }
}, [])

  React.useEffect(() => {
    const saved = hueService.getAllBridges()
    setBridges(saved)
  }, [])

React.useEffect(() => {
  if (currentPage === 'generator') {
    return
  }
  if (bridges.length > 0) {
    checkBridgeConnections()
    const interval = setInterval(checkBridgeConnections, 10000)
    return () => clearInterval(interval)
  }
}, [bridges, currentPage])

  React.useEffect(() => {
  if (selectedBridge) {
    // Refresh light states every 5 seconds while managing a bridge
    const interval = setInterval(() => {
      loadBridgeData(selectedBridge)
    }, 5000)
    
    return () => clearInterval(interval)
  }
}, [selectedBridge])

React.useEffect(() => {
  if (!selectedBridge || currentPage !== 'bridges') return
  
  const interval = setInterval(() => {
    console.log('Auto-refreshing lights...')
    loadBridgeData(selectedBridge)
  }, 30000)
  
  return () => clearInterval(interval)
}, [selectedBridge, currentPage])

// Load fleet database from localStorage
React.useEffect(() => {
  const stored = localStorage.getItem('fleet_database')
  if (stored) {
    try {
      setFleetDatabase(JSON.parse(stored))
      console.log('Fleet database loaded:', JSON.parse(stored))
    } catch (e) {
      console.error('Failed to load fleet database:', e)
    }
  }
}, [])

// Save fleet database to localStorage whenever it changes
const saveFleetDatabase = (newFleetData) => {
  setFleetDatabase(newFleetData)
  localStorage.setItem('fleet_database', JSON.stringify(newFleetData))
  console.log('Fleet database saved:', newFleetData)
}

// Register a new bulb in the fleet
const registerBulb = (uniqueId, fleetData) => {
  const newFleetDb = {
    ...fleetDatabase,
    [uniqueId]: {
      ...fleetData,
      history: [
        ...(fleetDatabase[uniqueId]?.history || []),
        {
          date: new Date().toISOString(),
          event: fleetData.event || 'Registered'
        }
      ]
    }
  }
  saveFleetDatabase(newFleetDb)
}

// Update bulb metadata
const updateBulbMetadata = (uniqueId, updates) => {
  if (!fleetDatabase[uniqueId]) return
  
  const newFleetDb = {
    ...fleetDatabase,
    [uniqueId]: {
      ...fleetDatabase[uniqueId],
      ...updates,
      history: [
        ...fleetDatabase[uniqueId].history,
        {
          date: new Date().toISOString(),
          event: updates.event || 'Updated'
        }
      ]
    }
  }
  saveFleetDatabase(newFleetDb)
}

const recognizeFleetBulbs = async (bridgeIp, username, lightsData) => {
  // Only run recognition once per session
  if (hasRunRecognition) {
    console.log('Recognition already completed this session, skipping...')
    return { recognizedCount: 0, newBulbs: [] }
  }
  
  if (recognitionInProgress.current) {
    console.log('Recognition already in progress, skipping...')
    return { recognizedCount: 0, newBulbs: [] }
  }
  
  recognitionInProgress.current = true
  setHasRunRecognition(true)  // Mark as done
  console.log('Checking for fleet bulbs...')
  
  let recognizedCount = 0
  let newBulbs = []
  
  for (const [lightId, light] of Object.entries(lightsData)) {
    const uniqueId = light.uniqueid
    
    if (fleetDatabase[uniqueId]) {
      const fleetData = fleetDatabase[uniqueId]
      console.log(`Recognized fleet bulb: ${fleetData.fleetId}`)
      
      if (light.name !== fleetData.preferredName) {
        console.log(`Renaming ${light.name} → ${fleetData.preferredName}`)
        try {
          await hueService.renameLight(bridgeIp, username, lightId, fleetData.preferredName)
          recognizedCount++
        } catch (error) {
          console.error('Failed to rename:', error)
        }
      } else {
        recognizedCount++
      }
      
      updateBulbMetadata(uniqueId, {
        currentBridge: bridgeIp,
        currentLightId: lightId,
        lastSeen: new Date().toISOString(),
        event: `Detected on bridge ${bridgeIp}`
      })
    } else {
      newBulbs.push({ lightId, light })
    }
  }
  
  recognitionInProgress.current = false
  
  console.log(`Recognized ${recognizedCount} bulbs, found ${newBulbs.length} new`)
  
  if (newBulbs.length > 0) {
    setUnregisteredBulbs(newBulbs)
    setShowRegistrationModal(true)
    setHasShownRegistrationModal(true)
  }
  
  return { recognizedCount, newBulbs }
}

React.useEffect(() => {
  const stored = localStorage.getItem('installations')
  if (stored) {
    setInstallations(JSON.parse(stored))
  } else {
    // Default installations
    const defaultInstallations = ['Constantinopoliad Installation', 'Drinking Brecht Installation', 'Available for Allocation']
    setInstallations(defaultInstallations)
    localStorage.setItem('installations', JSON.stringify(defaultInstallations))
  }
}, [])

const saveInstallations = (newInstallation) => {
  setInstallations(newInstallation)
  localStorage.setItem('installations', JSON.stringify(newInstallation))
}

const handleRegisterBulb = (uniqueId, formData) => {
  registerBulb(uniqueId, {
    fleetId: formData.fleetId,
    preferredName: formData.preferredName,
    currentInstallation: formData.installation,
    purchaseDate: formData.purchaseDate,
    notes: formData.notes,
    timesOffline: 0,
    currentBridge: selectedBridge.ip,
    event: 'Registered in fleet database'
  })
  
  console.log(`Registered bulb ${formData.fleetId}`)
}

const handleSkipBulb = (uniqueId) => {
  console.log(`Skipped bulb ${uniqueId}`)
}

const handleCloseRegistration = () => {
  setUnregisteredBulbs([])
}

const handleAddManualBridge = () => {
    if (manualIP) {
      const newBridge = {
        id: 'manual-' + Date.now(),
        ip: manualIP,
        name: manualName || `Bridge (${manualIP})`,
        connected: false,
        username: null
      }
      hueService.addBridge(newBridge)
      setBridges([...bridges, newBridge])
      setManualIP('')
      setManualName('')
    }
  }

  const handleConnect = async (bridge) => {
    try {
      const username = await hueService.authenticate(bridge.ip)
      const updatedBridge = { ...bridge, connected: true, username: username }
      hueService.addBridge(updatedBridge)
      setBridges(bridges.map(b => b.id === bridge.id ? updatedBridge : b))
      alert(`Connected! API Key saved.`)
    } catch (error) {
      alert(error.message)
    }
  }

 const handleSelectBridge = async (bridge) => {
  setLights({})
  setGroups({})
  
  setSelectedBridge(bridge)
  setHasRunRecognition(false)
  setHasShownRegistrationModal(false)
  
  await loadBridgeData(bridge)
}

const handleEnableTouchlinkForAdd = async () => {
  if (!selectedBridge) return
  
  try {
    console.log('Enabling touchlink on', selectedBridge.name)
    await hueService.enableTouchlink(selectedBridge.ip, selectedBridge.username)
    console.log('Touchlink enabled')
    
    setTouchlinkActive(true)
    
    // Auto-disable after 60 seconds
    setTimeout(() => {
      setTouchlinkActive(false)
    }, 60000)
    
  } catch (error) {
    console.error('Error enabling touchlink:', error)
    alert('Failed to enable touchlink: ' + error.message)
  }
}

const handleStartLightScan = async () => {
  if (!selectedBridge) return
  
  setIsScanning(true)
  setScanResults(null)
  
  try {
    await hueService.scanForLights(selectedBridge.ip, selectedBridge.username)
    console.log('Light scan started')
    
    // Auto-check after 45 seconds
    setTimeout(async () => {
      setIsScanning(false)
      await handleCheckForNewLights()
    }, 45000)
  } catch (error) {
    console.error('Error starting scan:', error)
    alert('Failed to start scan: ' + error.message)
    setIsScanning(false)
  }
}

const handleCheckForNewLights = async () => {
  if (!selectedBridge) return
  
 try {
    console.log('Checking for new lights on:', selectedBridge.name)
    const newLights = await hueService.getNewLights(selectedBridge.ip, selectedBridge.username)
    console.log('API Response:', newLights)
    
    const lightIds = Object.keys(newLights).filter(key => key !== 'lastscan')
    console.log('New light IDs found:', lightIds)
    
    if (lightIds.length > 0) {
      setScanResults({ found: true, count: lightIds.length })
      
      console.log('Before refresh - current lights:', Object.keys(lights).length)
      await loadBridgeData(selectedBridge)
      console.log('After refresh - should update soon')
      
    } else {
      console.log('No new lights found')
      setScanResults({ found: false, count: 0 })
    }
  } catch (error) {
    console.error('Error checking for new lights:', error)
    alert('Failed to check for new lights: ' + error.message)
  }
}

const handleDeleteLight = async (lightId) => {
  if (!selectedBridge) return
  
  const light = lights[lightId]
  const confirmDelete = window.confirm(
    `Delete "${light?.name}" from ${selectedBridge.name}?\n\n` +
    `The light will be removed from this bridge. To use it again, you'll need to reset it physically and re-pair it.`
  )
  
  if (!confirmDelete) return
  
  try {
    await hueService.deleteLight(selectedBridge.ip, selectedBridge.username, lightId)
    console.log(`Deleted light ${lightId}`)
    
    // Refresh bridge data
    await loadBridgeData(selectedBridge)
    
    alert(`"${light?.name}" has been deleted from ${selectedBridge.name}`)
  } catch (error) {
    console.error('Error deleting light:', error)
    alert('Failed to delete light: ' + error.message)
  }
}

const generateQlabScript = (groupId) => {
  const v2Id = groupV2Ids[selectedBridge?.ip]?.[groupId]
  
  if (!v2Id) {
    return '-- No v2 ID available. Add a light to this group first.'
  }
  
  const script = `do shell script "curl -k -X \\"PUT\\" \\"https://${selectedBridge.ip}/clip/v2/resource/grouped_light/${v2Id}\\" \\\\
     -H 'hue-application-key: ${selectedBridge.username}' \\\\`
  
  return script
}

const loadBridgeData = async (bridge) => {
  console.log('Loading data for:', bridge.name, bridge.ip)
  try {
    const [lightsData, groupsData] = await Promise.all([
      hueService.getLights(bridge.ip, bridge.username),
      hueService.getGroups(bridge.ip, bridge.username)
    ])
    
    console.log('Received lights:', Object.keys(lightsData).length)
    console.log('Light IDs:', Object.keys(lightsData))
    console.log('Received groups:', Object.keys(groupsData).length)
    
    console.log('About to update state...')
    setLights(lightsData)  // ← Should be lightsData, NOT finalLightsData
    setGroups(groupsData)
    setAllLoadedGroups(prev => ({ ...prev, [bridge.ip]: groupsData }))
    console.log('State updated!')
    
    // Fetch v2 IDs
    try {
      const v2Mapping = await hueService.getGroupedLightIds(bridge.ip, bridge.username)
      console.log('v2 IDs fetched:', v2Mapping)
      
      const newV2Ids = {
        ...groupV2Ids,
        [bridge.ip]: v2Mapping
      }
      setGroupV2Ids(newV2Ids)
      localStorage.setItem('group_v2_ids', JSON.stringify(newV2Ids))
    } catch (v2Error) {
      console.log('Could not fetch v2 IDs:', v2Error.message)
    }
  
  } catch (error) {
    console.error('Load error:', error)
    alert('Failed to load bridge data: ' + error.message)
  }
}

  const handleAddInstallation = (installationName) => {
    if (!installationName || installations.includes(installationName)) {
      alert('Installation already exists or is invalid')
      return
    }
    
    const newInstallation = [...installations, installationName]
    saveInstallations(newInstallation)
  }

  const handleRemoveInstallation = (installationName) => {
    const newInstallation = installations.filter(v => v !== installationName)
    saveInstallations(newInstallation)
  }

  const handleUpdateFleetBulb = (uniqueId, updates) => {
    updateBulbMetadata(uniqueId, {
      ...updates,
      event: 'Metadata updated'
    })
  }

  const handleDeleteFleetBulb = (uniqueId) => {
    const newFleetDb = { ...fleetDatabase }
    delete newFleetDb[uniqueId]
    saveFleetDatabase(newFleetDb)
  }

  const handleCreateGroup = async () => {
    if (!newGroupName || !selectedBridge) return
    
    try {
      await hueService.createGroup(selectedBridge.ip, selectedBridge.username, newGroupName, [])
      console.log('Group created, now refreshing...')
      await loadBridgeData(selectedBridge)
       await refreshV2Ids()
      
      setNewGroupName('')
      alert('Group created!')
    } catch (error) {
      alert('Failed to create group: ' + error.message)
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Delete this group?')) return
    
    try {
      await hueService.deleteGroup(selectedBridge.ip, selectedBridge.username, groupId)
      await loadBridgeData(selectedBridge)
       await refreshV2Ids()
    } catch (error) {
      alert('Failed to delete group: ' + error.message)
    }
  }

  const handleAddLightToGroup = async (groupId, lightId) => {
    const group = groups[groupId]
    if (!group) return

    if (group.lights.includes(lightId)) {
      alert('Light already in this group')
      return
    }

    try {
      const newLights = [...group.lights, lightId]
      await hueService.updateGroup(selectedBridge.ip, selectedBridge.username, groupId, newLights)
      await loadBridgeData(selectedBridge)
       await refreshV2Ids()
    } catch (error) {
      alert('Failed to add light: ' + error.message)
    }
  }

  const refreshV2Ids = async () => {
  if (!selectedBridge) return
  
  try {
    const v2Mapping = await hueService.getGroupedLightIds(selectedBridge.ip, selectedBridge.username)
    console.log('Refreshed v2 IDs:', v2Mapping)
    
    const newV2Ids = {
      ...groupV2Ids,
      [selectedBridge.ip]: v2Mapping
    }
    setGroupV2Ids(newV2Ids)
    localStorage.setItem('group_v2_ids', JSON.stringify(newV2Ids))
  } catch (error) {
    console.log('Could not fetch v2 IDs:', error.message)
  }
}

  const handleRemoveLightFromGroup = async (groupId, lightId) => {
    const group = groups[groupId]
    if (!group) return

    try {
      const newLights = group.lights.filter(id => id !== lightId)
      await hueService.updateGroup(selectedBridge.ip, selectedBridge.username, groupId, newLights)
      await loadBridgeData(selectedBridge)
    } catch (error) {
      alert('Failed to remove light: ' + error.message)
    }
  }

  const handleStartEdit = (lightId, currentName) => {
    setEditingLight(lightId)
    setEditName(currentName)
  }

  const handleRenameLight = async (lightId) => {
    if (!editName.trim()) return
    
    try {
      await hueService.renameLight(selectedBridge.ip, selectedBridge.username, lightId, editName)
      await loadBridgeData(selectedBridge)
      setEditingLight(null)
      setEditName('')
    } catch (error) {
      alert('Failed to rename: ' + error.message)
    }
  }

  const handleCancelEdit = () => {
    setEditingLight(null)
    setEditName('')
  }

// Export API info for Qlab (current functionality)
const handleExportForQlab = () => {
  if (!selectedBridge) {
    alert('Please select a bridge first to export its data')
    return
  }
  
  const exportData = {
    bridge: {
      name: selectedBridge.name,
      ipAddress: selectedBridge.ip,
      apiKey: selectedBridge.username
    },
    groups: Object.entries(groups).map(([groupId, group]) => ({
      name: group.name,
      v1GroupId: groupId,
      v2GroupedLightId: groupV2Ids[selectedBridge.ip]?.[groupId] || 'Not available',
      lightCount: group.lights?.length || 0,
      lightIds: group.lights || []
    })),
    exportedAt: new Date().toISOString(),
    exportedBy: 'Sister Sylvester LX Manager'
  }
  
  const dataStr = JSON.stringify(exportData, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${selectedBridge.name.replace(/\s+/g, '-')}-qlab-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
}

// Export bridge configuration (to reuse on other computers)
const handleExportBridgeConfig = async () => {
  const configData = {
    bridges: bridges.map(b => ({
      id: b.id,
      name: b.name,
      ip: b.ip,
      username: b.username,
      connected: b.connected
    })),
    groupV2Ids: groupV2Ids,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }
  
  const dataStr = JSON.stringify(configData, null, 2)
  const filename = `hue-bridge-config-${new Date().toISOString().split('T')[0]}.json`
  
  // Check if running in Electron
  if (window.electronAPI) {
    const result = await window.electronAPI.saveFile(filename, dataStr)
    if (result.success) {
      alert(`Bridge configuration saved to:\n${result.path}`)
    }
  } else {
    // Fallback for browser
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    alert('Bridge configuration exported! Check your Downloads folder.')
  }
}

// Import bridge configuration
const handleImportBridgeConfig = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const configData = JSON.parse(e.target.result)
      
      // Import bridges
      const importedBridges = hueService.importBridges(configData.bridges)
      setBridges(importedBridges)
      
      // Import v2 IDs if available
      if (configData.groupV2Ids) {
        setGroupV2Ids(configData.groupV2Ids)
        localStorage.setItem('group_v2_ids', JSON.stringify(configData.groupV2Ids))
      }
      
      alert(`Successfully imported ${importedBridges.length} bridge(s)!`)
      
      // Reset file input
      event.target.value = ''
    } catch (error) {
      alert('Failed to import configuration: ' + error.message)
    }
  }
  reader.readAsText(file)
}

  const handleRemoveBridge = (bridgeId) => {
    if (confirm('Remove this bridge?')) {
      const newBridges = bridges.filter(b => b.id !== bridgeId)
      setBridges(newBridges)
      localStorage.setItem('hue_bridges', JSON.stringify(newBridges))
      if (selectedBridge?.id === bridgeId) {
        setSelectedBridge(null)
        setLights({})
        setGroups({})
      }
    }
  }
  const handleToggleGroup = async (groupId, turnOn) => {
  if (!selectedBridge) return
  
  try {
    const state = {
      on: turnOn,
      bri: 254  // Full brightness when turning on
    }
    
    await hueService.setGroupState(selectedBridge.ip, selectedBridge.username, groupId, state)
    console.log(`Group ${groupId} turned ${turnOn ? 'ON' : 'OFF'}`)
  } catch (error) {
    alert('Failed to toggle group: ' + error.message)
  }
}

const checkBridgeConnections = async () => {
  const connectionStatus = {}
  
  for (const bridge of bridges) {
    if (bridge.username) {
      const isConnected = await hueService.checkConnection(bridge.ip, bridge.username)
      connectionStatus[bridge.id] = isConnected
    } else {
      connectionStatus[bridge.id] = false
    }
  }
  
setBridgeConnections(connectionStatus)
}


const handleCopyGroupId = (groupId) => {
  navigator.clipboard.writeText(groupId)
  alert(`Group ID ${groupId} copied to clipboard!`)
}

  const getUngroupedLights = () => {
    const groupedLightIds = new Set()
    Object.values(groups).forEach(group => {
      group.lights.forEach(lightId => groupedLightIds.add(lightId))
    })
    
    return Object.entries(lights).filter(([id]) => !groupedLightIds.has(id))
  }

  const loadAllBridgeGroups = React.useCallback(async () => {
  const allGroups = {}
  
  for (const bridge of bridges) {
    if (bridge.connected && bridge.username) {
      try {
        const groupsData = await hueService.getGroups(bridge.ip, bridge.username)
        allGroups[bridge.ip] = groupsData
        console.log(`Loaded ${Object.keys(groupsData).length} groups from ${bridge.name}`)
      } catch (error) {
        console.error(`Failed to load groups for ${bridge.name}:`, error)
      }
    }
  }
  
  setAllLoadedGroups(allGroups)
}, [bridges])

  return (
  <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
    
    {/* Fleet Bulb Registration Modal */}
    {showRegistrationModal && (
      <BulbRegistrationModal
        bulbs={unregisteredBulbs}
        installations={installations}
        onRegister={handleRegisterBulb}
        onSkip={handleSkipBulb}
        onClose={handleCloseRegistration}
      />
    )}

{currentPage === 'generator' && (
  <QlabGeneratorPage 
    bridges={bridges}
    allLoadedGroups={allLoadedGroups}
    loadAllBridgeGroups={loadAllBridgeGroups}
    groupV2Ids={groupV2Ids}
    setCurrentPage={setCurrentPage}
  />
)}

{currentPage === 'fleet' && (
  <FleetManagementPage
    fleetDatabase={fleetDatabase}
    onUpdateBulb={handleUpdateFleetBulb}
    onDeleteBulb={handleDeleteFleetBulb}
    setCurrentPage={setCurrentPage}
    installations={installations}
    onAddInstallation={handleAddInstallation}
    onRemoveInstallation={handleRemoveInstallation}
  />
)}

{currentPage === 'bridges' && (
      <div>
    {/* Header when NOT managing a bridge */}
    {!selectedBridge && (
      <div style={{ 
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ 
          margin: 0,
          fontSize: '28px',
          fontWeight: '700',
          color: '#1a202c',
          letterSpacing: '-0.5px'
        }}>
          Sister Sylvester LX Manager
        </h1>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          
  {/* Qlab Generator Button */}        
      <button 
        onClick={() => setCurrentPage('generator')}
        style={{
          backgroundColor: '#9C27B0',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        Qlab Generator
      </button>

    {/*Fleet Management Button */}
    <button 
    onClick={() => setCurrentPage('fleet')}
    style={{
      backgroundColor: '#FF9800',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    }}
  >
    Fleet Manager
  </button>

   {/* Import Bridge Config */}
      <label style={{
        backgroundColor: '#ffffff',
        color: '#1976d2',
        border: '1px solid #1976d2',
        padding: '4px 20px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1976d21a'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}>

        Import Bridge Config
        <input 
          type="file" 
          accept=".json"
          onChange={handleImportBridgeConfig}
          style={{ display: 'none' }}
        />
      </label>
      
      {/* Export Bridge Config */}
      <button 
        onClick={handleExportBridgeConfig}
        style={{
          backgroundColor: '#1976d292',
          color: '#ffffff',
          border: 'none',
          padding: '4px 20px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#1976d2'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#1976d292'}
      >
        Export Bridge Config
      </button>

          <button 
            onClick={checkBridgeConnections}
            style={{
              backgroundColor: '#1976d292',
              color: '#ffffff',
              border: '0px solid #e2e8f0',
              padding: '4px 20px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1976d2'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#1976d292'
            }}
          >
            Check Connections
          </button>

        </div>
      </div>
    )}
    
    {/* Header when managing a bridge */}
    {selectedBridge && (
      <div style={{ marginBottom: '20px' }}>

        <button 
          onClick={() => setSelectedBridge(null)}
          style={{
            backgroundColor: '#ffffff',
            color: '#4a5568',
            border: '1px solid #e2e8f0',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f7fafc'
            e.target.style.borderColor = '#cbd5e0'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ffffff'
            e.target.style.borderColor = '#e2e8f0'
          }}
        >
          <span>←</span> Back to Bridges
        </button>
      </div>
    )}

      {!selectedBridge && (
        <>
          <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
            <h3>Add Bridge:</h3>
            <input 
              type="text" 
              placeholder="Name (e.g., Bridge 1)"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              style={{ padding: '8px', width: '200px', marginRight: '10px' }}
            />
            <input 
              type="text" 
              placeholder="IP (e.g., 192.168.1.71)"
              value={manualIP}
              onChange={(e) => setManualIP(e.target.value)}
              style={{ padding: '8px', width: '200px', marginRight: '10px' }}
            />
            <button onClick={handleAddManualBridge}>Add Bridge</button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h2>Installation Bridges:</h2>
            {bridges.map(bridge => (
              <div key={bridge.id} style={{ 
                border: '1px solid #ddd', 
                padding: '15px', 
                marginBottom: '10px',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <h3 style={{ margin: 0 }}>{bridge.name}</h3>
    {bridgeConnections[bridge.id] !== undefined && (
      <span style={{
        display: 'inline-block',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: bridgeConnections[bridge.id] ? '#4CAF50' : '#ff4444',
        border: '2px solid ' + (bridgeConnections[bridge.id] ? '#45a049' : '#cc0000'),
        animation: bridgeConnections[bridge.id] ? 'pulse 2s infinite' : 'none'
      }} title={bridgeConnections[bridge.id] ? 'Connected' : 'Disconnected'} />
    )}
  </div>
  <p style={{ margin: '5px 0' }}>IP: {bridge.ip}</p>
  {bridge.username && <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>API Key: {bridge.username.slice(0, 100)}</p>}
  <p style={{ fontSize: '14px', color: bridgeConnections[bridge.id] ? '#4CAF50' : '#ff4444', fontWeight: '500', margin: '5px 0' }}>
    {bridgeConnections[bridge.id] ? '✓ Online' : '✗ Offline'}
  </p>
</div>
                  <div>
                    <button onClick={() => handleRemoveBridge(bridge.id)} style={{ background: '#ff4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
                      Remove
                    </button>
                    {bridge.connected && (
                      <button onClick={() => handleSelectBridge(bridge)} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>
                        Manage Lights →
                      </button>
                    )}
                  </div>
                </div>
                
                {!bridge.connected && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                      Press the button on your Hue bridge, then click Connect
                    </p>
                    <button onClick={() => handleConnect(bridge)}>Connect</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {selectedBridge && (
        <div>
          <div>
<div>
  {/* Title + Status + Buttons Row */}
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px' 
  }}>
    {/* Left: Title + Status */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <h2 style={{ margin: 0 }}>{selectedBridge.name} - Light Management</h2>
      {bridgeConnections[selectedBridge.id] !== undefined && (
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: bridgeConnections[selectedBridge.id] ? '#e8f5e9' : '#ffebee',
          color: bridgeConnections[selectedBridge.id] ? '#2e7d32' : '#c62828',
          border: '1px solid ' + (bridgeConnections[selectedBridge.id] ? '#4CAF50' : '#ff4444')
        }}>
          {bridgeConnections[selectedBridge.id] ? '● ONLINE' : '● OFFLINE'}
        </span>
      )}
    </div>
    
    {/* Right: Action Buttons */}
    <div style={{ display: 'flex', gap: '12px' }}>
            
      <button 
        onClick={handleExportForQlab}
        style={{
          backgroundColor: '#1976d292',
          color: 'white',
          border: 'none',
          padding: '4px 20px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#1976d2'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#1976d292'
        }}
      >
        Export API Info
      </button>

      <button 
        onClick={checkBridgeConnections}
        style={{
          backgroundColor: '#1976d292',
          color: '#ffffff',
          border: 'none',
          padding: '4px 20px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#1976d2'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#1976d292'
        }}
      >
        Check Connections
      </button>

      <button 
        onClick={async () => {
          console.log('Manual fleet recognition triggered')
          const lightsData = await hueService.getLights(selectedBridge.ip, selectedBridge.username)
          const { recognizedCount } = await recognizeFleetBulbs(selectedBridge.ip, selectedBridge.username, lightsData)
          
          // Only reload if we actually renamed bulbs
          if (recognizedCount > 0) {
            const updatedLightsData = await hueService.getLights(selectedBridge.ip, selectedBridge.username)
            setLights(updatedLightsData)
          }
        }}
        style={{
          backgroundColor: '#FF9800',
          color: 'white',
          border: 'none',
          padding: '4px 20px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#F57C00'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#FF9800'
        }}
      >
        Recognize Fleet Bulbs
      </button>
    </div>
  </div>
</div>

 <div style={{ 
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr',
  gap: '16px',
  marginBottom: '24px'
}}>

{/* Bridge Name Card - Wider */}
<div style={{
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  padding: '16px',
  borderRadius: '8px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
}}>
  <div style={{ fontSize: '11px', color: '#718096', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bridge</div>
  <div style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>{selectedBridge.name}</div>
  <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px', fontFamily: 'monospace' }}>{selectedBridge.ip}</div>
  
  {/* API Key */}
  <div style={{ 
    backgroundColor: '#e3f2fd', 
    padding: '8px 12px', 
    borderRadius: '4px',
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ 
        fontSize: '10px', 
        fontWeight: '600',
        color: '#1976d2',
        marginBottom: '4px'
      }}>
        API Key:
      </div>
      <code style={{ 
        fontSize: '11px', 
        color: '#1976d2',
        wordBreak: 'break-all',
        display: 'block'
      }}>
        {selectedBridge.username}
      </code>
    </div>
    <button
      onClick={() => {
        navigator.clipboard.writeText(selectedBridge.username)
        alert('API Key copied to clipboard!')
      }}
      style={{
        marginLeft: '12px',
        padding: '4px 10px',
        fontSize: '10px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '500',
        flexShrink: 0
      }}
    >
      Copy
    </button>
  </div>
</div>

  {/* Lights Count Card */}
  <div style={{
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  }}>
    <div style={{ fontSize: '11px', color: '#718096', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Lights</div>
    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2d3748' }}>{Object.keys(lights).length}</div>
  </div>
  
  {/* Groups Count Card */}
  <div style={{
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  }}>
    <div style={{ fontSize: '11px', color: '#718096', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Groups</div>
    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2d3748' }}>{Object.keys(groups).length}</div>
  </div>
</div>
</div>

{/* Add New Lights Section */}
<div style={{
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '24px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
}}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>
      Add New Lights
    </h3>
    <button
      onClick={() => setShowAddLightsPanel(!showAddLightsPanel)}
      style={{
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
      }}
    >
      {showAddLightsPanel ? 'Hide' : '+ Add New Lights'}
    </button>
  </div>
  
  {showAddLightsPanel && (
    <div style={{ marginTop: '20px' }}>
      {/* Method Selection */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setAddLightMethod('touchlink')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '6px',
            border: addLightMethod === 'touchlink' ? '2px solid #2196F3' : '1px solid #e2e8f0',
            backgroundColor: addLightMethod === 'touchlink' ? '#e3f2fd' : '#fff',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Touchlink
        </button>
        <button
          onClick={() => setAddLightMethod('manual')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '6px',
            border: addLightMethod === 'manual' ? '2px solid #4CAF50' : '1px solid #e2e8f0',
            backgroundColor: addLightMethod === 'manual' ? '#e8f5e9' : '#fff',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Manual Reset
        </button>
      </div>
      
      {/* Touchlink Method */}
      {addLightMethod === 'touchlink' && (
        <div>
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #2196F3'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#1565c0' }}>
              Touchlink Instructions:
            </h4>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#0d47a1', fontSize: '13px', lineHeight: '1.8' }}>
              <li><strong>Delete the light from its current bridge first</strong></li>
              <li>Make sure the light is powered ON</li>
              <li>Place the light within 3 feet of this bridge</li>
              <li>Click "Enable Touchlink" below</li>
              <li>Press the physical button on this bridge</li>
              <li>Light should flash 3 times if successful</li>
              <li>Click "Check for New Lights" after 30 seconds</li>
            </ol>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleEnableTouchlinkForAdd}
              disabled={touchlinkActive}
              style={{
                backgroundColor: touchlinkActive ? '#cbd5e0' : '#2196F3',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: touchlinkActive ? 'not-allowed' : 'pointer'
              }}
            >
              {touchlinkActive ? '✓ Touchlink Enabled - Press Bridge Button Now!' : 'Enable Touchlink'}
            </button>
            
            {touchlinkActive && (
              <div style={{
                backgroundColor: '#fff3cd',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #fbbf24',
                fontSize: '13px',
                fontWeight: '600',
                color: '#78350f',
                textAlign: 'center'
              }}>
                ⚠️ Press the button on {selectedBridge.name} NOW!
              </div>
            )}
            
            <button
              onClick={handleCheckForNewLights}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Check for New Lights
            </button>
          </div>
        </div>
      )}
      
      {/* Manual Reset Method */}
      {addLightMethod === 'manual' && (
        <div>
          <div style={{
            backgroundColor: '#e8f5e9',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #4CAF50'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#2e7d32' }}>
              Manual Reset Instructions:
            </h4>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#1b5e20', fontSize: '13px', lineHeight: '1.8' }}>
              <li><strong>Delete the light from its current bridge first</strong></li>
              <li>Turn the light OFF for 5 seconds</li>
              <li>Turn the light ON for 5 seconds</li>
              <li>Repeat 6 times total (OFF-ON-OFF-ON-OFF-ON-OFF-ON-OFF-ON-OFF-ON)</li>
              <li>Light will blink to confirm reset</li>
              <li>Click "Search for New Lights" below</li>
              <li>Wait 30-60 seconds</li>
              <li>Click "Check for New Lights"</li>
            </ol>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleStartLightScan}
              disabled={isScanning}
              style={{
                backgroundColor: isScanning ? '#cbd5e0' : '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isScanning ? 'not-allowed' : 'pointer'
              }}
            >
              {isScanning ? 'Scanning...' : '🔍 Search for New Lights'}
            </button>
            
            <button
              onClick={handleCheckForNewLights}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Check for New Lights
            </button>
          </div>
        </div>
      )}
      
      {/* Results */}
      {scanResults && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: scanResults.found ? '#e8f5e9' : '#fff3cd',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          {scanResults.found ? (
            <div>
              <strong style={{ color: '#2e7d32' }}>✓ Found {scanResults.count} new light(s)!</strong>
              <p style={{ margin: '8px 0 0 0', color: '#1b5e20' }}>
                 <button onClick={() => loadBridgeData(selectedBridge)}>
      Refresh Lights
    </button>
                Check Available Lights section below.
              </p>
            </div>
          ) : (
            <div>
              <strong style={{ color: '#f57c00' }}>No new lights found yet.</strong>
              <p style={{ margin: '8px 0 0 0', color: '#e65100' }}>
                {addLightMethod === 'touchlink' 
                  ? 'Did the light flash 3 times? Make sure it was deleted from the source bridge first.'
                  : 'Make sure the bulb is reset and try scanning again.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )}
</div>

          <p style={{ color: '#666', fontSize: '14px' }}>Click light name to rename | Click "Transfer" to move to another bridge</p>

          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', marginTop: '20px' }}>
            <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
              <h3>Available Lights</h3>
              {getUngroupedLights().length === 0 && <p style={{ color: '#666' }}>All lights are in groups</p>}
              {getUngroupedLights().map(([id, light]) => (
  <div key={id} style={{ 
    backgroundColor: 'white', 
    padding: '10px', 
    marginBottom: '8px', 
    borderRadius: '4px',
    border: '1px solid #ddd',
    opacity: light.state?.reachable === false ? 0.5 : 1
  }}>
    {editingLight === id ? (
      <div>
        <input 
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleRenameLight(id)}
          style={{ width: '100%', padding: '4px', marginBottom: '5px' }}
          autoFocus
        />
        <button onClick={() => handleRenameLight(id)} style={{ marginRight: '5px', padding: '2px 8px', fontSize: '12px' }}>Save</button>
        <button onClick={handleCancelEdit} style={{ padding: '2px 8px', fontSize: '12px' }}>Cancel</button>
      </div>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Status Indicator Dot */}
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: light.state?.reachable 
            ? (light.state?.on ? '#4CAF50' : '#666')
            : '#ff4444',
          border: '2px solid ' + (light.state?.reachable 
            ? (light.state?.on ? '#45a049' : '#555')
            : '#cc0000'),
          flexShrink: 0
        }} />
        
        <strong 
          onClick={() => handleStartEdit(id, light.name)}
          style={{ cursor: 'pointer', textDecoration: 'underline', color: '#0066cc', flex: 1 }}
        >
          {light.name}
        </strong>
      </div>
    )}
    
    {/* Status Text */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
        ID: {id}
      </p>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: '600',
        color: light.state?.reachable 
          ? (light.state?.on ? '#4CAF50' : '#666')
          : '#ff4444'
      }}>
        {!light.state?.reachable ? '⚠ OFFLINE' : (light.state?.on ? '● ON' : '○ OFF')}
      </span>
    </div>
    
    {/* Brightness indicator (only if light is on) */}
    {light.state?.on && light.state?.bri !== undefined && (
      <div style={{ marginTop: '5px' }}>
        <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>
          Brightness: {Math.round((light.state.bri / 254) * 100)}%
        </div>
        <div style={{ 
          width: '100%', 
          height: '4px', 
          backgroundColor: '#e0e0e0', 
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${(light.state.bri / 254) * 100}%`, 
            height: '100%', 
            backgroundColor: '#4CAF50',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>
    )}
    
<button 
  onClick={() => handleDeleteLight(id)}
  style={{
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    marginTop: '8px',
    width: '100%'
  }}
>
  Delete from Bridge
</button>
    
    <select 
      onChange={(e) => e.target.value && handleAddLightToGroup(e.target.value, id)}
      value=""
      style={{ marginTop: '5px', width: '100%', padding: '4px' }}
    >
      <option value="">Add to group...</option>
      {Object.entries(groups).map(([gid, group]) => (
        <option key={gid} value={gid}>{group.name}</option>
      ))}
    </select>
  </div>
))}
            </div>

            <div>
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                <h3>Create New Group</h3>
                <input 
                  type="text"
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  style={{ padding: '8px', width: '250px', marginRight: '10px' }}
                />
                <button onClick={handleCreateGroup}>Create Group</button>
              </div>

              <h3>Groups ({Object.keys(groups).length})</h3>
              {Object.entries(groups).map(([groupId, group]) => (
                <div key={groupId} style={{ 
                  border: '1px solid #ddd', 
                  padding: '15px', 
                  marginBottom: '15px',
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
  <h4 style={{ margin: 0 }}>{group.name}</h4>
  <p style={{ 
    margin: '4px 0 0 0', 
    fontSize: '11px', 
    color: '#666',
    fontFamily: 'monospace'
  }}>
    <span style={{ backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', marginRight: '5px' }}>
      v1 ID: {groupId}
    </span>
    {groupV2Ids[selectedBridge?.ip]?.[groupId] && (
  <div style={{ 
    backgroundColor: '#e3f2fd', 
    padding: '6px 10px', 
    borderRadius: '4px',
    marginTop: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <div style={{ flex: 1 }}>
      <strong style={{ fontSize: '11px' }}>v2 Grouped Light ID:</strong>
      <br/>
      <code style={{ fontSize: '10px', wordBreak: 'break-all', color: '#1976d2' }}>
        {groupV2Ids[selectedBridge.ip][groupId]}
      </code>
    </div>
    <button
      onClick={() => {
        navigator.clipboard.writeText(groupV2Ids[selectedBridge.ip][groupId])
        alert('v2 UUID copied to clipboard!')
      }}
      style={{ 
        marginLeft: '10px', 
        fontSize: '10px', 
        padding: '4px 8px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer'
      }}
    >
      Copy
    </button>
  </div>
)}
  </p>
</div>
  <div style={{ display: 'flex', gap: '10px' }}>

<label style={{ 
  display: 'flex', 
  alignItems: 'center', 
  cursor: 'pointer',
  gap: '8px'
}}>
  <span style={{ fontSize: '12px', fontWeight: '500' }}>
    {group.state?.any_on ? 'ON' : 'OFF'}
  </span>
  <div style={{
    position: 'relative',
    width: '44px',
    height: '24px',
    backgroundColor: group.state?.any_on ? '#4CAF50' : '#ccc',
    borderRadius: '12px',
    transition: 'background-color 0.3s',
    cursor: 'pointer'
  }}
  onClick={() => handleToggleGroup(groupId, !group.state?.any_on)}
  >
    <div style={{
      position: 'absolute',
      top: '2px',
      left: group.state?.any_on ? '22px' : '2px',
      width: '20px',
      height: '20px',
      backgroundColor: 'white',
      borderRadius: '50%',
      transition: 'left 0.3s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }} />
  </div>
</label>

    <button 
      onClick={() => handleDeleteGroup(groupId)}
      style={{ background: '#ff4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
    >
      Delete
    </button>
  </div>
</div>
                  
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    {group.lights.length} light{group.lights.length !== 1 ? 's' : ''}
                  </p>

                  {group.lights.length === 0 && (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>No lights in this group</p>
                  )}

                  {group.lights.map(lightId => {
  const light = lights[lightId]
  if (!light) return null
  return (
    <div key={lightId} style={{ 
      backgroundColor: '#f5f5f5', 
      padding: '8px', 
      marginTop: '8px', 
      borderRadius: '4px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      opacity: light.state?.reachable === false ? 0.5 : 1,
      border: light.state?.reachable === false ? '1px dashed #ff4444' : 'none'
    }}>
      <div style={{ flex: 1 }}>
        {editingLight === lightId ? (
          <div>
            <input 
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRenameLight(lightId)}
              style={{ padding: '4px' }}
              autoFocus
            />
            <button onClick={() => handleRenameLight(lightId)} style={{ marginLeft: '5px', padding: '2px 8px', fontSize: '12px' }}>Save</button>
            <button onClick={handleCancelEdit} style={{ marginLeft: '5px', padding: '2px 8px', fontSize: '12px' }}>Cancel</button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Status Indicator Dot */}
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: light.state?.reachable 
                  ? (light.state?.on ? '#4CAF50' : '#666')
                  : '#ff4444',
                border: '2px solid ' + (light.state?.reachable 
                  ? (light.state?.on ? '#45a049' : '#555')
                  : '#cc0000'),
                flexShrink: 0
              }} />
              
              <strong 
                onClick={() => handleStartEdit(lightId, light.name)}
                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#0066cc' }}
              >
                {light.name}
              </strong>
              
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '600',
                color: light.state?.reachable 
                  ? (light.state?.on ? '#4CAF50' : '#666')
                  : '#ff4444',
                marginLeft: 'auto'
              }}>
                {!light.state?.reachable ? '⚠ OFFLINE' : (light.state?.on ? 'ON' : 'OFF')}
              </span>
            </div>
            
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', marginLeft: '16px' }}>
              ID: {lightId}
              {light.state?.on && light.state?.bri !== undefined && (
                <span style={{ marginLeft: '10px' }}>
                  • {Math.round((light.state.bri / 254) * 100)}% brightness
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>

        <button 
          onClick={() => handleRemoveLightFromGroup(groupId, lightId)}
          style={{ background: '#999', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
        >
          Remove
        </button>
      </div>
    </div>
  )
})}
{/* Qlab Script Section */}
<div style={{
  marginTop: '16px',
  padding: '12px',
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  border: '1px solid #e2e8f0'
}}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>
      Qlab Curl Command
    </h4>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => setShowQlabScript(prev => ({ ...prev, [groupId]: !prev[groupId] }))}
        style={{
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        {showQlabScript[groupId] ? 'Hide' : 'Show'}
      </button>
      {groupV2Ids[selectedBridge?.ip]?.[groupId] && (
        <button
          onClick={() => {
            const script = generateQlabScript(groupId)
            navigator.clipboard.writeText(script)
            alert('Curl command copied to clipboard!')
          }}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
        Copy
        </button>
      )}
    </div>
  </div>
  
  {showQlabScript[groupId] && (
    <div>
      {!groupV2Ids[selectedBridge?.ip]?.[groupId] ? (
        <p style={{ fontSize: '12px', color: '#e53e3e', margin: '8px 0' }}>
          No v2 ID available. Add a light to this group to generate the command.
        </p>
      ) : (
        <pre style={{
          backgroundColor: '#2d3748',
          color: '#e2e8f0',
          padding: '12px',
          borderRadius: '4px',
          fontSize: '11px',
          overflow: 'auto',
          margin: 0,
          fontFamily: 'Monaco, Consolas, monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          lineHeight: '1.5'
        }}>
          {generateQlabScript(groupId)}
        </pre>
      )}
    </div>
  )}
</div>                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
import axios from 'axios'

class HueService {
  constructor() {
    this.bridges = new Map()
    this.loadSavedBridges()
  }

  saveBridges() {
    const bridgesArray = Array.from(this.bridges.values())
    localStorage.setItem('hue_bridges', JSON.stringify(bridgesArray))
  }

  loadSavedBridges() {
    const saved = localStorage.getItem('hue_bridges')
    if (saved) {
      const bridgesArray = JSON.parse(saved)
      bridgesArray.forEach(bridge => {
        this.bridges.set(bridge.id, bridge)
      })
    }
    return Array.from(this.bridges.values())
  }

  addBridge(bridge) {
    this.bridges.set(bridge.id, bridge)
    this.saveBridges()
  }

  getAllBridges() {
    return Array.from(this.bridges.values())
  }

  importBridges(bridgesData) {
  this.bridges.clear()
  bridgesData.forEach(bridge => {
    this.bridges.set(bridge.id, bridge)
  })
  this.saveBridges()
  return Array.from(this.bridges.values())
}

  async discoverBridges() {
    try {
      const response = await axios.get('https://discovery.meethue.com/')
      return response.data.map(bridge => ({
        id: bridge.id,
        ip: bridge.internalipaddress,
        name: `Hue Bridge ${bridge.id.slice(-6)}`,
        username: null,
        connected: false
      }))
    } catch (error) {
      console.error('Bridge discovery failed:', error)
      return []
    }
  }

  async authenticate(bridgeIp) {
    try {
      const response = await axios.post(
        `http://${bridgeIp}/api`,
        { devicetype: 'sissyl_lx_manager#desktop' }
      )

      const result = response.data[0]
      
      if (result.error) {
        if (result.error.type === 101) {
          throw new Error('Press the button on the bridge first!')
        }
        throw new Error(result.error.description)
      }

      return result.success.username
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`)
    }
  }

  async checkConnection(bridgeIp, username) {
    try {
      const response = await axios.get(
        `http://${bridgeIp}/api/${username}/config`,
        { timeout: 3000 }
      )
      return response.status === 200
    } catch (error) {
      return false
    }
  }

  async getLights(bridgeIp, username) {
    try {
      const response = await axios.get(
        `http://${bridgeIp}/api/${username}/lights`
      )
      return response.data
    } catch (error) {
      throw new Error(`Failed to get lights: ${error.message}`)
    }
  }

  async renameLight(bridgeIp, username, lightId, newName) {
    try {
      await axios.put(
        `http://${bridgeIp}/api/${username}/lights/${lightId}`,
        { name: newName }
      )
      return true
    } catch (error) {
      throw new Error(`Failed to rename light: ${error.message}`)
    }
  }

  async getGroups(bridgeIp, username) {
    try {
      const response = await axios.get(
        `http://${bridgeIp}/api/${username}/groups`
      )
      return response.data
    } catch (error) {
      throw new Error(`Failed to get groups: ${error.message}`)
    }
  }

async createGroup(bridgeIp, username, groupName, lightIds = []) {
  try {
    const response = await axios.post(
      `http://${bridgeIp}/api/${username}/groups`,
      {
        name: groupName,
        lights: lightIds.length > 0 ? lightIds : undefined,
        type: 'Room',
        class: 'Other'
      }
    )
    

    // The response is an array like: [{"success":{"id":"83"}}]
    // Extract the ID safely
    if (response.data && response.data[0] && response.data[0].success) {
      return response.data[0].success.id
    }
    
    // Fallback: just return the whole response
    console.log('Create group response:', response.data)
    return response.data
    
  } catch (error) {
     console.error('Create group error:', error.response?.data || error.message)
    throw new Error(`Failed to create group: ${error.message}`)
  }
}

  async updateGroup(bridgeIp, username, groupId, lightIds) {
    try {
      await axios.put(
        `http://${bridgeIp}/api/${username}/groups/${groupId}`,
        { lights: lightIds }
      )
      return true
    } catch (error) {
      throw new Error(`Failed to update group: ${error.message}`)
    }
  }

  async deleteGroup(bridgeIp, username, groupId) {
    try {
      await axios.delete(
        `http://${bridgeIp}/api/${username}/groups/${groupId}`
      )
      return true
    } catch (error) {
      throw new Error(`Failed to delete group: ${error.message}`)
    }
  }

  async setGroupState(bridgeIp, username, groupId, state) {
    try {
      await axios.put(
        `http://${bridgeIp}/api/${username}/groups/${groupId}/action`,
        state
      )
      return true
    } catch (error) {
      throw new Error(`Failed to set group state: ${error.message}`)
    }
  }

  async getGroupState(bridgeIp, username, groupId) {
    try {
      const response = await axios.get(
        `http://${bridgeIp}/api/${username}/groups/${groupId}`
      )
      return response.data.action
    } catch (error) {
      throw new Error(`Failed to get group state: ${error.message}`)
    }
  }

  async enableTouchlink(bridgeIp, username) {
    try {
      await axios.put(
        `http://${bridgeIp}/api/${username}/config`,
        { touchlink: true }
      )
      return true
    } catch (error) {
      throw new Error(`Failed to enable touchlink: ${error.message}`)
    }
  }

  async scanForLights(bridgeIp, username) {
    try {
      const response = await axios.post(
        `http://${bridgeIp}/api/${username}/lights`
      )
      return response.data
    } catch (error) {
      throw new Error(`Failed to scan for lights: ${error.message}`)
    }
  }

  async getNewLights(bridgeIp, username) {
    try {
      const response = await axios.get(
        `http://${bridgeIp}/api/${username}/lights/new`
      )
      return response.data
    } catch (error) {
      throw new Error(`Failed to get new lights: ${error.message}`)
    }
  }

  async deleteLight(bridgeIp, username, lightId) {
    try {
      await axios.delete(
        `http://${bridgeIp}/api/${username}/lights/${lightId}`
      )
      return true
    } catch (error) {
      throw new Error(`Failed to delete light: ${error.message}`)
    }
  }

  async startPairing(bridgeIp, username) {
    try {
      const response = await axios.post(
        `http://${bridgeIp}/api/${username}/lights`
      )
      return response.data
    } catch (error) {
      throw new Error(`Failed to start pairing: ${error.message}`)
    }
  }

  async setNetworkConfig(bridgeIp, username, newIp, netmask, gateway) {
    try {
      const response = await axios.put(
        `http://${bridgeIp}/api/${username}/config`,
        {
          ipaddress: newIp,
          netmask: netmask,
          gateway: gateway,
          dhcp: false
        }
      )
      return response.data
    } catch (error) {
      throw new Error(`Failed to set network config: ${error.message}`)
    }
  }

  // NEW: Get v2 grouped_light IDs
async getGroupedLightIds(bridgeIp, username) {
  try {
    // Call our local proxy server instead of the bridge directly
    const response = await axios.get(
      `http://localhost:3001/api/hue-v2/${bridgeIp}/grouped-lights?apiKey=${username}`
    )
    
    if (response.data.success) {
      return response.data.mapping
    } else {
      throw new Error(response.data.error)
    }
  } catch (error) {
    console.error('Failed to get v2 IDs:', error.message)
    throw new Error(`Failed to get grouped light IDs: ${error.message}`)
  }
}

  exportForQlab() {
    const bridges = this.getAllBridges()
    return {
      bridges: bridges.map(b => ({
        name: b.name,
        ip: b.ip,
        username: b.username,
      })),
      exportedAt: new Date().toISOString()
    }
  }
}

export default new HueService()
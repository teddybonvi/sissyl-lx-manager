import express from 'express'
import cors from 'cors'
import https from 'https'
import axios from 'axios'

const app = express()
const PORT = 3001

// Allow CORS from your app
app.use(cors())
app.use(express.json())

// Create an HTTPS agent that accepts self-signed certs
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

// Proxy endpoint to fetch v2 grouped_light IDs
app.get('/api/hue-v2/:bridgeIp/grouped-light', async (req, res) => {
  const { bridgeIp } = req.params
  const apiKey = req.headers['hue-application-key']
  
  if (!apiKey) {
    return res.status(400).json({ error: 'apiKey query parameter required' })
  }
  
  try {
    const response = await axios.get(
      `https://${bridgeIp}/clip/v2/resource/grouped_light`,
      {
        headers: {
          'hue-application-key': apiKey
        },
        httpsAgent
      }
    )
    
    // Parse and return mapping
    const mapping = {}
    response.data.data.forEach(item => {
      if (item.id_v1) {
        const v1Id = item.id_v1.replace('/groups/', '')
        mapping[v1Id] = item.id
      }
    })
    
    res.json({ success: true, mapping })
  } catch (error) {
    console.error('Error fetching from bridge:', error.message)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// Hue v2 API proxy - grouped light control
app.put('/api/hue-v2/:bridgeIp/grouped-light/:groupedLightId', async (req, res) => {
  const { bridgeIp, groupedLightId } = req.params
  const apiKey = req.headers['hue-application-key']
  
  try {
    const response = await axios.put(
      `https://${bridgeIp}/clip/v2/resource/grouped_light/${groupedLightId}`,
      req.body,
      {
        headers: {
          'hue-application-key': apiKey,
          'Content-Type': 'application/json'
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      }
    )
    
    res.json(response.data)
  } catch (error) {
    console.error('Hue v2 API error:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data || error.message 
    })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Hue proxy server running on http://localhost:${PORT}`)
})

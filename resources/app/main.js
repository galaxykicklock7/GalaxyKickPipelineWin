const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const { appState, addLog } = require("./src/config/appState");
const { initializeConnectionPool, getCurrentCode } = require("./src/network/connectionManager");
const { createWebSocketConnection } = require("./src/network/socketManager");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Headless mode support
const HEADLESS_MODE = process.env.HEADLESS === "true" || process.argv.includes("--headless");
const API_PORT = process.env.API_PORT || 3000;

console.log(`Starting BEST in ${HEADLESS_MODE ? 'HEADLESS' : 'GUI'} mode`);
console.log(`API server will run on port ${API_PORT}`);

let mainWindow;

// Express Server Setup
const apiServer = express();
apiServer.use(bodyParser.json());

// CORS Configuration
apiServer.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];
  
  const origin = req.headers.origin;
  
  // Allow specific localhost origins
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // Allow any loca.lt subdomain (for localtunnel)
  else if (origin && origin.match(/^https?:\/\/.*\.loca\.lt$/)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Allow all headers that the browser requests
  const requestedHeaders = req.headers['access-control-request-headers'];
  if (requestedHeaders) {
    res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
  } else {
    // Fallback to common headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, bypass-tunnel-reminder, cache-control, x-requested-with, pragma, expires');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

apiServer.use(express.static(path.join(__dirname, 'public')));
// Add support for serving the GUI in browser
apiServer.use(express.static(path.join(__dirname)));

// API Endpoints
apiServer.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiServer.get('/api/status', (req, res) => {
  // Return serializable state
  const minimalState = {
    connected: appState.connected,
    wsStatus: appState.wsStatus,
    config: appState.config,
    gameState: appState.gameState
  };
  res.json(minimalState);
});

apiServer.get('/api/logs', (req, res) => {
  res.json(appState.logs);
});

apiServer.post('/api/configure', (req, res) => {
  const config = req.body;

  console.log('[API] /api/configure received:', JSON.stringify(config, null, 2));

  // Update sensitive config keys (recovery codes)
  if (config.rc1 !== undefined) appState.config.rc1 = config.rc1;
  if (config.rc2 !== undefined) appState.config.rc2 = config.rc2;
  if (config.rc3 !== undefined) appState.config.rc3 = config.rc3;
  if (config.rc4 !== undefined) appState.config.rc4 = config.rc4;
  if (config.rc5 !== undefined) appState.config.rc5 = config.rc5;

  // Update alts
  if (config.rcl1 !== undefined) appState.config.rcl1 = config.rcl1;
  if (config.rcl2 !== undefined) appState.config.rcl2 = config.rcl2;
  if (config.rcl3 !== undefined) appState.config.rcl3 = config.rcl3;
  if (config.rcl4 !== undefined) appState.config.rcl4 = config.rcl4;
  if (config.rcl5 !== undefined) appState.config.rcl5 = config.rcl5;

  // Update kick recovery code (special case - starts with 'rc' but is not a recovery code)
  if (config.kickrc !== undefined) appState.config.kickrc = config.kickrc;

  // Update all other settings (excluding rc1-5 and rcl1-5)
  Object.keys(config).forEach(key => {
    // Skip recovery codes (rc1-5, rcl1-5) and kickrc (already handled above)
    if (!key.match(/^rc[1-5]$/) && !key.match(/^rcl[1-5]$/) && key !== 'kickrc') {
      appState.config[key] = config[key];
    }
  });

  // Log the updated config state for kick-related settings
  console.log('[API] Updated config - Kick settings:', {
    kickmode: appState.config.kickmode,
    imprisonmode: appState.config.imprisonmode,
    kickall: appState.config.kickall,
    kickbybl: appState.config.kickbybl,
    dadplus: appState.config.dadplus,
    kickrc: appState.config.kickrc ? '***' : '(empty)'
  });

  // Re-initialize pool
  initializeConnectionPool();

  res.json({ success: true, message: 'Configuration updated' });
});

apiServer.post('/api/connect', (req, res) => {
  appState.connected = true;
  appState.config.connected = true;
  appState.config.exitting = false; // "Standing" mode

  const connected = connectAll();
  res.json({ success: true, count: connected });
});

apiServer.post('/api/disconnect', (req, res) => {
  try {
    appState.connected = false;
    appState.config.connected = false;

    disconnectAll();
    res.json({ success: true, message: 'Disconnected all' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ success: false, message: 'Disconnect failed', error: error.message });
  }
});

apiServer.post('/api/send', (req, res) => {
  const { wsNumber, command } = req.body;
  if (!wsNumber || !command) {
    return res.status(400).json({ success: false, message: 'wsNumber and command required' });
  }

  const wsKey = `ws${wsNumber}`;
  const ws = appState.websockets[wsKey];
  
  if (!ws || ws.readyState !== ws.OPEN) {
    return res.status(400).json({ success: false, message: `WebSocket ${wsNumber} not connected` });
  }

  ws.send(`${command}\r\n`);
  addLog(wsNumber, `📤 Sent: ${command}`);
  res.json({ success: true, message: `Command sent to WS${wsNumber}` });
});

apiServer.post('/api/fly', (req, res) => {
  console.log('[API] /api/fly called with body:', req.body);
  
  const { planet } = req.body;
  if (!planet) {
    return res.status(400).json({ success: false, message: 'planet required' });
  }

  // Update config planet for all connections
  appState.config.planet = planet;
  
  let sent = 0;
  let errors = [];
  let reflown = 0; // Count of connections already on the same planet

  console.log('[API] Processing websockets:', Object.keys(appState.websockets));

  Object.keys(appState.websockets).forEach(key => {
    try {
      const ws = appState.websockets[key];
      const wsNum = parseInt(key.replace('ws', ''));
      
      console.log(`[API] Processing ${key}: ws=${!!ws}, readyState=${ws?.readyState}`);
      
      if (!ws) {
        errors.push(`WS${wsNum}: Not initialized`);
        return;
      }
      
      if (ws.readyState !== ws.OPEN) {
        errors.push(`WS${wsNum}: Not connected (state: ${ws.readyState})`);
        return;
      }
      
      // Check if already on the same planet
      const logicKey = `logic${wsNum}`;
      const currentPlanet = appState.gameLogic[logicKey]?.currentPlanet;
      const isRefly = currentPlanet === planet;
      
      console.log(`[API] WS${wsNum}: currentPlanet=${currentPlanet}, isRefly=${isRefly}`);
      
      if (isRefly) {
        reflown++;
        addLog(wsNum, `🔄 Reflying to ${planet} (already there)`);
      } else {
        addLog(wsNum, `🚀 Flying to ${planet}${currentPlanet ? ` (from ${currentPlanet})` : ''}`);
      }
      
      // Send JOIN command (works for both new planet and refly)
      // IRC protocol: JOIN automatically parts from current channel if different
      ws.send(`JOIN ${planet}\r\n`);
      console.log(`[API] WS${wsNum}: Sent JOIN ${planet}`);
      sent++;
      
      // Update gameLogic planet tracking
      if (appState.gameLogic[logicKey]) {
        appState.gameLogic[logicKey].currentPlanet = planet;
        appState.gameLogic[logicKey].inPrison = planet.startsWith('Prison');
      }
    } catch (error) {
      const wsNum = key.replace('ws', '');
      console.error(`[API] Error processing ${key}:`, error);
      errors.push(`WS${wsNum}: ${error.message}`);
    }
  });

  const response = {
    success: sent > 0,
    message: `Sent JOIN to ${sent} connection(s)${reflown > 0 ? ` (${reflown} refly)` : ''}`,
    planet,
    sent,
    reflown,
    total: Object.keys(appState.websockets).length
  };
  
  if (errors.length > 0) {
    response.errors = errors;
  }
  
  console.log('[API] /api/fly response:', response);
  res.json(response);
});

apiServer.post('/api/release', (req, res) => {
  let released = 0;
  let attempted = 0;
  let errors = [];

  const promises = [];

  Object.keys(appState.gameLogic).forEach(key => {
    const logic = appState.gameLogic[key];
    const wsNum = parseInt(key.replace('logic', ''));
    
    if (!logic) {
      return;
    }
    
    // Check if any recovery codes are configured
    const hasRC = ['rc1', 'rc2', 'rc3', 'rc4', 'rc5', 'rcl1', 'rcl2', 'rcl3', 'rcl4', 'rcl5']
      .some(key => logic.config[key] && logic.config[key].trim() !== '');
    
    if (!hasRC) {
      errors.push(`WS${wsNum}: No recovery codes configured`);
      addLog(wsNum, `⚠️ No recovery codes - cannot escape`);
      return;
    }
    
    attempted++;
    addLog(wsNum, `🔓 Attempting prison escape (manual)...`);
    console.log(`[API] WS${wsNum}: Attempting manual escape (inPrison=${logic.inPrison})`);
    
    // Force escape attempt regardless of inPrison flag (manual release)
    const promise = logic.escapeWithCode(logic.config.rc1 || logic.config.rcl1, 'Manual')
      .then(success => {
        if (success) {
          released++;
          addLog(wsNum, `✅ Successfully escaped from prison!`);
          logic.inPrison = false; // Update flag
          
          // Rejoin target planet
          const ws = appState.websockets[`ws${wsNum}`];
          const targetPlanet = logic.config.planet;
          if (targetPlanet && ws && ws.readyState === ws.OPEN) {
            setTimeout(() => {
              if (ws.readyState === ws.OPEN) {
                ws.send(`JOIN ${targetPlanet}\r\n`);
                addLog(wsNum, `🔄 Rejoining ${targetPlanet}`);
              }
            }, 3000);
          }
          return { wsNum, success: true };
        } else {
          addLog(wsNum, `❌ Escape failed - code invalid or not in prison`);
          return { wsNum, success: false };
        }
      })
      .catch(error => {
        errors.push(`WS${wsNum}: ${error.message}`);
        addLog(wsNum, `❌ Escape error: ${error.message}`);
        return { wsNum, success: false, error: error.message };
      });
    
    promises.push(promise);
  });

  // Wait for all escape attempts to complete
  Promise.all(promises).then(results => {
    console.log(`[API] Release complete: ${released}/${attempted} successful`);
  });

  const response = {
    success: attempted > 0,
    message: `Attempting to release ${attempted} account(s) from prison`,
    attempted,
    total: Object.keys(appState.gameLogic).length
  };
  
  if (errors.length > 0) {
    response.errors = errors;
  }
  
  res.json(response);
});

// Helper: Connect All
function connectAll() {
  let connected = 0;
  initializeConnectionPool(); // Refresh pool from config

  if (appState.config.rc1 || appState.config.rcl1) { createWebSocketConnection(1); connected++; }
  if (appState.config.rc2 || appState.config.rcl2) { createWebSocketConnection(2); connected++; }
  if (appState.config.rc3 || appState.config.rcl3) { createWebSocketConnection(3); connected++; }
  if (appState.config.rc4 || appState.config.rcl4) { createWebSocketConnection(4); connected++; }
  if (appState.config.rc5 || appState.config.rcl5) { createWebSocketConnection(5); connected++; } // Code 5 support

  return connected;
}

// Helper: Disconnect All
function disconnectAll() {
  Object.keys(appState.websockets).forEach(key => {
    try {
      const ws = appState.websockets[key];
      if (ws) {
        if (ws.readyState === ws.OPEN) {
          ws.send("QUIT :ds\r\n");
          ws.close(1000, "User disconnect");
        } else {
          try { ws.terminate(); } catch (e) { }
        }
      }
      appState.websockets[key] = null;
      appState.wsStatus[key] = false;

      // Cleanup GameLogic
      const logicKey = key.replace('ws', 'logic');
      if (appState.gameLogic[logicKey]) {
        if (typeof appState.gameLogic[logicKey].destroy === 'function') {
          appState.gameLogic[logicKey].destroy();
        }
        appState.gameLogic[logicKey] = null;
      }
    } catch (error) {
      console.error(`Error disconnecting ${key}:`, error);
    }
  });
}

// Start API Server
apiServer.listen(API_PORT, () => {
  console.log(`API Server running on http://localhost:${API_PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /api/health      - Health check`);
  console.log(`  GET  /api/status      - Get current status`);
  console.log(`  GET  /api/logs        - Get all logs`);
  console.log(`  POST /api/configure   - Update configuration`);
  console.log(`  POST /api/connect     - Connect all WebSockets`);
  console.log(`  POST /api/disconnect  - Disconnect all WebSockets`);
  console.log(`  POST /api/send        - Send command to specific WebSocket`);
  console.log(`  POST /api/fly         - Join/fly to a planet`);
  console.log(`  POST /api/release     - Release all accounts from prison`);
});

// Electron Logic
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load any.html (legacy UI)
  mainWindow.loadFile('any.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

if (!HEADLESS_MODE) {
  app.on('ready', createWindow);

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
      disconnectAll();
      app.quit();
    }
  });

  app.on('activate', function () {
    if (mainWindow === null) {
      createWindow();
    }
  });
} else {
  // Keep alive in headless
  setInterval(() => { }, 1000);
}

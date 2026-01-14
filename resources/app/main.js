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
  // SECURITY: Strict whitelist - only specific domains allowed
  const allowedOrigins = [
    // Local development
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    
    // Production frontend (Vercel)
    'https://galaxykicklock2.vercel.app',
    'https://galaxykicklock2-galaxykicklocks-projects.vercel.app',
    'https://galaxykicklock2-galaxykicklock77-galaxykicklocks-projects.vercel.app'
  ];
  
  const origin = req.headers.origin;
  
  // SECURITY: Only allow exact matches from whitelist
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // SECURITY: Allow ONLY the user's specific loca.lt subdomain (set via env var)
  else if (origin && process.env.TUNNEL_SUBDOMAIN) {
    const allowedTunnelUrl = `https://${process.env.TUNNEL_SUBDOMAIN}.loca.lt`;
    if (origin === allowedTunnelUrl) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // SECURITY: Reject unknown origins silently (no error details)
      console.log(`⚠️ CORS blocked: ${origin}`);
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  // SECURITY: Reject all other origins
  else if (origin) {
    console.log(`⚠️ CORS blocked: ${origin}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // SECURITY: Allow all common headers that browsers send
  res.setHeader('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-API-Key, ' +
    'bypass-tunnel-reminder, cache-control, pragma, expires, ' +
    'x-requested-with, accept, origin, referer, user-agent'
  );
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

apiServer.use(express.static(path.join(__dirname, 'public')));
// Add support for serving the GUI in browser
apiServer.use(express.static(path.join(__dirname)));

// ==================== SECURITY HELPERS ====================

/**
 * Sanitize config object by redacting sensitive fields
 * @param {Object} config - Configuration object
 * @returns {Object} - Sanitized config with redacted sensitive fields
 */
function sanitizeConfig(config) {
  const safe = { ...config };
  
  // Redact recovery codes
  if (safe.rc1) safe.rc1 = '***REDACTED***';
  if (safe.rc2) safe.rc2 = '***REDACTED***';
  if (safe.rc3) safe.rc3 = '***REDACTED***';
  if (safe.rc4) safe.rc4 = '***REDACTED***';
  if (safe.rc5) safe.rc5 = '***REDACTED***';
  
  // Redact alternate codes
  if (safe.rcl1) safe.rcl1 = '***REDACTED***';
  if (safe.rcl2) safe.rcl2 = '***REDACTED***';
  if (safe.rcl3) safe.rcl3 = '***REDACTED***';
  if (safe.rcl4) safe.rcl4 = '***REDACTED***';
  if (safe.rcl5) safe.rcl5 = '***REDACTED***';
  
  // Redact kick recovery code
  if (safe.kickrc) safe.kickrc = '***REDACTED***';
  
  return safe;
}

/**
 * Remove sensitive fields from config object
 * @param {Object} config - Configuration object
 * @returns {Object} - Config without sensitive fields
 */
function filterSensitiveData(config) {
  const filtered = { ...config };
  
  // Remove all recovery codes
  delete filtered.rc1;
  delete filtered.rc2;
  delete filtered.rc3;
  delete filtered.rc4;
  delete filtered.rc5;
  delete filtered.rcl1;
  delete filtered.rcl2;
  delete filtered.rcl3;
  delete filtered.rcl4;
  delete filtered.rcl5;
  delete filtered.kickrc;
  
  return filtered;
}

// ==================== API ENDPOINTS ====================
apiServer.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiServer.get('/api/status', (req, res) => {
  // SECURITY: Filter sensitive data before sending
  const safeConfig = filterSensitiveData(appState.config);
  
  const minimalState = {
    connected: appState.connected,
    wsStatus: appState.wsStatus,
    config: safeConfig, // ✅ Filtered - no recovery codes
    gameState: appState.gameState
  };
  res.json(minimalState);
});

apiServer.get('/api/logs', (req, res) => {
  // SECURITY: Logs are safe (no sensitive data stored in logs)
  // addLog() function only stores user-facing messages, not recovery codes
  res.json(appState.logs);
});

apiServer.post('/api/configure', (req, res) => {
  try {
    const config = req.body;

    // SECURITY: Validate input exists
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request' 
      });
    }

    // SECURITY: Log sanitized config (redact sensitive fields)
    console.log('[API] /api/configure received:', JSON.stringify(sanitizeConfig(config), null, 2));

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

    // SECURITY: Log sanitized kick settings (no recovery codes)
    console.log('[API] Updated config - Kick settings:', {
      kickmode: appState.config.kickmode,
      imprisonmode: appState.config.imprisonmode,
      kickall: appState.config.kickall,
      kickbybl: appState.config.kickbybl,
      dadplus: appState.config.dadplus,
      kickrc: appState.config.kickrc ? '***REDACTED***' : '(empty)'
    });

    // Re-initialize pool
    initializeConnectionPool();

    res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    // SECURITY: Don't expose internal error details
    console.error('[API] /api/configure error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Configuration failed' 
    });
  }
});

apiServer.post('/api/connect', (req, res) => {
  try {
    appState.connected = true;
    appState.config.connected = true;
    appState.config.exitting = false; // "Standing" mode

    const connected = connectAll();
    res.json({ success: true, count: connected });
  } catch (error) {
    // SECURITY: Don't expose internal error details
    console.error('[API] /api/connect error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Connection failed' 
    });
  }
});

apiServer.post('/api/disconnect', (req, res) => {
  try {
    appState.connected = false;
    appState.config.connected = false;

    disconnectAll();
    res.json({ success: true, message: 'Disconnected' });
  } catch (error) {
    // SECURITY: Don't expose internal error details
    console.error('[API] /api/disconnect error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Disconnect failed' 
    });
  }
});

apiServer.post('/api/send', (req, res) => {
  try {
    const { wsNumber, command } = req.body;
    
    // SECURITY: Validate input
    if (!wsNumber || !command) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request' 
      });
    }

    const wsKey = `ws${wsNumber}`;
    const ws = appState.websockets[wsKey];
    
    if (!ws || ws.readyState !== ws.OPEN) {
      return res.status(400).json({ 
        success: false, 
        message: 'Connection not available' 
      });
    }

    ws.send(`${command}\r\n`);
    addLog(wsNumber, `📤 Sent: ${command}`);
    res.json({ success: true, message: 'Command sent' });
  } catch (error) {
    // SECURITY: Don't expose internal error details
    console.error('[API] /api/send error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Command failed' 
    });
  }
});

apiServer.post('/api/fly', (req, res) => {
  try {
    console.log('[API] /api/fly called');
    
    const { planet } = req.body;
    
    // SECURITY: Validate input
    if (!planet) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request' 
      });
    }

    // Update config planet for all connections
    appState.config.planet = planet;
    
    let sent = 0;
    let errors = [];
    let reflown = 0;

    Object.keys(appState.websockets).forEach(key => {
      try {
        const ws = appState.websockets[key];
        const wsNum = parseInt(key.replace('ws', ''));
        
        if (!ws) {
          errors.push(`Connection ${wsNum} not initialized`);
          return;
        }
        
        if (ws.readyState !== ws.OPEN) {
          errors.push(`Connection ${wsNum} not ready`);
          return;
        }
        
        // Check if already on the same planet
        const logicKey = `logic${wsNum}`;
        const currentPlanet = appState.gameLogic[logicKey]?.currentPlanet;
        const isRefly = currentPlanet === planet;
        
        if (isRefly) {
          reflown++;
          addLog(wsNum, `🔄 Reflying to ${planet}`);
        } else {
          addLog(wsNum, `🚀 Flying to ${planet}`);
        }
        
        ws.send(`JOIN ${planet}\r\n`);
        sent++;
        
        // Update gameLogic planet tracking
        if (appState.gameLogic[logicKey]) {
          appState.gameLogic[logicKey].currentPlanet = planet;
          appState.gameLogic[logicKey].inPrison = planet.startsWith('Prison');
        }
      } catch (error) {
        // SECURITY: Don't expose internal error details
        console.error(`[API] Error processing ${key}:`, error.message);
        errors.push(`Connection ${key.replace('ws', '')} failed`);
      }
    });

    const response = {
      success: sent > 0,
      message: sent > 0 ? `Sent to ${sent} connection(s)` : 'No connections available',
      sent,
      total: Object.keys(appState.websockets).length
    };
    
    if (errors.length > 0 && errors.length < Object.keys(appState.websockets).length) {
      response.partial = true;
    }
    
    res.json(response);
  } catch (error) {
    // SECURITY: Don't expose internal error details
    console.error('[API] /api/fly error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Operation failed' 
    });
  }
});

apiServer.post('/api/release', (req, res) => {
  try {
    // Track detailed status for each connection
    const connectionStatus = {
      inPrison: [],
      notInPrison: [],
      released: [],
      failed: [],
      noCode: []
    };

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
        connectionStatus.noCode.push(wsNum);
        addLog(wsNum, `⚠️ No recovery codes - cannot escape`);
        return;
      }
      
      // Check if actually in prison
      const currentPlanet = logic.currentPlanet || 'Unknown';
      const isInPrison = logic.inPrison || (currentPlanet && currentPlanet.startsWith('Prison'));
      
      if (!isInPrison) {
        connectionStatus.notInPrison.push({ id: wsNum, planet: currentPlanet });
        addLog(wsNum, `✅ Already on planet: ${currentPlanet}`);
        return;
      }
      
      // In prison - attempt escape
      connectionStatus.inPrison.push({ id: wsNum, planet: currentPlanet });
      addLog(wsNum, `🔓 Attempting prison escape from ${currentPlanet}...`);
      
      const promise = logic.escapeWithCode(logic.config.rc1 || logic.config.rcl1, 'Manual')
        .then(success => {
          if (success) {
            connectionStatus.released.push(wsNum);
            addLog(wsNum, `✅ Successfully escaped from prison!`);
            logic.inPrison = false;
            
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
            connectionStatus.failed.push(wsNum);
            addLog(wsNum, `❌ Escape failed`);
            return { wsNum, success: false };
          }
        })
        .catch(error => {
          console.error(`[API] Escape error for WS${wsNum}:`, error.message);
          connectionStatus.failed.push(wsNum);
          addLog(wsNum, `❌ Escape error`);
          return { wsNum, success: false };
        });
      
      promises.push(promise);
    });

    // Wait for all escape attempts to complete
    Promise.all(promises).then(results => {
      console.log(`[API] Release complete:`, {
        inPrison: connectionStatus.inPrison.length,
        released: connectionStatus.released.length,
        failed: connectionStatus.failed.length,
        notInPrison: connectionStatus.notInPrison.length,
        noCode: connectionStatus.noCode.length
      });
    });

    // Build smart response message
    let message = '';
    const parts = [];
    
    if (connectionStatus.inPrison.length > 0) {
      parts.push(`${connectionStatus.inPrison.length} in prison`);
    }
    if (connectionStatus.notInPrison.length > 0) {
      parts.push(`${connectionStatus.notInPrison.length} already free`);
    }
    if (connectionStatus.noCode.length > 0) {
      parts.push(`${connectionStatus.noCode.length} missing codes`);
    }
    
    if (parts.length > 0) {
      message = parts.join(', ');
    } else {
      message = 'No connections available';
    }

    const response = {
      success: connectionStatus.inPrison.length > 0,
      message: message,
      details: {
        inPrison: connectionStatus.inPrison.length,
        notInPrison: connectionStatus.notInPrison.length,
        noCode: connectionStatus.noCode.length,
        total: Object.keys(appState.gameLogic).length
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('[API] /api/release error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Operation failed' 
    });
  }
});

// ==================== GLOBAL ERROR HANDLERS ====================

// SECURITY: Catch all unhandled errors and return generic message
apiServer.use((err, req, res, next) => {
  // Log error internally (with details)
  console.error('[API] Unhandled error:', err.message);
  console.error('[API] Stack:', err.stack);
  
  // SECURITY: Return generic error to client (no details)
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// SECURITY: Handle 404 for unknown routes
apiServer.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not found'
  });
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

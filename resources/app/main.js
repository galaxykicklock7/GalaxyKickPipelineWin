const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const crypto = require("crypto-js");
const axios = require("axios");
const WebSocketClient = require("ws");
const express = require("express");
const bodyParser = require("body-parser");
const FinalCompleteGameLogic = require("./game-logic-final.js");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Headless mode support
const HEADLESS_MODE = process.env.HEADLESS === "true" || process.argv.includes("--headless");
const API_PORT = process.env.API_PORT || 3000;

console.log(`Starting BEST in ${HEADLESS_MODE ? 'HEADLESS' : 'GUI'} mode`);
console.log(`API server will run on port ${API_PORT}`);

let mainWindow;
let appState = {
  connected: false,
  websockets: {
    ws1: null,
    ws2: null,
    ws3: null,
    ws4: null,
    ws5: null
  },
  wsStatus: {
    ws1: false,
    ws2: false,
    ws3: false,
    ws4: false,
    ws5: false
  },
  gameLogic: {
    logic1: null,
    logic2: null,
    logic3: null,
    logic4: null,
    logic5: null
  },
  config: {
    rc1: "",
    rc2: "",
    rc3: "",
    rc4: "",
    kickrc: "",
    rcl1: "",
    rcl2: "",
    rcl3: "",
    rcl4: "",
    planet: "",
    device: "312", // android
    autorelease: false,
    smart: false,
    lowsecmode: false,
    exitting: true,
    sleeping: false,
    kickmode: true,
    blacklist: "",
    gangblacklist: "",
    kblacklist: "",
    kgangblacklist: "",
    attack1: 1940,
    attack2: 1940,
    attack3: 1940,
    attack4: 1940,
    waiting1: 1910,
    waiting2: 1910,
    waiting3: 1910,
    waiting4: 1910,
    // Timer shift settings
    timershift: false,
    incrementvalue: 10,
    decrementvalue: 10,
    minatk: 1000,
    maxatk: 3000,
    mindef: 1000,
    maxdef: 3000,
    // Additional modes
    modena: false,
    kickbybl: false,
    dadplus: false,
    kickall: false,
    reconnect: 5000
  },
  logs: {
    log1: [],
    log2: [],
    log3: [],
    log4: []
  },
  // Game state tracking (from bestscript.js)
  gameState: {
    // Target tracking per WS
    targetids1: [],
    targetids2: [],
    targetids3: [],
    targetids4: [],
    targetnames1: [],
    targetnames2: [],
    targetnames3: [],
    targetnames4: [],
    // Attack tracking
    attackids1: [],
    attackids2: [],
    attackids3: [],
    attackids4: [],
    attacknames1: [],
    attacknames2: [],
    attacknames3: [],
    attacknames4: [],
    // Current targets
    useridtarget1: null,
    useridtarget2: null,
    useridtarget3: null,
    useridtarget4: null,
    // User detection flags
    userFound1: false,
    userFound2: false,
    userFound3: false,
    userFound4: false,
    // Status tracking
    status1: "",
    status2: "",
    status3: "",
    status4: "",
    // Timing flags
    threesec1: false,
    threesec2: false,
    threesec3: false,
    threesec4: false,
    // Timeout handles
    timeout1: null,
    timeout2: null,
    timeout3: null,
    timeout4: null,
    // Increment counters for code alternation
    inc1: 0,
    inc2: 0,
    inc3: 0,
    inc4: 0,
    // Low time
    lowtime: 0
  }
};

// Helper function to parse haaapsi
const parseHaaapsi = (e) => {
  var temp = crypto.MD5(e).toString(crypto.enc.Hex);
  return (temp = (temp = temp.split("").reverse().join("0")).substr(5, 10));
};

// Helper function to check if user is in blacklist
const isUserBlacklisted = (username) => {
  if (!appState.config.blacklist) return false;
  const blacklist = appState.config.blacklist.split('\n').map(n => n.trim()).filter(n => n);
  return blacklist.some(blocked => username.includes(blocked));
};

// Helper function to check if gang is blacklisted
const isGangBlacklisted = (username) => {
  if (!appState.config.gangblacklist) return false;
  const gangblacklist = appState.config.gangblacklist.split('\n').map(n => n.trim()).filter(n => n);
  return gangblacklist.some(blocked => username.includes(blocked));
};

// Helper function to count occurrences in array
const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);

// Connection retry state
const connectionRetries = {
  ws1: { count: 0, maxRetries: 5, backoff: 1000 },
  ws2: { count: 0, maxRetries: 5, backoff: 1000 },
  ws3: { count: 0, maxRetries: 5, backoff: 1000 },
  ws4: { count: 0, maxRetries: 5, backoff: 1000 },
  ws5: { count: 0, maxRetries: 5, backoff: 1000 }
};

// Connection pool for code rotation (main <-> alternate)
const connectionPool = {
  ws1: { useMain: true, mainCode: null, altCode: null },
  ws2: { useMain: true, mainCode: null, altCode: null },
  ws3: { useMain: true, mainCode: null, altCode: null },
  ws4: { useMain: true, mainCode: null, altCode: null }
};

// Initialize connection pool with configured codes
function initializeConnectionPool() {
  connectionPool.ws1.mainCode = appState.config.rc1 || null;
  connectionPool.ws1.altCode = appState.config.rcl1 || null;
  
  connectionPool.ws2.mainCode = appState.config.rc2 || null;
  connectionPool.ws2.altCode = appState.config.rcl2 || null;
  
  connectionPool.ws3.mainCode = appState.config.rc3 || null;
  connectionPool.ws3.altCode = appState.config.rcl3 || null;
  
  connectionPool.ws4.mainCode = appState.config.rc4 || null;
  connectionPool.ws4.altCode = appState.config.rcl4 || null;
  
  console.log('🔄 Connection pool initialized:');
  console.log(`  WS1: Main=${!!connectionPool.ws1.mainCode}, Alt=${!!connectionPool.ws1.altCode}`);
  console.log(`  WS2: Main=${!!connectionPool.ws2.mainCode}, Alt=${!!connectionPool.ws2.altCode}`);
  console.log(`  WS3: Main=${!!connectionPool.ws3.mainCode}, Alt=${!!connectionPool.ws3.altCode}`);
  console.log(`  WS4: Main=${!!connectionPool.ws4.mainCode}, Alt=${!!connectionPool.ws4.altCode}`);
}

// Get current code for wsNumber (rotates between main and alternate)
function getCurrentCode(wsNumber) {
  if (wsNumber === 5) {
    return appState.config.kickrc; // Kick code has no alternate
  }
  
  const wsKey = `ws${wsNumber}`;
  const pool = connectionPool[wsKey];
  
  if (!pool) return null;
  
  // If both codes exist, alternate between them
  if (pool.mainCode && pool.altCode) {
    const code = pool.useMain ? pool.mainCode : pool.altCode;
    const codeType = pool.useMain ? 'Main' : 'Alt';
    console.log(`🔄 WS${wsNumber} using ${codeType} code`);
    return code;
  }
  
  // If only one code exists, use it
  return pool.mainCode || pool.altCode;
}

// Rotate to next code (main -> alt or alt -> main)
function rotateCode(wsNumber) {
  if (wsNumber === 5) return; // Kick code has no rotation
  
  const wsKey = `ws${wsNumber}`;
  const pool = connectionPool[wsKey];
  
  if (!pool) return;
  
  // Only rotate if both codes are available
  if (pool.mainCode && pool.altCode) {
    pool.useMain = !pool.useMain;
    const newType = pool.useMain ? 'Main' : 'Alt';
    addLog(wsNumber, `🔄 Rotated to ${newType} code for next connection`);
  }
}

// Function to create WebSocket connection with retry logic
function createWebSocketConnection(wsNumber, recoveryCode = null, isRetry = false) {
  const wsKey = `ws${wsNumber}`;
  const logicKey = `logic${wsNumber}`;
  const retryState = connectionRetries[wsKey];
  
  // Get code from pool if not provided
  if (!recoveryCode) {
    recoveryCode = getCurrentCode(wsNumber);
    if (!recoveryCode) {
      addLog(wsNumber, `❌ No recovery code available for WS${wsNumber}`);
      return;
    }
  }
  
  // Check if we've exceeded max retries
  if (isRetry && retryState.count >= retryState.maxRetries) {
    addLog(wsNumber, `❌ Max retries (${retryState.maxRetries}) exceeded. Stopping reconnection attempts.`);
    retryState.count = 0; // Reset for future manual reconnect
    return;
  }
  
  if (isRetry) {
    retryState.count++;
    const delay = Math.min(retryState.backoff * Math.pow(2, retryState.count - 1), 30000); // Max 30s
    addLog(wsNumber, `🔄 Retry attempt ${retryState.count}/${retryState.maxRetries} in ${delay}ms...`);
    
    // Rotate code on retry
    rotateCode(wsNumber);
    const nextCode = getCurrentCode(wsNumber);
    
    setTimeout(() => createWebSocketConnectionInternal(wsNumber, nextCode, retryState), delay);
  } else {
    retryState.count = 0; // Reset retry counter for new connection
    createWebSocketConnectionInternal(wsNumber, recoveryCode, retryState);
  }
}

function createWebSocketConnectionInternal(wsNumber, recoveryCode, retryState) {
  const ws = new WebSocketClient("wss://cs.mobstudio.ru:6672");
  const wsKey = `ws${wsNumber}`;
  const logicKey = `logic${wsNumber}`;
  
  appState.websockets[wsKey] = ws;
  
  // Create FinalCompleteGameLogic instance with all callbacks
  const updateConfigCallback = (key, value) => {
    appState.config[key] = value;
  };
  
  const reconnectCallback = (wsNum) => {
    // Auto-reconnect logic with code rotation
    const wsKey = `ws${wsNum}`;
    if (!appState.wsStatus[wsKey]) {
      addLog(wsNum, `🔄 Auto-reconnecting WS${wsNum}...`);
      
      // Rotate to next code before reconnecting
      rotateCode(wsNum);
      
      // Get the next code from pool
      const nextCode = getCurrentCode(wsNum);
      if (nextCode) {
        createWebSocketConnection(wsNum, nextCode, false); // Not a retry, new cycle
      } else {
        addLog(wsNum, `❌ No code available for reconnection`);
      }
    }
  };
  
  appState.gameLogic[logicKey] = new FinalCompleteGameLogic(wsNumber, appState.config, addLog, updateConfigCallback, reconnectCallback);
  const gameLogic = appState.gameLogic[logicKey];
  
  // Store haaapsi value for this connection (CRITICAL!)
  let savedHaaapsi = null;
  
  ws.on('open', () => {
    console.log(`WebSocket ${wsNumber} connected`);
    appState.wsStatus[wsKey] = true;
    retryState.count = 0; // Reset retry counter on successful connection
    gameLogic.resetState(); // Reset game state for new connection
    ws.send(`:en IDENT ${appState.config.device} -2 4030 1 2 :GALA\r\n`);
    addLog(wsNumber, `✅ Connection established for code ${wsNumber}`);
  });

  ws.on('message', (data) => {
    const text = data.toString();
    const snippets = text.split(" ");
    
    // Handle HAAAPSI - MUST SAVE IT!
    if (snippets[0] === "HAAAPSI") {
      savedHaaapsi = snippets[1]; // Save for later use in REGISTER
      gameLogic.haaapsi = savedHaaapsi; // Also save in game logic
      ws.send(`RECOVER ${recoveryCode}\r\n`);
      addLog(wsNumber, `Recovering with code: ${recoveryCode}`);
    }
    
    // Handle DOMAINS message (server telling us the domain)
    if (snippets[0] === "DOMAINS") {
      addLog(wsNumber, `Domain received: ${snippets[1]}`);
      // No response needed, just acknowledge
    }
    
    // Handle REGISTER - Use saved haaapsi value!
    if (snippets[0] === "REGISTER") {
      const id = snippets[1];
      const password = snippets[2];
      const username = snippets[3].split("\r\n")[0];
      const temp = parseHaaapsi(savedHaaapsi); // Use saved haaapsi from HAAAPSI message!
      
      // Save to game logic
      gameLogic.id = id;
      gameLogic.useridg = id;
      gameLogic.passwordg = password;
      gameLogic.finalusername = username;
      
      ws.send(`USER ${id} ${password} ${username} ${temp}\r\n`);
      addLog(wsNumber, `Registered as: ${username}`);
    }
    
    // Handle connection success
    if (snippets[0] === "999") {
      ws.send("FWLISTVER 0\r\n");
      ws.send("ADDONS 0 0\r\n");
      ws.send("MYADDONS 0 0\r\n");
      ws.send("PHONE 1366 768 0 2 :chrome 113.0.0.0\r\n");
      ws.send("JOIN\r\n");
      addLog(wsNumber, `Successfully joined game`);
    }
    
    // Handle PING - CRITICAL! Must respond or server disconnects
    if (snippets[0] === "PING\r\n" || text.trim() === "PING") {
      ws.send("PONG\r\n");
      if (HEADLESS_MODE) {
        console.log(`[WS${wsNumber}] PING received, sent PONG`);
      }
    }
    
    // Handle 900 - User joining planet (CRITICAL FOR AUTO-ATTACK/KICK)
    if (snippets[0] === "900") {
      gameLogic.handle900Message(ws, snippets, text);
    }
    
    // Handle PART - User leaving
    if (snippets[0] === "PART") {
      gameLogic.handlePartMessage(ws, snippets, text);
    }
    
    // Handle SLEEP - User going to sleep
    if (snippets[0] === "SLEEP") {
      gameLogic.handleSleepMessage(ws, snippets, text);
    }
    
    // Handle JOIN responses (user joined channel)
    if (snippets[0] === "JOIN") {
      gameLogic.handleJoinMessage(ws, snippets, text);
      addLog(wsNumber, `Joined channel: ${snippets[1] || 'unknown'}`);
    }
    
    // Handle 353 (channel user list)
    if (snippets[0] === "353") {
      gameLogic.handle353Message(ws, snippets, text);
      addLog(wsNumber, `User list received for channel: ${snippets[3]}`);
    }
    
    // Handle 471 (channel full or error)
    if (snippets[0] === "471") {
      gameLogic.handle471Message(ws, snippets, text);
      addLog(wsNumber, `Error 471: ${text}`);
    }
    
    // Handle QUIT (connection closing)
    if (snippets[0] === "QUIT") {
      addLog(wsNumber, `Server sent QUIT: ${text}`);
    }
    
    // Handle 850 (status message)
    if (snippets[0] === "850") {
      gameLogic.handle850Message(ws, snippets, text);
      addLog(wsNumber, `Status: ${text.substring(0, 50)}`);
    }
    
    // Handle 452 (sign/authentication message)
    if (snippets[0] === "452") {
      gameLogic.handle452Message(ws, snippets, text);
      addLog(wsNumber, `Auth message: ${text.substring(0, 50)}`);
    }
    
    // Log all messages in headless mode for debugging
    if (HEADLESS_MODE) {
      console.log(`[WS${wsNumber}] ${text.substring(0, 150)}${text.length > 150 ? '...' : ''}`);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`WebSocket ${wsNumber} closed - Code: ${code}, Reason: ${reason}`);
    appState.wsStatus[wsKey] = false;
    addLog(wsNumber, `⚠️ Connection closed (code: ${code})`);
    
    // Only retry if not a clean disconnect and config still has the code
    const recoveryCodeStillExists = appState.config[`rc${wsNumber}`] || appState.config[`rcl${wsNumber}`] || (wsNumber === 5 && appState.config.kickrc);
    if (code !== 1000 && recoveryCodeStillExists && appState.connected) {
      // Not a clean close, attempt retry
      addLog(wsNumber, `🔄 Connection lost unexpectedly, will retry...`);
      createWebSocketConnection(wsNumber, recoveryCode, true);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket ${wsNumber} error:`, error);
    appState.wsStatus[wsKey] = false;
    addLog(wsNumber, `❌ Error: ${error.message}`);
    
    // Retry on connection errors
    const recoveryCodeStillExists = appState.config[`rc${wsNumber}`] || appState.config[`rcl${wsNumber}`] || (wsNumber === 5 && appState.config.kickrc);
    if (recoveryCodeStillExists && appState.connected) {
      addLog(wsNumber, `🔄 Connection error, will retry...`);
      setTimeout(() => {
        createWebSocketConnection(wsNumber, recoveryCode, true);
      }, 1000); // Brief delay before retry
    }
  });
  
  return ws;
}

// Function to add log entry
function addLog(wsNumber, message) {
  const logKey = `log${wsNumber}`;
  if (appState.logs[logKey]) {
    appState.logs[logKey].push({
      timestamp: new Date().toISOString(),
      message: message
    });
    // Keep only last 100 log entries
    if (appState.logs[logKey].length > 100) {
      appState.logs[logKey].shift();
    }
  }
  console.log(`[LOG${wsNumber}] ${message}`);
}

// Function to connect all configured codes
function connectAll() {
  let connected = 0;
  
  // Initialize connection pool with current config
  initializeConnectionPool();
  
  // Send analytics to Discord (optional - from bestscript.js line 217-219)
  try {
    // Create temporary game logic instance just for sendNick
    if (appState.config.rc1 || appState.config.rc2 || appState.config.rc3 || appState.config.rc4 || appState.config.kickrc) {
      const tempLogic = new FinalCompleteGameLogic(1, appState.config, addLog, null, null);
      tempLogic.sendNick(appState.config).catch(() => {}); // Silently fail
    }
  } catch (error) {
    // Analytics is optional - continue if it fails
  }
  
  // Connect WS1 (uses pool to get rc1 or rcl1)
  if (appState.config.rc1 || appState.config.rcl1) {
    createWebSocketConnection(1); // Code will be fetched from pool
    connected++;
  }
  
  // Connect WS2 (uses pool to get rc2 or rcl2)
  if (appState.config.rc2 || appState.config.rcl2) {
    createWebSocketConnection(2); // Code will be fetched from pool
    connected++;
  }
  
  // Connect WS3 (uses pool to get rc3 or rcl3)
  if (appState.config.rc3 || appState.config.rcl3) {
    createWebSocketConnection(3); // Code will be fetched from pool
    connected++;
  }
  
  // Connect WS4 (uses pool to get rc4 or rcl4)
  if (appState.config.rc4 || appState.config.rcl4) {
    createWebSocketConnection(4); // Code will be fetched from pool
    connected++;
  }
  
  // Connect WS5 (kick code - no alternation)
  if (appState.config.kickrc) {
    createWebSocketConnection(5, appState.config.kickrc);
    connected++;
  }
  
  appState.connected = connected > 0;
  return connected;
}

// Function to disconnect all
function disconnectAll() {
  Object.keys(appState.websockets).forEach(wsKey => {
    if (appState.websockets[wsKey]) {
      const ws = appState.websockets[wsKey];
      
      // Send QUIT command to server before closing (graceful disconnect)
      try {
        if (ws.readyState === ws.OPEN) {
          ws.send("QUIT :ds\r\n");
          console.log(`Sent QUIT command to ${wsKey}`);
          
          // Add to logs
          const wsNumber = parseInt(wsKey.replace('ws', ''));
          addLog(wsNumber, 'Sent QUIT command to server');
        }
      } catch (error) {
        console.error(`Error sending QUIT to ${wsKey}:`, error);
      }
      
      // Wait a moment for QUIT to be sent, then close
      setTimeout(() => {
        try {
          ws.close();
          console.log(`Closed ${wsKey}`);
        } catch (error) {
          console.error(`Error closing ${wsKey}:`, error);
        }
      }, 100);
      
      appState.websockets[wsKey] = null;
      appState.wsStatus[wsKey] = false;
    }
  });
  appState.connected = false;
}

// Express HTTP API Server
const apiServer = express();
apiServer.use(bodyParser.json());

// CORS middleware
apiServer.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// API Routes
apiServer.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: HEADLESS_MODE ? 'headless' : 'gui',
    timestamp: new Date().toISOString()
  });
});

apiServer.get('/api/status', (req, res) => {
  // Get game state from all active connections
  const gameStates = {};
  Object.keys(appState.gameLogic).forEach(key => {
    if (appState.gameLogic[key]) {
      gameStates[key] = appState.gameLogic[key].getState();
    }
  });
  
  // Get retry status
  const retryStatus = {
    ws1: { retries: connectionRetries.ws1.count, maxRetries: connectionRetries.ws1.maxRetries },
    ws2: { retries: connectionRetries.ws2.count, maxRetries: connectionRetries.ws2.maxRetries },
    ws3: { retries: connectionRetries.ws3.count, maxRetries: connectionRetries.ws3.maxRetries },
    ws4: { retries: connectionRetries.ws4.count, maxRetries: connectionRetries.ws4.maxRetries },
    ws5: { retries: connectionRetries.ws5.count, maxRetries: connectionRetries.ws5.maxRetries }
  };
  
  // Get connection pool status
  const poolStatus = {
    ws1: { 
      hasMain: !!connectionPool.ws1?.mainCode, 
      hasAlt: !!connectionPool.ws1?.altCode, 
      usingMain: connectionPool.ws1?.useMain 
    },
    ws2: { 
      hasMain: !!connectionPool.ws2?.mainCode, 
      hasAlt: !!connectionPool.ws2?.altCode, 
      usingMain: connectionPool.ws2?.useMain 
    },
    ws3: { 
      hasMain: !!connectionPool.ws3?.mainCode, 
      hasAlt: !!connectionPool.ws3?.altCode, 
      usingMain: connectionPool.ws3?.useMain 
    },
    ws4: { 
      hasMain: !!connectionPool.ws4?.mainCode, 
      hasAlt: !!connectionPool.ws4?.altCode, 
      usingMain: connectionPool.ws4?.useMain 
    }
  };
  
  res.json({
    connected: appState.connected,
    websockets: appState.wsStatus,
    retryStatus: retryStatus, // Show retry attempts
    poolStatus: poolStatus, // Show which code is active
    gameStates: gameStates, // Include game state (targets, etc.)
    config: {
      ...appState.config,
      // Don't expose recovery codes in status
      rc1: appState.config.rc1 ? '***' : '',
      rc2: appState.config.rc2 ? '***' : '',
      rc3: appState.config.rc3 ? '***' : '',
      rc4: appState.config.rc4 ? '***' : '',
      kickrc: appState.config.kickrc ? '***' : '',
      rcl1: appState.config.rcl1 ? '***' : '',
      rcl2: appState.config.rcl2 ? '***' : '',
      rcl3: appState.config.rcl3 ? '***' : '',
      rcl4: appState.config.rcl4 ? '***' : ''
    }
  });
});

apiServer.get('/api/logs', (req, res) => {
  res.json({
    logs: appState.logs
  });
});

apiServer.post('/api/configure', (req, res) => {
  try {
    const config = req.body;
    
    // Update configuration
    Object.keys(config).forEach(key => {
      if (appState.config.hasOwnProperty(key)) {
        appState.config[key] = config[key];
      }
    });
    
    // Reinitialize connection pool with new codes
    initializeConnectionPool();
    
    console.log('Configuration updated:', config);
    
    res.json({
      success: true,
      message: 'Configuration updated (connection pool reinitialized)',
      config: appState.config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiServer.post('/api/connect', (req, res) => {
  try {
    if (appState.connected) {
      return res.json({
        success: false,
        message: 'Already connected'
      });
    }
    
    const connected = connectAll();
    
    res.json({
      success: true,
      message: `Connected ${connected} WebSocket(s)`,
      connected: connected
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiServer.post('/api/disconnect', (req, res) => {
  try {
    disconnectAll();
    
    res.json({
      success: true,
      message: 'Disconnected all WebSockets'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiServer.post('/api/send', (req, res) => {
  try {
    const { wsNumber, command } = req.body;
    
    if (!wsNumber || !command) {
      return res.status(400).json({
        success: false,
        error: 'wsNumber and command are required'
      });
    }
    
    const wsKey = `ws${wsNumber}`;
    const ws = appState.websockets[wsKey];
    
    if (!ws || !appState.wsStatus[wsKey]) {
      return res.status(400).json({
        success: false,
        error: `WebSocket ${wsNumber} is not connected`
      });
    }
    
    ws.send(command + '\r\n');
    
    res.json({
      success: true,
      message: `Command sent to WebSocket ${wsNumber}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start API server
let httpServer;
function startApiServer() {
  httpServer = apiServer.listen(API_PORT, '0.0.0.0', () => {
    console.log(`\n✅ BEST API Server running on http://0.0.0.0:${API_PORT}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  /api/health      - Health check`);
    console.log(`  GET  /api/status      - Get current status`);
    console.log(`  GET  /api/logs        - Get all logs`);
    console.log(`  POST /api/configure   - Update configuration`);
    console.log(`  POST /api/connect     - Connect all WebSockets`);
    console.log(`  POST /api/disconnect  - Disconnect all WebSockets`);
    console.log(`  POST /api/send        - Send command to specific WebSocket`);
    console.log(`\n`);
  });
}

// GUI Window creation
const createWindow = async () => {
  if (HEADLESS_MODE) {
    console.log('Headless mode enabled - skipping GUI window creation');
    return;
  }

  mainWindow = new BrowserWindow({
    width: 930,
    height: 640,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  mainWindow.loadURL(`file://${__dirname}/any.html`);
  mainWindow.setMenu(null);
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.on("ready", () => {
  startApiServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (HEADLESS_MODE) {
    // In headless mode, keep running even if no windows
    console.log('Window closed but continuing in headless mode...');
  } else if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null && !HEADLESS_MODE) {
    createWindow();
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  disconnectAll();
  if (httpServer) {
    httpServer.close();
  }
  app.quit();
});

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const crypto = require("crypto-js");
const axios = require("axios");
const WebSocketClient = require("ws");
const express = require("express");
const bodyParser = require("body-parser");
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
    waiting4: 1910
  },
  logs: {
    log1: [],
    log2: [],
    log3: [],
    log4: []
  }
};

// Helper function to parse haaapsi
const parseHaaapsi = (e) => {
  var temp = crypto.MD5(e).toString(crypto.enc.Hex);
  return (temp = (temp = temp.split("").reverse().join("0")).substr(5, 10));
};

// Function to create WebSocket connection
function createWebSocketConnection(wsNumber, recoveryCode) {
  const ws = new WebSocketClient("wss://cs.mobstudio.ru:6672");
  const wsKey = `ws${wsNumber}`;
  
  appState.websockets[wsKey] = ws;
  
  // Store haaapsi value for this connection (CRITICAL!)
  let savedHaaapsi = null;
  
  ws.on('open', () => {
    console.log(`WebSocket ${wsNumber} connected`);
    appState.wsStatus[wsKey] = true;
    ws.send(`:en IDENT ${appState.config.device} -2 4030 1 2 :GALA\r\n`);
    addLog(wsNumber, `Connection established for code ${wsNumber}`);
  });

  ws.on('message', (data) => {
    const text = data.toString();
    const snippets = text.split(" ");
    
    // Handle HAAAPSI - MUST SAVE IT!
    if (snippets[0] === "HAAAPSI") {
      savedHaaapsi = snippets[1]; // Save for later use in REGISTER
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
    
    // Handle JOIN responses (user joined channel)
    if (snippets[0] === "JOIN") {
      addLog(wsNumber, `Joined channel: ${snippets[1] || 'unknown'}`);
    }
    
    // Handle 353 (channel user list)
    if (snippets[0] === "353") {
      addLog(wsNumber, `User list received for channel: ${snippets[3]}`);
    }
    
    // Handle 471 (channel full or error)
    if (snippets[0] === "471") {
      addLog(wsNumber, `Error 471: ${text}`);
    }
    
    // Handle QUIT (connection closing)
    if (snippets[0] === "QUIT") {
      addLog(wsNumber, `Server sent QUIT: ${text}`);
    }
    
    // Handle 850 (status message)
    if (snippets[0] === "850") {
      addLog(wsNumber, `Status: ${text.substring(0, 50)}`);
    }
    
    // Handle 452 (sign/authentication message)
    if (snippets[0] === "452") {
      addLog(wsNumber, `Auth message: ${text.substring(0, 50)}`);
    }
    
    // Log all messages in headless mode for debugging
    if (HEADLESS_MODE) {
      console.log(`[WS${wsNumber}] ${text.substring(0, 150)}${text.length > 150 ? '...' : ''}`);
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket ${wsNumber} closed`);
    appState.wsStatus[wsKey] = false;
    addLog(wsNumber, `Connection closed`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket ${wsNumber} error:`, error);
    addLog(wsNumber, `Error: ${error.message}`);
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
  
  if (appState.config.rc1 || appState.config.rcl1) {
    const code = appState.config.rc1 || appState.config.rcl1;
    createWebSocketConnection(1, code);
    connected++;
  }
  
  if (appState.config.rc2 || appState.config.rcl2) {
    const code = appState.config.rc2 || appState.config.rcl2;
    createWebSocketConnection(2, code);
    connected++;
  }
  
  if (appState.config.rc3 || appState.config.rcl3) {
    const code = appState.config.rc3 || appState.config.rcl3;
    createWebSocketConnection(3, code);
    connected++;
  }
  
  if (appState.config.rc4 || appState.config.rcl4) {
    const code = appState.config.rc4 || appState.config.rcl4;
    createWebSocketConnection(4, code);
    connected++;
  }
  
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
  res.json({
    connected: appState.connected,
    websockets: appState.wsStatus,
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
    
    console.log('Configuration updated:', config);
    
    res.json({
      success: true,
      message: 'Configuration updated',
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

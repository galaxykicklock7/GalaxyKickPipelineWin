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
    connected: false, // Track if user wants to stay connected (for OffSleep check)
    rc1: "",
    rc2: "",
    rc3: "",
    rc4: "",
    rc5: "",  // NEW: Code 5 (replaces kickrc)
    rcl1: "",
    rcl2: "",
    rcl3: "",
    rcl4: "",
    rcl5: "", // NEW: Code 5 Alt
    planet: "",
    device: "312", // android
    autorelease: false,
    smart: false,
    lowsecmode: false,
    exitting: true,
    sleeping: false,
    kickmode: true,  // NEW: true = Kick mode, false = Imprison mode
    blacklist: "",
    gangblacklist: "",
    kblacklist: "",
    kgangblacklist: "",
    attack1: 1940,
    attack2: 1940,
    attack3: 1940,
    attack4: 1940,
    attack5: 1940,  // NEW: Code 5 attack timing
    waiting1: 1910,
    waiting2: 1910,
    waiting3: 1910,
    waiting4: 1910,
    waiting5: 1910, // NEW: Code 5 waiting timing
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
    reconnect: 5000,
    // Code rotation
    rotateRC: false,
    // Smart Mode options (NEW)
    roundRobin: false,  // Enable round robin target selection in smart mode
    // AI Mode - Simplified (AUTO with optimal defaults)
    aiMode: false              // Enable AI Mode: Auto-detect opponent timing and optimize (all other settings are optimal defaults)
  },
  logs: {
    log1: [],
    log2: [],
    log3: [],
    log4: [],
    log5: []  // Kick account logs
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
  ws4: { useMain: true, mainCode: null, altCode: null },
  ws5: { useMain: true, mainCode: null, altCode: null }  // NEW: Code 5 with rotation support
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
  
  connectionPool.ws5.mainCode = appState.config.rc5 || null;  // NEW: Code 5
  connectionPool.ws5.altCode = appState.config.rcl5 || null;  // NEW: Code 5 Alt
  
  console.log('🔄 Connection pool initialized:');
  console.log(`  WS1: Main=${!!connectionPool.ws1.mainCode}, Alt=${!!connectionPool.ws1.altCode}`);
  console.log(`  WS2: Main=${!!connectionPool.ws2.mainCode}, Alt=${!!connectionPool.ws2.altCode}`);
  console.log(`  WS3: Main=${!!connectionPool.ws3.mainCode}, Alt=${!!connectionPool.ws3.altCode}`);
  console.log(`  WS4: Main=${!!connectionPool.ws4.mainCode}, Alt=${!!connectionPool.ws4.altCode}`);
  console.log(`  WS5: Main=${!!connectionPool.ws5.mainCode}, Alt=${!!connectionPool.ws5.altCode}`);
}

// Get current code for wsNumber (rotates between main and alternate)
function getCurrentCode(wsNumber) {
  
  const wsKey = `ws${wsNumber}`;
  const pool = connectionPool[wsKey];
  
  if (!pool) return null;
  
  // If rotation is disabled, always use main code (normal behavior)
  if (!appState.config.rotateRC) {
    addLog(wsNumber, `📍 Using main code (rotation disabled)`);
    return pool.mainCode || pool.altCode;
  }
  
  // If both codes exist, alternate between them
  if (pool.mainCode && pool.altCode) {
    const code = pool.useMain ? pool.mainCode : pool.altCode;
    const codeType = pool.useMain ? 'Main' : 'Alt';
    console.log(`🔄 WS${wsNumber} using ${codeType} code`);
    addLog(wsNumber, `🔄 Using ${codeType} code (rotation enabled)`);
    return code;
  }
  
  // If only one code exists, use it
  addLog(wsNumber, `📍 Using single code (no alternate available)`);
  return pool.mainCode || pool.altCode;
}

// Rotate to next code (main -> alt or alt -> main)
function rotateCode(wsNumber) {
  // Only rotate if rotateRC is enabled
  if (!appState.config.rotateRC) {
    return; // Keep using same code (normal behavior)
  }
  
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
    const baseDelay = retryState.backoff * Math.pow(2, retryState.count - 1);
    const cappedDelay = Math.min(baseDelay, 30000); // Max 30s
    
    // Add jitter (±20%) to prevent thundering herd
    const jitterRange = cappedDelay * 0.2;
    const jitter = (Math.random() * jitterRange * 2) - jitterRange;
    const delay = Math.max(100, Math.floor(cappedDelay + jitter)); // Min 100ms to prevent invalid values
    
    addLog(wsNumber, `🔄 Retry ${retryState.count}/${retryState.maxRetries} in ${Math.floor(delay/1000)}s`);
    
    // Rotate code on retry if rotateRC is enabled
    if (appState.config.rotateRC) {
      rotateCode(wsNumber);
      const nextCode = getCurrentCode(wsNumber);
      addLog(wsNumber, `🔄 Using rotated code for retry`);
      setTimeout(() => createWebSocketConnectionInternal(wsNumber, nextCode, retryState), delay);
    } else {
      // Normal mode: use same code
      setTimeout(() => createWebSocketConnectionInternal(wsNumber, recoveryCode, retryState), delay);
    }
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
    // Check if user intentionally disconnected
    if (!appState.connected) {
      addLog(wsNum, `⏰ User disconnected - skipping auto-reconnect`);
      return;
    }
    
    // Auto-reconnect logic with optional code rotation
    const wsKey = `ws${wsNum}`;
    if (!appState.wsStatus[wsKey]) {
      if (appState.config.rotateRC) {
        addLog(wsNum, `🔄 Auto-reconnecting WS${wsNum} with rotation...`);
        
        // Rotate to next code before reconnecting
        rotateCode(wsNum);
        
        // Get the next code from pool
        const nextCode = getCurrentCode(wsNum);
        if (nextCode) {
          createWebSocketConnection(wsNum, nextCode, false); // Not a retry, new cycle
        } else {
          addLog(wsNum, `❌ No code available for reconnection`);
        }
      } else {
        addLog(wsNum, `🔄 Auto-reconnecting WS${wsNum} (normal mode)...`);
        
        // Normal mode: use same code (main code only)
        const code = getCurrentCode(wsNum);
        if (code) {
          createWebSocketConnection(wsNum, code, false);
        } else {
          addLog(wsNum, `❌ No code available for reconnection`);
        }
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
    
    // Initialize AI Mode if enabled
    if (appState.config.aiMode) {
      gameLogic.initAIMode();
    }
    
    // Reset OffSleep retry counter on successful connection
    gameLogic.offSleepRetryCount = 0;
    gameLogic.isOffSleepActive = false;
    
    // Increment the counter for code rotation (matches bestscript.js behavior)
    gameLogic.inc++;
    
    // Log which code is being used (for debugging)
    const pool = connectionPool[wsKey];
    if (pool && pool.mainCode && pool.altCode && appState.config.rotateRC) {
      const codeType = pool.useMain ? 'Main' : 'Alt';
      addLog(wsNumber, `🔑 Using ${codeType} code (connection #${gameLogic.inc})`);
    }
    
    ws.send(`:en IDENT ${appState.config.device} -2 4030 1 2 :GALA\r\n`);
    addLog(wsNumber, `✅ Connection established for code ${wsNumber}`);
  });

  let messageCount = 0;
  ws.on('message', (data) => {
    messageCount++;
    const text = data.toString();
    
    // RAW DATA CHECK: Log if 353 or 900 appears ANYWHERE in raw data
    if (text.includes("353") || text.includes("900")) {
      console.log(`\n🔍 RAW DATA CHECK - Message #${messageCount} contains 353 or 900:`);
      console.log(`Raw bytes length: ${data.length}`);
      console.log(`Text: ${text}`);
      console.log(`\n`);
    }
    
    const snippets = text.split(" ");
    
    // Log COMPLETE raw messages (not truncated)
    if (HEADLESS_MODE || appState.config.autorelease) {
      // Show full message for important types, truncated for others
      if (["353", "900", "JOIN", "PART", "SLEEP", "HAAAPSI", "999", "REGISTER", "DOMAINS"].includes(snippets[0])) {
        console.log(`[WS${wsNumber}] MSG#${messageCount} FULL:`, text.substring(0, 500));
      } else {
        console.log(`[WS${wsNumber}] MSG#${messageCount} ${snippets[0]}:`, snippets.slice(1, 5).join(' '));
      }
    }
    
    // Log EVERY message completely for the first 50 messages after JOIN
    if (messageCount >= 10 && messageCount <= 60) {
      console.log(`\n[WS${wsNumber}] ===== COMPLETE MESSAGE #${messageCount} =====`);
      console.log(text);
      console.log(`========================================\n`);
    }
    
    // PRIORITY: Check for 353 and 900 messages
    if (snippets[0] === "353") {
      console.log(`\n🌍 ========== 353 MESSAGE (USER LIST + PLANET) ==========`);
      console.log(`[WS${wsNumber}] Planet: ${snippets[3]}`);
      console.log(`[WS${wsNumber}] Full message:`, text);
      console.log(`=========================================================\n`);
      addLog(wsNumber, `📍 353 - Planet: ${snippets[3]}`);
    }
    
    if (snippets[0] === "900") {
      console.log(`\n🌍 ========== 900 MESSAGE (PLANET INFO) ==========`);
      console.log(`[WS${wsNumber}] Planet:`, snippets[1]);
      console.log(`[WS${wsNumber}] Full message:`, text);
      console.log(`==================================================\n`);
      addLog(wsNumber, `📍 900 - Planet: ${snippets[1]}`);
    }
    
    // Check for PRISON message (snippets[1] === "PRISON") - EXACT LOGIC FROM BESTSCRIPT.JS
    if (snippets[1] === "PRISON" && snippets[2] === "0") {
      console.log(`\n🚨 ========== PRISON MESSAGE DETECTED ==========`);
      console.log(`[WS${wsNumber}] Full message:`, text);
      console.log(`===============================================\n`);
      addLog(wsNumber, `🚔 PRISON detected: ${text.substring(0, 100)}`);
      
      // CRITICAL: Set inPrison flag immediately when PRISON message is detected
      gameLogic.inPrison = true;
      gameLogic.currentPlanet = "Prison";
      console.log(`[WS${wsNumber}] Set inPrison=true from PRISON message`);
      
      if (appState.config.autorelease) {
        console.log(`DEBUG ws${wsNumber} autorelease: PRISON 0 detected, triggering escape`);
        setTimeout(async () => {
          // Call escapeAll (HTTPS API only, like bestscript.js)
          const escaped = await gameLogic.escapeAll();
          console.log(`DEBUG ws${wsNumber}: Escape result: ${escaped}`);
          
          // After escape, rejoin target planet
          const targetPlanet = appState.config.planet;
          if (targetPlanet) {
            setTimeout(() => {
              if (ws.readyState === ws.OPEN) {
                ws.send(`JOIN ${targetPlanet}\r\n`);
                addLog(wsNumber, `🔄 Rejoining ${targetPlanet} after escape`);
                console.log(`DEBUG ws${wsNumber} autorelease: rejoined planet after escape`);
              }
            }, 3000);
          }
        }, 1000);
      }
    }
    
    // Debug: Log important messages with full details
    if (snippets[0] === "900" || snippets[0] === "HAAAPSI" || snippets[0] === "999" || snippets[0] === "PRISON") {
      console.log(`DEBUG ws${wsNumber} IMPORTANT:`, snippets[0], snippets[1], snippets[2]);
      addLog(wsNumber, `📨 Received: ${snippets[0]} ${snippets[1] || ''} ${snippets[2] || ''}`);
    }
    
    // Handle HAAAPSI - MUST SAVE IT!
    if (snippets[0] === "HAAAPSI") {
      savedHaaapsi = snippets[1]; // Save for later use in REGISTER
      gameLogic.haaapsi = savedHaaapsi; // Also save in game logic
      ws.send(`RECOVER ${recoveryCode}\r\n`);
      
      // Enhanced logging to show which code is being used
      const pool = connectionPool[wsKey];
      if (pool && pool.mainCode && pool.altCode && appState.config.rotateRC) {
        const isMain = (recoveryCode === pool.mainCode);
        const isAlt = (recoveryCode === pool.altCode);
        const codeLabel = isMain ? '(Main RC)' : isAlt ? '(Alt RC)' : '(Unknown)';
        addLog(wsNumber, `🔑 Recovering with ${codeLabel}: ${recoveryCode}`);
      } else {
        addLog(wsNumber, `Recovering with code: ${recoveryCode}`);
      }
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
    
    // Handle connection success - EXACT LOGIC FROM BESTSCRIPT.JS
    if (snippets[0] === "999") {
      console.log(`DEBUG ws${wsNumber}: Got 999 (authenticated), auto-escape enabled:`, appState.config.autorelease);
      ws.send("FWLISTVER 0\r\n");
      ws.send("ADDONS 0 0\r\n");
      ws.send("MYADDONS 0 0\r\n");
      ws.send("PHONE 1366 768 0 2 :chrome 113.0.0.0\r\n");
      
      // SEND JOIN IMMEDIATELY (like bestscript.js does)
      const planet = appState.config.planet;
      if (planet && planet !== "") {
        ws.send(`JOIN ${planet}\r\n`);
        addLog(wsNumber, `Connection established. Joining ${planet}`);
        console.log(`[WS${wsNumber}] Sent JOIN ${planet}`);
      } else {
        ws.send("JOIN\r\n");
        addLog(wsNumber, `Connection established.`);
      }
      
      // Check prison status after connecting if auto-release is enabled
      // NOTE: We don't call escape here anymore - we wait for 900/353/PRISON messages
      // to tell us if we're actually in prison, then escape automatically
      if (appState.config.autorelease) {
        console.log(`DEBUG ws${wsNumber}: Auto-release enabled - will escape automatically if prison detected`);
        addLog(wsNumber, `🔓 Auto-release enabled - monitoring for prison`);
      }
    }
    
    // Handle PING - CRITICAL! Must respond or server disconnects
    if (snippets[0] === "PING\r\n" || text.trim() === "PING") {
      ws.send("PONG\r\n");
      if (HEADLESS_MODE) {
        console.log(`[WS${wsNumber}] PING received, sent PONG`);
      }
    }
    
    // Handle 900 - User joining planet (CRITICAL FOR AUTO-ATTACK/KICK)
    // Check both exact match and trimmed version
    const msgType = snippets[0].trim();
    if (msgType === "900" || snippets[0] === "900") {
      console.log(`DEBUG ws${wsNumber}: 900 message received, planet:`, snippets[1], 'auto-escape enabled:', appState.config.autorelease);
      console.log(`DEBUG ws${wsNumber}: Full 900 message:`, text.substring(0, 200));
      const plnt = snippets[1];
      if (appState.config.autorelease && plnt && plnt.slice(0, 6) === "Prison") {
        console.log(`DEBUG ws${wsNumber} autorelease: Prison detected, triggering escape`);
      }
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
    
    // Handle 353 (channel user list) - THIS CONTAINS THE PLANET NAME!
    if (snippets[0] === "353") {
      const planetName = snippets[3];
      console.log(`[WS${wsNumber}] 📍 353 Message - Planet: ${planetName}`);
      addLog(wsNumber, `📍 Joined planet: ${planetName}`);
      
      // Check for Prison and trigger auto-escape
      if (appState.config.autorelease && planetName && planetName.slice(0, 6) === "Prison") {
        console.log(`[WS${wsNumber}] 🔓 Prison detected in 353 message - triggering escape`);
        addLog(wsNumber, `🔓 Prison detected - attempting escape`);
        
        setTimeout(async () => {
          // Call escapeAll (HTTPS API only, like bestscript.js)
          await gameLogic.escapeAll();
          
          const targetPlanet = appState.config.planet;
          if (targetPlanet) {
            setTimeout(() => {
              if (ws.readyState === ws.OPEN) {
                ws.send(`JOIN ${targetPlanet}\r\n`);
                addLog(wsNumber, `🔄 Rejoining ${targetPlanet}`);
              }
            }, 3000);
          }
        }, 1000);
      } else if (appState.config.autorelease && planetName) {
        // Not in prison - log confirmation
        console.log(`[WS${wsNumber}] ✅ Planet ${planetName} is not a prison - no escape needed`);
        addLog(wsNumber, `✅ On ${planetName} - ready for action`);
      }
      
      gameLogic.handle353Message(ws, snippets, text);
    }
    
    // Handle 471 (channel full or error) - EXACT LOGIC FROM BESTSCRIPT.JS
    if (snippets[0] === "471") {
      addLog(wsNumber, `⚠️ Error 471 - Channel full, joining fallback planet B`);
      setTimeout(() => {
        if (ws.readyState === ws.OPEN) {
          ws.send("JOIN B\r\n");
          console.log(`[WS${wsNumber}] Sent JOIN B (fallback after 471 error)`);
        }
      }, 1000);
      gameLogic.handle471Message(ws, snippets, text);
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
    
    // Handle 860 (user info/status - Dad+ mode)
    if (snippets[0] === "860") {
      gameLogic.handle860Message(ws, snippets, text);
    }
    
    // Handle FOUNDER (planet owner) - IMPORTANT: Don't attack the founder!
    if (snippets[0] === "FOUNDER") {
      const founderId = snippets[1];
      gameLogic.founderUserId = founderId;
      console.log(`[WS${wsNumber}] Planet founder detected: ${founderId}`);
      addLog(wsNumber, `👑 Planet owner: ${founderId}`);
    }
    
  });

  ws.on('close', (code, reason) => {
    console.log(`WebSocket ${wsNumber} closed - Code: ${code}, Reason: ${reason}`);
    appState.wsStatus[wsKey] = false;
    addLog(wsNumber, `⚠️ Connection closed (code: ${code})`);
    
    // Check if OffSleep is already handling reconnection
    if (gameLogic.isOffSleepActive) {
      console.log(`[WS${wsNumber}] ⏰ OffSleep is handling reconnection - skipping ws.on('close') retry logic`);
      addLog(wsNumber, `⏰ OffSleep active - skipping auto-retry`);
      return;
    }
    
    // Clear any pending reconnect timeout
    if (gameLogic.reconnectTimeoutId) {
      clearTimeout(gameLogic.reconnectTimeoutId);
      gameLogic.reconnectTimeoutId = null;
      console.log(`[WS${wsNumber}] Cleared stale reconnectTimeoutId on close`);
    }
    
    // Only retry if not a clean disconnect and config still has the code
    const recoveryCodeStillExists = appState.config[`rc${wsNumber}`] || appState.config[`rcl${wsNumber}`] || (wsNumber === 5 && appState.config.kickrc);
    // Check BOTH appState.connected AND appState.config.connected
    if (code !== 1000 && recoveryCodeStillExists && appState.connected && appState.config.connected) {
      // Not a clean close, attempt retry
      addLog(wsNumber, `🔄 Connection lost unexpectedly, will retry...`);
      
      // If rotation is enabled, rotate to next code before retrying
      if (appState.config.rotateRC && wsNumber !== 5) {
        rotateCode(wsNumber);
        const nextCode = getCurrentCode(wsNumber);
        if (nextCode) {
          createWebSocketConnection(wsNumber, nextCode, true);
        } else {
          createWebSocketConnection(wsNumber, recoveryCode, true);
        }
      } else {
        createWebSocketConnection(wsNumber, recoveryCode, true);
      }
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket ${wsNumber} error:`, error);
    appState.wsStatus[wsKey] = false;
    addLog(wsNumber, `❌ Error: ${error.message}`);
    
    // Check if OffSleep is already handling reconnection
    if (gameLogic.isOffSleepActive) {
      console.log(`[WS${wsNumber}] ⏰ OffSleep is handling reconnection - skipping ws.on('error') retry logic`);
      addLog(wsNumber, `⏰ OffSleep active - skipping error retry`);
      return;
    }
    
    // Clear any pending reconnect timeout
    if (gameLogic.reconnectTimeoutId) {
      clearTimeout(gameLogic.reconnectTimeoutId);
      gameLogic.reconnectTimeoutId = null;
      console.log(`[WS${wsNumber}] Cleared stale reconnectTimeoutId on error`);
    }
    
    // Retry on connection errors
    const recoveryCodeStillExists = appState.config[`rc${wsNumber}`] || appState.config[`rcl${wsNumber}`] || (wsNumber === 5 && appState.config.kickrc);
    // Check BOTH appState.connected AND appState.config.connected
    if (recoveryCodeStillExists && appState.connected && appState.config.connected) {
      addLog(wsNumber, `🔄 Connection error, will retry...`);
      setTimeout(() => {
        // If rotation is enabled, rotate to next code before retrying
        if (appState.config.rotateRC && wsNumber !== 5) {
          rotateCode(wsNumber);
          const nextCode = getCurrentCode(wsNumber);
          if (nextCode) {
            createWebSocketConnection(wsNumber, nextCode, true);
          } else {
            createWebSocketConnection(wsNumber, recoveryCode, true);
          }
        } else {
          createWebSocketConnection(wsNumber, recoveryCode, true);
        }
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
  
  // SECURITY: Discord analytics removed - no longer sending recovery codes to external webhook
  
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
  
  // Connect WS5 (Code 5 - uses pool to get rc5 or rcl5)
  if (appState.config.rc5 || appState.config.rcl5) {
    createWebSocketConnection(5); // Code will be fetched from pool
    connected++;
  }
  
  appState.connected = connected > 0;
  appState.config.connected = connected > 0; // Also set in config so game logic can see it
  return connected;
}

// Function to disconnect all
function disconnectAll() {
  console.log('🛑 AGGRESSIVE DISCONNECT - Stopping ALL processes');
  
  // Set connected to false FIRST to prevent auto-reconnect
  appState.connected = false;
  appState.config.connected = false; // Also set in config so game logic can see it
  
  Object.keys(appState.websockets).forEach(wsKey => {
    const wsNumber = parseInt(wsKey.replace('ws', ''));
    const logicKey = `logic${wsNumber}`;
    
    if (appState.websockets[wsKey]) {
      const ws = appState.websockets[wsKey];
      
      // 1. IMMEDIATELY remove ALL event listeners (Node.js ws library uses .on() not .onXXX)
      try {
        ws.removeAllListeners('message');
        ws.removeAllListeners('open');
        ws.removeAllListeners('close');
        ws.removeAllListeners('error');
        console.log(`Removed all event listeners for ${wsKey}`);
      } catch (error) {
        console.error(`Error removing listeners for ${wsKey}:`, error);
      }
      
      // 2. Clear all timeouts in game logic
      if (appState.gameLogic[logicKey]) {
        try {
          const gameLogic = appState.gameLogic[logicKey];
          
          // Clear attack/kick timeout
          if (gameLogic.timeout) {
            clearTimeout(gameLogic.timeout);
            gameLogic.timeout = null;
            console.log(`Cleared attack timeout for ${wsKey}`);
          }
          
          // Clear inner timeouts (from kick/imprison forEach loops)
          if (gameLogic.innerTimeouts && Array.isArray(gameLogic.innerTimeouts)) {
            gameLogic.innerTimeouts.forEach(timeout => clearTimeout(timeout));
            gameLogic.innerTimeouts = [];
            console.log(`Cleared inner timeouts for ${wsKey}`);
          }
          
          // Clear reconnect timeout (from OffSleep)
          if (gameLogic.reconnectTimeoutId) {
            console.log(`[${wsKey}] Clearing reconnect timeout: ${gameLogic.reconnectTimeoutId}`);
            clearTimeout(gameLogic.reconnectTimeoutId);
            gameLogic.reconnectTimeoutId = null;
            console.log(`[${wsKey}] ✅ Cleared reconnect timeout`);
          } else {
            console.log(`[${wsKey}] ⚠️ No reconnect timeout to clear (reconnectTimeoutId is ${gameLogic.reconnectTimeoutId})`);
          }
          
          // Reset state
          gameLogic.userFound = false;
          gameLogic.useridtarget = null;
          gameLogic.useridattack = null;
        } catch (error) {
          console.error(`Error clearing timeouts for ${wsKey}:`, error);
        }
      }
      
      // 3. Send PART and QUIT commands (no more messages will be processed)
      try {
        if (ws.readyState === ws.OPEN) {
          // Send PART to leave the channel/planet
          const currentPlanet = appState.config.planet;
          if (currentPlanet) {
            ws.send(`PART ${currentPlanet}\r\n`);
            console.log(`Sent PART command for ${currentPlanet} to ${wsKey}`);
          }
          
          // Send QUIT to disconnect
          ws.send("QUIT :ds\r\n");
          console.log(`Sent QUIT command to ${wsKey}`);
          addLog(wsNumber, '🛑 QUIT - Disconnecting');
          
          // Wait 300ms for server to process, then terminate
          setTimeout(() => {
            try {
              // Force terminate the connection
              if (typeof ws.terminate === 'function') {
                ws.terminate();
                console.log(`Terminated ${wsKey} (aggressive)`);
              } else {
                ws.close();
                console.log(`Closed ${wsKey}`);
              }
              
              // Destroy the socket completely (Node.js ws library)
              if (ws._socket) {
                ws._socket.destroy();
                console.log(`Destroyed socket for ${wsKey}`);
              }
            } catch (error) {
              console.error(`Error terminating ${wsKey}:`, error);
            }
          }, 300);
        } else {
          // WebSocket not open, terminate immediately
          try {
            if (typeof ws.terminate === 'function') {
              ws.terminate();
            } else {
              ws.close();
            }
            
            // Destroy the socket completely
            if (ws._socket) {
              ws._socket.destroy();
            }
            console.log(`Terminated ${wsKey} (not open)`);
          } catch (error) {
            console.error(`Error terminating ${wsKey}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error sending QUIT to ${wsKey}:`, error);
      }
      
      // 4. Clear references AFTER scheduling terminate (so setTimeout can access ws)
      setTimeout(() => {
        appState.websockets[wsKey] = null;
        appState.wsStatus[wsKey] = false;
      }, 400); // Clear after terminate completes
      
      addLog(wsNumber, '✅ Disconnected completely');
    }
  });
  
  console.log('✅ All WebSockets disconnected aggressively');
}

// Express HTTP API Server
const apiServer = express();
apiServer.use(bodyParser.json());

// CORS middleware
apiServer.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, bypass-tunnel-reminder");
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
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
    rotationEnabled: appState.config.rotateRC,
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
    },
    ws5: { 
      hasMain: !!connectionPool.ws5?.mainCode, 
      hasAlt: !!connectionPool.ws5?.altCode, 
      usingMain: connectionPool.ws5?.useMain 
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
      rc5: appState.config.rc5 ? '***' : '',
      rcl1: appState.config.rcl1 ? '***' : '',
      rcl2: appState.config.rcl2 ? '***' : '',
      rcl3: appState.config.rcl3 ? '***' : '',
      rcl4: appState.config.rcl4 ? '***' : '',
      rcl5: appState.config.rcl5 ? '***' : ''
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
    
    console.log('📥 Received configuration update:', JSON.stringify(config, null, 2));
    
    // Update configuration
    Object.keys(config).forEach(key => {
      if (appState.config.hasOwnProperty(key)) {
        const oldValue = appState.config[key];
        appState.config[key] = config[key];
        if (oldValue !== config[key]) {
          console.log(`  ✏️  ${key}: ${oldValue} → ${config[key]}`);
        }
      }
    });
    
    // Reinitialize connection pool with new codes
    initializeConnectionPool();
    
    console.log('✅ Configuration updated successfully');
    console.log('⚠️ NOTE: Active connections will use new settings immediately.');
    console.log('⚠️ To use new recovery codes (rc1-4, kickrc), you must disconnect and reconnect.');
    
    res.json({
      success: true,
      message: 'Configuration updated (active connections will use new settings immediately)',
      config: appState.config,
      note: 'To use new recovery codes, disconnect and reconnect'
    });
  } catch (error) {
    console.error('❌ Configuration update error:', error);
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

apiServer.post('/api/fly', (req, res) => {
  try {
    const { planet } = req.body;
    
    if (!planet) {
      return res.status(400).json({
        success: false,
        error: 'planet is required'
      });
    }
    
    let sentCount = 0;
    const results = [];
    
    // Send JOIN command to all connected WebSockets
    for (let i = 1; i <= 5; i++) {
      const wsKey = `ws${i}`;
      const ws = appState.websockets[wsKey];
      
      if (ws && appState.wsStatus[wsKey]) {
        try {
          ws.send(`JOIN ${planet}\r\n`);
          addLog(i, `✈️ Flying to ${planet}`);
          sentCount++;
          results.push({ ws: i, success: true, message: `Joined ${planet}` });
        } catch (error) {
          results.push({ ws: i, success: false, message: error.message });
        }
      }
    }
    
    if (sentCount === 0) {
      return res.json({
        success: false,
        message: 'No WebSockets connected',
        results: []
      });
    }
    
    // Update config with new planet
    appState.config.planet = planet;
    
    res.json({
      success: true,
      message: `Sent JOIN ${planet} to ${sentCount} connection(s)`,
      sentCount,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiServer.post('/api/release', (req, res) => {
  try {
    const results = [];
    let successCount = 0;
    let failCount = 0;
    let notInPrisonCount = 0;
    
    // Try to escape from prison for all connected WebSockets
    const escapePromises = [];
    
    for (let i = 1; i <= 5; i++) {
      const wsKey = `ws${i}`;
      const logicKey = `logic${i}`;
      const gameLogic = appState.gameLogic[logicKey];
      
      if (appState.wsStatus[wsKey] && gameLogic) {
        addLog(i, `🔓 Manual release triggered`);
        
        // MANUAL RELEASE: User clicked the button, so they know bot is in prison
        // Don't check inPrison flag - just attempt escape
        // Force set inPrison to true to bypass the check in escapeAll()
        const wasInPrison = gameLogic.inPrison;
        gameLogic.inPrison = true;
        
        const escapePromise = gameLogic.escapeAll()
          .then(escaped => {
            if (escaped) {
              successCount++;
              results.push({ 
                ws: i, 
                success: true, 
                inPrison: true,
                message: 'Escaped successfully' 
              });
              addLog(i, `✅ Manual release successful`);
              
              // Rejoin target planet after escape
              const targetPlanet = appState.config.planet;
              if (targetPlanet && appState.websockets[wsKey]) {
                setTimeout(() => {
                  const ws = appState.websockets[wsKey];
                  if (ws && ws.readyState === ws.OPEN) {
                    ws.send(`JOIN ${targetPlanet}\r\n`);
                    addLog(i, `🔄 Rejoining ${targetPlanet}`);
                  }
                }, 3000);
              }
            } else {
              failCount++;
              results.push({ 
                ws: i, 
                success: false, 
                inPrison: true,
                message: 'Escape failed or no RCs configured' 
              });
              addLog(i, `❌ Manual release failed`);
            }
          })
          .catch(error => {
            failCount++;
            results.push({ 
              ws: i, 
              success: false, 
              inPrison: true,
              message: error.message 
            });
            addLog(i, `❌ Release error: ${error.message}`);
          });
        
        escapePromises.push(escapePromise);
      }
    }
    
    if (escapePromises.length === 0) {
      return res.json({
        success: false,
        message: 'No WebSockets connected',
        successCount: 0,
        failCount: 0,
        results: []
      });
    }
    
    // Wait for all escape attempts to complete
    Promise.all(escapePromises).then(() => {
      let message = '';
      if (successCount > 0 && failCount === 0) {
        message = `All ${successCount} account(s) released successfully`;
      } else if (successCount === 0 && failCount > 0) {
        message = `All ${failCount} escape attempt(s) failed`;
      } else if (successCount > 0 && failCount > 0) {
        message = `Release completed: ${successCount} succeeded, ${failCount} failed`;
      } else {
        message = `No escape attempts made`;
      }
      
      res.json({
        success: successCount > 0,
        message: message,
        successCount,
        failCount,
        results
      });
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
    console.log(`  POST /api/fly         - Join/fly to a planet`);
    console.log(`  POST /api/release     - Release all accounts from prison`);
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

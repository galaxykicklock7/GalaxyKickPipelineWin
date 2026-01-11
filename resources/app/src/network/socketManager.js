const WebSocketClient = require("ws");
const { appState, connectionRetries, connectionPool, addLog } = require("../config/appState");
const GameLogic = require("../game/gameLogic");
const { getCurrentCode, rotateCode } = require("./connectionManager");

function createWebSocketConnection(wsNumber, recoveryCode = null, isRetry = false) {
    const wsKey = `ws${wsNumber}`;
    const logicKey = `logic${wsNumber}`;
    const retryState = connectionRetries[wsKey];

    if (!recoveryCode) {
        recoveryCode = getCurrentCode(wsNumber);
        if (!recoveryCode) {
            addLog(wsNumber, `❌ No recovery code available for WS${wsNumber}`);
            return;
        }
    }

    if (isRetry && retryState.count >= retryState.maxRetries) {
        addLog(wsNumber, `❌ Max retries (${retryState.maxRetries}) exceeded. Stopping reconnection attempts.`);
        retryState.count = 0;
        return;
    }

    if (isRetry) {
        retryState.count++;
        const baseDelay = retryState.backoff * Math.pow(2, retryState.count - 1);
        const delay = Math.min(baseDelay, 30000);

        addLog(wsNumber, `🔄 Retry ${retryState.count}/${retryState.maxRetries} in ${Math.floor(delay / 1000)}s`);

        if (appState.config.rotateRC) {
            rotateCode(wsNumber);
            const nextCode = getCurrentCode(wsNumber);
            addLog(wsNumber, `🔄 Using rotated code for retry`);
            setTimeout(() => createWebSocketConnectionInternal(wsNumber, nextCode, retryState), delay);
        } else {
            setTimeout(() => createWebSocketConnectionInternal(wsNumber, recoveryCode, retryState), delay);
        }
    } else {
        retryState.count = 0;
        createWebSocketConnectionInternal(wsNumber, recoveryCode, retryState);
    }
}

function createWebSocketConnectionInternal(wsNumber, recoveryCode, retryState) {
    const ws = new WebSocketClient("wss://cs.mobstudio.ru:6672");
    const wsKey = `ws${wsNumber}`;
    const logicKey = `logic${wsNumber}`;

    appState.websockets[wsKey] = ws;

    const updateConfigCallback = (key, value) => {
        appState.config[key] = value;
    };

    const reconnectCallback = (wsNum) => {
        if (!appState.connected) {
            addLog(wsNum, `⏰ User disconnected - skipping auto-reconnect`);
            return;
        }

        const wsKey = `ws${wsNum}`;
        if (!appState.wsStatus[wsKey]) {
            if (appState.config.rotateRC) {
                addLog(wsNum, `🔄 Auto-reconnecting WS${wsNum} with rotation...`);
                rotateCode(wsNum);
                const nextCode = getCurrentCode(wsNum);
                if (nextCode) {
                    createWebSocketConnection(wsNum, nextCode, false);
                } else {
                    addLog(wsNum, `❌ No code available for reconnection`);
                }
            } else {
                addLog(wsNum, `🔄 Auto-reconnecting WS${wsNum} (normal mode)...`);
                const code = getCurrentCode(wsNum);
                if (code) {
                    createWebSocketConnection(wsNum, code, false);
                } else {
                    addLog(wsNum, `❌ No code available for reconnection`);
                }
            }
        }
    };

    appState.gameLogic[logicKey] = new GameLogic(wsNumber, appState.config, addLog, updateConfigCallback, reconnectCallback);
    const gameLogic = appState.gameLogic[logicKey];

    let savedHaaapsi = null;

    ws.on('open', () => {
        console.log(`WebSocket ${wsNumber} connected`);
        appState.wsStatus[wsKey] = true;
        retryState.count = 0;
        gameLogic.resetState();
        gameLogic.offSleepRetryCount = 0;
        gameLogic.isOffSleepActive = false;
        gameLogic.inc++;

        const pool = connectionPool[wsKey];
        if (pool && pool.mainCode && pool.altCode && appState.config.rotateRC) {
            const codeType = pool.useMain ? 'Main' : 'Alt';
            addLog(wsNumber, `🔑 Using ${codeType} code`);
        }

        ws.send(`:en IDENT ${appState.config.device} -2 4030 1 2 :GALA\r\n`);
        addLog(wsNumber, `✅ Connection established`);
    });

    ws.on('message', (data) => {
        const text = data.toString();
        const snippets = text.split(" ");
        
        // Debug: Log all messages
        console.log(`[WS${wsNumber}] Received: ${snippets[0]} ${snippets.slice(1, 4).join(' ')}`);

        if (snippets[0] === "HAAAPSI") {
            savedHaaapsi = snippets[1];
            gameLogic.haaapsi = savedHaaapsi;
            ws.send(`RECOVER ${recoveryCode}\r\n`);
            addLog(wsNumber, `Recovering with code: ${recoveryCode}`);
        }

        if (snippets[0] === "REGISTER") {
            const id = snippets[1];
            const password = snippets[2];
            const username = snippets[3].split("\r\n")[0];
            const temp = gameLogic.parseHaaapsi(savedHaaapsi);

            gameLogic.id = id;
            gameLogic.useridg = id;
            gameLogic.passwordg = password;
            gameLogic.finalusername = username;

            ws.send(`USER ${id} ${password} ${username} ${temp}\r\n`);
            addLog(wsNumber, `Registered as: ${username}`);
        }

        if (snippets[0] === "999") {
            ws.send("FWLISTVER 0\r\n");
            ws.send("ADDONS 0 0\r\n");
            ws.send("MYADDONS 0 0\r\n");
            ws.send("PHONE 1366 768 0 2 :chrome 113.0.0.0\r\n");

            const planet = appState.config.planet;
            if (planet && planet !== "") {
                ws.send(`JOIN ${planet}\r\n`);
                addLog(wsNumber, `Connection established. Joining ${planet}`);
            } else {
                ws.send("JOIN\r\n");
                addLog(wsNumber, `Connection established.`);
            }
        }

        if (snippets[0] === "PING\r\n" || text.trim() === "PING") {
            ws.send("PONG\r\n");
        }

        // Delegate to GameLogic handlers
        if (snippets[0] === "353") gameLogic.handle353Message(ws, snippets, text);
        if (snippets[0] === "JOIN") gameLogic.handleJoinMessage(ws, snippets, text);
        if (snippets[0] === "PART") gameLogic.handlePartMessage(ws, snippets, text);
        if (snippets[0] === "SLEEP") gameLogic.handleSleepMessage(ws, snippets, text);
        if (snippets[0] === "850") gameLogic.handle850Message(ws, snippets, text);
        if (snippets[0] === "452") gameLogic.handle452Message(ws, snippets, text);
        if (snippets[0] === "860") gameLogic.handle860Message(ws, snippets, text);
        if (snippets[0] === "471") gameLogic.handle471Message(ws, snippets, text);
        if (snippets[0] === "900" || snippets[0].trim() === "900") gameLogic.handle900Message(ws, snippets, text);
        
        // Handle PRISON message (when you get imprisoned)
        if (snippets[1] === "PRISON" && snippets[2] === "0") {
            gameLogic.inPrison = true;
            gameLogic.currentPlanet = "Prison";
            console.log(`[WS${wsNumber}] PRISON message detected - setting inPrison=true`);
            addLog(wsNumber, `🔴 You were imprisoned!`);
            
            if (gameLogic.config.autorelease) {
                addLog(wsNumber, `🔓 Prison detected - attempting escape`);
                setTimeout(async () => {
                    await gameLogic.escapeAll();
                    
                    // Rejoin target planet after escape
                    const targetPlanet = gameLogic.config.planet;
                    if (targetPlanet && ws.readyState === ws.OPEN) {
                        setTimeout(() => {
                            if (ws.readyState === ws.OPEN) {
                                ws.send(`JOIN ${targetPlanet}\r\n`);
                                addLog(wsNumber, `🔄 Rejoining ${targetPlanet}`);
                            }
                        }, 3000);
                    }
                }, 1000);
            }
        }
    });

    ws.on('close', (code, reason) => {
        appState.wsStatus[wsKey] = false;
        addLog(wsNumber, `⚠️ Connection closed (code: ${code})`);

        if (gameLogic.isOffSleepActive) return;

        if (gameLogic.reconnectTimeoutId) {
            clearTimeout(gameLogic.reconnectTimeoutId);
            gameLogic.reconnectTimeoutId = null;
        }

        const recoveryCodeStillExists = appState.config[`rc${wsNumber}`] || appState.config[`rcl${wsNumber}`];
        if (code !== 1000 && recoveryCodeStillExists && appState.connected && appState.config.connected) {
            addLog(wsNumber, `🔄 Connection lost, retrying...`);
            if (appState.config.rotateRC) {
                rotateCode(wsNumber);
                const nextCode = getCurrentCode(wsNumber);
                createWebSocketConnection(wsNumber, nextCode || recoveryCode, true);
            } else {
                createWebSocketConnection(wsNumber, recoveryCode, true);
            }
        }
    });

    ws.on('error', (error) => {
        appState.wsStatus[wsKey] = false;
        addLog(wsNumber, `❌ Error: ${error.message}`);
        if (gameLogic.isOffSleepActive) return;

        setTimeout(() => {
            createWebSocketConnection(wsNumber, recoveryCode, true);
        }, 1000);
    });

    return ws;
}

module.exports = { createWebSocketConnection };

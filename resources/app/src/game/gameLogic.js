const https = require("https");
const { parseHaaapsi, countOccurrences } = require("../utils/helpers");
const { getFounderId, setFounderId } = require("../utils/founderMemory");

class GameLogic {
    constructor(wsNumber, config, addLogCallback, updateConfigCallback, reconnectCallback) {
        this.wsNumber = wsNumber;
        this.config = config;
        this.addLog = addLogCallback;
        this.updateConfig = updateConfigCallback;
        this.reconnect = reconnectCallback;

        // Core state
        this.haaapsi = null;
        this.id = null;
        this.useridg = null;
        this.passwordg = null;
        this.finalusername = null;
        this.botGangName = null; // Track bot's own gang/clan name

        // Target tracking - Using Sets for faster lookups
        this.targetids = new Set();
        this.targetnames = new Map(); // userid -> username
        this.attackids = new Set();
        this.attacknames = new Map(); // userid -> username

        // Current target/attack
        this.useridtarget = null;
        this.useridattack = null;
        this.status = ""; // "attack" or "defense"

        // Flags
        this.userFound = false;
        this.threesec = false;
        this.inPrison = false;
        this.currentPlanet = null;
        this.founderUserId = null; // Will be loaded from file

        // Timers
        this.timeout = null;
        this.innerTimeouts = []; // Track nested timeouts for clean cancellation

        // Counter for code alternation
        this.inc = 0;

        // Reconnection & OffSleep
        this.reconnectTimeoutId = null;
        this.isOffSleepActive = false;
        this.offSleepRetryCount = 0;
        this.maxOffSleepRetries = 10;

        // Timer Shift
        this.consecutiveErrors = 0;
        this.consecutiveSuccesses = 0;
        this.recentAdjustments = [];
        this.maxAdjustmentHistory = 5;

        // Smart Mode
        this.attackCooldowns = {};
        this.attackedThisSession = new Set();
        this.targetIndex = 0;
        this.cooldownDuration = 3500;
        this.userAppearanceTime = {}; // Track when each user appeared on planet
        
        // Dad+ Mode (WHOIS retry logic)
        this.whoisPendingRequests = new Map(); // userid -> { retries, timestamp, timeout }
        this.whoisMaxRetries = 3;
        this.whoisTimeout = 5000; // 5 seconds timeout per request
    }

    // ==================== HELPER METHODS ====================
    
    /**
     * Parse 353 message to extract user IDs - Optimized version
     * @param {string} text - Raw 353 message
     * @returns {Array} - Array of user IDs
     */
    parse353UserIds(text) {
        // Single regex replace instead of multiple split/join operations
        const members = text.replace(/[+@:]/g, '').toLowerCase();
        const membersarr = members.split(" ");
        return membersarr.filter(item => !isNaN(item) && item !== "-" && item.length >= 6);
    }
    
    /**
     * Add user to target/attack tracking - Using Sets for O(1) lookups
     * @param {string} userid - User ID
     * @param {string} username - Username
     */
    addToTargetTracking(userid, username) {
        if (!this.targetids.has(userid)) {
            this.targetids.add(userid);
            this.targetnames.set(userid, username);
            this.attackids.add(userid);
            this.attacknames.set(userid, username);
            this.userAppearanceTime[userid] = Date.now();
            return true;
        }
        return false;
    }
    
    parseHaaapsi(e) { return parseHaaapsi(e); }
    countOccurrences(arr, val) { return countOccurrences(arr, val); }
    
    // ==================== SAFE WEBSOCKET OPERATIONS ====================
    
    /**
     * Safely send a WebSocket message with error handling
     * @param {WebSocket} ws - WebSocket connection
     * @param {string} message - Message to send
     * @param {string} context - Context for logging (e.g., "ATTACK", "KICK")
     * @returns {boolean} - True if sent successfully, false otherwise
     */
    safeSend(ws, message, context = "MESSAGE") {
        try {
            if (!ws) {
                console.error(`[WS${this.wsNumber}] ${context} - WebSocket is null`);
                this.addLog(this.wsNumber, `❌ ${context} failed - No connection`);
                return false;
            }
            
            if (ws.readyState !== ws.OPEN) {
                console.error(`[WS${this.wsNumber}] ${context} - WebSocket not open (state: ${ws.readyState})`);
                this.addLog(this.wsNumber, `❌ ${context} failed - Connection not ready`);
                return false;
            }
            
            ws.send(message);
            console.log(`[WS${this.wsNumber}] ${context} - Sent: ${message.substring(0, 50)}`);
            return true;
            
        } catch (error) {
            console.error(`[WS${this.wsNumber}] ${context} - Send error:`, error.message);
            this.addLog(this.wsNumber, `❌ ${context} failed - ${error.message}`);
            return false;
        }
    }
    
    /**
     * Send WHOIS request with retry logic for Dad+ mode
     * @param {WebSocket} ws - WebSocket connection
     * @param {string} userid - User ID to query
     * @param {number} retryCount - Current retry attempt
     */
    sendWhoisWithRetry(ws, userid, retryCount = 0) {
        try {
            if (!userid || userid === this.useridg || userid === this.founderUserId) {
                return;
            }
            
            // Check if already pending
            if (this.whoisPendingRequests.has(userid)) {
                const existing = this.whoisPendingRequests.get(userid);
                console.log(`[WS${this.wsNumber}] WHOIS for ${userid} already pending (retry ${existing.retries})`);
                return;
            }
            
            // Send WHOIS request
            const sent = this.safeSend(ws, `WHOIS ${userid}\r\n`, "WHOIS");
            
            if (!sent) {
                console.error(`[WS${this.wsNumber}] Failed to send WHOIS for ${userid}`);
                return;
            }
            
            // Track pending request
            const timeoutId = setTimeout(() => {
                if (this.whoisPendingRequests.has(userid)) {
                    const request = this.whoisPendingRequests.get(userid);
                    console.log(`[WS${this.wsNumber}] WHOIS timeout for ${userid} (retry ${request.retries}/${this.whoisMaxRetries})`);
                    
                    // Remove from pending
                    this.whoisPendingRequests.delete(userid);
                    
                    // Retry if under limit
                    if (request.retries < this.whoisMaxRetries) {
                        console.log(`[WS${this.wsNumber}] Retrying WHOIS for ${userid}...`);
                        setTimeout(() => {
                            this.sendWhoisWithRetry(ws, userid, request.retries + 1);
                        }, 1000); // Wait 1 second before retry
                    } else {
                        console.error(`[WS${this.wsNumber}] WHOIS for ${userid} failed after ${this.whoisMaxRetries} retries`);
                        this.addLog(this.wsNumber, `⚠️ Dad+ check failed for user ${userid}`);
                    }
                }
            }, this.whoisTimeout);
            
            this.whoisPendingRequests.set(userid, {
                retries: retryCount,
                timestamp: Date.now(),
                timeout: timeoutId
            });
            
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in sendWhoisWithRetry:`, error);
        }
    }
    
    /**
     * Mark WHOIS request as completed (call when 860 response received)
     * @param {string} userid - User ID that was queried
     */
    completeWhoisRequest(userid) {
        if (this.whoisPendingRequests.has(userid)) {
            const request = this.whoisPendingRequests.get(userid);
            clearTimeout(request.timeout);
            this.whoisPendingRequests.delete(userid);
            console.log(`[WS${this.wsNumber}] WHOIS completed for ${userid}`);
        }
    }

    resetState() {
        this.haaapsi = null;
        this.userFound = false;
        this.status = "";
        this.threesec = false;
        this.targetids.clear();
        this.targetnames.clear();
        this.attackids.clear();
        this.attacknames.clear();
        this.useridattack = "";
        this.useridtarget = null;
        
        // Reset bot gang detection on disconnect
        this.botGangName = null;
        
        // MEMORY LEAK FIX: Clear cooldown tracking objects
        this.attackCooldowns = {};
        this.userAppearanceTime = {};
        this.attackedThisSession.clear();

        if (this.timeout) { clearTimeout(this.timeout); this.timeout = null; }
        if (this.reconnectTimeoutId) { clearTimeout(this.reconnectTimeoutId); this.reconnectTimeoutId = null; }

        // Clear nested timeouts
        if (this.innerTimeouts && this.innerTimeouts.length > 0) {
            this.innerTimeouts.forEach(t => clearTimeout(t));
            this.innerTimeouts = [];
        }
        
        // Clear pending WHOIS requests
        if (this.whoisPendingRequests && this.whoisPendingRequests.size > 0) {
            this.whoisPendingRequests.forEach((request, userid) => {
                clearTimeout(request.timeout);
            });
            this.whoisPendingRequests.clear();
        }
        
        // Note: this.founderUserId persists across reconnects (loaded from file)

        this.isOffSleepActive = false;
        this.consecutiveErrors = 0;
        this.consecutiveSuccesses = 0;
    }

    // ==================== TIMER SHIFT LOGIC ====================
    getAdaptiveStepSize(baseStep) {
        if (this.consecutiveErrors >= 5) return baseStep * 5;
        if (this.consecutiveErrors >= 3) return baseStep * 3;
        if (this.consecutiveErrors >= 2) return baseStep * 2;
        return baseStep;
    }

    isOscillating() {
        if (this.recentAdjustments.length < 4) return false;
        for (let i = 1; i < this.recentAdjustments.length; i++) {
            const curr = this.recentAdjustments[i];
            const prev = this.recentAdjustments[i - 1];
            if ((curr > 0 && prev > 0) || (curr < 0 && prev < 0)) return false;
        }
        return true;
    }

    trackAdjustment(value) {
        this.recentAdjustments.push(value);
        if (this.recentAdjustments.length > this.maxAdjustmentHistory) this.recentAdjustments.shift();
    }

    getTiming(mode) {
        return mode === "defense" ?
            parseInt(this.config[`waiting${this.wsNumber}`] || 1910) :
            parseInt(this.config[`attack${this.wsNumber}`] || 1940);
    }

    getTimingLabel(mode) {
        if (this.config.timershift) {
            return mode === "defense" ? "Auto Defense" : "Auto Attack";
        } else {
            return mode === "defense" ? "Defense" : "Attack";
        }
    }

    incrementAttack() { this._adjustTiming(`attack${this.wsNumber}`, true); }
    decrementAttack() { this._adjustTiming(`attack${this.wsNumber}`, false); }
    incrementDefence() { this._adjustTiming(`waiting${this.wsNumber}`, true); }
    decrementDefence() { this._adjustTiming(`waiting${this.wsNumber}`, false); }

    _adjustTiming(key, increment) {
        if (!this.config.timershift) return;
        let value = parseInt(this.config[key] || 1940);
        const baseVal = parseInt(this.config.incrementvalue || 10);
        const decrementVal = parseInt(this.config.decrementvalue || 10);
        
        // Get min/max bounds
        const isAttack = key.startsWith('attack');
        const minBound = parseInt(isAttack ? this.config.minatk : this.config.mindef || 1000);
        const maxBound = parseInt(isAttack ? this.config.maxatk : this.config.maxdef || 3000);
        
        // Calculate step size
        let step;
        if (increment) {
            step = this.getAdaptiveStepSize(baseVal);
        } else {
            step = decrementVal; // Use smaller steps for decrement (more conservative)
        }
        
        // Reduce step size if oscillating
        if (this.isOscillating()) {
            step = Math.max(1, Math.floor(step / 2));
            this.addLog(this.wsNumber, `⚠️ Oscillation detected - reducing step to ${step}ms`);
        }

        if (increment) {
            value += step;
            if (value <= maxBound) {
                this.config[key] = value;
                this.updateConfig(key, value);
                this.trackAdjustment(step);
                this.addLog(this.wsNumber, `⏫ Timing ${key} increased to ${value}ms (+${step}ms)`);
            } else {
                this.addLog(this.wsNumber, `⚠️ Timing ${key} at maximum (${maxBound}ms)`);
            }
        } else {
            value -= step;
            if (value >= minBound) {
                this.config[key] = value;
                this.updateConfig(key, value);
                this.trackAdjustment(-step);
                this.addLog(this.wsNumber, `⏬ Timing ${key} decreased to ${value}ms (-${step}ms)`);
            } else {
                this.addLog(this.wsNumber, `⚠️ Timing ${key} at minimum (${minBound}ms)`);
            }
        }
    }

    // ==================== SMART MODE LOGIC ====================
    markTargetAttacked(userid) {
        this.attackCooldowns[userid] = Date.now();
        this.attackedThisSession.add(userid);
        
        // MEMORY OPTIMIZATION: Cleanup old cooldowns (older than 10 seconds)
        const now = Date.now();
        const maxAge = 10000; // 10 seconds
        Object.keys(this.attackCooldowns).forEach(id => {
            if (now - this.attackCooldowns[id] > maxAge) {
                delete this.attackCooldowns[id];
                delete this.userAppearanceTime[id];
            }
        });
    }

    isOnCooldown(userid) {
        const last = this.attackCooldowns[userid];
        return last && (Date.now() - last < this.cooldownDuration);
    }

    getAvailableTargets() {
        return Array.from(this.attackids).filter(id => !this.isOnCooldown(id));
    }

    selectSmartTarget() {
        if (!this.config.smart || this.attackids.size === 0) return null;
        let candidates = this.getAvailableTargets();
        if (candidates.length === 0) candidates = Array.from(this.attackids);

        const unattacked = candidates.filter(id => !this.attackedThisSession.has(id));
        if (unattacked.length > 0) candidates = unattacked;
        else this.attackedThisSession.clear();

        let selectedId;
        if (this.config.roundRobin) {
            selectedId = candidates[this.targetIndex % candidates.length];
            this.targetIndex++;
        } else {
            selectedId = candidates[Math.floor(Math.random() * candidates.length)];
        }
        return { id: selectedId, name: this.attacknames.get(selectedId) };
    }

    // ==================== 353 MESSAGE HANDLERS ====================

    handle353Message(ws, snippets, text) {
        const planetName = snippets[3];
        
        console.log(`[WS${this.wsNumber}] 353 message received - Planet: ${planetName}`);
        
        // Extract bot's own gang name if not already set
        if (!this.botGangName && this.useridg) {
            // Parse the 353 message to find bot's gang
            // Format: "353 1 = PLANET :GANGNAME username userid GANGNAME username userid ..."
            // Or: "353 1 = PLANET :- username userid ..." (no gang)
            
            console.log(`[WS${this.wsNumber}] 🔍 Detecting bot gang - Bot ID: ${this.useridg}`);
            console.log(`[WS${this.wsNumber}] 🔍 353 message: ${text.substring(0, 300)}...`);
            
            // Find bot's userid in the message
            const botIdIndex = text.indexOf(this.useridg);
            
            if (botIdIndex !== -1) {
                console.log(`[WS${this.wsNumber}] 🔍 Bot found at position ${botIdIndex}`);
                
                // Get text before bot's userid
                const textBeforeBot = text.substring(0, botIdIndex);
                console.log(`[WS${this.wsNumber}] 🔍 Text before bot: ...${textBeforeBot.substring(Math.max(0, textBeforeBot.length - 100))}`);
                
                // Split by spaces to get tokens
                const tokens = textBeforeBot.trim().split(/\s+/);
                console.log(`[WS${this.wsNumber}] 🔍 Last 5 tokens before bot: ${tokens.slice(-5).join(' ')}`);
                
                // Work backwards from bot's position
                // Pattern: ... GANGNAME username userid
                // We want to find the token before username (which is before userid)
                
                // The last token should be the bot's username
                // The token before that should be the gang name (or ":-" if no gang)
                
                if (tokens.length >= 2) {
                    const botUsername = tokens[tokens.length - 1]; // Last token before userid
                    const gangOrSeparator = tokens[tokens.length - 2]; // Token before username
                    
                    console.log(`[WS${this.wsNumber}] 🔍 Bot username: ${botUsername}`);
                    console.log(`[WS${this.wsNumber}] 🔍 Gang/Separator: ${gangOrSeparator}`);
                    
                    // Check if it's a gang name or separator
                    if (gangOrSeparator === ':-' || gangOrSeparator === ':') {
                        // No gang
                        this.botGangName = "NO_GANG";
                        console.log(`[WS${this.wsNumber}] 🤖 Bot has no gang (separator: ${gangOrSeparator})`);
                        this.addLog(this.wsNumber, `🤖 Bot has no gang`);
                    } else if (gangOrSeparator.match(/^[A-Z_][A-Z0-9_]*$/i)) {
                        // Looks like a gang name (alphanumeric + underscore)
                        this.botGangName = gangOrSeparator.toLowerCase();
                        console.log(`[WS${this.wsNumber}] 🤖 Bot's gang detected: ${this.botGangName}`);
                        this.addLog(this.wsNumber, `🤖 Bot gang: ${this.botGangName}`);
                    } else {
                        // Unclear - might be username or something else
                        this.botGangName = "NO_GANG";
                        console.log(`[WS${this.wsNumber}] 🤖 Bot has no gang (unclear token: ${gangOrSeparator})`);
                        this.addLog(this.wsNumber, `🤖 Bot has no gang`);
                    }
                } else {
                    // Not enough tokens
                    this.botGangName = "NO_GANG";
                    console.log(`[WS${this.wsNumber}] 🤖 Bot has no gang (not enough tokens)`);
                }
            } else {
                console.log(`[WS${this.wsNumber}] 🔍 Bot NOT found in 353 message`);
                // Bot not in message yet - will detect on next 353
            }
        }
        
        // Load founder ID from file if planet changed or not loaded yet
        if (planetName && planetName !== this.currentPlanet) {
            const savedFounderId = getFounderId(planetName);
            if (savedFounderId) {
                this.founderUserId = savedFounderId;
                console.log(`[WS${this.wsNumber}] Loaded founder from memory: ${savedFounderId}`);
                this.addLog(this.wsNumber, `👑 Planet founder (from memory): ${savedFounderId}`);
            } else {
                // New planet without saved founder - clear previous founder
                this.founderUserId = null;
                console.log(`[WS${this.wsNumber}] New planet - waiting for FOUNDER message`);
            }
        }
        
        console.log(`[WS${this.wsNumber}] Founder ID: ${this.founderUserId || 'NONE'}`);
        this.addLog(this.wsNumber, `📋 353 - Users on ${planetName || 'planet'}`);
        
        if (planetName) {
            this.currentPlanet = planetName;
            this.inPrison = planetName.slice(0, 6) === "Prison";
            
            console.log(`[WS${this.wsNumber}] 353 - Planet: ${planetName}, inPrison: ${this.inPrison}, autorelease: ${this.config.autorelease}`);
            
            // If we're in prison and autorelease is enabled, trigger escape
            if (this.inPrison) {
                this.addLog(this.wsNumber, `🔴 In Prison: ${planetName}`);
                
                if (this.config.autorelease) {
                    this.addLog(this.wsNumber, `🔓 Prison detected on connect - attempting escape`);
                    console.log(`[WS${this.wsNumber}] Triggering auto-release...`);
                    setTimeout(async () => {
                        console.log(`[WS${this.wsNumber}] Calling escapeAll()...`);
                        const success = await this.escapeAll();
                        console.log(`[WS${this.wsNumber}] escapeAll() result: ${success}`);
                        
                        // Rejoin target planet after escape
                        const targetPlanet = this.config.planet;
                        if (targetPlanet && ws.readyState === ws.OPEN) {
                            setTimeout(() => {
                                if (ws.readyState === ws.OPEN) {
                                    ws.send(`JOIN ${targetPlanet}\r\n`);
                                    this.addLog(this.wsNumber, `🔄 Rejoining ${targetPlanet}`);
                                }
                            }, 3000);
                        }
                    }, 1000);
                } else {
                    this.addLog(this.wsNumber, `⚠️ Auto-release is disabled`);
                    console.log(`[WS${this.wsNumber}] Auto-release is disabled (autorelease=${this.config.autorelease})`);
                }
            }
        }

        // DEBUG: Log current config state
        console.log(`[WS${this.wsNumber}] 353 - Config check:`, {
            modena: this.config.modena,
            lowsecmode: this.config.lowsecmode,
            kickmode: this.config.kickmode,
            kickall: this.config.kickall,
            kickbybl: this.config.kickbybl,
            dadplus: this.config.dadplus
        });

        // Check N/A mode first - applies to ALL connections
        if (this.config.modena === true) {
            console.log(`[WS${this.wsNumber}] 353 - Routing to BAN mode`);
            this.handle353BanMode(ws, snippets, text);
            return;
        }

        // Check Low Sec mode
        if (this.config.lowsecmode) {
            console.log(`[WS${this.wsNumber}] 353 - Routing to Low Sec mode`);
            this.handle353LowSec(ws, snippets, text);
            return;
        }

        // Check if any kick/imprison mode is enabled
        const kickModeEnabled = this.config.kickall || this.config.kickbybl || this.config.dadplus;
        console.log(`[WS${this.wsNumber}] 353 - kickModeEnabled: ${kickModeEnabled}`);
        
        if (kickModeEnabled) {
            // Only run kick/imprison mode handler
            console.log(`[WS${this.wsNumber}] 353 - Routing to Kick/Imprison mode`);
            this.handle353KickMode(ws, snippets, text);
        } else if (!this.config.kickmode) {
            // Only run normal attack mode if NOT in kick mode
            // (kickmode=true with no modes enabled means "do nothing")
            console.log(`[WS${this.wsNumber}] 353 - Routing to Normal attack mode`);
            this.handle353Normal(ws, snippets, text);
        } else {
            // kickmode=true but no modes enabled - do nothing
            console.log(`[WS${this.wsNumber}] Kick mode enabled but no action modes selected - doing nothing`);
        }
    }

    // 1. BAN MODE (N/A Mode)
    handle353BanMode(ws, snippets, text) {
        try {
            const channelName = snippets[3];
            
            // Skip prison channels
            if (channelName && channelName.slice(0, 6) === "Prison") {
                this.addLog(this.wsNumber, `Skipping prison channel`);
                return;
            }

            // ONLY process if at least one mode is enabled
            if (!this.config.kickall && !this.config.kickbybl && !this.config.dadplus) {
                return;
            }
            
            // Log current founder ID (from FOUNDER message - the only reliable source)
            console.log(`[WS${this.wsNumber}] 353 BAN - Using founder ID for filtering: ${this.founderUserId || 'NONE'}`);

            console.log(`[WS${this.wsNumber}] 353 BAN mode - Processing user list`);
            console.log(`[WS${this.wsNumber}] 353 BAN mode options - Everyone=${this.config.kickall}, ByBlacklist=${this.config.kickbybl}, Dad+=${this.config.dadplus}`);
            
            // Parse all user IDs from 353 message - Optimized
            const integers = this.parse353UserIds(text);
            
            console.log(`[WS${this.wsNumber}] 353 BAN - Found ${integers.length} user IDs`);
            console.log(`[WS${this.wsNumber}] 353 BAN - Self ID: ${this.useridg}, Founder ID: ${this.founderUserId || 'NONE'}`);
            
            // CRITICAL FIX: Parse membersarr for username lookup
            const members = text.replace(/[+@:]/g, '');
            const membersarr = members.toLowerCase().split(" ");
            
            // PERFORMANCE FIX: Use Set for O(1) deduplication instead of array.find()
            const usersToBanSet = new Set();
            const usersToBanMap = new Map(); // userid -> {username, reason}
            
            // OPTION 1: Check "Everyone" mode - ban all users
            if (this.config.kickall) {
                console.log(`[WS${this.wsNumber}] 353 BAN mode - Everyone mode active`);
                
                integers.forEach((userid) => {
                    // CRITICAL: Check founder FIRST
                    if (userid === this.founderUserId) {
                        console.log(`[WS${this.wsNumber}] 353 BAN mode - SKIPPING FOUNDER: ${userid}`);
                        this.addLog(this.wsNumber, `👑 Skipping planet owner: ${userid}`);
                        return;
                    }
                    
                    // Skip self
                    if (userid === this.useridg) {
                        console.log(`[WS${this.wsNumber}] 353 BAN mode - Skipping self: ${userid}`);
                        return;
                    }
                    
                    const idx = membersarr.indexOf(userid);
                    if (idx > 0) {
                        const username = membersarr[idx - 1];
                        
                        // Skip if username is also numeric
                        if (!isNaN(username)) return;
                        
                        // PERFORMANCE FIX: Use Set instead of array.find()
                        if (!usersToBanSet.has(userid)) {
                            usersToBanSet.add(userid);
                            usersToBanMap.set(userid, { username, reason: 'everyone' });
                            console.log(`[WS${this.wsNumber}] 353 BAN mode - Added user to ban (everyone): ${username} (${userid})`);
                        }
                    }
                });
            }
            
            // OPTION 2: Check "By Blacklist" mode (only if Everyone is not enabled)
            else if (this.config.kickbybl) {
                const data = text.replaceAll("+", "").toLowerCase();
                
                // PERFORMANCE FIX: Cache split results instead of splitting in loop
                const kblacklist = (this.config.kblacklist || "").toLowerCase().split("\n").filter(k => k.trim());
                const kgangblacklist = (this.config.kgangblacklist || "").toLowerCase().split("\n").filter(g => g.trim());
                
                console.log(`[WS${this.wsNumber}] 353 BAN mode - Kick Blacklist Users: [${kblacklist.join(', ')}]`);
                console.log(`[WS${this.wsNumber}] 353 BAN mode - Kick Blacklist Clans: [${kgangblacklist.join(', ')}]`);
                console.log(`[WS${this.wsNumber}] 353 BAN mode - Data: ${data.substring(0, 200)}...`);
                
                // Process username blacklist
                kblacklist.forEach((element) => {
                    if (element && data.includes(element)) {
                        console.log(`[WS${this.wsNumber}] 353 BAN mode - Found username match: ${element}`);
                        const replace = element + " ";
                        const replaced = data.replaceAll(replace, "*");
                        const arr = replaced.split("*");
                        arr.shift();
                        
                        if (arr[0]) {
                            const userid = arr[0].split(" ")[0];
                            if (userid === this.useridg) {
                                console.log(`[WS${this.wsNumber}] 353 BAN mode - Skipping self: ${userid}`);
                            } else if (userid === this.founderUserId) {
                                console.log(`[WS${this.wsNumber}] 353 BAN mode - Skipping founder: ${userid}`);
                                this.addLog(this.wsNumber, `👑 Skipping BAN for planet owner: ${element}`);
                            } else if (userid && !usersToBanSet.has(userid)) {
                                usersToBanSet.add(userid);
                                usersToBanMap.set(userid, { username: element, reason: `kblacklist: ${element}` });
                                console.log(`[WS${this.wsNumber}] 353 BAN mode - Found user to ban: ${element} (${userid})`);
                            }
                        }
                    }
                });
                
                // Process gang blacklist
                kgangblacklist.forEach((element) => {
                    console.log(`[WS${this.wsNumber}] 353 BAN mode - Checking gang: "${element}"`);
                    
                    // Skip if this is bot's own gang
                    if (this.botGangName && this.botGangName !== "no_gang" && element === this.botGangName) {
                        console.log(`[WS${this.wsNumber}] 353 BAN mode - Skipping bot's own gang: ${element}`);
                        this.addLog(this.wsNumber, `🤖 Skipping own gang: ${element}`);
                        return;
                    }
                    
                    if (element && data.includes(element)) {
                        console.log(`[WS${this.wsNumber}] 353 BAN mode - Found gang match: ${element}`);
                        const replace = element + " ";
                        const replaced = data.replaceAll(replace, "*");
                        const arr = replaced.split("*");
                        console.log(`[WS${this.wsNumber}] 353 BAN mode - Split result: ${arr.length} parts`);
                        arr.shift();
                        
                        for (let i = 0; i < arr.length; i++) {
                            const value = arr[i];
                            const parts = value.split(" ");
                            const userid = parts[1];
                            const username = parts[0];
                            
                            console.log(`[WS${this.wsNumber}] 353 BAN mode - Gang member: username="${username}", userid="${userid}"`);
                            
                            if (userid === this.useridg) {
                                console.log(`[WS${this.wsNumber}] 353 BAN mode - Skipping self: ${userid}`);
                            } else if (userid === this.founderUserId) {
                                console.log(`[WS${this.wsNumber}] 353 BAN mode - Skipping founder: ${userid}`);
                                this.addLog(this.wsNumber, `👑 Skipping BAN for planet owner in gang: ${username}`);
                            } else if (username && userid && !usersToBanSet.has(userid)) {
                                usersToBanSet.add(userid);
                                usersToBanMap.set(userid, { username, reason: `kgangblacklist: ${element}` });
                                console.log(`[WS${this.wsNumber}] 353 BAN mode - Found gang member to ban: ${username} (${userid})`);
                            }
                        }
                    } else {
                        console.log(`[WS${this.wsNumber}] 353 BAN mode - Gang "${element}" NOT found in data`);
                    }
                });
            }
            
            // OPTION 3: Dad+ mode - Request user info for all users to check for aura
            if (this.config.dadplus) {
                console.log(`[WS${this.wsNumber}] Dad+ mode - Requesting info for ${integers.length} users`);
                this.addLog(this.wsNumber, `🔍 Dad+ checking ${integers.length} users for aura`);
                
                integers.forEach((userid, index) => {
                    if (userid === this.useridg || userid === this.founderUserId) return;
                    
                    setTimeout(() => {
                        this.sendWhoisWithRetry(ws, userid);
                    }, index * 100); // Increased from 50ms to 100ms to avoid rate limiting
                });
            }
            
            // Ban all matched users (convert Set back to array)
            const usersToBan = Array.from(usersToBanSet).map(userid => ({
                userid,
                username: usersToBanMap.get(userid).username,
                reason: usersToBanMap.get(userid).reason
            }));
            
            if (usersToBan.length > 0) {
                console.log(`[WS${this.wsNumber}] 353 BAN mode - Banning ${usersToBan.length} user(s)`);
                this.addLog(this.wsNumber, `🚫 Found ${usersToBan.length} user(s) to ban`);
                
                usersToBan.forEach((user, index) => {
                    setTimeout(() => {
                        if (ws.readyState === ws.OPEN) {
                            ws.send(`BAN ${user.userid}\r\n`);
                            this.addLog(this.wsNumber, `🚫 Banning ${user.username} (${user.userid}) - ${user.reason}`);
                            console.log(`[WS${this.wsNumber}] 353 BAN mode - Sent BAN command for ${user.userid}`);
                        }
                    }, index * 100);
                });
            } else {
                console.log(`[WS${this.wsNumber}] 353 BAN mode - No users to ban`);
                this.addLog(this.wsNumber, `✅ No users in blacklist found on planet`);
            }
            
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in handle353BanMode:`, error);
        }
    }

    // 2. KICK / IMPRISON MODE
    handle353KickMode(ws, snippets, text) {
        try {
            const channelName = snippets[3];
            
            // Skip prison channels
            if (channelName && channelName.slice(0, 6) === "Prison") {
                this.addLog(this.wsNumber, `Skipping prison channel`);
                return;
            }

            // ONLY process if at least one mode is enabled
            if (!this.config.kickall && !this.config.kickbybl && !this.config.dadplus) {
                return;
            }
            
            // Log current founder ID (from FOUNDER message - the only reliable source)
            console.log(`[WS${this.wsNumber}] 353 - Using founder ID for filtering: ${this.founderUserId || 'NONE'}`);

            // Determine if we're in Kick or Imprison mode
            const isKickMode = this.config.kickmode === true;
            const actionType = isKickMode ? "Kick" : "Imprison";
            
            console.log(`[WS${this.wsNumber}] 353 ${actionType} mode - Processing user list`);
            console.log(`[WS${this.wsNumber}] 353 ${actionType} mode options - Everyone=${this.config.kickall}, ByBlacklist=${this.config.kickbybl}, Dad+=${this.config.dadplus}`);
            
            // Parse all user IDs from 353 message - Optimized
            const integers = this.parse353UserIds(text);
            
            console.log(`[WS${this.wsNumber}] 353 - Found ${integers.length} user IDs: [${integers.join(', ')}]`);
            console.log(`[WS${this.wsNumber}] 353 - Self ID: ${this.useridg}, Founder ID: ${this.founderUserId || 'NONE'}`);
            
            // CRITICAL FIX: Parse membersarr for username lookup
            const members = text.replace(/[+@:]/g, '');
            const membersarr = members.toLowerCase().split(" ");
            
            // PERFORMANCE FIX: Use Set for O(1) deduplication instead of array.find()
            const usersToActSet = new Set();
            const usersToActMap = new Map(); // userid -> {username, reason}
            
            // OPTION 1: Check "Everyone" mode - kick/imprison all users
            if (this.config.kickall) {
                console.log(`[WS${this.wsNumber}] 353 ${actionType} mode - Everyone mode active`);
                
                integers.forEach((userid) => {
                    // CRITICAL: Check founder FIRST before any processing
                    if (userid === this.founderUserId) {
                        console.log(`[WS${this.wsNumber}] 353 ${actionType} mode - SKIPPING FOUNDER: ${userid}`);
                        this.addLog(this.wsNumber, `👑 Skipping planet owner: ${userid}`);
                        return; // Skip this user completely
                    }
                    
                    // Skip self
                    if (userid === this.useridg) {
                        console.log(`[WS${this.wsNumber}] 353 ${actionType} mode - Skipping self: ${userid}`);
                        return;
                    }
                    
                    const idx = membersarr.indexOf(userid);
                    if (idx > 0) {
                        const username = membersarr[idx - 1];
                        
                        // Skip if username is also numeric (means it's not a username)
                        if (!isNaN(username)) return;
                        
                        // PERFORMANCE FIX: Use Set instead of array.find()
                        if (!usersToActSet.has(userid)) {
                            usersToActSet.add(userid);
                            usersToActMap.set(userid, { username, reason: 'everyone' });
                            console.log(`[WS${this.wsNumber}] 353 ${actionType} mode - Added user (everyone): ${username} (${userid})`);
                        }
                    }
                });
            }
            
            // OPTION 2: Check "By Blacklist" mode (only if Everyone is not enabled)
            else if (this.config.kickbybl) {
                const data = text.replaceAll("+", "").toLowerCase();
                
                if (isKickMode) {
                    // KICK MODE: Use kblacklist and kgangblacklist
                    // PERFORMANCE FIX: Cache split results
                    const kblacklist = (this.config.kblacklist || "").toLowerCase().split("\n").filter(k => k.trim());
                    const kgangblacklist = (this.config.kgangblacklist || "").toLowerCase().split("\n").filter(g => g.trim());
                    
                    console.log(`[WS${this.wsNumber}] 353 Kick mode - Kick Blacklist Users: [${kblacklist.join(', ')}]`);
                    console.log(`[WS${this.wsNumber}] 353 Kick mode - Kick Blacklist Clans: [${kgangblacklist.join(', ')}]`);
                    
                    // Process username blacklist
                    kblacklist.forEach((element) => {
                        if (element && data.includes(element)) {
                            const replace = element + " ";
                            const replaced = data.replaceAll(replace, "*");
                            const arr = replaced.split("*");
                            arr.shift();
                            
                            if (arr[0]) {
                                const userid = arr[0].split(" ")[0];
                                // Skip self and founder
                                if (userid === this.useridg) {
                                    console.log(`[WS${this.wsNumber}] 353 Kick mode - Skipping self: ${userid}`);
                                } else if (userid === this.founderUserId) {
                                    console.log(`[WS${this.wsNumber}] 353 Kick mode - Skipping founder: ${userid}`);
                                    this.addLog(this.wsNumber, `👑 Skipping kick for planet owner: ${element}`);
                                } else if (userid && !usersToActSet.has(userid)) {
                                    usersToActSet.add(userid);
                                    usersToActMap.set(userid, { username: element, reason: `kblacklist: ${element}` });
                                    console.log(`[WS${this.wsNumber}] 353 Kick mode - Found user to kick: ${element} (${userid})`);
                                }
                            }
                        }
                    });
                    
                    // Process gang blacklist
                    kgangblacklist.forEach((element) => {
                        console.log(`[WS${this.wsNumber}] 353 Kick mode - Checking gang: "${element}"`);
                        
                        // Skip if this is bot's own gang
                        if (this.botGangName && this.botGangName !== "no_gang" && element === this.botGangName) {
                            console.log(`[WS${this.wsNumber}] 353 Kick mode - Skipping bot's own gang: ${element}`);
                            this.addLog(this.wsNumber, `🤖 Skipping own gang: ${element}`);
                            return;
                        }
                        
                        if (element && data.includes(element)) {
                            console.log(`[WS${this.wsNumber}] 353 Kick mode - Found gang match: ${element}`);
                            const replace = element + " ";
                            const replaced = data.replaceAll(replace, "*");
                            const arr = replaced.split("*");
                            console.log(`[WS${this.wsNumber}] 353 Kick mode - Split result: ${arr.length} parts`);
                            arr.shift();
                            
                            for (let i = 0; i < arr.length; i++) {
                                const value = arr[i];
                                const parts = value.split(" ");
                                const userid = parts[1];
                                const username = parts[0];
                                
                                console.log(`[WS${this.wsNumber}] 353 Kick mode - Gang member: username="${username}", userid="${userid}"`);
                                
                                // Skip self and founder
                                if (userid === this.useridg) {
                                    console.log(`[WS${this.wsNumber}] 353 Kick mode - Skipping self: ${userid}`);
                                } else if (userid === this.founderUserId) {
                                    console.log(`[WS${this.wsNumber}] 353 Kick mode - Skipping founder: ${userid}`);
                                    this.addLog(this.wsNumber, `👑 Skipping kick for planet owner in gang: ${username}`);
                                } else if (username && userid && !usersToActSet.has(userid)) {
                                    usersToActSet.add(userid);
                                    usersToActMap.set(userid, { username, reason: `kgangblacklist: ${element}` });
                                    console.log(`[WS${this.wsNumber}] 353 Kick mode - Found gang member to kick: ${username} (${userid})`);
                                }
                            }
                        } else {
                            console.log(`[WS${this.wsNumber}] 353 Kick mode - Gang "${element}" NOT found in data`);
                        }
                    });
                } else {
                    // IMPRISON MODE: Use blacklist and gangblacklist
                    // PERFORMANCE FIX: Cache split results
                    const blacklist = (this.config.blacklist || "").toLowerCase().split("\n").filter(b => b.trim());
                    const gangblacklist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(g => g.trim());
                    
                    console.log(`[WS${this.wsNumber}] 353 Imprison mode - Blacklist Users: [${blacklist.join(', ')}]`);
                    console.log(`[WS${this.wsNumber}] 353 Imprison mode - Blacklist Clans: [${gangblacklist.join(', ')}]`);
                    
                    // Process username blacklist
                    blacklist.forEach((element) => {
                        if (element && data.includes(element)) {
                            const replace = element + " ";
                            const replaced = data.replaceAll(replace, "*");
                            const arr = replaced.split("*");
                            arr.shift();
                            
                            if (arr[0]) {
                                const userid = arr[0].split(" ")[0];
                                // Skip self and founder
                                if (userid === this.useridg) {
                                    console.log(`[WS${this.wsNumber}] 353 Imprison mode - Skipping self: ${userid}`);
                                } else if (userid === this.founderUserId) {
                                    console.log(`[WS${this.wsNumber}] 353 Imprison mode - Skipping founder: ${userid}`);
                                    this.addLog(this.wsNumber, `👑 Skipping imprison for planet owner: ${element}`);
                                } else if (userid && !usersToActSet.has(userid)) {
                                    usersToActSet.add(userid);
                                    usersToActMap.set(userid, { username: element, reason: `blacklist: ${element}` });
                                    console.log(`[WS${this.wsNumber}] 353 Imprison mode - Found user to imprison: ${element} (${userid})`);
                                }
                            }
                        }
                    });
                    
                    // Process gang blacklist
                    gangblacklist.forEach((element) => {
                        console.log(`[WS${this.wsNumber}] 353 Imprison mode - Checking gang: "${element}"`);
                        
                        // Skip if this is bot's own gang
                        if (this.botGangName && this.botGangName !== "no_gang" && element === this.botGangName) {
                            console.log(`[WS${this.wsNumber}] 353 Imprison mode - Skipping bot's own gang: ${element}`);
                            this.addLog(this.wsNumber, `🤖 Skipping own gang: ${element}`);
                            return;
                        }
                        
                        if (element && data.includes(element)) {
                            console.log(`[WS${this.wsNumber}] 353 Imprison mode - Found gang match: ${element}`);
                            const replace = element + " ";
                            const replaced = data.replaceAll(replace, "*");
                            const arr = replaced.split("*");
                            console.log(`[WS${this.wsNumber}] 353 Imprison mode - Split result: ${arr.length} parts`);
                            arr.shift();
                            
                            for (let i = 0; i < arr.length; i++) {
                                const value = arr[i];
                                const parts = value.split(" ");
                                const userid = parts[1];
                                const username = parts[0];
                                
                                console.log(`[WS${this.wsNumber}] 353 Imprison mode - Gang member: username="${username}", userid="${userid}"`);
                                
                                // Skip self and founder
                                if (userid === this.useridg) {
                                    console.log(`[WS${this.wsNumber}] 353 Imprison mode - Skipping self: ${userid}`);
                                } else if (userid === this.founderUserId) {
                                    console.log(`[WS${this.wsNumber}] 353 Imprison mode - Skipping founder: ${userid}`);
                                    this.addLog(this.wsNumber, `👑 Skipping imprison for planet owner in gang: ${username}`);
                                } else if (username && userid && !usersToActSet.has(userid)) {
                                    usersToActSet.add(userid);
                                    usersToActMap.set(userid, { username, reason: `gangblacklist: ${element}` });
                                    console.log(`[WS${this.wsNumber}] 353 Imprison mode - Found gang member to imprison: ${username} (${userid})`);
                                }
                            }
                        } else {
                            console.log(`[WS${this.wsNumber}] 353 Imprison mode - Gang "${element}" NOT found in data`);
                        }
                    });
                }
            }
            
            // OPTION 3: Dad+ mode - Request user info for all users to check for aura (independent of other modes)
            if (this.config.dadplus) {
                console.log(`[WS${this.wsNumber}] Dad+ mode - Requesting info for ${integers.length} users`);
                this.addLog(this.wsNumber, `🔍 Dad+ checking ${integers.length} users for aura`);
                
                integers.forEach((userid, index) => {
                    // Skip self and founder
                    if (userid === this.useridg || userid === this.founderUserId) return;
                    
                    setTimeout(() => {
                        this.sendWhoisWithRetry(ws, userid);
                    }, index * 100); // Increased from 50ms to 100ms to avoid rate limiting
                });
            }
            
            // Execute actions for matched users (convert Set back to array)
            const usersToAct = Array.from(usersToActSet).map(userid => ({
                userid,
                username: usersToActMap.get(userid).username,
                reason: usersToActMap.get(userid).reason
            }));
            
            if (usersToAct.length > 0) {
                // KICK mode: No timing delay (immediate)
                // IMPRISON mode: Use attack timing
                const timing = isKickMode ? 0 : this.getTiming("attack");
                const timingLabel = isKickMode ? "Immediate" : this.getTimingLabel("attack");
                
                console.log(`[WS${this.wsNumber}] 353 ${actionType} mode - Acting on ${usersToAct.length} user(s)`);
                this.addLog(this.wsNumber, `${isKickMode ? '👢' : '⚔️'} Found ${usersToAct.length} user(s) to ${actionType.toLowerCase()}`);
                
                if (isKickMode) {
                    this.addLog(this.wsNumber, `⚡ Kicking immediately (no delay)`);
                } else {
                    this.addLog(this.wsNumber, `⚡ ${timingLabel} in ${timing}ms`);
                }
                
                // Wait for timing before sending first action (0ms for kick mode)
                this.timeout = setTimeout(() => {
                    usersToAct.forEach((user, index) => {
                        const innerTimeout = setTimeout(() => {
                            if (ws.readyState === ws.OPEN) {
                                if (isKickMode) {
                                    ws.send(`KICK ${user.userid}\r\n`);
                                    this.addLog(this.wsNumber, `👢 Kicking ${user.username} (${user.userid}) - ${user.reason}`);
                                    console.log(`[WS${this.wsNumber}] 353 Kick mode - Sent KICK command for ${user.userid}`);
                                } else {
                                    ws.send(`ACTION 3 ${user.userid}\r\n`);
                                    this.markTargetAttacked(user.userid);
                                    this.addLog(this.wsNumber, `⚔️ Imprisoning ${user.username} (${user.userid}) - ${user.reason}`);
                                    console.log(`[WS${this.wsNumber}] 353 Imprison mode - Sent ACTION 3 command for ${user.userid}`);
                                }
                                
                                // QUIT only in Imprison mode (not in Kick mode)
                                // Kick mode: Stay connected to kick more users
                                // Imprison mode: Quit because you get imprisoned
                                if (index === usersToAct.length - 1 && !isKickMode) {
                                    if (this.config.exitting || this.config.sleeping) {
                                        ws.send("QUIT :ds\r\n");
                                        this.addLog(this.wsNumber, `🚪 QUIT after ${actionType.toLowerCase()}`);
                                        
                                        // Trigger auto-reconnect if sleeping mode is enabled
                                        console.log(`[WS${this.wsNumber}] 353 Imprison - Checking OffSleep: sleeping=${this.config.sleeping}, connected=${this.config.connected}`);
                                        this.addLog(this.wsNumber, `🔍 Check: sleeping=${this.config.sleeping}, connected=${this.config.connected}`);
                                        if (this.config.sleeping && this.config.connected) {
                                            console.log(`[WS${this.wsNumber}] ✅ Calling OffSleep from 353 handler`);
                                            this.addLog(this.wsNumber, `✅ Calling OffSleep (353 handler)`);
                                            this.OffSleep(ws);
                                        } else {
                                            console.log(`[WS${this.wsNumber}] ❌ Skipping OffSleep (sleeping=${this.config.sleeping}, connected=${this.config.connected})`);
                                            this.addLog(this.wsNumber, `❌ Skipping OffSleep (sleeping=${this.config.sleeping}, connected=${this.config.connected})`);
                                        }
                                    }
                                } else if (index === usersToAct.length - 1 && isKickMode) {
                                    // Kick mode: Stay connected, don't quit
                                    console.log(`[WS${this.wsNumber}] Kick mode - Staying connected to kick more users`);
                                    this.addLog(this.wsNumber, `✅ Staying connected (Kick mode)`);
                                }
                            }
                        }, index * 100); // Stagger actions by 100ms to avoid flooding
                        
                        this.innerTimeouts.push(innerTimeout);
                    });
                }, timing);
            } else {
                console.log(`[WS${this.wsNumber}] 353 ${actionType} mode - No users to ${actionType.toLowerCase()}`);
                this.addLog(this.wsNumber, `✅ No users in blacklist found on planet`);
            }
            
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in handle353KickMode:`, error);
        }
    }

    // 3. LOW SEC MODE
    handle353LowSec(ws, snippets, text) {
        if (snippets[3] && snippets[3].slice(0, 6) === "Prison") return;

        // Optimized string operations
        const members = text.replace(/[+@:]/g, '');
        const membersarr = members.toLowerCase().split(" ");
        membersarr.push("randomname");

        const whitelist = (this.config.blacklist || "").split("\n").filter(x => x.trim());
        const gangwhitelist = (this.config.gangblacklist || "").split("\n").filter(x => x.trim());

        const indexself = membersarr.indexOf(this.useridg);
        if (indexself >= 0) membersarr[indexself] = "-";

        whitelist.forEach(element => {
            if (element && membersarr.includes(element.toLowerCase())) {
                const idx = membersarr.indexOf(element.toLowerCase());
                if (idx >= 0) membersarr[idx + 1] = "-";
            }
        });

        gangwhitelist.forEach(element => {
            if (element) {
                const count = this.countOccurrences(membersarr, element.toLowerCase());
                for (let k = 0; k < count; k++) {
                    const idx = membersarr.indexOf(element.toLowerCase());
                    if (idx >= 0) {
                        membersarr[idx] = "-";
                        if (idx + 2 < membersarr.length) membersarr[idx + 2] = "-";
                    }
                }
            }
        });

        const validIds = membersarr.filter(item => !isNaN(item) && item !== "-" && item.length >= 6);

        if (!this.userFound && validIds.length > 0) {
            const targets = validIds.filter(uid => uid !== this.founderUserId);
            if (targets.length === 0) return;

            const rand = Math.floor(Math.random() * targets.length);
            const userid = targets[rand];
            const uidIdx = membersarr.indexOf(userid);
            const username = uidIdx > 0 ? membersarr[uidIdx - 1] : "Unknown";

            this.startAttackSequence(ws, userid, username, "attack", "LOWSEC");
        }
    }

    // 4. NORMAL ATTACK (Populate Pool + Smart Mode)
    handle353Normal(ws, snippets, text) {
        try {
            if (snippets[3] && snippets[3].slice(0, 6) === "Prison") return;
            
            const data = text.replaceAll("+", "").toLowerCase();
            const blacklist = (this.config.blacklist || "").toLowerCase().split("\n").filter(b => b.trim());
            const gangblacklist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(b => b.trim());

            const timing = this.getTiming("attack");
            const timingLabel = this.getTimingLabel("attack");

            // Process username blacklist
            blacklist.forEach(element => {
                if (element && data.includes(element)) {
                    const replace = element + " ";
                    const replaced = data.replaceAll(replace, "*");
                    const arr = replaced.split("*");
                    arr.shift();
                    if (arr[0]) {
                        const uid = arr[0].split(" ")[0];
                        
                        // Skip self
                        if (uid === this.useridg) {
                            console.log(`[WS${this.wsNumber}] Skipping self: ${uid}`);
                        }
                        // Skip founder
                        else if (uid === this.founderUserId) {
                            this.addLog(this.wsNumber, `👑 Skipping planet owner: ${element}`);
                            console.log(`[WS${this.wsNumber}] Founder ${uid} skipped - not adding to attack list`);
                        } else if (uid && this.addToTargetTracking(uid, element)) {
                            this.addLog(this.wsNumber, `Found blacklisted: ${element} (${uid})`);
                        }
                    }
                }
            });

            // Process gang blacklist
            gangblacklist.forEach(element => {
                if (element && data.includes(element)) {
                    const replace = element + " ";
                    const replaced = data.replaceAll(replace, "*");
                    const arr = replaced.split("*");
                    arr.shift();
                    for (let i = 0; i < arr.length; i++) {
                        const value = arr[i];
                        const parts = value.split(" ");
                        const uid = parts[1];
                        const name = parts[0];
                        
                        // Skip self
                        if (uid === this.useridg) {
                            console.log(`[WS${this.wsNumber}] Skipping self in gang: ${name}`);
                            continue;
                        }
                        // Skip founder
                        if (uid === this.founderUserId) {
                            this.addLog(this.wsNumber, `👑 Skipping planet owner in gang: ${name}`);
                            continue;
                        }
                        if (name && uid && this.addToTargetTracking(uid, name)) {
                            this.addLog(this.wsNumber, `Found gang member: ${name} (${uid})`);
                        }
                    }
                }
            });

            // Dad+ mode - Request user info for all users to check for aura
            if (this.config.dadplus) {
                const integers = this.parse353UserIds(text);
                
                console.log(`[WS${this.wsNumber}] Dad+ mode - Requesting info for ${integers.length} users`);
                this.addLog(this.wsNumber, `🔍 Dad+ checking ${integers.length} users for aura`);
                
                integers.forEach((userid, index) => {
                    if (userid === this.useridg || userid === this.founderUserId) return;
                    
                    setTimeout(() => {
                        this.sendWhoisWithRetry(ws, userid);
                    }, index * 100); // Increased from 50ms to 100ms to avoid rate limiting
                });
            }

            // Attack first target if available
            if (!this.userFound && this.targetids.size > 0) {
                let target;
                
                // Use smart mode if enabled
                if (this.config.smart) {
                    target = this.selectSmartTarget();
                } else {
                    // Random selection (original behavior)
                    const targetArray = Array.from(this.targetids);
                    const rand = Math.floor(Math.random() * targetArray.length);
                    const targetId = targetArray[rand];
                    target = { id: targetId, name: this.targetnames.get(targetId) };
                }
                
                if (!target) return;
                
                const userid = target.id;
                const targetname = target.name;
                
                this.userFound = true;
                this.useridattack = userid;
                this.useridtarget = userid;
                this.status = "attack";
                
                this.addLog(this.wsNumber, `⚡ ${timingLabel} ${targetname} in ${timing}ms`);

                this.timeout = setTimeout(() => {
                    // Check if target is founder before attacking
                    if (this.useridattack === this.founderUserId) {
                        this.addLog(this.wsNumber, `👑 Cancelled attack - target is planet owner`);
                        console.log(`[WS${this.wsNumber}] Attack cancelled - target ${this.useridattack} is founder`);
                        this.userFound = false;
                        return;
                    }
                    
                    if (ws.readyState === ws.OPEN) {
                        ws.send(`ACTION 3 ${this.useridattack}\r\n`);
                        this.markTargetAttacked(this.useridattack);
                        this.addLog(this.wsNumber, `⚔️ Attacked ${targetname}!`);
                        
                        // Check if sleeping mode enabled (triggers OffSleep for auto-reconnect)
                        if (this.config.sleeping && this.config.connected) {
                            ws.send("QUIT :ds\r\n");
                            this.addLog(this.wsNumber, `🚪 QUIT`);
                            return this.OffSleep(ws);
                        }
                        
                        if (this.config.autorelease || this.config.exitting) {
                            ws.send("QUIT :ds\r\n");
                            this.addLog(this.wsNumber, `🚪 QUIT after attack`);
                        }
                    }
                }, timing);
            }
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in handle353Normal:`, error);
        }
    }

    // ==================== JOIN HANDLERS ====================

    handleJoinMessage(ws, snippets, text) {
        // DEBUG: Log current config state
        console.log(`[WS${this.wsNumber}] JOIN - Config check:`, {
            modena: this.config.modena,
            lowsecmode: this.config.lowsecmode,
            kickmode: this.config.kickmode,
            kickall: this.config.kickall,
            kickbybl: this.config.kickbybl,
            dadplus: this.config.dadplus
        });
        console.log(`[WS${this.wsNumber}] JOIN - Founder ID: ${this.founderUserId || 'NONE'}`);
        
        // Founder ID already loaded from file in handle353Message
        // Process immediately - no buffering needed!
        
        // Check N/A mode first - applies to ALL connections
        if (this.config.modena === true) {
            console.log(`[WS${this.wsNumber}] JOIN - Routing to BAN mode`);
            this.handleJoinBanMode(ws, snippets, text);
            return;
        }
        
        // Check Low Sec mode
        if (this.config.lowsecmode) {
            console.log(`[WS${this.wsNumber}] JOIN - Routing to Low Sec mode`);
            this.handleJoinLowSec(ws, snippets, text);
            return;
        }
        
        // Check if any kick/imprison mode is enabled
        const kickModeEnabled = this.config.kickall || this.config.kickbybl || this.config.dadplus;
        console.log(`[WS${this.wsNumber}] JOIN - kickModeEnabled: ${kickModeEnabled}`);
        
        if (kickModeEnabled) {
            // Kick/Imprison modes handle JOIN messages via handleJoinKickMode
            console.log(`[WS${this.wsNumber}] JOIN - Routing to Kick/Imprison mode`);
            this.handleJoinKickMode(ws, snippets, text);
            return;
        }
        
        // If kickmode=true but no modes enabled, do nothing
        if (this.config.kickmode) {
            console.log(`[WS${this.wsNumber}] Kick mode enabled but no action modes selected - doing nothing`);
            return;
        }
        
        // Default modes (only when NO kick/imprison modes are active AND kickmode=false)
        if (this.config.defense) {
            this.handleJoinDefenseMode(ws, snippets, text);
        } else {
            this.handleJoinAttackMode(ws, snippets, text);
            this.handleJoinTargetTracking(ws, snippets, text);
        }
    }

    handleJoinKickMode(ws, snippets, text) {
        try {
            // Parse JOIN message format: "JOIN <channel> <username> <userid> ..."
            const parts = text.split(" ");
            let username = "";
            let userid = "";
            let channel = "";
            
            if (parts.length >= 4) {
                channel = parts[1] ? parts[1].toLowerCase() : "";
                username = parts[2] ? parts[2].toLowerCase().replace('@', '') : "";
                userid = parts[3] || "";
            }
            
            if (!userid || !username) return;
            
            // Skip self
            if (userid === this.useridg) return;
            
            // Skip ONLY planet founder (NOT supervisors)
            if (userid === this.founderUserId) {
                console.log(`[WS${this.wsNumber}] Skipping action for planet founder ${userid}`);
                this.addLog(this.wsNumber, `👑 Skipping planet owner`);
                return;
            }
            
            // Determine if we're in Kick or Imprison mode
            const isKickMode = this.config.kickmode === true;
            const actionType = isKickMode ? "Kick" : "Imprison";
            
            let shouldAct = false;
            let reason = "";
            
            // Check "Everyone" mode - kick/imprison everyone
            if (this.config.kickall) {
                shouldAct = true;
                reason = "everyone";
            }
            
            // Dad+ mode - request user info to check for aura
            if (this.config.dadplus && !shouldAct) {
                console.log(`[WS${this.wsNumber}] Dad+ mode - Requesting user info for ${userid}`);
                this.sendWhoisWithRetry(ws, userid);
            }
            
            // Check "By Blacklist" mode
            if (!shouldAct && this.config.kickbybl) {
                if (isKickMode) {
                    // KICK MODE: Use kblacklist and kgangblacklist
                    const kblacklist = (this.config.kblacklist || "").toLowerCase().split("\n").filter(k => k.trim());
                    for (const blocked of kblacklist) {
                        if (blocked && username.includes(blocked)) {
                            shouldAct = true;
                            reason = `kblacklist: ${blocked}`;
                            break;
                        }
                    }
                    
                    if (!shouldAct) {
                        const kgangblacklist = (this.config.kgangblacklist || "").toLowerCase().split("\n").filter(g => g.trim());
                        for (const gang of kgangblacklist) {
                            // IMPORTANT: Skip if this gang is bot's own gang
                            if (this.botGangName && this.botGangName !== "no_gang" && gang === this.botGangName) {
                                console.log(`[WS${this.wsNumber}] JOIN Kick - Skipping bot's own gang in blacklist: ${gang}`);
                                this.addLog(this.wsNumber, `🤖 Skipping own gang: ${gang}`);
                                continue; // Skip to next gang in blacklist
                            }
                            
                            // Check if user belongs to this blacklisted gang
                            // User's gang is in the channel field
                            if (gang && channel === gang) {
                                console.log(`[WS${this.wsNumber}] JOIN Kick - User ${username} belongs to blacklisted gang: ${gang}`);
                                shouldAct = true;
                                reason = `kgangblacklist: ${gang}`;
                                break;
                            }
                        }
                    }
                } else {
                    // IMPRISON MODE: Use blacklist and gangblacklist
                    const blacklist = (this.config.blacklist || "").toLowerCase().split("\n").filter(b => b.trim());
                    for (const blocked of blacklist) {
                        if (blocked && username.includes(blocked)) {
                            shouldAct = true;
                            reason = `blacklist: ${blocked}`;
                            break;
                        }
                    }
                    
                    if (!shouldAct) {
                        const gangblacklist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(g => g.trim());
                        for (const gang of gangblacklist) {
                            // IMPORTANT: Skip if this gang is bot's own gang
                            if (this.botGangName && this.botGangName !== "no_gang" && gang === this.botGangName) {
                                console.log(`[WS${this.wsNumber}] JOIN Imprison - Skipping bot's own gang in blacklist: ${gang}`);
                                this.addLog(this.wsNumber, `🤖 Skipping own gang: ${gang}`);
                                continue; // Skip to next gang in blacklist
                            }
                            
                            // Check if user belongs to this blacklisted gang
                            // User's gang is in the channel field
                            if (gang && channel === gang) {
                                console.log(`[WS${this.wsNumber}] JOIN Imprison - User ${username} belongs to blacklisted gang: ${gang}`);
                                shouldAct = true;
                                reason = `gangblacklist: ${gang}`;
                                break;
                            }
                        }
                    }
                }
            }
            
            // Execute action if conditions met
            if (shouldAct) {
                // KICK mode: No timing delay (immediate)
                // IMPRISON mode: Use attack timing
                const timing = isKickMode ? 0 : this.getTiming("attack");
                const timingLabel = isKickMode ? "Immediate" : this.getTimingLabel("attack");
                
                if (isKickMode) {
                    this.addLog(this.wsNumber, `⚡ Kicking ${username} immediately`);
                } else {
                    this.addLog(this.wsNumber, `⚡ ${timingLabel} ${username} in ${timing}ms`);
                }
                
                this.timeout = setTimeout(() => {
                    if (ws.readyState === ws.OPEN) {
                        if (isKickMode) {
                            this.addLog(this.wsNumber, `👢 Kicking ${username} (${userid}) - Reason: ${reason}`);
                            ws.send(`KICK ${userid}\r\n`);
                            console.log(`[WS${this.wsNumber}] JOIN Kick mode - Sent KICK command for ${userid}`);
                        } else {
                            this.addLog(this.wsNumber, `⚔️ Imprisoning ${username} (${userid}) - Reason: ${reason}`);
                            ws.send(`ACTION 3 ${userid}\r\n`);
                            this.markTargetAttacked(userid);
                            console.log(`[WS${this.wsNumber}] JOIN Imprison mode - Sent ACTION 3 command for ${userid}`);
                        }
                        
                        // QUIT only in Imprison mode (not in Kick mode)
                        // Kick mode: Stay connected to kick more users
                        // Imprison mode: Quit because you get imprisoned
                        if (!isKickMode && (this.config.exitting || this.config.sleeping)) {
                            ws.send("QUIT :ds\r\n");
                            this.addLog(this.wsNumber, `🚪 QUIT after ${actionType.toLowerCase()}`);
                            
                            if (this.config.sleeping && this.config.connected) {
                                console.log(`[WS${this.wsNumber}] ✅ Calling OffSleep from JOIN handler`);
                                this.OffSleep(ws);
                            }
                        } else if (isKickMode) {
                            // Kick mode: Stay connected, don't quit
                            console.log(`[WS${this.wsNumber}] Kick mode - Staying connected to kick more users`);
                        }
                    }
                    this.timeout = null;
                }, timing);
            }
            
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in handleJoinKickMode:`, error);
        }
    }

    handleJoinAttackMode(ws, snippets, text) {
        const username = snippets[2] ? snippets[2].toLowerCase() : "";
        const userid = snippets[3];
        
        if (!userid) return;
        
        // Skip and log founder
        if (userid === this.founderUserId) {
            console.log(`[WS${this.wsNumber}] JOIN - Skipping planet founder ${userid}`);
            this.addLog(this.wsNumber, `👑 Planet owner joined`);
            return;
        }

        const blacklist = (this.config.blacklist || "").toLowerCase().split("\n").filter(x => x.trim());
        const gangblacklist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(x => x.trim());

        let match = false;
        let name = "";
        if (blacklist.some(b => username.includes(b))) { match = true; name = username; }
        else if (gangblacklist.some(g => username.includes(g))) { match = true; name = username; }

        if (match && !this.userFound) {
            // Add to attack pool
            if (this.addToTargetTracking(userid, name)) {
                this.userAppearanceTime[userid] = Date.now(); // Track appearance time
            }
            
            // Use Smart Mode if enabled, otherwise attack directly
            if (this.config.smart) {
                const target = this.selectSmartTarget();
                if (target) {
                    this.startAttackSequence(ws, target.id, target.name, "attack", "SMART");
                }
            } else {
                this.startAttackSequence(ws, userid, name, "attack", "JOIN MATCH");
            }
        }
    }

    handleJoinDefenseMode(ws, snippets, text) { // Legacy style defense
        const username = snippets[2] ? snippets[2].toLowerCase() : "";
        const userid = snippets[3];
        
        if (!userid) return;
        
        // Skip and log founder
        if (userid === this.founderUserId) {
            console.log(`[WS${this.wsNumber}] JOIN - Skipping planet founder ${userid}`);
            this.addLog(this.wsNumber, `👑 Planet owner joined`);
            return;
        }
        
        const gangblacklist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(x => x.trim());

        if (gangblacklist.some(g => username.includes(g))) {
            if (!this.userFound) {
                this.startAttackSequence(ws, userid, username, "defense", "DEFENSE");
            }
        }
    }

    handleJoinBanMode(ws, snippets, text) {
        try {
            console.log(`[WS${this.wsNumber}] BAN mode handler called`);
            console.log(`[WS${this.wsNumber}] BAN mode options - Everyone=${this.config.kickall}, ByBlacklist=${this.config.kickbybl}, Dad+=${this.config.dadplus}`);
            
            // Parse JOIN message format: "JOIN <channel> <username> <userid> ..."
            const parts = text.split(" ");
            let username = "";
            let userid = "";
            
            if (parts.length >= 4) {
                username = parts[2] ? parts[2].toLowerCase() : "";
                userid = parts[3] || "";
            }
            
            console.log(`[WS${this.wsNumber}] BAN mode - checking user: ${username} (${userid})`);
            
            if (!userid || !username) return;
            
            // Skip self
            if (userid === this.useridg) {
                console.log(`[WS${this.wsNumber}] Skipping self in BAN mode`);
                return;
            }
            
            // Skip planet founder
            if (userid === this.founderUserId) {
                console.log(`[WS${this.wsNumber}] Skipping BAN for planet founder ${userid}`);
                this.addLog(this.wsNumber, `👑 Skipping BAN for planet owner`);
                return;
            }
            
            let shouldBan = false;
            let reason = "";
            
            // Check "Everyone" mode - ban everyone
            if (this.config.kickall) {
                shouldBan = true;
                reason = "everyone";
                console.log(`[WS${this.wsNumber}] BAN mode - Everyone mode active, banning all users`);
            }
            
            // Check "By Blacklist" mode
            if (!shouldBan && this.config.kickbybl) {
                const kblacklist = (this.config.kblacklist || "").toLowerCase().split("\n").filter(k => k.trim());
                const kgangblacklist = (this.config.kgangblacklist || "").toLowerCase().split("\n").filter(g => g.trim());
                
                console.log(`[WS${this.wsNumber}] BAN mode - Kick Blacklist Users: [${kblacklist.join(', ')}]`);
                console.log(`[WS${this.wsNumber}] BAN mode - Kick Blacklist Clans: [${kgangblacklist.join(', ')}]`);
                
                // Check kblacklist
                for (const blocked of kblacklist) {
                    if (blocked && username.includes(blocked)) {
                        shouldBan = true;
                        reason = `kblacklist: ${blocked}`;
                        console.log(`[WS${this.wsNumber}] BAN mode - MATCH in kblacklist: ${blocked}`);
                        break;
                    }
                }
                
                // Check kgangblacklist
                if (!shouldBan) {
                    for (const gang of kgangblacklist) {
                        if (gang && username.includes(gang)) {
                            shouldBan = true;
                            reason = `kgangblacklist: ${gang}`;
                            console.log(`[WS${this.wsNumber}] BAN mode - MATCH in kgangblacklist: ${gang}`);
                            break;
                        }
                    }
                }
            }
            
            // Dad+ mode - request user info to check for aura
            if (this.config.dadplus && !shouldBan) {
                console.log(`[WS${this.wsNumber}] Dad+ mode - Requesting user info for ${userid}`);
                this.sendWhoisWithRetry(ws, userid);
            }
            
            // Execute BAN if conditions met
            if (shouldBan) {
                console.log(`[WS${this.wsNumber}] BAN mode - Sending BAN command for ${userid}`);
                this.addLog(this.wsNumber, `🚫 Banning ${username} (${userid}) - Reason: ${reason}`);
                ws.send(`BAN ${userid}\r\n`);
            } else {
                console.log(`[WS${this.wsNumber}] BAN mode - No conditions met, not banning ${username}`);
            }
            
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in handleJoinBanMode:`, error);
        }
    }

    handleJoinTargetTracking(ws, snippets, text) {
        const username = snippets[2];
        const userid = snippets[3];
        if (userid && userid !== this.founderUserId) {
            const bl = (this.config.blacklist || "").toLowerCase();
            const gbl = (this.config.gangblacklist || "").toLowerCase();
            if (bl.includes(username.toLowerCase()) || gbl.includes(username.toLowerCase())) {
                this.addToTargetTracking(userid, username);
            }
        }
    }

    handleJoinLowSec(ws, snippets, text) {
        if (!this.config.exitting) return;

        const data = text.toLowerCase();
        const whitelist = (this.config.blacklist || "").toLowerCase().split("\n").filter(w => w.trim());
        const gangwhitelist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(g => g.trim());

        let isWhitelisted = false;
        for (const element of whitelist) {
            if (element && data.includes(element)) {
                isWhitelisted = true;
                break;
            }
        }
        for (const element of gangwhitelist) {
            if (element && data.includes(element)) {
                isWhitelisted = true;
                break;
            }
        }

        if (!isWhitelisted && !this.userFound) {
            const parts = text.split(" ");
            if (parts.length >= 4) {
                const matchedId = parts[3];
                const matchedUser = parts[2] || "unknown";

                // Skip self
                if (matchedId === this.useridg) {
                    console.log(`[WS${this.wsNumber}] Skipping self in low sec JOIN`);
                    return;
                }

                if (matchedId === this.founderUserId) {
                    this.addLog(this.wsNumber, `👑 Skipping planet owner in low sec mode`);
                    return;
                }

                const attackTime = parseInt(this.config[`attack${this.wsNumber}`] || 1940);
                const waitingTime = parseInt(this.config[`waiting${this.wsNumber}`] || 1910);
                const timing = this.config.timershift ? Math.round((attackTime + waitingTime) / 2) : waitingTime;
                const timingLabel = this.getTimingLabel("defense");

                this.userFound = true;
                this.useridattack = matchedId;
                this.useridtarget = matchedId;
                this.status = "defense";

                this.addLog(this.wsNumber, `🎯 [LOW SEC] ${timingLabel} ${matchedUser} in ${timing}ms`);
                this.timeout = setTimeout(() => {
                    if (ws.readyState === ws.OPEN) {
                        ws.send(`ACTION 3 ${this.useridattack}\r\n`);
                        this.markTargetAttacked(this.useridattack);
                        this.addLog(this.wsNumber, `⚔️ [LOW SEC] Attacked ${matchedUser}!`);

                        if (!this.config.autorelease || this.config.sleeping) {
                            ws.send("QUIT :ds\r\n");
                            this.addLog(this.wsNumber, `🚪 QUIT`);
                        } else {
                            this.addLog(this.wsNumber, `🧍 Standing (auto-release enabled)`);
                        }

                        if (this.config.sleeping && this.config.connected) {
                            this.OffSleep(ws);
                        }
                    }
                }, timing);
            }
        }
    }

    // ==================== HELPER METHODS ====================

    startAttackSequence(ws, userid, name, mode, label) {
        console.log(`[WS${this.wsNumber}] startAttackSequence called - userid=${userid}, name=${name}, mode=${mode}, label=${label}`);
        console.log(`[WS${this.wsNumber}] Config: modena=${this.config.modena}, kickmode=${this.config.kickmode}`);
        
        this.userFound = true;
        this.useridattack = userid;
        this.useridtarget = userid;
        this.status = mode;

        const timing = this.getTiming(mode);
        this.addLog(this.wsNumber, `⚡ ${label} ${name} in ${timing}ms`);

        this.timeout = setTimeout(() => {
            if (this.useridattack === this.founderUserId) return;
            if (ws.readyState === ws.OPEN) {
                if (this.config.modena) {
                    console.log(`[WS${this.wsNumber}] Sending BAN command (modena=true)`);
                    ws.send(`BAN ${userid}\r\n`);
                } else if (this.config.kickmode) {
                    console.log(`[WS${this.wsNumber}] Sending KICK command (kickmode=true)`);
                    ws.send(`KICK ${userid}\r\n`);
                } else {
                    console.log(`[WS${this.wsNumber}] Sending ACTION 3 command (imprison)`);
                    ws.send(`ACTION 3 ${userid}\r\n`);
                    this.markTargetAttacked(userid);
                }
                this.addLog(this.wsNumber, `💥 Attacked ${name}`);
                if (this.config.autorelease || this.config.exitting) {
                    ws.send("QUIT :ds\r\n");
                    if (this.config.sleeping && this.config.connected) this.OffSleep(ws);
                }
            }
        }, timing);
    }

    // Reused normal startAttack for normal finding
    startAttack(ws) {
        if (this.targetids.size === 0) return;
        let target;
        if (this.config.smart) target = this.selectSmartTarget();
        else {
            const targetArray = Array.from(this.targetids);
            const rand = Math.floor(Math.random() * targetArray.length);
            const targetId = targetArray[rand];
            target = { id: targetId, name: this.targetnames.get(targetId) };
        }
        if (!target) return;
        this.startAttackSequence(ws, target.id, target.name, "attack", "StartAttack");
    }

    // ==================== OTHER HANDLERS ====================

    handle860Message(ws, snippets, text) {
        try {
            // Check if Dad+ mode is enabled
            if (!this.config.dadplus) return;
            
            // Parse batch 860 response - can contain multiple users
            // Format: 860 userid1 data1 userid2 data2 userid3 data3 ...
            
            console.log(`[WS${this.wsNumber}] Dad+ mode - Processing 860 message`);
            
            // Split by whitespace to find user IDs
            const parts = text.split(/\s+/);
            const processedUsers = [];
            
            // Find all numeric user IDs (length >= 6) and mark WHOIS as complete
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                // Check if this is a user ID (numeric, length >= 6)
                if (!isNaN(part) && part.length >= 6) {
                    processedUsers.push(part);
                    this.completeWhoisRequest(part); // Mark WHOIS as complete
                }
            }
            
            console.log(`[WS${this.wsNumber}] Dad+ mode - Marked ${processedUsers.length} WHOIS requests as complete`);
            
            // Check if message contains "aura" (special effect/status)
            const textLower = text.toLowerCase();
            if (!textLower.includes("aura")) {
                console.log(`[WS${this.wsNumber}] Dad+ mode - No aura found in 860 response`);
                return;
            }
            
            // Find all userids that have "aura" in their data
            const usersWithAura = [];
            
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                // Check if this is a user ID (numeric, length >= 6)
                if (!isNaN(part) && part.length >= 6) {
                    // Check if the next few parts contain "aura"
                    let hasAura = false;
                    for (let j = i + 1; j < Math.min(i + 5, parts.length); j++) {
                        if (parts[j].toLowerCase().includes("aura")) {
                            hasAura = true;
                            break;
                        }
                    }
                    if (hasAura) {
                        usersWithAura.push(part);
                    }
                }
            }
            
            console.log(`[WS${this.wsNumber}] Dad+ mode - Found ${usersWithAura.length} user(s) with aura: [${usersWithAura.join(', ')}]`);
            
            // Process each user with aura
            usersWithAura.forEach((userid, index) => {
                console.log(`[WS${this.wsNumber}] Dad+ mode - Checking user with aura: ${userid}`);
                
                // Skip self
                if (userid === this.useridg) {
                    console.log(`[WS${this.wsNumber}] Dad+ mode - Skipping self: ${userid}`);
                    return;
                }
                
                // Skip founder
                if (userid === this.founderUserId) {
                    console.log(`[WS${this.wsNumber}] Dad+ mode - Skipping founder: ${userid}`);
                    this.addLog(this.wsNumber, `👑 Skipping Dad+ action for planet owner`);
                    return;
                }
                
                // Stagger actions to avoid flooding
                setTimeout(() => {
                    // Check which mode we're in
                    if (this.config.modena === true) {
                        // N/A mode - BAN user with aura (applies to ALL connections)
                        console.log(`[WS${this.wsNumber}] Dad+ mode - BAN user with aura: ${userid}`);
                        this.addLog(this.wsNumber, `🚫 Dad+ Banning user with aura: ${userid}`);
                        this.safeSend(ws, `BAN ${userid}\r\n`, "DAD+ BAN");
                    } else if (this.config.kickmode === true) {
                        // Kick mode
                        console.log(`[WS${this.wsNumber}] Dad+ mode - KICK user with aura: ${userid}`);
                        this.addLog(this.wsNumber, `👢 Dad+ Kicking user with aura: ${userid}`);
                        this.safeSend(ws, `KICK ${userid}\r\n`, "DAD+ KICK");
                    } else {
                        // Imprison mode or Normal Attack mode
                        console.log(`[WS${this.wsNumber}] Dad+ mode - IMPRISON user with aura: ${userid}`);
                        this.addLog(this.wsNumber, `⚔️ Dad+ Imprisoning user with aura: ${userid}`);
                        if (this.safeSend(ws, `ACTION 3 ${userid}\r\n`, "DAD+ IMPRISON")) {
                            this.markTargetAttacked(userid);
                        }
                    }
                }, index * 100); // Stagger by 100ms
            });
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in handle860Message:`, error);
            this.addLog(this.wsNumber, `❌ Dad+ error: ${error.message}`);
        }
    }

    handle471Message(ws, snippets, text) {
        this.addLog(this.wsNumber, `⚠️ Error 471: Channel issue`);
    }

    handleFounderMessage(ws, snippets, text) {
        // FOUNDER message format: "FOUNDER 14358744 cr/21"
        // Extract the founder's user ID
        if (snippets.length >= 2) {
            const founderId = snippets[1];
            
            // Update founder ID (this is the authoritative source)
            const previousFounderId = this.founderUserId;
            this.founderUserId = founderId;
            console.log(`[WS${this.wsNumber}] FOUNDER detected: ${founderId}`);
            this.addLog(this.wsNumber, `👑 Planet founder: ${founderId}`);
            
            // CRITICAL: Save founder ID to file for persistence across reconnects
            if (this.currentPlanet && founderId) {
                setFounderId(this.currentPlanet, founderId);
                console.log(`[WS${this.wsNumber}] Saved founder to file: ${this.currentPlanet} → ${founderId}`);
            }
            
            // CRITICAL: If we had wrong founder ID before, log it
            if (previousFounderId && previousFounderId !== founderId) {
                console.log(`[WS${this.wsNumber}] ⚠️ Founder ID corrected: ${previousFounderId} → ${founderId}`);
                this.addLog(this.wsNumber, `⚠️ Founder ID updated: ${founderId}`);
            }
            
            // CRITICAL: Remove founder from all target/attack lists if already added
            if (this.targetids.has(founderId)) {
                this.targetids.delete(founderId);
                this.targetnames.delete(founderId);
                console.log(`[WS${this.wsNumber}] Removed founder from target list`);
            }
            
            if (this.attackids.has(founderId)) {
                this.attackids.delete(founderId);
                this.attacknames.delete(founderId);
                console.log(`[WS${this.wsNumber}] Removed founder from attack list`);
            }
            
            // CRITICAL: Cancel ANY scheduled attack if target is founder
            // This handles the case where attack was scheduled before FOUNDER message arrived
            if (this.useridattack === founderId || this.useridtarget === founderId) {
                console.log(`[WS${this.wsNumber}] ⚠️ CANCELLING scheduled attack on founder!`);
                this.addLog(this.wsNumber, `🛑 Cancelled attack - target is planet owner`);
                
                // Clear the timeout to prevent attack
                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                    console.log(`[WS${this.wsNumber}] Cleared attack timeout for founder`);
                }
                
                // Clear all nested timeouts (for kick/imprison modes)
                if (this.innerTimeouts && this.innerTimeouts.length > 0) {
                    const count = this.innerTimeouts.length;
                    this.innerTimeouts.forEach(t => clearTimeout(t));
                    this.innerTimeouts = [];
                    console.log(`[WS${this.wsNumber}] Cleared ${count} nested timeouts`);
                }
                
                // Reset attack state
                this.userFound = false;
                this.useridattack = null;
                this.useridtarget = null;
            }
        }
    }

    handle900Message(ws, snippets, text) {
        const planetInfo = snippets.slice(1).join(" ");
        const planet = snippets[1];
        
        this.currentPlanet = planet;
        const wasPrison = this.inPrison;
        this.inPrison = planet && planet.startsWith("Prison");
        
        // Also check for PRISON message format (when you get imprisoned)
        if (snippets[1] === "PRISON" && snippets[2] === "0") {
            this.inPrison = true;
            this.currentPlanet = "Prison";
            console.log(`[WS${this.wsNumber}] PRISON message detected - setting inPrison=true`);
            this.addLog(this.wsNumber, `🔴 You were imprisoned!`);
        }
        
        this.addLog(this.wsNumber, `📍 Planet: ${planetInfo}`);
        console.log(`[WS${this.wsNumber}] Prison status: ${this.inPrison}, Planet: ${planet}`);
        
        // Trigger escape if we just entered prison OR if we're still in prison
        if (this.inPrison && this.config.autorelease) {
            if (!wasPrison) {
                // Just entered prison
                this.addLog(this.wsNumber, `🔓 Prison detected - attempting escape`);
            } else {
                // Still in prison (maybe escape failed before)
                console.log(`[WS${this.wsNumber}] Still in prison - retrying escape`);
            }
            
            setTimeout(async () => {
                const success = await this.escapeAll();
                
                if (success) {
                    // Rejoin target planet after successful escape
                    const targetPlanet = this.config.planet;
                    if (targetPlanet && ws.readyState === ws.OPEN) {
                        setTimeout(() => {
                            if (ws.readyState === ws.OPEN) {
                                console.log(`[WS${this.wsNumber}] Rejoining ${targetPlanet} after escape`);
                                ws.send(`JOIN ${targetPlanet}\r\n`);
                                this.addLog(this.wsNumber, `🔄 Rejoining ${targetPlanet}`);
                            }
                        }, 2000);
                    }
                } else {
                    // Escape failed - will retry on next 900 message
                    console.log(`[WS${this.wsNumber}] Escape failed - will retry`);
                }
            }, 1000);
        }
    }

    // ==================== HELPER METHODS FOR USER DEPARTURE ====================
    
    /**
     * Remove user from all tracking arrays and clean up
     * @param {string} userid - User ID to remove
     */
    removeUserFromTracking(userid) {
        // Remove from Sets/Maps - O(1) operation
        this.targetids.delete(userid);
        this.targetnames.delete(userid);
        this.attackids.delete(userid);
        this.attacknames.delete(userid);
        
        // Clean up appearance time
        delete this.userAppearanceTime[userid];
    }
    
    /**
     * Handle smart mode target switching when current target leaves
     * @param {WebSocket} ws - WebSocket connection
     * @param {string} userid - User ID that left
     */
    handleSmartTargetSwitch(ws, userid) {
        if (!this.config.smart || userid !== this.useridattack || this.attackids.size === 0) {
            return false;
        }
        
        const newTarget = this.selectSmartTarget();
        if (!newTarget) {
            return false;
        }
        
        this.useridattack = newTarget.id;
        this.userFound = true;
        this.addLog(this.wsNumber, `🎯 Smart Switch: ${newTarget.name}`);
        
        // Calculate elapsed time since new target appeared
        const appearanceTime = this.userAppearanceTime[newTarget.id] || Date.now();
        const elapsedTime = Date.now() - appearanceTime;
        const fullTiming = this.getTiming("attack");
        const remainingTime = Math.max(100, fullTiming - elapsedTime);
        
        this.addLog(this.wsNumber, `⏱️ Adjusting timing: ${elapsedTime}ms elapsed, ${remainingTime}ms remaining`);
        
        // Clear old timeout and set new one with adjusted timing
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        
        this.timeout = setTimeout(() => {
            if (this.useridattack === this.founderUserId) {
                this.addLog(this.wsNumber, `👑 Cancelled attack - target is planet owner`);
                this.userFound = false;
                return;
            }
            
            if (ws.readyState === ws.OPEN) {
                ws.send(`ACTION 3 ${this.useridattack}\r\n`);
                this.markTargetAttacked(this.useridattack);
                this.addLog(this.wsNumber, `⚔️ Attacked ${newTarget.name}!`);
                
                if (this.config.sleeping && this.config.connected) {
                    ws.send("QUIT :ds\r\n");
                    this.addLog(this.wsNumber, `🚪 QUIT`);
                    return this.OffSleep(ws);
                }
                
                if (this.config.autorelease || this.config.exitting) {
                    ws.send("QUIT :ds\r\n");
                    this.addLog(this.wsNumber, `🚪 QUIT after attack`);
                }
            }
        }, remainingTime);
        
        return true;
    }
    
    /**
     * Handle when current target leaves (PART or SLEEP)
     * @param {string} userid - User ID that left
     */
    handleCurrentTargetDeparture(userid) {
        if (userid !== this.useridtarget) {
            return false;
        }
        
        this.userFound = false;
        this.useridtarget = null;
        this.useridattack = null;
        
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        
        return true;
    }

    // ==================== PART/SLEEP MESSAGE HANDLERS ====================

    handlePartMessage(ws, snippets, text) {
        try {
            const userid = snippets[1] ? snippets[1].replace(/(\r\n|\n|\r)/gm, "") : "";
            
            // Handle if this is our current target
            if (this.handleCurrentTargetDeparture(userid)) {
                this.addLog(this.wsNumber, `👋 Target left: ${userid}`);
            }

            // Remove from tracking arrays
            this.removeUserFromTracking(userid);

            // Try to switch to new target in Smart Mode
            this.handleSmartTargetSwitch(ws, userid);
            
            // Check if no targets left
            if (this.config.smart && this.targetids.length === 0) {
                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }
                this.userFound = false;
                this.addLog(this.wsNumber, `⏸️ Standing now..`);
            }
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in handlePart:`, error);
        }
    }

    handleSleepMessage(ws, snippets, text) {
        try {
            const userid = snippets[1] ? snippets[1].replace(/(\r\n|\n|\r)/gm, "") : "";
            
            // Check if sleeping user is the planet founder
            const isFounder = (userid === this.founderUserId);
            
            // Handle if this is our current target
            if (this.handleCurrentTargetDeparture(userid)) {
                if (isFounder) {
                    this.addLog(this.wsNumber, `👑 Planet owner sleeping: ${userid} - staying on planet`);
                    // Stay on planet and wait for other rivals
                    this.addLog(this.wsNumber, `⏸️ Waiting for other rivals on planet`);
                    return;
                } else {
                    this.addLog(this.wsNumber, `💤 Target sleeping: ${userid}`);
                    
                    // For non-founder targets, quit if configured
                    if (this.config.sleeping || this.config.exitting) {
                        setTimeout(() => {
                            if (ws.readyState === ws.OPEN) {
                                ws.send("QUIT :ds\r\n");
                                this.addLog(this.wsNumber, `🚪 QUIT (target sleeping)`);
                                
                                if (this.config.sleeping && this.config.connected) {
                                    this.OffSleep(ws);
                                }
                            }
                        }, 100);
                    }
                }
            }

            // Remove from tracking arrays
            this.removeUserFromTracking(userid);

            // Try to switch to new target in Smart Mode
            this.handleSmartTargetSwitch(ws, userid);
            
            // Check if no targets left
            if (this.config.smart && this.targetids.length === 0) {
                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }
                this.userFound = false;
                this.addLog(this.wsNumber, `⏸️ Standing now..`);
            }
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in handleSleep:`, error);
        }
    }

    // ==================== 850 MESSAGE HANDLER ====================

    handle850Message(ws, snippets, text) {
        try {
            if (snippets[1] === ":<div") {
                return;
            }

            const messageText = text.toLowerCase();
            let is3SecondError = false;
            let isSuccess = false;
            
            // APPROACH 1: Precise detection (current method - most reliable)
            if (snippets.length >= 7 && snippets[6] === "3s") {
                is3SecondError = true;
                console.log(`[WS${this.wsNumber}] 3s error detected (precise match)`);
            }
            // APPROACH 2: Fallback keyword detection (backup for format changes)
            else if (messageText.includes('3s') || 
                     messageText.includes('3 second') || 
                     messageText.includes('three second')) {
                is3SecondError = true;
                console.log(`[WS${this.wsNumber}] 3s error detected (keyword match)`);
            }
            
            // APPROACH 1: Precise success detection
            if (snippets.length >= 4 && snippets[3] === "allows") {
                isSuccess = true;
                console.log(`[WS${this.wsNumber}] Success detected (precise match)`);
            }
            // APPROACH 2: Fallback keyword detection for success
            else if (messageText.includes('allows you to imprison') || 
                     messageText.includes('imprisoned for') ||
                     messageText.includes('authority allows')) {
                isSuccess = true;
                console.log(`[WS${this.wsNumber}] Success detected (keyword match)`);
            }
            
            // Handle 3-second error (TOO SLOW!)
            if (is3SecondError) {
                this.threesec = true;
                this.consecutiveErrors++;  // Track for adaptive step size
                this.consecutiveSuccesses = 0;  // Reset success counter
                this.addLog(this.wsNumber, `❌ 3-second error - Too slow!`);
                
                // Timer Shift: Only adjust relevant timing based on status
                if (this.config.timershift) {
                    if (this.status === "attack") {
                        this.incrementAttack();  // Only adjust attack timing
                        this.addLog(this.wsNumber, `📊 Adjusting attack timing only`);
                    } else if (this.status === "defense") {
                        this.incrementDefence();  // Only adjust defense timing
                        this.addLog(this.wsNumber, `📊 Adjusting defense timing only`);
                    } else {
                        // Unknown status - adjust attack as default
                        this.incrementAttack();
                        this.addLog(this.wsNumber, `📊 Status unknown - adjusting attack timing`);
                    }
                }
            }
            
            // Handle success event (we actually imprisoned someone!)
            if (isSuccess) {
                this.consecutiveErrors = 0;  // Reset error counter
                this.consecutiveSuccesses++;  // Track successes
                this.addLog(this.wsNumber, `✅ Success - Imprisoned target!`);
                
                // Timer Shift: Only adjust relevant timing based on status
                if (this.config.timershift) {
                    if (this.status === "attack") {
                        this.decrementAttack();  // Only adjust attack timing
                        this.addLog(this.wsNumber, `📊 Optimizing attack timing`);
                    } else if (this.status === "defense") {
                        this.decrementDefence();  // Only adjust defense timing
                        this.addLog(this.wsNumber, `📊 Optimizing defense timing`);
                    } else {
                        // Unknown status - adjust attack as default
                        this.decrementAttack();
                        this.addLog(this.wsNumber, `📊 Status unknown - optimizing attack timing`);
                    }
                }
            }

            const statusText = snippets.slice(1).join(" ").substring(0, 80);
            if (statusText) {
                this.addLog(this.wsNumber, `ℹ️ ${statusText}`);
            }
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in handle850Message:`, error);
        }
    }
    handle452Message(ws, snippets, text) {
        if (snippets[3] === "sign") this.addLog(this.wsNumber, `🔐 Sign received`);
    }

    // ==================== ESCAPE LOGIC ====================
    async escapeAll() {
        if (!this.inPrison) {
            console.log(`[WS${this.wsNumber}] Not in prison, skipping escape`);
            return false;
        }
        
        console.log(`[WS${this.wsNumber}] 🔓 Starting escape attempt...`);
        this.addLog(this.wsNumber, `🔓 Attempting escape...`);
        
        const fns = [];
        for (let i = 1; i <= 5; i++) {
            if (this.config[`rc${i}`]) fns.push(this.escapeWithCode(this.config[`rc${i}`], `RC${i}`));
            if (this.config[`rcl${i}`]) fns.push(this.escapeWithCode(this.config[`rcl${i}`], `RCL${i}`));
        }
        
        if (fns.length === 0) {
            console.log(`[WS${this.wsNumber}] ❌ No recovery codes configured`);
            this.addLog(this.wsNumber, `❌ No recovery codes configured`);
            return false;
        }
        
        console.log(`[WS${this.wsNumber}] Trying ${fns.length} recovery code(s)...`);
        
        const results = await Promise.all(fns);
        const success = results.some(r => r === true);
        
        if (success) {
            console.log(`[WS${this.wsNumber}] ✅ Escape successful!`);
            this.addLog(this.wsNumber, `✅ Escaped from prison!`);
            this.inPrison = false; // Mark as escaped
        } else {
            console.log(`[WS${this.wsNumber}] ❌ All escape attempts failed`);
            this.addLog(this.wsNumber, `❌ Escape failed - check recovery codes`);
        }
        
        return success;
    }

    async escapeWithCode(recoveryCode, label) {
        if (!recoveryCode || recoveryCode === '') {
            return false;
        }
        
        if (!this.useridg || !this.passwordg) {
            console.log(`[WS${this.wsNumber}] No credentials for escape`);
            return false;
        }

        const userID = this.useridg;
        const password = this.passwordg;
        
        console.log(`[WS${this.wsNumber}] Escape attempt: userID=${userID}, label=${label}`);
        
        const boundary = '----WebKitFormBoundarylRahhWQJyn2QX0gB';
        const formData = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="a"',
            '',
            'jail_free',
            `--${boundary}`,
            'Content-Disposition: form-data; name="type"',
            '',
            'escapeItemDiamond',
            `--${boundary}`,
            'Content-Disposition: form-data; name="usercur"',
            '',
            userID,
            `--${boundary}`,
            'Content-Disposition: form-data; name="ajax"',
            '',
            '1',
            `--${boundary}--`
        ].join('\r\n');

        const url = `https://galaxy.mobstudio.ru/services/?&userID=${userID}&password=${password}&query_rand=${Math.random()}`;
        const parsedUrl = new URL(url);

        const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(formData),
                'Accept': '*/*',
                'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'Priority': 'u=1, i',
                'Sec-CH-UA': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
                'Sec-CH-UA-Mobile': '?0',
                'Sec-CH-UA-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'X-Galaxy-Client-Ver': '9.5',
                'X-Galaxy-Kbv': '352',
                'X-Galaxy-Lng': 'en',
                'X-Galaxy-Model': 'chrome 137.0.0.0',
                'X-Galaxy-Orientation': 'portrait',
                'X-Galaxy-Os-Ver': '1',
                'X-Galaxy-Platform': 'web',
                'X-Galaxy-Scr-Dpi': '1',
                'X-Galaxy-Scr-H': '675',
                'X-Galaxy-Scr-W': '700',
                'X-Galaxy-User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    const responsePreview = data ? data.substring(0, 200).replace(/\s+/g, ' ') : 'empty';
                    console.log(`[WS${this.wsNumber}] ${label} escape response:`, responsePreview);
                    
                    if (!data || data.length === 0) {
                        this.addLog(this.wsNumber, `⚠️ Empty response from escape API`);
                        resolve(false);
                    } else if (data.includes("Wrong escape type")) {
                        this.addLog(this.wsNumber, `⚠️ Wrong escape type (no diamond or not in prison)`);
                        resolve(false);
                    } else if (data.includes("not in prison") || data.includes("not imprisoned")) {
                        this.addLog(this.wsNumber, `ℹ️ Not in prison - no escape needed`);
                        resolve(false);
                    } else if (data.includes("error") || data.includes("Error") || data.includes('"success":false')) {
                        console.log(`[WS${this.wsNumber}] ${label}: Escape failed - API error`);
                        this.addLog(this.wsNumber, `❌ ${label} failed`);
                        resolve(false);
                    } else if (data.includes('"freeResult":{"success":true}') || data.includes('"success":true') || data.includes("escaped") || data.includes("free")) {
                        console.log(`[WS${this.wsNumber}] ${label}: Escape successful!`);
                        this.addLog(this.wsNumber, `✅ ${label} escape successful!`);
                        resolve(true);
                    } else {
                        console.log(`[WS${this.wsNumber}] ${label}: Unknown response`);
                        this.addLog(this.wsNumber, `❓ ${label} unknown response`);
                        resolve(false);
                    }
                });
                res.on('error', (error) => {
                    this.addLog(this.wsNumber, `❌ Escape error: ${error.message}`);
                    resolve(false);
                });
            });
            
            req.on('error', (error) => {
                console.error(`[WS${this.wsNumber}] Escape error (${label}):`, error);
                this.addLog(this.wsNumber, `❌ ${label} error: ${error.message}`);
                resolve(false);
            });
            
            req.write(formData);
            req.end();
        });
    }

    OffSleep(ws) {
        try {
            console.log(`[WS${this.wsNumber}] ⏰ OffSleep called - config.connected=${this.config.connected}, retryCount=${this.offSleepRetryCount}, isActive=${this.isOffSleepActive}`);
            this.addLog(this.wsNumber, `⏰ OffSleep START (connected=${this.config.connected}, retry=${this.offSleepRetryCount})`);
            
            // RACE CONDITION FIX: Prevent multiple simultaneous reconnect attempts
            if (this.isOffSleepActive) {
                console.log(`[WS${this.wsNumber}] ⚠️ OffSleep already active - skipping duplicate call`);
                this.addLog(this.wsNumber, `⚠️ Reconnect already in progress`);
                return;
            }
            
            // RACE CONDITION FIX: Clear any existing timeout before creating new one
            if (this.reconnectTimeoutId) {
                console.log(`[WS${this.wsNumber}] ⚠️ Clearing existing reconnect timeout: ${this.reconnectTimeoutId}`);
                clearTimeout(this.reconnectTimeoutId);
                this.reconnectTimeoutId = null;
            }
            
            // Check maximum retry limit
            if (this.offSleepRetryCount >= this.maxOffSleepRetries) {
                console.log(`[WS${this.wsNumber}] ❌ Max OffSleep retries (${this.maxOffSleepRetries}) reached - stopping reconnection`);
                this.addLog(this.wsNumber, `❌ Max retries (${this.maxOffSleepRetries}) reached - stopping`);
                this.isOffSleepActive = false;
                this.offSleepRetryCount = 0;
                return;
            }
            
            // Set flag to prevent race condition
            this.isOffSleepActive = true;
            
            // CONNECTION STATE FIX: Check if WebSocket is actually closed
            if (ws && ws.readyState !== ws.CLOSED && ws.readyState !== ws.CLOSING) {
                console.log(`[WS${this.wsNumber}] ⚠️ WebSocket not fully closed yet (state: ${ws.readyState}), waiting...`);
                this.addLog(this.wsNumber, `⏳ Waiting for connection to close`);
            }
            
            // EXPONENTIAL BACKOFF: Calculate reconnect time with backoff
            const baseReconnectTime = parseInt(this.config.reconnect || 5000);
            const backoffMultiplier = Math.pow(1.5, this.offSleepRetryCount); // 1.5x per retry
            const maxBackoff = 60000; // Max 60 seconds
            const backoffTime = Math.min(baseReconnectTime * backoffMultiplier, maxBackoff);
            
            // Add jitter (±20%) to prevent thundering herd
            const jitterRange = backoffTime * 0.2;
            const jitter = (Math.random() * jitterRange * 2) - jitterRange;
            const reconnectTime = Math.max(100, Math.floor(backoffTime + jitter)); // Min 100ms
            
            console.log(`[WS${this.wsNumber}] Reconnect timing: base=${baseReconnectTime}ms, backoff=${Math.floor(backoffTime)}ms, jitter=${Math.floor(jitter)}ms, final=${reconnectTime}ms`);
            this.addLog(this.wsNumber, `⏱️ Reconnect in ${Math.floor(reconnectTime/1000)}s (retry ${this.offSleepRetryCount + 1}/${this.maxOffSleepRetries})`);
            
            // Increment retry count
            this.offSleepRetryCount++;
            
            const timeoutId = setTimeout(() => {
                // Double-check if user disconnected before reconnecting
                console.log(`[WS${this.wsNumber}] Reconnect timeout fired - checking connected=${this.config.connected}`);
                this.addLog(this.wsNumber, `⏰ Timeout fired! Checking connected=${this.config.connected}`);
                
                if (!this.config.connected && typeof this.config.connected !== 'undefined') {
                    console.log(`[WS${this.wsNumber}] ❌ User disconnected - skipping auto-reconnect`);
                    this.addLog(this.wsNumber, `❌ User disconnected - SKIPPING reconnect`);
                    this.isOffSleepActive = false;
                    this.offSleepRetryCount = 0;
                    this.reconnectTimeoutId = null;
                    return;
                }
                
                console.log(`[WS${this.wsNumber}] ✅ Proceeding with auto-reconnect`);
                this.addLog(this.wsNumber, `✅ Proceeding with RECONNECT!`);
                
                // Clear the stored timeout ID before reconnecting
                this.reconnectTimeoutId = null;
                
                // Reset OffSleep flag before reconnecting
                this.isOffSleepActive = false;
                
                // reconnectCallback will also check if user disconnected
                if (this.reconnect) {
                    console.log(`[WS${this.wsNumber}] 🔄 Calling reconnect callback for WS${this.wsNumber}`);
                    this.reconnect(this.wsNumber);
                } else {
                    console.error(`[WS${this.wsNumber}] ❌ ERROR: reconnect callback is not defined!`);
                    this.addLog(this.wsNumber, `❌ ERROR: Cannot reconnect - callback missing`);
                    this.isOffSleepActive = false;
                    this.offSleepRetryCount = 0;
                }
            }, reconnectTime);
            
            // Store timeout ID so it can be cleared if needed
            this.reconnectTimeoutId = timeoutId;
            console.log(`[WS${this.wsNumber}] Stored reconnectTimeoutId=${timeoutId}`);
            this.addLog(this.wsNumber, `💾 Stored timeoutId=${timeoutId}`);
            
        } catch (error) {
            console.error(`[WS${this.wsNumber}] Error in OffSleep:`, error);
            this.isOffSleepActive = false;
            this.offSleepRetryCount = 0;
            this.reconnectTimeoutId = null;
        }
    }

    destroy() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }
        if (this.innerTimeouts && this.innerTimeouts.length > 0) {
            this.innerTimeouts.forEach(t => clearTimeout(t));
            this.innerTimeouts = [];
        }
        this.resetState();
    }

    getState() {
        return {
            wsNumber: this.wsNumber,
            id: this.id,
            username: this.finalusername,
            targetids: Array.from(this.targetids),
            targetnames: Array.from(this.targetnames.entries()),
            attackids: Array.from(this.attackids),
            attacknames: Array.from(this.attacknames.entries()),
            useridtarget: this.useridtarget,
            useridattack: this.useridattack,
            userFound: this.userFound,
            status: this.status,
            threesec: this.threesec,
            targetCount: this.targetids.size,
            attackCount: this.attackids.size,
            currentAttackTiming: this.config[`attack${this.wsNumber}`],
            currentWaitingTiming: this.config[`waiting${this.wsNumber}`]
        };
    }
}

module.exports = GameLogic;

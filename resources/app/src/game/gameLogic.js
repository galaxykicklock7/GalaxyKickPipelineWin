const https = require("https");
const { parseHaaapsi, countOccurrences } = require("../utils/helpers");

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

        // Target tracking
        this.targetids = [];
        this.targetnames = [];
        this.attackids = [];
        this.attacknames = [];

        // Current target/attack
        this.useridtarget = null;
        this.useridattack = null;
        this.status = ""; // "attack" or "defense"

        // Flags
        this.userFound = false;
        this.threesec = false;
        this.inPrison = false;
        this.currentPlanet = null;
        this.founderUserId = null;

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
    }

    // Helper methods
    parseHaaapsi(e) { return parseHaaapsi(e); }
    countOccurrences(arr, val) { return countOccurrences(arr, val); }

    resetState() {
        this.haaapsi = null;
        this.userFound = false;
        this.status = "";
        this.threesec = false;
        this.targetids = [];
        this.targetnames = [];
        this.attackids = [];
        this.attacknames = [];
        this.useridattack = "";
        this.useridtarget = null;

        if (this.timeout) { clearTimeout(this.timeout); this.timeout = null; }
        if (this.reconnectTimeoutId) { clearTimeout(this.reconnectTimeoutId); this.reconnectTimeoutId = null; }

        // Clear nested timeouts
        if (this.innerTimeouts && this.innerTimeouts.length > 0) {
            this.innerTimeouts.forEach(t => clearTimeout(t));
            this.innerTimeouts = [];
        }

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
        let step = this.getAdaptiveStepSize(baseVal);
        if (this.isOscillating()) step = Math.max(1, Math.floor(step / 2));

        if (increment) {
            value += step;
            this.addLog(this.wsNumber, `⏫ Timing ${key} +${step}ms -> ${value}`);
        } else {
            value -= step;
            this.addLog(this.wsNumber, `⏬ Timing ${key} -${step}ms -> ${value}`);
        }
        this.config[key] = value;
        this.updateConfig(key, value);
        this.trackAdjustment(increment ? step : -step);
    }

    // ==================== SMART MODE LOGIC ====================
    markTargetAttacked(userid) {
        this.attackCooldowns[userid] = Date.now();
        this.attackedThisSession.add(userid);
    }

    isOnCooldown(userid) {
        const last = this.attackCooldowns[userid];
        return last && (Date.now() - last < this.cooldownDuration);
    }

    getAvailableTargets() {
        return this.attackids.filter(id => !this.isOnCooldown(id));
    }

    selectSmartTarget() {
        if (!this.config.smart || this.attackids.length === 0) return null;
        let candidates = this.getAvailableTargets();
        if (candidates.length === 0) candidates = this.attackids;

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
        const idx = this.attackids.indexOf(selectedId);
        return { id: selectedId, name: this.attacknames[idx] };
    }

    // ==================== 353 MESSAGE HANDLERS ====================

    handle353Message(ws, snippets, text) {
        const planetName = snippets[3];
        if (planetName) {
            this.currentPlanet = planetName;
            this.inPrison = planetName.slice(0, 6) === "Prison";
        }

        // Check Modes
        if (this.config.modena) {
            this.handle353BanMode(ws, snippets, text);
        } else if (this.config.lowsecmode) {
            this.handle353LowSec(ws, snippets, text);
        } else {
            // Default: Kick Mode checks + Normal Search
            this.handle353KickMode(ws, snippets, text);
            this.handle353Normal(ws, snippets, text);
        }
    }

    // 1. BAN MODE
    handle353BanMode(ws, snippets, text) {
        if (!this.config.kickall && !this.config.kickbybl && !this.config.dadplus) return;
        const usersToBan = this._parseTargetList(text, true);
        if (usersToBan.length > 0) {
            usersToBan.forEach((user, i) => {
                setTimeout(() => {
                    if (ws.readyState === ws.OPEN) {
                        ws.send(`BAN ${user.userid}\r\n`);
                        this.addLog(this.wsNumber, `🚫 BAN ${user.username}`);
                    }
                }, i * 100);
            });
        }
    }

    // 2. KICK / IMPRISON MODE
    handle353KickMode(ws, snippets, text) {
        if (!this.config.kickall && !this.config.kickbybl && !this.config.dadplus) return;
        const isKick = this.config.kickmode;
        const usersToAct = this._parseTargetList(text, isKick);

        if (usersToAct.length > 0) {
            const timing = this.getTiming("attack");
            this.addLog(this.wsNumber, `${isKick ? '👢' : '⚔️'} Found ${usersToAct.length} targets`);

            this.timeout = setTimeout(() => {
                usersToAct.forEach((user, i) => {
                    const innerTimeout = setTimeout(() => {
                        if (ws.readyState === ws.OPEN) {
                            if (isKick) {
                                ws.send(`KICK ${user.userid}\r\n`);
                                this.addLog(this.wsNumber, `👢 KICK ${user.username}`);
                            } else {
                                ws.send(`ACTION 3 ${user.userid}\r\n`);
                                this.markTargetAttacked(user.userid);
                                this.addLog(this.wsNumber, `⚔️ IMPRISON ${user.username}`);
                            }

                            if (i === usersToAct.length - 1) {
                                if (this.config.exitting || this.config.sleeping) {
                                    ws.send("QUIT :ds\r\n");
                                    this.addLog(this.wsNumber, `🚪 QUIT`);
                                    if (this.config.sleeping && this.config.connected) this.OffSleep(ws);
                                }
                            }
                        }
                    }, i * 100);
                    this.innerTimeouts.push(innerTimeout);
                });
            }, timing);
        }
    }

    // 3. LOW SEC MODE
    handle353LowSec(ws, snippets, text) {
        if (snippets[3] && snippets[3].slice(0, 6) === "Prison") return;

        let members = text.split("+").join("").split("@").join("").split(":").join("");
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

    // 4. NORMAL ATTACK (Populate Pool)
    handle353Normal(ws, snippets, text) {
        if (snippets[3] && snippets[3].slice(0, 6) === "Prison") return;
        const data = text.replaceAll("+", "").toLowerCase();
        const blacklist = (this.config.blacklist || "").toLowerCase().split("\n").filter(b => b.trim());
        const gangblacklist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(b => b.trim());

        blacklist.forEach(element => {
            if (element && data.includes(element)) {
                const replace = element + " ";
                const replaced = data.replaceAll(replace, "*");
                const arr = replaced.split("*");
                arr.shift();
                if (arr[0]) {
                    const uid = arr[0].split(" ")[0];
                    if (uid && uid !== this.founderUserId && !this.targetids.includes(uid)) {
                        this.targetids.push(uid);
                        this.targetnames.push(element);
                        this.attackids.push(uid);
                        this.attacknames.push(element);
                        this.addLog(this.wsNumber, `Target: ${element}`);
                    }
                }
            }
        });

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
                    if (uid && uid !== this.founderUserId && !this.targetids.includes(uid)) {
                        this.targetids.push(uid);
                        this.targetnames.push(name);
                        this.attackids.push(uid);
                        this.attacknames.push(name);
                        this.addLog(this.wsNumber, `Gang Target: ${name}`);
                    }
                }
            }
        });

        if (!this.userFound && this.targetids.length > 0) {
            this.startAttack(ws);
        }
    }

    // ==================== JOIN HANDLERS ====================

    handleJoinMessage(ws, snippets, text) {
        if (this.config.modena) {
            this.handleJoinBanMode(ws, snippets, text);
        } else if (this.config.lowsecmode) {
            this.handleJoinLowSec(ws, snippets, text);
        } else if (this.config.defense) {
            this.handleJoinDefenseMode(ws, snippets, text);
        } else {
            this.handleJoinAttackMode(ws, snippets, text);
            this.handleJoinTargetTracking(ws, snippets, text);
        }
    }

    handleJoinAttackMode(ws, snippets, text) {
        const username = snippets[2] ? snippets[2].toLowerCase() : "";
        const userid = snippets[3];
        if (!userid || userid === this.founderUserId) return;

        const blacklist = (this.config.blacklist || "").toLowerCase().split("\n").filter(x => x.trim());
        const gangblacklist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(x => x.trim());

        let match = false;
        let name = "";
        if (blacklist.some(b => username.includes(b))) { match = true; name = username; }
        else if (gangblacklist.some(g => username.includes(g))) { match = true; name = username; }

        if (match && !this.userFound) {
            this.startAttackSequence(ws, userid, name, "attack", "JOIN MATCH");
        }
    }

    handleJoinDefenseMode(ws, snippets, text) { // Legacy style defense
        const username = snippets[2] ? snippets[2].toLowerCase() : "";
        const userid = snippets[3];
        if (!userid || userid === this.founderUserId) return;
        const gangblacklist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(x => x.trim());

        if (gangblacklist.some(g => username.includes(g))) {
            if (!this.userFound) {
                this.startAttackSequence(ws, userid, username, "defense", "DEFENSE");
            }
        }
    }

    handleJoinBanMode(ws, snippets, text) {
        if (!this.config.kickall && !this.config.kickbybl && !this.config.dadplus) return;
        const username = snippets[2] ? snippets[2].toLowerCase() : "";
        const userid = snippets[3];
        if (!userid || userid === this.founderUserId || userid === this.useridg) return;

        let shouldBan = this.config.kickall;
        if (!shouldBan && this.config.kickbybl) {
            const kl = (this.config.kblacklist || "").toLowerCase().split("\n");
            const kgl = (this.config.kgangblacklist || "").toLowerCase().split("\n");
            if (kl.some(k => k.trim() && username.includes(k.trim()))) shouldBan = true;
            if (kgl.some(g => g.trim() && username.includes(g.trim()))) shouldBan = true;
        }

        if (shouldBan) {
            this.addLog(this.wsNumber, `🚫 JOIN BAN: ${username}`);
            setTimeout(() => { if (ws.readyState === ws.OPEN) ws.send(`BAN ${userid}\r\n`); }, 200);
        }
    }

    handleJoinTargetTracking(ws, snippets, text) {
        const username = snippets[2];
        const userid = snippets[3];
        if (userid && userid !== this.founderUserId) {
            const bl = (this.config.blacklist || "").toLowerCase();
            const gbl = (this.config.gangblacklist || "").toLowerCase();
            if (bl.includes(username.toLowerCase()) || gbl.includes(username.toLowerCase())) {
                if (!this.targetids.includes(userid)) {
                    this.targetids.push(userid);
                    this.targetnames.push(username);
                    this.attackids.push(userid);
                    this.attacknames.push(username);
                }
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
        this.userFound = true;
        this.useridattack = userid;
        this.useridtarget = userid;
        this.status = mode;

        const timing = this.getTiming(mode);
        this.addLog(this.wsNumber, `⚡ ${label} ${name} in ${timing}ms`);

        this.timeout = setTimeout(() => {
            if (this.useridattack === this.founderUserId) return;
            if (ws.readyState === ws.OPEN) {
                if (this.config.modena) ws.send(`BAN ${userid}\r\n`);
                else if (this.config.kickmode) ws.send(`KICK ${userid}\r\n`);
                else {
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
        if (this.targetids.length === 0) return;
        let target;
        if (this.config.smart) target = this.selectSmartTarget();
        else {
            const rand = Math.floor(Math.random() * this.targetids.length);
            target = { id: this.targetids[rand], name: this.targetnames[rand] };
        }
        if (!target) return;
        this.startAttackSequence(ws, target.id, target.name, "attack", "StartAttack");
    }

    _parseTargetList(text, isKickCheck) {
        const users = [];
        const data = text.replaceAll("+", "").toLowerCase();

        const blSource = isKickCheck ? (this.config.kblacklist || "") : (this.config.blacklist || "");
        const gblSource = isKickCheck ? (this.config.kgangblacklist || "") : (this.config.gangblacklist || "");

        const blacklist = blSource.toLowerCase().split("\n").filter(x => x.trim());
        const gangblacklist = gblSource.toLowerCase().split("\n").filter(x => x.trim());

        blacklist.forEach(element => {
            if (element && data.includes(element)) {
                const replace = element + " ";
                const replaced = data.replaceAll(replace, "*");
                const arr = replaced.split("*");
                arr.shift();
                if (arr[0]) {
                    const uid = arr[0].split(" ")[0];
                    if (uid && uid !== this.useridg && uid !== this.founderUserId && !users.find(u => u.userid === uid)) {
                        users.push({ userid: uid, username: element });
                    }
                }
            }
        });

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
                    if (uid && uid !== this.useridg && uid !== this.founderUserId && !users.find(u => u.userid === uid)) {
                        users.push({ userid: uid, username: name });
                    }
                }
            }
        });
        return users;
    }

    // ==================== OTHER HANDLERS ====================

    handle860Message(ws, snippets, text) {
        if (this.config.dadplus && text.toLowerCase().includes("aura")) {
            // Dad+ Logic: Log user with aura. If we want to attack them, that logic would go here.
            // Legacy code usually just logged it or used it for 'finding' hidden users.
            const userid = snippets[1];
            this.addLog(this.wsNumber, `✨ Aura detected on ${userid}`);
        }
    }

    handle471Message(ws, snippets, text) {
        this.addLog(this.wsNumber, `⚠️ Error 471: Channel issue`);
    }

    handle900Message(ws, snippets, text) {
        const planetInfo = snippets.slice(1).join(" ");
        const planet = snippets[1];
        
        this.currentPlanet = planet;
        this.inPrison = planet && planet.startsWith("Prison");
        
        this.addLog(this.wsNumber, `📍 Planet: ${planetInfo}`);
        
        if (this.inPrison && this.config.autorelease) {
            this.addLog(this.wsNumber, `🔓 Prison detected - attempting escape`);
            setTimeout(() => this.escapeAll(), 1000);
        }
    }

    handlePartMessage(ws, snippets, text) {
        if (snippets[1] === this.useridtarget) {
            this.userFound = false;
            if (this.timeout) clearTimeout(this.timeout);
        }
    }
    handleSleepMessage(ws, snippets, text) { this.handlePartMessage(ws, snippets, text); }

    handle850Message(ws, snippets, text) {
        if (snippets[6] === "3s") {
            this.threesec = true;
            this.addLog(this.wsNumber, `❌ 3s Error`);
            this.incrementAttack();
        } else if (snippets[3] === "allows") {
            this.addLog(this.wsNumber, `✅ Success`);
            this.decrementAttack();
        }
    }
    handle452Message(ws, snippets, text) {
        if (snippets[3] === "sign") this.addLog(this.wsNumber, `🔐 Sign received`);
    }

    // ==================== ESCAPE LOGIC ====================
    async escapeAll() {
        if (!this.inPrison) return false;
        const fns = [];
        for (let i = 1; i <= 5; i++) {
            if (this.config[`rc${i}`]) fns.push(this.escapeWithCode(this.config[`rc${i}`], `RC${i}`));
            if (this.config[`rcl${i}`]) fns.push(this.escapeWithCode(this.config[`rcl${i}`], `RCL${i}`));
        }
        const results = await Promise.all(fns);
        return results.some(r => r === true);
    }

    async escapeWithCode(recoveryCode, label) {
        if (!recoveryCode) return false;
        const userID = this.useridg || "0";
        const password = this.passwordg || "0";
        const boundary = '----WebKitFormBoundarylRahhWQJyn2QX0gB';
        const formData = [
            `--${boundary}`, 'Content-Disposition: form-data; name="a"', '', 'jail_free',
            `--${boundary}`, 'Content-Disposition: form-data; name="type"', '', 'escapeItemDiamond',
            `--${boundary}`, 'Content-Disposition: form-data; name="usercur"', '', userID,
            `--${boundary}`, 'Content-Disposition: form-data; name="ajax"', '', '1', `--${boundary}--`
        ].join('\r\n');

        const options = {
            hostname: 'galaxy.mobstudio.ru', port: 443,
            path: `/services/?&userID=${userID}&password=${password}&query_rand=${Math.random()}`,
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(formData), 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        };
        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    const success = data.includes('"success":true') || data.includes('escaped');
                    if (success) this.addLog(this.wsNumber, `✅ ${label} Escape Success!`);
                    resolve(success);
                });
            });
            req.on('error', () => resolve(false));
            req.write(formData);
            req.end();
        });
    }

    OffSleep(ws) {
        if (this.offSleepRetryCount >= this.maxOffSleepRetries) return;
        this.isOffSleepActive = true;
        const delay = 5000 * Math.pow(1.5, this.offSleepRetryCount);
        this.reconnectTimeoutId = setTimeout(() => {
            if (this.config.connected && this.reconnect) this.reconnect(this.wsNumber);
            this.offSleepRetryCount++;
            this.isOffSleepActive = false;
        }, delay);
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
            targetids: [...this.targetids],
            targetnames: [...this.targetnames],
            attackids: [...this.attackids],
            attacknames: [...this.attacknames],
            useridtarget: this.useridtarget,
            useridattack: this.useridattack,
            userFound: this.userFound,
            status: this.status,
            threesec: this.threesec,
            targetCount: this.targetids.length,
            attackCount: this.attackids.length,
            currentAttackTiming: this.config[`attack${this.wsNumber}`],
            currentWaitingTiming: this.config[`waiting${this.wsNumber}`]
        };
    }
}

module.exports = GameLogic;

// FINAL COMPLETE Game Logic Module - 100% Feature Parity with bestscript.js
// All features from 3360 lines of bestscript.js implemented for headless operation

const crypto = require("crypto-js");

class FinalCompleteGameLogic {
  constructor(wsNumber, config, addLogCallback, updateConfigCallback) {
    this.wsNumber = wsNumber;
    this.config = config;
    this.addLog = addLogCallback;
    this.updateConfig = updateConfigCallback; // For timer shift
    
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
    
    // Flags
    this.userFound = false;
    this.threesec = false;
    
    // Status
    this.status = ""; // "attack" or "defense"
    this.joindate = null;
    
    // Timers
    this.timeout = null;
    this.lowtime = 0;
    
    // Counter for code alternation
    this.inc = 0;
  }

  // Parse haaapsi
  parseHaaapsi(e) {
    if (!e) return "";
    var temp = crypto.MD5(e).toString(crypto.enc.Hex);
    return (temp = (temp = temp.split("").reverse().join("0")).substr(5, 10));
  }

  // Count occurrences in array
  countOccurrences(arr, val) {
    return arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
  }

  // Get recovery code with alternation
  getRecoveryCode(mainCode, altCode) {
    this.inc++;
    if (mainCode && altCode) {
      return (this.inc % 2 == 1) ? mainCode : altCode;
    }
    return altCode || mainCode;
  }

  // Reset state for new connection
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
    this.lowtime = 0;
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  // ========================================
  // TIMER SHIFT FEATURE (NEW!)
  // ========================================
  
  incrementAttack() {
    if (!this.config.timershift) return;
    
    const currentKey = `attack${this.wsNumber}`;
    let value = parseInt(this.config[currentKey] || 1940);
    const incrementValue = parseInt(this.config.incrementvalue || 10);
    const maxAtk = parseInt(this.config.maxatk || 3000);
    
    value += incrementValue;
    
    if (value <= maxAtk) {
      this.config[currentKey] = value;
      this.updateConfig(currentKey, value);
      this.addLog(this.wsNumber, `⏫ Attack timing increased to ${value}ms`);
    }
  }

  decrementAttack() {
    if (!this.config.timershift) return;
    
    const currentKey = `attack${this.wsNumber}`;
    let value = parseInt(this.config[currentKey] || 1940);
    const decrementValue = parseInt(this.config.decrementvalue || 10);
    const minAtk = parseInt(this.config.minatk || 1000);
    
    value -= decrementValue;
    
    if (value >= minAtk) {
      this.config[currentKey] = value;
      this.updateConfig(currentKey, value);
      this.addLog(this.wsNumber, `⏬ Attack timing decreased to ${value}ms`);
    }
  }

  incrementDefence() {
    if (!this.config.timershift) return;
    
    const currentKey = `waiting${this.wsNumber}`;
    let value = parseInt(this.config[currentKey] || 1910);
    const incrementValue = parseInt(this.config.incrementvalue || 10);
    const maxDef = parseInt(this.config.maxdef || 3000);
    
    value += incrementValue;
    
    if (value <= maxDef) {
      this.config[currentKey] = value;
      this.updateConfig(currentKey, value);
      this.addLog(this.wsNumber, `⏫ Waiting timing increased to ${value}ms`);
    }
  }

  decrementDefence() {
    if (!this.config.timershift) return;
    
    const currentKey = `waiting${this.wsNumber}`;
    let value = parseInt(this.config[currentKey] || 1910);
    const decrementValue = parseInt(this.config.decrementvalue || 10);
    const minDef = parseInt(this.config.mindef || 1000);
    
    value -= decrementValue;
    
    if (value >= minDef) {
      this.config[currentKey] = value;
      this.updateConfig(currentKey, value);
      this.addLog(this.wsNumber, `⏬ Waiting timing decreased to ${value}ms`);
    }
  }

  // ========================================
  // 353 HANDLER - CHANNEL USER LIST
  // ========================================
  
  handle353Normal(ws, snippets, text) {
    try {
      const channelName = snippets[3];
      
      if (channelName && channelName.slice(0, 6) === "Prison") {
        this.addLog(this.wsNumber, `Skipping prison channel`);
        return;
      }

      const data = text.replaceAll("+", "").toLowerCase();
      const blacklistfull = (this.config.blacklist || "").toLowerCase();
      const blacklist = blacklistfull.split("\n").filter(b => b.trim());
      const gangblacklistfull = (this.config.gangblacklist || "").toLowerCase();
      const gangblacklist = gangblacklistfull.split("\n").filter(g => g.trim());
      const timing = parseInt(this.config[`attack${this.wsNumber}`] || 1940);

      // Process username blacklist
      if (blacklistfull) {
        blacklist.forEach((element) => {
          if (element && data.includes(element)) {
            const replace = element + " ";
            const replaced = data.replaceAll(replace, "*");
            const arr = replaced.split("*");
            arr.shift();
            
            if (arr[0]) {
              const userid = arr[0].split(" ")[0];
              if (userid && !this.targetids.includes(userid)) {
                this.targetids.push(userid);
                this.attackids.push(userid);
                this.targetnames.push(element);
                this.attacknames.push(element);
                this.addLog(this.wsNumber, `Found blacklisted: ${element} (${userid})`);
              }
            }
          }
        });
      }

      // Process gang blacklist
      if (gangblacklistfull) {
        gangblacklist.forEach((element) => {
          if (element && data.includes(element)) {
            const replace = element + " ";
            const replaced = data.replaceAll(replace, "*");
            const arr = replaced.split("*");
            arr.shift();
            
            for (let i = 0; i < arr.length; i++) {
              const value = arr[i];
              const parts = value.split(" ");
              if (parts[0] && parts[1] && !this.targetids.includes(parts[1])) {
                this.targetnames.push(parts[0]);
                this.attacknames.push(parts[0]);
                this.targetids.push(parts[1]);
                this.attackids.push(parts[1]);
                this.addLog(this.wsNumber, `Found gang member: ${parts[0]} (${parts[1]})`);
              }
            }
          }
        });
      }

      // Attack first target if available
      if (!this.userFound && this.targetids.length > 0) {
        const rand = Math.floor(Math.random() * this.targetids.length);
        const userid = this.targetids[rand];
        const targetname = this.targetnames[rand];
        
        this.userFound = true;
        this.useridattack = userid;
        this.useridtarget = userid;
        this.status = "attack";
        
        this.addLog(this.wsNumber, `⚡ Will attack ${targetname} in ${timing}ms`);

        this.timeout = setTimeout(() => {
          if (ws.readyState === ws.OPEN) {
            ws.send(`ACTION 3 ${this.useridattack}\r\n`);
            this.addLog(this.wsNumber, `⚔️ Attacked ${targetname}!`);
            
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

  handle353LowSec(ws, snippets, text) {
    try {
      const channelName = snippets[3];
      
      if (channelName && channelName.slice(0, 6) === "Prison") {
        return;
      }

      let members = text.split("+").join("");
      members = members.split("@").join("");
      members = members.split(":").join("");
      const finmembers = members.toLowerCase();
      const membersarr = finmembers.split(" ");
      membersarr.push("randomname");

      const whitelist = (this.config.blacklist || "").split("\n").filter(w => w.trim());
      const gangwhitelist = (this.config.gangblacklist || "").split("\n").filter(g => g.trim());

      const indexself = membersarr.indexOf(this.useridg);
      if (indexself >= 0) {
        membersarr[indexself] = "-";
      }

      whitelist.forEach((element) => {
        if (element && membersarr.includes(element.toLowerCase())) {
          const indexcheck = membersarr.indexOf(element.toLowerCase());
          if (indexcheck >= 0 && indexcheck + 1 < membersarr.length) {
            membersarr[indexcheck + 1] = "-";
          }
        }
      });

      gangwhitelist.forEach((element) => {
        if (element) {
          const occurances = this.countOccurrences(membersarr, element.toLowerCase());
          for (let k = 0; k < occurances; k++) {
            const indexcheck = membersarr.indexOf(element.toLowerCase());
            if (indexcheck >= 0) {
              membersarr[indexcheck] = "-";
              if (indexcheck + 2 < membersarr.length) {
                membersarr[indexcheck + 2] = "-";
              }
            }
          }
        }
      });

      const integers = membersarr.filter(item => !isNaN(item) && item !== "-");
      const userids = integers.filter((element) => {
        const idx = membersarr.indexOf(element);
        if (idx > 0 && isNaN(membersarr[idx - 1])) {
          return element.length >= 6;
        }
        return false;
      });

      const timing = parseInt(this.config[`attack${this.wsNumber}`] || 1940);

      if (!this.userFound && userids.length > 0) {
        const rand = Math.floor(Math.random() * userids.length);
        const userid = userids[rand];
        const idx = membersarr.indexOf(userid);
        const username = idx > 0 ? membersarr[idx - 1] : "unknown";
        
        this.userFound = true;
        this.useridattack = userid;
        this.useridtarget = userid;
        this.status = "attack";
        
        this.addLog(this.wsNumber, `⚡ [LOW SEC] Attack ${username} in ${timing}ms`);

        this.timeout = setTimeout(() => {
          if (ws.readyState === ws.OPEN) {
            ws.send(`ACTION 3 ${this.useridattack}\r\n`);
            this.addLog(this.wsNumber, `⚔️ [LOW SEC] Attacked ${username}!`);
            
            if (this.config.autorelease || this.config.exitting) {
              ws.send("QUIT :ds\r\n");
              this.addLog(this.wsNumber, `🚪 QUIT after attack`);
            }
          }
        }, timing);
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handle353LowSec:`, error);
    }
  }

  handle353Message(ws, snippets, text) {
    if (this.config.lowsecmode) {
      this.handle353LowSec(ws, snippets, text);
    } else {
      this.handle353Normal(ws, snippets, text);
    }
  }

  // ========================================
  // JOIN HANDLERS - MULTIPLE MODES
  // ========================================
  
  // JOIN Handler #1 - Attack mode (immediate attack on blacklist match)
  handleJoinAttackMode(ws, snippets, text) {
    try {
      if (!this.config.exitting) return;

      const data = text.toLowerCase();
      const blacklistfull = (this.config.blacklist || "").toLowerCase();
      const blacklist = blacklistfull.split("\n").filter(b => b.trim());
      const gangblacklistfull = (this.config.gangblacklist || "").toLowerCase();
      const gangblacklist = gangblacklistfull.split("\n").filter(g => g.trim());

      let foundMatch = false;
      let matchedUser = "";
      let matchedId = "";

      // Check username blacklist
      if (blacklistfull) {
        for (const element of blacklist) {
          if (element && data.includes(element)) {
            const parts = text.split(" ");
            if (parts.length >= 3) {
              matchedUser = element;
              matchedId = parts[1];
              foundMatch = true;
              break;
            }
          }
        }
      }

      // Check gang blacklist
      if (!foundMatch && gangblacklistfull) {
        for (const element of gangblacklist) {
          if (element && data.includes(element)) {
            const parts = text.split(" ");
            if (parts.length >= 3) {
              matchedUser = parts[2] || element;
              matchedId = parts[1];
              foundMatch = true;
              break;
            }
          }
        }
      }

      // Attack if found
      if (foundMatch && !this.userFound) {
        const timing = parseInt(this.config[`attack${this.wsNumber}`] || 1940);
        const waiting = parseInt(this.config[`waiting${this.wsNumber}`] || 1910);
        
        this.userFound = true;
        this.useridattack = matchedId;
        this.useridtarget = matchedId;
        this.status = "attack";
        
        this.addLog(this.wsNumber, `🎯 Target joined: ${matchedUser}`);
        this.addLog(this.wsNumber, `⚡ Attack in ${timing}ms`);

        this.timeout = setTimeout(() => {
          if (ws.readyState === ws.OPEN) {
            ws.send(`ACTION 3 ${this.useridattack}\r\n`);
            this.addLog(this.wsNumber, `⚔️ Attacked ${matchedUser}!`);
            
            setTimeout(() => {
              if (ws.readyState === ws.OPEN) {
                ws.send("QUIT :ds\r\n");
                this.addLog(this.wsNumber, `🚪 QUIT`);
              }
            }, waiting);
          }
        }, timing);
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handleJoinAttackMode:`, error);
    }
  }

  // JOIN Handler #2 - Defense mode (NEW! Uses waiting timing, gang only)
  handleJoinDefenseMode(ws, snippets, text) {
    try {
      if (!this.userFound) {
        const data = text.toLowerCase();
        const member = data.split(" ");
        const gangblacklist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(g => g.trim());
        const timing = parseInt(this.config[`waiting${this.wsNumber}`] || 1910);
        
        gangblacklist.forEach((element) => {
          if (element && member.includes(element.toLowerCase())) {
            const memberindex = member.indexOf(element.toLowerCase());
            const userid = member[memberindex + 2];
            const username = member[memberindex + 1];
            
            this.useridtarget = userid;
            this.status = "defense";
            this.userFound = true;
            
            this.addLog(this.wsNumber, `🛡️ Defense mode: ${username} in ${timing}ms`);

            this.timeout = setTimeout(() => {
              if (ws.readyState === ws.OPEN) {
                ws.send(`ACTION 3 ${userid}\r\n`);
                this.addLog(this.wsNumber, `⚔️ Defense attacked ${username}!`);
                
                ws.send("QUIT :ds\r\n");
                this.addLog(this.wsNumber, `🚪 QUIT`);
              }
            }, timing);
          }
        });
      }
    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handleJoinDefenseMode:`, error);
    }
  }

  // JOIN Handler #3 - Target tracking (NEW! Builds target pool)
  handleJoinTargetTracking(ws, snippets, text) {
    try {
      const data = text.toLowerCase();
      const member = data.split(" ");
      
      // Track username blacklist
      const blacklist = (this.config.blacklist || "").split("\n").filter(b => b.trim());
      blacklist.forEach(element => {
        if (element && member.includes(element.toLowerCase())) {
          const memberindex = member.indexOf(element.toLowerCase());
          const useridnew = member[memberindex + 1];
          if (useridnew && !this.targetids.includes(useridnew)) {
            this.targetids.push(useridnew);
            this.targetnames.push(element);
            this.addLog(this.wsNumber, `📝 Added to pool: ${element}`);
          }
        }
      });

      // Track gang blacklist
      const gangblacklist = (this.config.gangblacklist || "").split("\n").filter(g => g.trim());
      gangblacklist.forEach(element => {
        if (element && member.includes(element.toLowerCase())) {
          const memberindex = member.indexOf(element.toLowerCase());
          const useridnew = member[memberindex + 2];
          const username = member[memberindex + 1];
          if (useridnew && !this.targetids.includes(useridnew)) {
            this.targetids.push(useridnew);
            this.targetnames.push(username);
            this.addLog(this.wsNumber, `📝 Added to pool: ${username}`);
          }
        }
      });
    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handleJoinTargetTracking:`, error);
    }
  }

  // JOIN Handler #4 - Low sec mode
  handleJoinLowSec(ws, snippets, text) {
    try {
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
        if (parts.length >= 3) {
          const matchedId = parts[1];
          const matchedUser = parts[2] || "unknown";
          const timing = parseInt(this.config[`attack${this.wsNumber}`] || 1940);
          const waiting = parseInt(this.config[`waiting${this.wsNumber}`] || 1910);
          
          this.userFound = true;
          this.useridattack = matchedId;
          this.useridtarget = matchedId;
          this.status = "attack";
          
          this.addLog(this.wsNumber, `🎯 [LOW SEC] Non-whitelisted user: ${matchedUser}`);

          this.timeout = setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send(`ACTION 3 ${this.useridattack}\r\n`);
              this.addLog(this.wsNumber, `⚔️ [LOW SEC] Attacked!`);
              
              if (!this.config.sleeping || !this.config.autorelease) {
                setTimeout(() => {
                  if (ws.readyState === ws.OPEN) {
                    ws.send("QUIT :ds\r\n");
                    this.addLog(this.wsNumber, `🚪 QUIT`);
                  }
                }, waiting);
              }
            }
          }, timing);
        }
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handleJoinLowSec:`, error);
    }
  }

  // JOIN Router - Calls all handlers
  handleJoinMessage(ws, snippets, text) {
    if (this.config.lowsecmode) {
      this.handleJoinLowSec(ws, snippets, text);
    } else {
      // Normal mode - call all handlers
      this.handleJoinAttackMode(ws, snippets, text);
      this.handleJoinDefenseMode(ws, snippets, text);
      this.handleJoinTargetTracking(ws, snippets, text);
    }
  }

  // ========================================
  // PING HANDLER
  // ========================================
  
  handlePingMessage(ws) {
    ws.send("PONG\r\n");
  }

  // ========================================
  // 471 - ERROR HANDLER
  // ========================================
  
  handle471Message(ws, snippets, text) {
    this.addLog(this.wsNumber, `⚠️ Error 471: Channel issue`);
  }

  // ========================================
  // 850 - STATUS + TIMER SHIFT TRIGGER
  // ========================================
  
  handle850Message(ws, snippets, text) {
    try {
      if (snippets[1] === ":<div") {
        return;
      }

      // Check for 3-second event (TIMER SHIFT TRIGGER!)
      if (snippets.length >= 7 && snippets[6] === "3s") {
        this.threesec = true;
        this.addLog(this.wsNumber, `⏰ 3-second event detected`);
        
        // Timer shift logic
        if (this.config.timershift) {
          if (this.status === "attack") {
            this.incrementAttack();
          } else if (this.status === "defense") {
            this.incrementDefence();
          }
        }
      }

      const statusText = snippets.slice(1).join(" ").substring(0, 80);
      if (statusText) {
        this.addLog(this.wsNumber, `ℹ️ ${statusText}`);
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handle850:`, error);
    }
  }

  // ========================================
  // 452 - SIGN/AUTH
  // ========================================
  
  handle452Message(ws, snippets, text) {
    if (snippets[3] === "sign") {
      this.addLog(this.wsNumber, `🔐 Sign message received`);
    }
  }

  // ========================================
  // PART - USER LEAVING + TIMER SHIFT
  // ========================================
  
  handlePartMessage(ws, snippets, text) {
    try {
      const userid = snippets[1];
      
      // Check if it's our target
      if (userid === this.useridtarget) {
        this.addLog(this.wsNumber, `👋 Target left: ${userid}`);
        
        // Timer shift: Decrement if left before 3-second event
        if (this.config.timershift && !this.threesec) {
          if (this.status === "attack") {
            this.decrementAttack();
          } else if (this.status === "defense") {
            this.decrementDefence();
          }
        }
        
        this.userFound = false;
        this.useridtarget = null;
        this.useridattack = null;
        
        if (this.timeout) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
        
        if (this.config.exitting) {
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send("QUIT :ds\r\n");
              this.addLog(this.wsNumber, `🚪 QUIT (target left)`);
            }
          }, 100);
        }
      }

      // Remove from target arrays (ENHANCED CLEANUP)
      const index = this.targetids.indexOf(userid);
      if (index > -1) {
        this.targetids.splice(index, 1);
        this.targetnames.splice(index, 1);
      }
      
      const attackIndex = this.attackids.indexOf(userid);
      if (attackIndex > -1) {
        this.attackids.splice(attackIndex, 1);
        this.attacknames.splice(attackIndex, 1);
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handlePart:`, error);
    }
  }

  // ========================================
  // SLEEP - USER SLEEPING
  // ========================================
  
  handleSleepMessage(ws, snippets, text) {
    try {
      const userid = snippets[1] ? snippets[1].replace(/(\r\n|\n|\r)/gm, "") : "";
      
      // Check if it's our target
      if (userid === this.useridtarget) {
        this.addLog(this.wsNumber, `💤 Target sleeping: ${userid}`);
        this.userFound = false;
        this.useridtarget = null;
        this.useridattack = null;
        
        if (this.timeout) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
        
        if (this.config.sleeping || this.config.exitting) {
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send("QUIT :ds\r\n");
              this.addLog(this.wsNumber, `🚪 QUIT (target sleeping)`);
            }
          }, 100);
        }
      }

      // ENHANCED: Remove from ALL target arrays
      const index = this.targetids.indexOf(userid);
      if (index > -1) {
        this.targetids.splice(index, 1);
        this.targetnames.splice(index, 1);
        this.addLog(this.wsNumber, `Removed sleeping user from targets`);
      }
      
      const attackIndex = this.attackids.indexOf(userid);
      if (attackIndex > -1) {
        this.attackids.splice(attackIndex, 1);
        this.attacknames.splice(attackIndex, 1);
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handleSleep:`, error);
    }
  }

  // ========================================
  // 900 - PLANET/PRISON
  // ========================================
  
  handle900Message(ws, snippets, text) {
    try {
      if (snippets[1]) {
        const planetInfo = snippets.slice(1).join(" ");
        this.addLog(this.wsNumber, `🌍 Current Planet: ${planetInfo}`);
      }

      if (this.config.autorelease) {
        const plnt = snippets[1];
        if (plnt && plnt.slice(0, 6) === "Prison") {
          this.addLog(this.wsNumber, `🔓 Prison detected - attempting escape`);
          
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send("ACTION 2\r\n");
              this.addLog(this.wsNumber, `🏃 Escape command sent`);
              
              const targetPlanet = this.config.planet;
              if (targetPlanet) {
                setTimeout(() => {
                  if (ws.readyState === ws.OPEN) {
                    ws.send(`JOIN ${targetPlanet}\r\n`);
                    this.addLog(this.wsNumber, `🔄 Rejoining ${targetPlanet}`);
                  }
                }, 3000);
              }
            }
          }, 1000);
        }
      }

      if (snippets[1] === "PRISON" && snippets[2] === "0" && this.config.autorelease) {
        this.addLog(this.wsNumber, `🔓 Prison status detected - escaping`);
        setTimeout(() => {
          if (ws.readyState === ws.OPEN) {
            ws.send("ACTION 2\r\n");
            const targetPlanet = this.config.planet;
            if (targetPlanet) {
              setTimeout(() => {
                if (ws.readyState === ws.OPEN) {
                  ws.send(`JOIN ${targetPlanet}\r\n`);
                  this.addLog(this.wsNumber, `🔄 Rejoining ${targetPlanet}`);
                }
              }, 3000);
            }
          }
        }, 1000);
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handle900:`, error);
    }
  }

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
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

  destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.resetState();
  }
}

module.exports = FinalCompleteGameLogic;

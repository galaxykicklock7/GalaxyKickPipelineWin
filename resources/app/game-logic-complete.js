// Complete Game Logic Module - Full feature parity with bestscript.js
// Extracted and adapted for headless operation

const crypto = require("crypto-js");

class CompleteGameLogic {
  constructor(wsNumber, config, addLogCallback) {
    this.wsNumber = wsNumber;
    this.config = config;
    this.addLog = addLogCallback;
    
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
    this.status = "";
    this.joindate = null;
    
    // Timers
    this.timeout = null;
    this.lowtime = 0;
    
    // Counter for code alternation
    this.inc = 0;
  }

  // Parse haaapsi (from bestscript.js line 290)
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
    
    // Clear any existing timers
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  // Handle 353 - Channel user list (NORMAL MODE)
  // From bestscript.js line 455-534
  handle353Normal(ws, snippets, text) {
    try {
      const channelName = snippets[3];
      
      // Skip prison channels
      if (channelName && channelName.slice(0, 6) === "Prison") {
        this.addLog(this.wsNumber, `Skipping prison channel: ${channelName}`);
        return;
      }

      // Process user list for blacklisted users
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
            
            // Auto-quit if enabled
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

  // Handle 353 - Channel user list (LOW SEC MODE)
  // From bestscript.js line 536-608
  handle353LowSec(ws, snippets, text) {
    try {
      const channelName = snippets[3];
      
      // Skip prison
      if (channelName && channelName.slice(0, 6) === "Prison") {
        return;
      }

      // Parse members
      let members = text.split("+").join("");
      members = members.split("@").join("");
      members = members.split(":").join("");
      const finmembers = members.toLowerCase();
      const membersarr = finmembers.split(" ");
      membersarr.push("randomname");

      // Whitelist (in low sec, blacklist acts as whitelist!)
      const whitelist = (this.config.blacklist || "").split("\n").filter(w => w.trim());
      const gangwhitelist = (this.config.gangblacklist || "").split("\n").filter(g => g.trim());

      // Remove self
      const indexself = membersarr.indexOf(this.useridg);
      if (indexself >= 0) {
        membersarr[indexself] = "-";
      }

      // Remove whitelisted usernames
      whitelist.forEach((element) => {
        if (element && membersarr.includes(element.toLowerCase())) {
          const indexcheck = membersarr.indexOf(element.toLowerCase());
          if (indexcheck >= 0 && indexcheck + 1 < membersarr.length) {
            membersarr[indexcheck + 1] = "-";
          }
        }
      });

      // Remove whitelisted gangs
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

      // Extract valid user IDs
      const integers = membersarr.filter(item => !isNaN(item) && item !== "-");
      const userids = integers.filter((element) => {
        const idx = membersarr.indexOf(element);
        if (idx > 0 && isNaN(membersarr[idx - 1])) {
          return element.length >= 6;
        }
        return false;
      });

      const timing = parseInt(this.config[`attack${this.wsNumber}`] || 1940);

      // Attack random non-whitelisted user
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

  // Handle 353 - Router
  handle353Message(ws, snippets, text) {
    if (this.config.lowsecmode) {
      this.handle353LowSec(ws, snippets, text);
    } else {
      this.handle353Normal(ws, snippets, text);
    }
  }

  // Handle JOIN - Normal mode
  // From bestscript.js line 611-656
  handleJoinNormal(ws, snippets, text) {
    try {
      if (!this.config.exitting) return;

      // Check for specific patterns
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
            
            // QUIT after waiting time
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
      console.error(`[WS${this.wsNumber}] Error in handleJoinNormal:`, error);
    }
  }

  // Handle JOIN - Low sec mode
  // From bestscript.js line 705-770
  handleJoinLowSec(ws, snippets, text) {
    try {
      if (!this.config.exitting) return;

      const data = text.toLowerCase();
      const whitelist = (this.config.blacklist || "").toLowerCase().split("\n").filter(w => w.trim());
      const gangwhitelist = (this.config.gangblacklist || "").toLowerCase().split("\n").filter(g => g.trim());

      let isWhitelisted = false;

      // Check if user is whitelisted
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

      // Attack if NOT whitelisted
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
              
              // Only QUIT if not sleeping mode or autorelease disabled
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

  // Handle JOIN - Router
  handleJoinMessage(ws, snippets, text) {
    if (this.config.lowsecmode) {
      this.handleJoinLowSec(ws, snippets, text);
    } else {
      this.handleJoinNormal(ws, snippets, text);
    }
  }

  // Handle PING (from bestscript.js line 771-772)
  handlePingMessage(ws) {
    ws.send("PONG\r\n");
  }

  // Handle 471 - Error/Channel full (from bestscript.js line 774-779)
  handle471Message(ws, snippets, text) {
    this.addLog(this.wsNumber, `⚠️ Error 471: Channel issue`);
    // Could add retry logic here
  }

  // Handle 850 - Status messages (from bestscript.js line 780-841)
  handle850Message(ws, snippets, text) {
    try {
      // Skip HTML divs
      if (snippets[1] === ":<div") {
        return;
      }

      // Check for 3-second event
      if (snippets.length >= 7 && snippets[6] === "3s") {
        this.threesec = true;
        this.addLog(this.wsNumber, `⏰ 3-second event detected`);
      }

      // Log other status messages
      const statusText = snippets.slice(1).join(" ").substring(0, 80);
      if (statusText) {
        this.addLog(this.wsNumber, `ℹ️ ${statusText}`);
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handle850:`, error);
    }
  }

  // Handle 452 - Sign/Auth (from bestscript.js line 801-810)
  handle452Message(ws, snippets, text) {
    if (snippets[3] === "sign") {
      this.addLog(this.wsNumber, `🔐 Sign message received`);
    }
  }

  // Handle PART - User leaving (from bestscript.js line 857-882 and 1403-1424)
  handlePartMessage(ws, snippets, text) {
    try {
      const userid = snippets[1];
      
      // Check if it's our target
      if (userid === this.useridtarget) {
        this.addLog(this.wsNumber, `👋 Target left: ${userid}`);
        this.userFound = false;
        this.useridtarget = null;
        this.useridattack = null;
        
        // Clear timeout
        if (this.timeout) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
        
        // QUIT if exitting enabled
        if (this.config.exitting) {
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send("QUIT :ds\r\n");
              this.addLog(this.wsNumber, `🚪 QUIT (target left)`);
            }
          }, 100);
        }
      }

      // Remove from target list
      const index = this.targetids.indexOf(userid);
      if (index > -1) {
        this.targetids.splice(index, 1);
        this.targetnames.splice(index, 1);
        this.attackids.splice(index, 1);
        this.attacknames.splice(index, 1);
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handlePart:`, error);
    }
  }

  // Handle SLEEP - User sleeping (from bestscript.js line 870-926 and 1425-1486)
  handleSleepMessage(ws, snippets, text) {
    try {
      const userid = snippets[1] ? snippets[1].replace(/(\r\n|\n|\r)/gm, "") : "";
      
      // Check if it's our target
      if (userid === this.useridtarget) {
        this.addLog(this.wsNumber, `💤 Target sleeping: ${userid}`);
        this.userFound = false;
        this.useridtarget = null;
        this.useridattack = null;
        
        // Clear timeout
        if (this.timeout) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
        
        // QUIT if sleeping detection enabled
        if (this.config.sleeping || this.config.exitting) {
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send("QUIT :ds\r\n");
              this.addLog(this.wsNumber, `🚪 QUIT (target sleeping)`);
            }
          }, 100);
        }
      }

      // Remove from target list
      const index = this.targetids.indexOf(userid);
      if (index > -1) {
        this.targetids.splice(index, 1);
        this.targetnames.splice(index, 1);
        this.attackids.splice(index, 1);
        this.attacknames.splice(index, 1);
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error in handleSleep:`, error);
    }
  }

  // Handle 900 - Messages about planet/prison
  // From bestscript.js line 929-970
  handle900Message(ws, snippets, text) {
    try {
      // Log current planet
      if (snippets[1]) {
        const planetInfo = snippets.slice(1).join(" ");
        this.addLog(this.wsNumber, `🌍 Current Planet: ${planetInfo}`);
      }

      // Check for auto-release from prison
      if (this.config.autorelease) {
        const plnt = snippets[1];
        if (plnt && plnt.slice(0, 6) === "Prison") {
          this.addLog(this.wsNumber, `🔓 Prison detected - attempting escape`);
          
          // In headless mode, we need to send escape command directly
          // Desktop uses button click, we'll send the command
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              // Send ACTION 2 for escape (based on desktop logic)
              ws.send("ACTION 2\r\n");
              this.addLog(this.wsNumber, `🏃 Escape command sent`);
              
              // Rejoin target planet after 3 seconds
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

      // Also handle PRISON 0 format
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

  // Get current state snapshot
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
      attackCount: this.attackids.length
    };
  }

  // Cleanup
  destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.resetState();
  }
}

module.exports = CompleteGameLogic;

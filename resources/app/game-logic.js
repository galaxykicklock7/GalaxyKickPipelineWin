// Game Logic Module - Extracted from bestscript.js for headless use
// This module contains all the important game automation logic without DOM dependencies

const crypto = require("crypto-js");

class GameLogic {
  constructor(wsNumber, config, addLogCallback) {
    this.wsNumber = wsNumber;
    this.config = config;
    this.addLog = addLogCallback;
    
    // State tracking (from bestscript.js)
    this.haaapsi = null;
    this.id = null;
    this.useridg = null;
    this.passwordg = null;
    this.finalusername = null;
    this.targetids = [];
    this.targetnames = [];
    this.attackids = [];
    this.attacknames = [];
    this.useridtarget = null;
    this.useridattack = null;
    this.userFound = false;
    this.status = "";
    this.threesec = false;
    this.timeout = null;
    this.inc = 0;
    this.joindate = null;
    this.lowtime = 0;
  }

  // Parse haaapsi (from bestscript.js line 290)
  parseHaaapsi(e) {
    var temp = crypto.MD5(e).toString(crypto.enc.Hex);
    return (temp = (temp = temp.split("").reverse().join("0")).substr(5, 10));
  }

  // Count occurrences (from bestscript.js line 294)
  countOccurrences(arr, val) {
    return arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
  }

  // Check if user is in blacklist
  isUserBlacklisted(username) {
    if (!this.config.blacklist) return false;
    const blacklist = this.config.blacklist.split('\n').map(n => n.trim()).filter(n => n);
    return blacklist.some(blocked => username.toLowerCase().includes(blocked.toLowerCase()));
  }

  // Check if gang is blacklisted
  isGangBlacklisted(username) {
    if (!this.config.gangblacklist) return false;
    const gangblacklist = this.config.gangblacklist.split('\n').map(n => n.trim()).filter(n => n);
    return gangblacklist.some(blocked => username.toLowerCase().includes(blocked.toLowerCase()));
  }

  // Get recovery code with alternation (from bestscript.js line 307-324)
  getRecoveryCode(mainCode, altCode) {
    this.inc++;
    
    // If both codes exist, alternate between them
    if (mainCode && altCode) {
      if (this.inc % 2 == 1) {
        return mainCode;
      } else {
        return altCode;
      }
    }
    // If only Alt code exists, always use Alt
    else if (altCode) {
      return altCode;
    }
    // If only main code exists (or both empty), use main
    else {
      return mainCode;
    }
  }

  // Reset state for new connection (from bestscript.js line 422-433)
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
    this.lowtime = 0;
  }

  // Handle 900 message - User joining planet (from bestscript.js line 929-968)
  handle900Message(ws, snippets, text) {
    try {
      // Format: 900 :userid username joined planet
      const userid = snippets[1].substring(1); // Remove leading :
      const username = snippets[2];
      const joinedText = snippets[3]; // "joined"
      const planetName = snippets.slice(4).join(" ").replace(/(\r\n|\n|\r)/gm, "");

      this.addLog(this.wsNumber, `User joined: ${username} (${userid}) on ${planetName}`);

      // Check if this is our target planet
      if (planetName !== this.config.planet) {
        return; // Not our planet, ignore
      }

      // Check blacklists
      const isBlacklisted = this.isUserBlacklisted(username);
      const isGangBlacklisted = this.isGangBlacklisted(username);

      if (isBlacklisted || isGangBlacklisted) {
        this.addLog(this.wsNumber, `⚠️ Blacklisted user detected: ${username}`);
        
        // Add to target list
        if (!this.targetids.includes(userid)) {
          this.targetids.push(userid);
          this.targetnames.push(username);
          this.addLog(this.wsNumber, `Added to targets: ${username} (${userid})`);
        }

        // Auto-attack logic (if enabled)
        if (this.config.exitting && !this.userFound) {
          this.userFound = true;
          this.useridtarget = userid;
          this.addLog(this.wsNumber, `🎯 Targeting: ${username}`);

          // Send attack command with timing
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send(`PRIVMSG ${this.config.planet} :ATTACK ${userid}\r\n`);
              this.addLog(this.wsNumber, `⚡ Attacked: ${username}`);
              
              // Auto-quit if autorelease enabled
              if (this.config.autorelease) {
                setTimeout(() => {
                  if (ws.readyState === ws.OPEN) {
                    ws.send("QUIT :ds\r\n");
                    this.addLog(this.wsNumber, `🚪 Auto-quit after attack`);
                  }
                }, this.config[`waiting${this.wsNumber}`] || 1910);
              }
            }
          }, this.config[`attack${this.wsNumber}`] || 1940);
        }
      }
    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error handling 900:`, error);
    }
  }

  // Handle PART message - User leaving (from bestscript.js line 857-882)
  handlePartMessage(ws, snippets, text) {
    try {
      const userid = snippets[1];
      
      if (userid === this.useridtarget) {
        this.addLog(this.wsNumber, `Target left: ${userid}`);
        this.userFound = false;
        this.useridtarget = null;
        
        // Auto-quit if configured
        if (this.config.exitting) {
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send("QUIT :ds\r\n");
              this.addLog(this.wsNumber, `🚪 Quit because target left`);
            }
          }, 100);
        }
      }

      // Remove from target list
      const index = this.targetids.indexOf(userid);
      if (index > -1) {
        this.targetids.splice(index, 1);
        this.targetnames.splice(index, 1);
        this.addLog(this.wsNumber, `Removed from targets: ${userid}`);
      }
    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error handling PART:`, error);
    }
  }

  // Handle SLEEP message - User going to sleep (from bestscript.js line 870-926)
  handleSleepMessage(ws, snippets, text) {
    try {
      const userid = snippets[1].replace(/(\r\n|\n|\r)/gm, "");
      
      if (userid === this.useridtarget) {
        this.addLog(this.wsNumber, `💤 Target sleeping: ${userid}`);
        this.userFound = false;
        this.useridtarget = null;
        
        // Auto-quit if sleeping detection enabled
        if (this.config.sleeping) {
          setTimeout(() => {
            if (ws.readyState === ws.OPEN) {
              ws.send("QUIT :ds\r\n");
              this.addLog(this.wsNumber, `🚪 Quit because target is sleeping`);
            }
          }, 100);
        }
      }

      // Remove from target list
      const index = this.targetids.indexOf(userid);
      if (index > -1) {
        this.targetids.splice(index, 1);
        this.targetnames.splice(index, 1);
        this.addLog(this.wsNumber, `Removed sleeping user: ${userid}`);
      }
    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error handling SLEEP:`, error);
    }
  }

  // Handle 353 message - Channel user list (from bestscript.js line 455-536)
  handle353Message(ws, snippets, text) {
    try {
      const channelName = snippets[3];
      const isPrison = channelName.slice(0, 6) === "Prison";
      
      // Skip prison channels
      if (isPrison) {
        this.addLog(this.wsNumber, `Skipping prison channel: ${channelName}`);
        return;
      }

      // Check if lowsecmode
      if (this.config.lowsecmode) {
        this.addLog(this.wsNumber, `Low sec mode: ${channelName}`);
        // Low sec mode has different logic
        return;
      }

      // Parse user list
      const userListStart = text.indexOf(channelName) + channelName.length;
      const userListText = text.substring(userListStart).trim();
      const users = userListText.split(" ").filter(u => u && u !== "\r\n");

      this.addLog(this.wsNumber, `User list for ${channelName}: ${users.length} users`);

      // Process each user
      users.forEach(username => {
        // Extract userid if present (format: userid_username or just username)
        const isBlacklisted = this.isUserBlacklisted(username);
        const isGangBlacklisted = this.isGangBlacklisted(username);

        if (isBlacklisted || isGangBlacklisted) {
          this.addLog(this.wsNumber, `Found blacklisted user in channel: ${username}`);
          // Could add to target list here if needed
        }
      });

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error handling 353:`, error);
    }
  }

  // Handle JOIN message - User/self joined channel (from bestscript.js line 611-773)
  handleJoinMessage(ws, snippets, text) {
    try {
      // Format: JOIN userid username channel
      if (snippets.length < 3) {
        return; // Incomplete message
      }

      const userid = snippets[1];
      const username = snippets[2];
      const channel = snippets[3] ? snippets[3].replace(/(\r\n|\n|\r)/gm, "") : "";

      this.addLog(this.wsNumber, `JOIN: ${username} (${userid}) to ${channel}`);

      // If this is us joining, send additional commands
      if (!this.config.lowsecmode) {
        // Normal mode - could add auto-actions here
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error handling JOIN:`, error);
    }
  }

  // Handle 850 message - Status/info messages (from bestscript.js line 780-841)
  handle850Message(ws, snippets, text) {
    try {
      // 850 messages contain various game status info
      // Example: 850 :<div>some game status</div>
      
      // Skip HTML div messages
      if (snippets[1] === ":<div") {
        return;
      }

      // Log important status messages
      const statusText = snippets.slice(1).join(" ").substring(0, 100);
      this.addLog(this.wsNumber, `Status: ${statusText}`);

      // Check for specific status indicators
      if (text.includes("3s")) {
        // 3-second event detected
        this.threesec = true;
        this.addLog(this.wsNumber, `⏰ 3-second event detected`);
      }

    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error handling 850:`, error);
    }
  }

  // Handle 452 message - Sign/authentication (from bestscript.js line 801-810)
  handle452Message(ws, snippets, text) {
    try {
      // Format: 452 ... sign ...
      if (snippets[3] === "sign") {
        this.addLog(this.wsNumber, `Sign message received`);
        // Could add authentication logic here if needed
      }
    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error handling 452:`, error);
    }
  }

  // Handle 471 message - Error/channel full (from bestscript.js line 774-779)
  handle471Message(ws, snippets, text) {
    try {
      const errorText = text.substring(0, 100);
      this.addLog(this.wsNumber, `⚠️ Error 471: ${errorText}`);
      
      // Could add auto-retry logic or planet switching here
    } catch (error) {
      console.error(`[WS${this.wsNumber}] Error handling 471:`, error);
    }
  }

  // Get current state snapshot
  getState() {
    return {
      id: this.id,
      username: this.finalusername,
      targetids: [...this.targetids],
      targetnames: [...this.targetnames],
      useridtarget: this.useridtarget,
      userFound: this.userFound,
      status: this.status,
      targetCount: this.targetids.length
    };
  }
}

module.exports = GameLogic;

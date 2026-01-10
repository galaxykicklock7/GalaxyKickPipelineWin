// Core Game State Management
// Handles all state variables and lifecycle

class GameState {
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
    
    // Flags
    this.userFound = false;
    this.threesec = false;
    this.inPrison = false;
    this.currentPlanet = null;
    this.founderUserId = null;
    
    // Status
    this.status = "";
    this.joindate = null;
    
    // Timers
    this.timeout = null;
    this.lowtime = 0;
    
    // Counter for code alternation
    this.inc = 0;
    
    // Debug flag
    this._kickConfigLogged = false;
    
    // Reconnection management
    this.reconnectTimeoutId = null;
    this.isOffSleepActive = false;
    this.offSleepRetryCount = 0;
    this.maxOffSleepRetries = 10;
    this.innerTimeouts = [];
    
    // Timer Shift improvements
    this.consecutiveErrors = 0;
    this.consecutiveSuccesses = 0;
    this.recentAdjustments = [];
    this.maxAdjustmentHistory = 5;
    
    // Smart Mode improvements
    this.attackCooldowns = {};
    this.attackedThisSession = new Set();
    this.targetIndex = 0;
    this.cooldownDuration = 3500;
  }

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
    this._kickConfigLogged = false;
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    if (this.innerTimeouts && this.innerTimeouts.length > 0) {
      this.innerTimeouts.forEach(timeout => clearTimeout(timeout));
      this.innerTimeouts = [];
    }
    
    this.isOffSleepActive = false;
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

  destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.resetState();
  }
}

module.exports = GameState;

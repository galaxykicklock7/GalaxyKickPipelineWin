// Game Logic - Modular Entry Point
// This file serves as the main entry point for the game logic
// It extends the original game-logic-final.js for compatibility
// while allowing gradual migration to modular components

const OriginalGameLogic = require('../game-logic-final');
const { parseHaaapsi, countOccurrences, getRecoveryCode } = require('./utils/helpers');
const SmartMode = require('./features/SmartMode');
const TimerShift = require('./features/TimerShift');
const OffSleep = require('./features/OffSleep');
const PrisonEscape = require('./utils/prison');

/**
 * Main Game Logic Class
 * Extends the original implementation while adding modular structure
 */
class GameLogic extends OriginalGameLogic {
  constructor(wsNumber, config, addLogCallback, updateConfigCallback, reconnectCallback) {
    super(wsNumber, config, addLogCallback, updateConfigCallback, reconnectCallback);
    
    // Initialize modular features
    this.smartMode = new SmartMode(this);
    this.timerShift = new TimerShift(this);
    this.offSleep = new OffSleep(this);
    this.prisonEscape = new PrisonEscape(this);
  }
  
  // Override utility methods to use modular versions
  parseHaaapsi(e) {
    return parseHaaapsi(e);
  }
  
  countOccurrences(arr, val) {
    return countOccurrences(arr, val);
  }
  
  getRecoveryCode(mainCode, altCode) {
    this.inc++;
    return getRecoveryCode(this.inc, mainCode, altCode);
  }
  
  // Override Smart Mode methods
  markTargetAttacked(userid) {
    return this.smartMode.markTargetAttacked(userid);
  }
  
  isOnCooldown(userid) {
    return this.smartMode.isOnCooldown(userid);
  }
  
  getAvailableTargets() {
    return this.smartMode.getAvailableTargets();
  }
  
  getUnattackedTargets() {
    return this.smartMode.getUnattackedTargets();
  }
  
  selectSmartTarget() {
    return this.smartMode.selectSmartTarget();
  }
  
  // Override Timer Shift methods
  getTiming(type) {
    return this.timerShift.getTiming(type);
  }
  
  getTimingLabel(type) {
    return this.timerShift.getTimingLabel(type);
  }
  
  incrementAttack() {
    return this.timerShift.incrementAttack();
  }
  
  decrementAttack() {
    return this.timerShift.decrementAttack();
  }
  
  incrementDefence() {
    return this.timerShift.incrementDefence();
  }
  
  decrementDefence() {
    return this.timerShift.decrementDefence();
  }
  
  getAdaptiveStepSize(baseStep) {
    return this.timerShift.getAdaptiveStepSize(baseStep);
  }
  
  isOscillating() {
    return this.timerShift.isOscillating();
  }
  
  trackAdjustment(value) {
    return this.timerShift.trackAdjustment(value);
  }
  
  // Override OffSleep method
  OffSleep(ws) {
    return this.offSleep.execute(ws);
  }
  
  // Override Prison Escape methods
  async escapeWithCode(code, label) {
    return await this.prisonEscape.escapeWithCode(code, label);
  }
  
  async escape1() {
    return await this.prisonEscape.escape1();
  }
  
  async escape2() {
    return await this.prisonEscape.escape2();
  }
  
  async escape3() {
    return await this.prisonEscape.escape3();
  }
  
  async escape4() {
    return await this.prisonEscape.escape4();
  }
  
  async escape5() {
    return await this.prisonEscape.escape5();
  }
  
  async escapeL1() {
    return await this.prisonEscape.escapeL1();
  }
  
  async escapeL2() {
    return await this.prisonEscape.escapeL2();
  }
  
  async escapeL3() {
    return await this.prisonEscape.escapeL3();
  }
  
  async escapeL4() {
    return await this.prisonEscape.escapeL4();
  }
  
  async escapeL5() {
    return await this.prisonEscape.escapeL5();
  }
  
  async escapeViaDiamond() {
    return await this.prisonEscape.escapeViaDiamond();
  }
  
  async escapeAll() {
    return await this.prisonEscape.escapeAll();
  }
}

module.exports = GameLogic;

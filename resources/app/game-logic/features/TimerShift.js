// Timer Shift Feature - Adaptive timing adjustments

class TimerShift {
  constructor(gameState) {
    this.state = gameState;
  }

  getAdaptiveStepSize(baseStep) {
    if (this.state.consecutiveErrors >= 3) {
      return Math.min(baseStep * 2, 50);
    } else if (this.state.consecutiveSuccesses >= 5) {
      return Math.max(Math.floor(baseStep / 2), 5);
    }
    return baseStep;
  }

  isOscillating() {
    if (this.state.recentAdjustments.length < this.state.maxAdjustmentHistory) {
      return false;
    }
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const adj of this.state.recentAdjustments) {
      if (adj > 0) positiveCount++;
      if (adj < 0) negativeCount++;
    }
    
    return positiveCount >= 2 && negativeCount >= 2;
  }

  trackAdjustment(value) {
    this.state.recentAdjustments.push(value);
    if (this.state.recentAdjustments.length > this.state.maxAdjustmentHistory) {
      this.state.recentAdjustments.shift();
    }
  }

  getTiming(type) {
    const key = type === "attack" ? `attack${this.state.wsNumber}` : `waiting${this.state.wsNumber}`;
    return parseInt(this.state.config[key] || (type === "attack" ? 1940 : 1910));
  }

  getTimingLabel(type) {
    const timing = this.getTiming(type);
    if (timing < 1800) return "[VERY FAST]";
    if (timing < 1900) return "[FAST]";
    if (timing < 2000) return "[NORMAL]";
    if (timing < 2100) return "[SLOW]";
    return "[VERY SLOW]";
  }

  incrementAttack() {
    if (!this.state.config.timershift) return;
    
    const currentKey = `attack${this.state.wsNumber}`;
    let value = parseInt(this.state.config[currentKey] || 1940);
    const baseIncrement = parseInt(this.state.config.incrementvalue || 10);
    const maxAtk = parseInt(this.state.config.maxatk || 3000);
    
    let incrementValue = this.getAdaptiveStepSize(baseIncrement);
    
    if (this.isOscillating()) {
      incrementValue = Math.max(1, Math.floor(incrementValue / 2));
      this.state.addLog(this.state.wsNumber, `⚠️ Oscillation detected - reducing step to ${incrementValue}ms`);
    }
    
    value += incrementValue;
    
    if (value <= maxAtk) {
      this.state.config[currentKey] = value;
      this.state.updateConfig(currentKey, value);
      this.trackAdjustment(+incrementValue);
      this.state.addLog(this.state.wsNumber, `⏫ Attack timing increased to ${value}ms (+${incrementValue}ms)`);
    } else {
      this.state.addLog(this.state.wsNumber, `⚠️ Attack timing at maximum (${maxAtk}ms)`);
    }
  }

  decrementAttack() {
    if (!this.state.config.timershift) return;
    
    const currentKey = `attack${this.state.wsNumber}`;
    let value = parseInt(this.state.config[currentKey] || 1940);
    const baseDecrement = parseInt(this.state.config.decrementvalue || 10);
    const minAtk = parseInt(this.state.config.minatk || 1000);
    
    let decrementValue = baseDecrement;
    
    if (this.isOscillating()) {
      decrementValue = Math.max(1, Math.floor(decrementValue / 2));
      this.state.addLog(this.state.wsNumber, `⚠️ Oscillation detected - reducing step to ${decrementValue}ms`);
    }
    
    value -= decrementValue;
    
    if (value >= minAtk) {
      this.state.config[currentKey] = value;
      this.state.updateConfig(currentKey, value);
      this.trackAdjustment(-decrementValue);
      this.state.addLog(this.state.wsNumber, `⏬ Attack timing decreased to ${value}ms (-${decrementValue}ms)`);
    } else {
      this.state.addLog(this.state.wsNumber, `⚠️ Attack timing at minimum (${minAtk}ms)`);
    }
  }

  incrementDefence() {
    if (!this.state.config.timershift) return;
    
    const currentKey = `waiting${this.state.wsNumber}`;
    let value = parseInt(this.state.config[currentKey] || 1910);
    const baseIncrement = parseInt(this.state.config.incrementvalue || 10);
    const maxDef = parseInt(this.state.config.maxdef || 3000);
    
    let incrementValue = this.getAdaptiveStepSize(baseIncrement);
    
    if (this.isOscillating()) {
      incrementValue = Math.max(1, Math.floor(incrementValue / 2));
      this.state.addLog(this.state.wsNumber, `⚠️ Oscillation detected - reducing step to ${incrementValue}ms`);
    }
    
    value += incrementValue;
    
    if (value <= maxDef) {
      this.state.config[currentKey] = value;
      this.state.updateConfig(currentKey, value);
      this.trackAdjustment(+incrementValue);
      this.state.addLog(this.state.wsNumber, `⏫ Defense timing increased to ${value}ms (+${incrementValue}ms)`);
    } else {
      this.state.addLog(this.state.wsNumber, `⚠️ Defense timing at maximum (${maxDef}ms)`);
    }
  }

  decrementDefence() {
    if (!this.state.config.timershift) return;
    
    const currentKey = `waiting${this.state.wsNumber}`;
    let value = parseInt(this.state.config[currentKey] || 1910);
    const baseDecrement = parseInt(this.state.config.decrementvalue || 10);
    const minDef = parseInt(this.state.config.mindef || 1000);
    
    let decrementValue = baseDecrement;
    
    if (this.isOscillating()) {
      decrementValue = Math.max(1, Math.floor(decrementValue / 2));
      this.state.addLog(this.state.wsNumber, `⚠️ Oscillation detected - reducing step to ${decrementValue}ms`);
    }
    
    value -= decrementValue;
    
    if (value >= minDef) {
      this.state.config[currentKey] = value;
      this.state.updateConfig(currentKey, value);
      this.trackAdjustment(-decrementValue);
      this.state.addLog(this.state.wsNumber, `⏬ Defense timing decreased to ${value}ms (-${decrementValue}ms)`);
    } else {
      this.state.addLog(this.state.wsNumber, `⚠️ Defense timing at minimum (${minDef}ms)`);
    }
  }
}

module.exports = TimerShift;

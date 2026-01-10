// Smart Mode Feature - Intelligent target selection with cooldowns and round robin

class SmartMode {
  constructor(gameState) {
    this.state = gameState;
  }

  markTargetAttacked(userid) {
    this.state.attackCooldowns[userid] = Date.now();
    this.state.attackedThisSession.add(userid);
  }
  
  isOnCooldown(userid) {
    const lastAttack = this.state.attackCooldowns[userid];
    if (!lastAttack) return false;
    
    const timeSinceAttack = Date.now() - lastAttack;
    return timeSinceAttack < this.state.cooldownDuration;
  }
  
  getAvailableTargets() {
    return this.state.attackids.filter(id => !this.isOnCooldown(id));
  }
  
  getUnattackedTargets() {
    return this.state.attackids.filter(id => !this.state.attackedThisSession.has(id));
  }
  
  selectSmartTarget() {
    if (!this.state.config.smart || this.state.attackids.length === 0) {
      return null;
    }
    
    // IMPROVEMENT #1: Filter out targets on cooldown
    let candidateTargets = this.getAvailableTargets();
    
    if (candidateTargets.length === 0) {
      candidateTargets = this.state.attackids;
      this.state.addLog(this.state.wsNumber, `⏳ All targets on cooldown - picking anyway`);
    }
    
    // IMPROVEMENT #3: Prefer targets not attacked this session
    const unattackedCandidates = candidateTargets.filter(id => 
      !this.state.attackedThisSession.has(id)
    );
    
    if (unattackedCandidates.length > 0) {
      candidateTargets = unattackedCandidates;
      this.state.addLog(this.state.wsNumber, `🆕 ${unattackedCandidates.length} fresh target(s) available`);
    } else {
      this.state.attackedThisSession.clear();
      this.state.addLog(this.state.wsNumber, `🔄 All targets attacked - starting new round`);
    }
    
    // IMPROVEMENT #2: Round Robin or Random selection
    let selectedId;
    if (this.state.config.roundRobin) {
      this.state.targetIndex = this.state.targetIndex % candidateTargets.length;
      selectedId = candidateTargets[this.state.targetIndex];
      this.state.targetIndex++;
      this.state.addLog(this.state.wsNumber, `🔄 Round Robin: Target #${this.state.targetIndex}`);
    } else {
      const rand = Math.floor(Math.random() * candidateTargets.length);
      selectedId = candidateTargets[rand];
    }
    
    const targetIndex = this.state.attackids.indexOf(selectedId);
    const targetName = this.state.attacknames[targetIndex];
    
    return { id: selectedId, name: targetName };
  }
}

module.exports = SmartMode;

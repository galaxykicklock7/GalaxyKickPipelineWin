// OffSleep Feature - Auto-reconnect functionality

class OffSleep {
  constructor(gameState) {
    this.state = gameState;
  }

  execute(ws) {
    try {
      console.log(`[WS${this.state.wsNumber}] ⏰ OffSleep called - config.connected=${this.state.config.connected}, retryCount=${this.state.offSleepRetryCount}`);
      this.state.addLog(this.state.wsNumber, `⏰ OffSleep START (connected=${this.state.config.connected}, retry=${this.state.offSleepRetryCount})`);
      
      if (this.state.offSleepRetryCount >= this.state.maxOffSleepRetries) {
        console.log(`[WS${this.state.wsNumber}] ❌ Max OffSleep retries (${this.state.maxOffSleepRetries}) reached - stopping reconnection`);
        this.state.addLog(this.state.wsNumber, `❌ Max retries (${this.state.maxOffSleepRetries}) reached - stopping`);
        this.state.isOffSleepActive = false;
        this.state.offSleepRetryCount = 0;
        return;
      }
      
      this.state.isOffSleepActive = true;
      
      console.log(`[WS${this.state.wsNumber}] Waiting for clean close from QUIT command`);
      this.state.addLog(this.state.wsNumber, `⏳ Waiting for server to close connection`);
      
      const baseReconnectTime = parseInt(this.state.config.reconnect || 5000);
      const backoffMultiplier = Math.pow(1.5, this.state.offSleepRetryCount);
      const maxBackoff = 60000;
      const backoffTime = Math.min(baseReconnectTime * backoffMultiplier, maxBackoff);
      
      const jitterRange = backoffTime * 0.2;
      const jitter = (Math.random() * jitterRange * 2) - jitterRange;
      const reconnectTime = Math.max(100, Math.floor(backoffTime + jitter));
      
      console.log(`[WS${this.state.wsNumber}] Creating reconnect timeout (base=${baseReconnectTime}ms, backoff=${Math.floor(backoffTime)}ms, jitter=${Math.floor(jitter)}ms, final=${reconnectTime}ms)`);
      this.state.addLog(this.state.wsNumber, `⏱️ Reconnect in ${Math.floor(reconnectTime/1000)}s (retry ${this.state.offSleepRetryCount + 1}/${this.state.maxOffSleepRetries})`);
      
      this.state.offSleepRetryCount++;
      
      const timeoutId = setTimeout(() => {
        console.log(`[WS${this.state.wsNumber}] Reconnect timeout fired - checking connected=${this.state.config.connected}`);
        this.state.addLog(this.state.wsNumber, `⏰ Timeout fired! Checking connected=${this.state.config.connected}`);
        
        if (!this.state.config.connected && typeof this.state.config.connected !== 'undefined') {
          console.log(`[WS${this.state.wsNumber}] ❌ User disconnected - skipping auto-reconnect`);
          this.state.addLog(this.state.wsNumber, `❌ User disconnected - SKIPPING reconnect`);
          this.state.isOffSleepActive = false;
          this.state.offSleepRetryCount = 0;
          this.state.reconnectTimeoutId = null;
          return;
        }
        
        console.log(`[WS${this.state.wsNumber}] ✅ Proceeding with auto-reconnect`);
        this.state.addLog(this.state.wsNumber, `✅ Proceeding with RECONNECT!`);
        
        this.state.reconnectTimeoutId = null;
        this.state.isOffSleepActive = false;
        
        if (this.state.reconnect) {
          console.log(`[WS${this.state.wsNumber}] 🔄 Calling reconnect callback for WS${this.state.wsNumber}`);
          this.state.reconnect(this.state.wsNumber);
        } else {
          console.error(`[WS${this.state.wsNumber}] ❌ ERROR: reconnect callback is not defined!`);
          this.state.addLog(this.state.wsNumber, `❌ ERROR: Cannot reconnect - callback missing`);
        }
      }, reconnectTime);
      
      this.state.reconnectTimeoutId = timeoutId;
      console.log(`[WS${this.state.wsNumber}] Stored reconnectTimeoutId=${timeoutId}`);
      this.state.addLog(this.state.wsNumber, `💾 Stored timeoutId=${timeoutId}`);
      
    } catch (error) {
      console.error(`[WS${this.state.wsNumber}] Error in OffSleep:`, error);
      this.state.isOffSleepActive = false;
      this.state.reconnectTimeoutId = null;
    }
  }
}

module.exports = OffSleep;

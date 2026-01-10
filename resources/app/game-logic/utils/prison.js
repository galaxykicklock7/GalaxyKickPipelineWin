// Prison Escape Utilities

const https = require("https");
const crypto = require("crypto-js");

class PrisonEscape {
  constructor(gameState) {
    this.state = gameState;
  }

  async escapeWithCode(code, label = "Code") {
    try {
      const formData = `code=${code}&haaapsi=${this.state.haaapsi}`;
      
      const options = {
        hostname: 'www.bgalaxy.eu',
        port: 443,
        path: '/api/prison/free',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
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
      
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            const responsePreview = data ? data.substring(0, 200).replace(/\s+/g, ' ') : 'empty';
            console.log(`[WS${this.state.wsNumber}] ${label} escape response:`, responsePreview);
            
            if (!data || data.length === 0) {
              this.state.addLog(this.state.wsNumber, `⚠️ Empty response from escape API`);
              resolve(false);
            } else if (data.includes("Wrong escape type")) {
              this.state.addLog(this.state.wsNumber, `⚠️ Wrong escape type (no diamond or not in prison)`);
              resolve(false);
            } else if (data.includes("not in prison") || data.includes("not imprisoned")) {
              this.state.addLog(this.state.wsNumber, `ℹ️ Not in prison - no escape needed`);
              resolve(false);
            } else if (data.includes("error") || data.includes("Error") || data.includes('"success":false')) {
              console.log(`[WS${this.state.wsNumber}] ${label}: Escape failed - API error`);
              resolve(false);
            } else if (data.includes('"freeResult":{"success":true}') || data.includes('"success":true') || data.includes("escaped") || data.includes("free")) {
              console.log(`[WS${this.state.wsNumber}] ${label}: Escape successful!`);
              this.state.addLog(this.state.wsNumber, `✅ ${label} escape successful!`);
              resolve(true);
            } else {
              console.log(`[WS${this.state.wsNumber}] ${label}: Unknown response`);
              resolve(false);
            }
          });
          res.on('error', (error) => {
            this.state.addLog(this.state.wsNumber, `❌ Escape error: ${error.message}`);
            reject(error);
          });
        });
        
        req.on('error', (error) => {
          this.state.addLog(this.state.wsNumber, `❌ Escape request error: ${error.message}`);
          reject(error);
        });
        
        req.write(formData);
        req.end();
      });
    } catch (error) {
      console.error(`[WS${this.state.wsNumber}] Error in escapeWithCode:`, error);
      return false;
    }
  }

  async escape1() {
    const code = this.state.config.code1;
    if (!code) return false;
    return await this.escapeWithCode(code, "Code 1");
  }

  async escape2() {
    const code = this.state.config.code2;
    if (!code) return false;
    return await this.escapeWithCode(code, "Code 2");
  }

  async escape3() {
    const code = this.state.config.code3;
    if (!code) return false;
    return await this.escapeWithCode(code, "Code 3");
  }

  async escape4() {
    const code = this.state.config.code4;
    if (!code) return false;
    return await this.escapeWithCode(code, "Code 4");
  }

  async escape5() {
    const code = this.state.config.code5;
    if (!code) return false;
    return await this.escapeWithCode(code, "Code 5");
  }

  async escapeL1() {
    const code = this.state.config.codel1;
    if (!code) return false;
    return await this.escapeWithCode(code, "Code L1");
  }

  async escapeL2() {
    const code = this.state.config.codel2;
    if (!code) return false;
    return await this.escapeWithCode(code, "Code L2");
  }

  async escapeL3() {
    const code = this.state.config.codel3;
    if (!code) return false;
    return await this.escapeWithCode(code, "Code L3");
  }

  async escapeL4() {
    const code = this.state.config.codel4;
    if (!code) return false;
    return await this.escapeWithCode(code, "Code L4");
  }

  async escapeL5() {
    const code = this.state.config.codel5;
    if (!code) return false;
    return await this.escapeWithCode(code, "Code L5");
  }

  async escapeViaDiamond() {
    try {
      const formData = `haaapsi=${this.state.haaapsi}`;
      
      const options = {
        hostname: 'www.bgalaxy.eu',
        port: 443,
        path: '/api/prison/free',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
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
      
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            const responsePreview = data ? data.substring(0, 200).replace(/\s+/g, ' ') : 'empty';
            console.log(`[WS${this.state.wsNumber}] Diamond escape response:`, responsePreview);
            
            if (!data || data.length === 0) {
              this.state.addLog(this.state.wsNumber, `⚠️ Empty response from escape API`);
              resolve(false);
            } else if (data.includes("Wrong escape type")) {
              this.state.addLog(this.state.wsNumber, `⚠️ Wrong escape type (no diamond or not in prison)`);
              resolve(false);
            } else if (data.includes("not in prison") || data.includes("not imprisoned")) {
              this.state.addLog(this.state.wsNumber, `ℹ️ Not in prison - no escape needed`);
              resolve(false);
            } else if (data.includes("error") || data.includes("Error") || data.includes('"success":false')) {
              console.log(`[WS${this.state.wsNumber}] Diamond: Escape failed - API error`);
              resolve(false);
            } else if (data.includes('"freeResult":{"success":true}') || data.includes('"success":true') || data.includes("escaped") || data.includes("free")) {
              console.log(`[WS${this.state.wsNumber}] Diamond: Escape successful!`);
              this.state.addLog(this.state.wsNumber, `✅ Diamond escape successful!`);
              resolve(true);
            } else {
              console.log(`[WS${this.state.wsNumber}] Diamond: Unknown response`);
              resolve(false);
            }
          });
          res.on('error', (error) => {
            this.state.addLog(this.state.wsNumber, `❌ Escape error: ${error.message}`);
            reject(error);
          });
        });
        
        req.on('error', (error) => {
          this.state.addLog(this.state.wsNumber, `❌ Escape request error: ${error.message}`);
          reject(error);
        });
        
        req.write(formData);
        req.end();
      });
    } catch (error) {
      console.error(`[WS${this.state.wsNumber}] Error in escapeViaDiamond:`, error);
      return false;
    }
  }

  async escapeAll() {
    try {
      this.state.addLog(this.state.wsNumber, `🔓 Attempting prison escape...`);
      
      const escapeMethods = [
        () => this.escape1(),
        () => this.escape2(),
        () => this.escape3(),
        () => this.escape4(),
        () => this.escape5(),
        () => this.escapeL1(),
        () => this.escapeL2(),
        () => this.escapeL3(),
        () => this.escapeL4(),
        () => this.escapeL5(),
        () => this.escapeViaDiamond()
      ];
      
      for (const method of escapeMethods) {
        const success = await method();
        if (success) {
          this.state.addLog(this.state.wsNumber, `✅ Prison escape successful!`);
          return true;
        }
      }
      
      this.state.addLog(this.state.wsNumber, `❌ All escape attempts failed`);
      return false;
    } catch (error) {
      console.error(`[WS${this.state.wsNumber}] Error in escapeAll:`, error);
      return false;
    }
  }
}

module.exports = PrisonEscape;

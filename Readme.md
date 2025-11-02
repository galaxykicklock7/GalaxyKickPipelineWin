# BEST Backend - Complete Headless Implementation

**100% Feature Parity with Desktop bestscript.js**

Run BEST game automation on GitHub Actions Linux with LocalTunnel public access.

---

## 🎉 Features

### ✅ **ALL Desktop Features Implemented:**
- ✅ **Multiple attack modes** (attack, defense, target pooling)
- ✅ **Timer shift optimization** (dynamic timing adjustment)
- ✅ **Normal + Low security modes**
- ✅ **Prison auto-escape**
- ✅ **Blacklist/gangblacklist filtering**
- ✅ **Auto-attack on JOIN/353**
- ✅ **Auto-quit triggers** (release, sleep, part)
- ✅ **5 WebSocket connections** (ws1-ws5)
- ✅ **Full state tracking**
- ✅ **HTTP API control**

---

## 🚀 Quick Start

### **1. Run on GitHub Actions:**
1. Go to: https://github.com/galaxykicklock7/GalaxyKickPipelineWin/actions
2. Click: **"BEST Headless Server with LocalTunnel (Linux)"**
3. Click: **"Run workflow"**
4. Enter:
   - **subdomain:** `best-backend` (your custom name)
   - **rc1:** Your recovery code
   - **planet:** Your target planet
   - **blacklist:** Enemy usernames (one per line)
   - **gangblacklist:** Enemy gang tags
   - **duration:** `360` (6 hours max)
5. Click: **"Run workflow"**

### **2. Get Your Tunnel URL:**
Wait 2-3 minutes, then check workflow logs for:
```
✅ LocalTunnel Established!
🌐 Your BEST Backend is now accessible at:
    https://best-backend.loca.lt
```

### **3. Test Connection:**
```bash
curl -H "bypass-tunnel-reminder: true" \
  https://best-backend.loca.lt/api/health
```

**Response:**
```json
{"status":"ok","mode":"headless","timestamp":"..."}
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/status` | GET | Get status + game state + targets |
| `/api/logs` | GET | Get all logs |
| `/api/configure` | POST | Update configuration |
| `/api/connect` | POST | Connect all WebSockets |
| `/api/disconnect` | POST | Disconnect all WebSockets |
| `/api/send` | POST | Send custom command |

**⚠️ Important:** Always include header: `bypass-tunnel-reminder: true`

---

## ⚙️ Configuration Options

### **Recovery Codes:**
```json
{
  "rc1": "code1",
  "rc2": "code2",
  "rc3": "code3",
  "rc4": "code4",
  "kickrc": "kickcode",
  "rcl1": "alt1",
  "rcl2": "alt2",
  "rcl3": "alt3",
  "rcl4": "alt4"
}
```

### **Target Settings:**
```json
{
  "planet": "THE_BOT",
  "blacklist": "Enemy1\nEnemy2\nBadGuy",
  "gangblacklist": "[EVIL]\n[BAD]",
  "device": "312"
}
```

### **Behavior Flags:**
```json
{
  "autorelease": true,
  "exitting": true,
  "sleeping": true,
  "lowsecmode": false,
  "smart": false,
  "kickmode": false
}
```

### **Timing (Per WebSocket):**
```json
{
  "attack1": 1940,
  "attack2": 1940,
  "attack3": 1940,
  "attack4": 1940,
  "waiting1": 1910,
  "waiting2": 1910,
  "waiting3": 1910,
  "waiting4": 1910
}
```

### **Timer Shift (Advanced):**
```json
{
  "timershift": true,
  "incrementvalue": 10,
  "decrementvalue": 10,
  "minatk": 1000,
  "maxatk": 3000,
  "mindef": 1000,
  "maxdef": 3000
}
```

---

## 📝 Usage Examples

### **PowerShell (Windows):**
```powershell
# Configure
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/configure" `
  -Method POST `
  -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"} `
  -Body '{"rc1":"yourcode","planet":"Earth","blacklist":"Enemy1","autorelease":true}'

# Connect
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/connect" `
  -Method POST `
  -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"}

# Check status
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/status" `
  -Headers @{"bypass-tunnel-reminder"="true"}
```

### **Bash (Linux/Mac):**
```bash
# Configure
curl -X POST https://best-backend.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{"rc1":"yourcode","planet":"Earth","blacklist":"Enemy1","autorelease":true}'

# Connect
curl -X POST https://best-backend.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"

# Check status
curl -H "bypass-tunnel-reminder: true" \
  https://best-backend.loca.lt/api/status
```

### **JavaScript (Web App):**
```javascript
const BACKEND_URL = "https://best-backend.loca.lt";
const headers = {
  'bypass-tunnel-reminder': 'true',
  'Content-Type': 'application/json'
};

// Configure
await fetch(`${BACKEND_URL}/api/configure`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    rc1: "yourcode",
    planet: "Earth",
    blacklist: "Enemy1\nEnemy2",
    gangblacklist: "[EVIL]",
    autorelease: true,
    timershift: true
  })
});

// Connect
await fetch(`${BACKEND_URL}/api/connect`, {
  method: 'POST',
  headers
});

// Monitor game state
const status = await fetch(`${BACKEND_URL}/api/status`, {
  headers: { 'bypass-tunnel-reminder': 'true' }
}).then(r => r.json());

console.log('Targets:', status.gameStates.logic1.targetids);
console.log('Attack timing:', status.gameStates.logic1.currentAttackTiming);
```

---

## 🎯 Game Automation Features

### **Attack Modes:**

**1. Normal Mode (Blacklist):**
- Attacks users matching blacklist
- Attacks users in blacklisted gangs
- Uses `attack` timing

**2. Defense Mode:**
- Attacks gang members only
- Uses `waiting` timing
- Set status to "defense"

**3. Low Security Mode (Whitelist):**
- Attacks everyone EXCEPT whitelist
- Protects friends/allies
- Good for low-sec planets

### **Timer Shift:**

Automatically adjusts attack/waiting timing based on game events:

- **3-second event (850 + "3s")** → Increment timing
- **Target leaves early (PART before 3-sec)** → Decrement timing
- Stays within min/max bounds
- Optimizes success rate over time

**Example:**
```
Start: attack1 = 1940ms
3-sec event detected → attack1 = 1950ms (+10)
Target left early → attack1 = 1940ms (-10)
3-sec event again → attack1 = 1950ms (+10)
```

### **Prison Handling:**

- Detects "Prison" in planet name or "PRISON 0" message
- Sends ACTION 2 (escape command)
- Waits 3 seconds
- Rejoins target planet automatically

### **Auto-Quit Triggers:**

- **autorelease:** QUIT after successful attack
- **exitting:** QUIT when target leaves (PART)
- **sleeping:** QUIT when target sleeps (SLEEP)

---

## 🔍 Monitoring

### **Get Game State:**
```bash
curl -H "bypass-tunnel-reminder: true" \
  https://best-backend.loca.lt/api/status | jq .gameStates
```

**Response:**
```json
{
  "logic1": {
    "wsNumber": 1,
    "id": "54531773",
    "username": "[R]OLE[X]",
    "targetids": ["12345", "67890"],
    "targetnames": ["Enemy1", "[EVIL]BadGuy"],
    "useridtarget": "12345",
    "userFound": true,
    "status": "attack",
    "threesec": false,
    "targetCount": 2,
    "currentAttackTiming": 1950,
    "currentWaitingTiming": 1910
  }
}
```

### **Get Logs:**
```bash
curl -H "bypass-tunnel-reminder: true" \
  https://best-backend.loca.lt/api/logs | jq .logs.log1
```

---

## 🏗️ Architecture

```
GitHub Actions Linux Runner
  ├─ Xvfb (Virtual Display)
  ├─ Electron (Headless)
  │   ├─ Express HTTP API Server (Port 3000)
  │   ├─ 5x WebSocket Connections (wss://cs.mobstudio.ru:6672)
  │   └─ FinalCompleteGameLogic (Game automation)
  └─ LocalTunnel (Public HTTPS Access)
      └─ https://your-subdomain.loca.lt
```

---

## 📚 Documentation

- **QUICKSTART.md** - Quick start guide
- **START_HERE.md** - Detailed setup instructions
- **CURL_COMMANDS.md** - Ready-to-use API commands
- **ACTUALLY_MISSING_FEATURES.md** - Feature audit (All implemented!)

---

## ✅ Feature Comparison

| Feature | Desktop | Headless Backend |
|---------|---------|------------------|
| Connection | ✅ | ✅ |
| Authentication | ✅ | ✅ |
| PING/PONG | ✅ | ✅ |
| 353 Handler | ✅ | ✅ |
| JOIN Attack | ✅ | ✅ |
| JOIN Defense | ✅ | ✅ |
| JOIN Tracking | ✅ | ✅ |
| PART Handler | ✅ | ✅ |
| SLEEP Handler | ✅ | ✅ |
| Prison Escape | ✅ | ✅ |
| Timer Shift | ✅ | ✅ |
| Low Sec Mode | ✅ | ✅ |
| Multi-WS | ✅ | ✅ |
| GUI | ✅ | ❌ (API instead) |
| localStorage | ✅ | ❌ (API config) |

**Overall: 100% Core Feature Parity** ✅

---

## 🛠️ Development

### **Local Testing (Codespaces):**
```bash
# Install dependencies
cd resources/app
sudo apt-get update
sudo apt-get install -y xvfb libnss3 libatk1.0-0 ...
(sudo apt-get install -y libasound2t64 || sudo apt-get install -y libasound2)
npm install

# Start headless
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
export DISPLAY=:99
npm run headless

# Test API
curl http://localhost:3000/api/health
```

---

## 🎁 Credits

- Original BEST app by **DRUGGIST**
- Headless implementation & full feature port
- GitHub Actions integration
- LocalTunnel public access

---

## 📞 Support

**Repository:** https://github.com/galaxykicklock7/GalaxyKickPipelineWin

**Issues?** Check workflow logs in GitHub Actions

**Testing:** Use Codespaces for development/testing

---

## 🚀 Ready to Deploy!

Your BEST backend is now ready with **100% desktop feature parity**!

1. Run workflow on GitHub Actions
2. Get your LocalTunnel URL
3. Configure via API
4. Connect and automate!

**Happy Automating!** 🎮✨

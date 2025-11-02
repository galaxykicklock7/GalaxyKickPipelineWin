# Complete curl Commands for BEST Backend

## Your Working Backend URL
```
https://best-backend.loca.lt
```

## ⚠️ CRITICAL: Always Include This Header
```
bypass-tunnel-reminder: true
```

---

## For Windows PowerShell

### Health Check
```powershell
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/health" -Headers @{"bypass-tunnel-reminder"="true"}
```

### Get Status
```powershell
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/status" -Headers @{"bypass-tunnel-reminder"="true"}
```

### Get Logs
```powershell
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/logs" -Headers @{"bypass-tunnel-reminder"="true"}
```

### Configure (Simple)
```powershell
$config = '{"rc1":"onfoqk2ff1","planet":"THE_BOT","device":"312","autorelease":true}'

Invoke-RestMethod `
  -Uri "https://best-backend.loca.lt/api/configure" `
  -Method POST `
  -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"} `
  -Body $config
```

### Configure (All Options)
```powershell
$config = @{
    rc1 = "onfoqk2ff1"
    rc2 = "YourCode2"
    rc3 = "YourCode3"
    rc4 = "YourCode4"
    kickrc = "KickCode"
    rcl1 = "AltCode1"
    rcl2 = "AltCode2"
    rcl3 = "AltCode3"
    rcl4 = "AltCode4"
    planet = "THE_BOT"
    device = "312"
    autorelease = $true
    smart = $true
    lowsecmode = $false
    exitting = $true
    sleeping = $false
    kickmode = $true
    blacklist = "enemy1`nenemy2`nenemy3"
    gangblacklist = "clan1`nclan2"
    kblacklist = "kickuser1"
    kgangblacklist = "kickclan1"
    attack1 = 1940
    attack2 = 1940
    attack3 = 1940
    attack4 = 1940
    waiting1 = 1910
    waiting2 = 1910
    waiting3 = 1910
    waiting4 = 1910
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://best-backend.loca.lt/api/configure" `
  -Method POST `
  -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"} `
  -Body $config
```

### Connect
```powershell
Invoke-RestMethod `
  -Uri "https://best-backend.loca.lt/api/connect" `
  -Method POST `
  -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"}
```

### Disconnect
```powershell
Invoke-RestMethod `
  -Uri "https://best-backend.loca.lt/api/disconnect" `
  -Method POST `
  -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"}
```

### Send Custom Command
```powershell
$command = @{
    wsNumber = 1
    command = "JOIN"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://best-backend.loca.lt/api/send" `
  -Method POST `
  -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"} `
  -Body $command
```

---

## For Linux/Mac/Git Bash (Real curl)

### Health Check
```bash
curl -H "bypass-tunnel-reminder: true" \
  https://best-backend.loca.lt/api/health
```

### Get Status
```bash
curl -H "bypass-tunnel-reminder: true" \
  https://best-backend.loca.lt/api/status
```

### Get Logs
```bash
curl -H "bypass-tunnel-reminder: true" \
  https://best-backend.loca.lt/api/logs
```

### Configure
```bash
curl -X POST https://best-backend.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{
    "rc1": "onfoqk2ff1",
    "planet": "THE_BOT",
    "device": "312",
    "autorelease": true
  }'
```

### Configure (All Options)
```bash
curl -X POST https://best-backend.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{
    "rc1": "onfoqk2ff1",
    "rc2": "Code2",
    "rc3": "Code3",
    "rc4": "Code4",
    "kickrc": "KickCode",
    "rcl1": "AltCode1",
    "rcl2": "AltCode2",
    "rcl3": "AltCode3",
    "rcl4": "AltCode4",
    "planet": "THE_BOT",
    "device": "312",
    "autorelease": true,
    "smart": true,
    "lowsecmode": false,
    "exitting": true,
    "sleeping": false,
    "kickmode": true,
    "blacklist": "enemy1\nenemy2\nenemy3",
    "gangblacklist": "clan1\nclan2",
    "kblacklist": "kickuser1",
    "kgangblacklist": "kickclan1",
    "attack1": 1940,
    "attack2": 1940,
    "attack3": 1940,
    "attack4": 1940,
    "waiting1": 1910,
    "waiting2": 1910,
    "waiting3": 1910,
    "waiting4": 1910
  }'
```

### Connect
```bash
curl -X POST https://best-backend.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"
```

### Disconnect
```bash
curl -X POST https://best-backend.loca.lt/api/disconnect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"
```

---

## For Windows CMD (Command Prompt)

### Health Check
```cmd
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/health
```

### Configure (One Line)
```cmd
curl -X POST https://best-backend.loca.lt/api/configure -H "bypass-tunnel-reminder: true" -H "Content-Type: application/json" -d "{\"rc1\":\"onfoqk2ff1\",\"planet\":\"THE_BOT\",\"device\":\"312\",\"autorelease\":true}"
```

### Connect (One Line)
```cmd
curl -X POST https://best-backend.loca.lt/api/connect -H "bypass-tunnel-reminder: true" -H "Content-Type: application/json"
```

---

## JavaScript (Web App Integration)

```javascript
const BACKEND_URL = "https://best-backend.loca.lt";

// Helper function with bypass header
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'bypass-tunnel-reminder': 'true',
    ...options.headers
  };
  
  return fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers
  });
}

// Health check
const health = await apiRequest('/api/health').then(r => r.json());
console.log('Health:', health);

// Configure
const configResponse = await apiRequest('/api/configure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rc1: "onfoqk2ff1",
    planet: "THE_BOT",
    device: "312",
    autorelease: true
  })
}).then(r => r.json());

console.log('Config:', configResponse);

// Connect
const connectResponse = await apiRequest('/api/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json());

console.log('Connect:', connectResponse);

// Get status
const status = await apiRequest('/api/status').then(r => r.json());
console.log('Status:', status);

// Get logs
const logs = await apiRequest('/api/logs').then(r => r.json());
console.log('Logs:', logs);

// Disconnect
const disconnect = await apiRequest('/api/disconnect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json());

console.log('Disconnect:', disconnect);
```

---

## Python

```python
import requests

BACKEND_URL = "https://best-backend.loca.lt"

# Headers with bypass
headers = {
    "bypass-tunnel-reminder": "true",
    "Content-Type": "application/json"
}

# Health check
response = requests.get(f"{BACKEND_URL}/api/health", headers={"bypass-tunnel-reminder": "true"})
print("Health:", response.json())

# Configure
config = {
    "rc1": "onfoqk2ff1",
    "planet": "THE_BOT",
    "device": "312",
    "autorelease": True
}
response = requests.post(f"{BACKEND_URL}/api/configure", json=config, headers=headers)
print("Config:", response.json())

# Connect
response = requests.post(f"{BACKEND_URL}/api/connect", headers=headers)
print("Connect:", response.json())

# Get status
response = requests.get(f"{BACKEND_URL}/api/status", headers={"bypass-tunnel-reminder": "true"})
print("Status:", response.json())
```

---

## Quick Copy-Paste Commands

### PowerShell (Windows) - Copy & Run:

```powershell
# Configure
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/configure" -Method POST -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"} -Body '{"rc1":"onfoqk2ff1","planet":"THE_BOT","device":"312","autorelease":true}'

# Connect
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/connect" -Method POST -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"}

# Status
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/status" -Headers @{"bypass-tunnel-reminder"="true"}

# Logs
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/logs" -Headers @{"bypass-tunnel-reminder"="true"}

# Disconnect
Invoke-RestMethod -Uri "https://best-backend.loca.lt/api/disconnect" -Method POST -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"}
```

### Git Bash / WSL / Linux - Copy & Run:

```bash
# Configure
curl -X POST https://best-backend.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{"rc1":"onfoqk2ff1","planet":"THE_BOT","device":"312","autorelease":true}'

# Connect
curl -X POST https://best-backend.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"

# Status
curl -H "bypass-tunnel-reminder: true" \
  https://best-backend.loca.lt/api/status

# Logs
curl -H "bypass-tunnel-reminder: true" \
  https://best-backend.loca.lt/api/logs

# Disconnect
curl -X POST https://best-backend.loca.lt/api/disconnect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"
```

---

## ✅ Your Configuration Was Successfully Applied!

```json
{
  "success": true,
  "message": "Configuration updated",
  "config": {
    "rc1": "onfoqk2ff1",
    "planet": "THE_BOT",
    "device": "312",
    "autorelease": true,
    ...
  }
}
```

**Now you can connect or disconnect as needed!** 🎉

Use the PowerShell commands above since you're on Windows.

# LocalTunnel Usage Guide

## ⚠️ CRITICAL REQUIREMENT

**ALL requests to LocalTunnel MUST include this header:**

```
bypass-tunnel-reminder: true
```

Without this header, you'll get a warning page or 403/503 errors.

---

## Quick Test Commands

### PowerShell

```powershell
# Health check
Invoke-RestMethod `
  -Uri "https://best-backend.loca.lt/api/health" `
  -Headers @{"bypass-tunnel-reminder"="true"}

# Configure
$config = @{
    rc1 = "YourCode1"
    planet = "YourPlanet"
    device = "312"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://best-backend.loca.lt/api/configure" `
  -Method POST `
  -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"} `
  -Body $config

# Connect
Invoke-RestMethod `
  -Uri "https://best-backend.loca.lt/api/connect" `
  -Method POST `
  -Headers @{"bypass-tunnel-reminder"="true"; "Content-Type"="application/json"}

# Get status
Invoke-RestMethod `
  -Uri "https://best-backend.loca.lt/api/status" `
  -Headers @{"bypass-tunnel-reminder"="true"}
```

### curl (Windows)

```bash
# Health check
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/health

# Configure
curl -X POST https://best-backend.loca.lt/api/configure ^
  -H "bypass-tunnel-reminder: true" ^
  -H "Content-Type: application/json" ^
  -d "{\"rc1\":\"Code123\",\"planet\":\"Earth\",\"device\":\"312\"}"

# Connect
curl -X POST https://best-backend.loca.lt/api/connect ^
  -H "bypass-tunnel-reminder: true" ^
  -H "Content-Type: application/json"

# Get status
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/status
```

### curl (Linux/Mac)

```bash
# Health check
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/health

# Configure
curl -X POST https://best-backend.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{"rc1":"Code123","planet":"Earth","device":"312"}'

# Connect
curl -X POST https://best-backend.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"

# Get status
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/status
```

---

## Web Application Integration

### JavaScript/Fetch

```javascript
const TUNNEL_URL = "https://best-backend.loca.lt";

// ALWAYS include this header
const headers = {
  'bypass-tunnel-reminder': 'true',
  'Content-Type': 'application/json'
};

// Health check
fetch(`${TUNNEL_URL}/api/health`, {
  headers: { 'bypass-tunnel-reminder': 'true' }
})
  .then(r => r.json())
  .then(data => console.log('Health:', data));

// Configure
fetch(`${TUNNEL_URL}/api/configure`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    rc1: "Code123",
    rc2: "Code456",
    planet: "Earth",
    device: "312",
    autorelease: true
  })
})
  .then(r => r.json())
  .then(data => console.log('Config:', data));

// Connect
fetch(`${TUNNEL_URL}/api/connect`, {
  method: 'POST',
  headers: headers
})
  .then(r => r.json())
  .then(data => console.log('Connect:', data));

// Get status
fetch(`${TUNNEL_URL}/api/status`, {
  headers: { 'bypass-tunnel-reminder': 'true' }
})
  .then(r => r.json())
  .then(data => console.log('Status:', data));
```

### Axios

```javascript
import axios from 'axios';

const TUNNEL_URL = "https://best-backend.loca.lt";

// Create axios instance with default header
const api = axios.create({
  baseURL: TUNNEL_URL,
  headers: {
    'bypass-tunnel-reminder': 'true'
  }
});

// Health check
api.get('/api/health')
  .then(res => console.log('Health:', res.data));

// Configure
api.post('/api/configure', {
  rc1: "Code123",
  planet: "Earth",
  device: "312"
})
  .then(res => console.log('Config:', res.data));

// Connect
api.post('/api/connect')
  .then(res => console.log('Connect:', res.data));

// Get status
api.get('/api/status')
  .then(res => console.log('Status:', res.data));
```

### React Component

```javascript
import React, { useState, useEffect } from 'react';

function BESTController() {
  const TUNNEL_URL = "https://best-backend.loca.lt";
  
  // CRITICAL: Always include this header
  const headers = {
    'bypass-tunnel-reminder': 'true',
    'Content-Type': 'application/json'
  };

  const [status, setStatus] = useState(null);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${TUNNEL_URL}/api/health`, {
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
      const data = await res.json();
      console.log('Health:', data);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const configure = async (config) => {
    const res = await fetch(`${TUNNEL_URL}/api/configure`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(config)
    });
    return res.json();
  };

  const connect = async () => {
    const res = await fetch(`${TUNNEL_URL}/api/connect`, {
      method: 'POST',
      headers: headers
    });
    return res.json();
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div>
      <h1>BEST Controller</h1>
      {/* Your UI here */}
    </div>
  );
}
```

### Python

```python
import requests

TUNNEL_URL = "https://best-backend.loca.lt"

# CRITICAL: Always include this header
headers = {
    "bypass-tunnel-reminder": "true",
    "Content-Type": "application/json"
}

# Health check
response = requests.get(
    f"{TUNNEL_URL}/api/health",
    headers={"bypass-tunnel-reminder": "true"}
)
print("Health:", response.json())

# Configure
config = {
    "rc1": "Code123",
    "planet": "Earth",
    "device": "312",
    "autorelease": True
}
response = requests.post(
    f"{TUNNEL_URL}/api/configure",
    json=config,
    headers=headers
)
print("Config:", response.json())

# Connect
response = requests.post(
    f"{TUNNEL_URL}/api/connect",
    headers=headers
)
print("Connect:", response.json())

# Get status
response = requests.get(
    f"{TUNNEL_URL}/api/status",
    headers={"bypass-tunnel-reminder": "true"}
)
print("Status:", response.json())
```

---

## Test Script

Use the provided PowerShell test script:

```powershell
.\test-localtunnel.ps1 -TunnelUrl "https://best-backend.loca.lt"
```

This will:
- ✅ Test health endpoint with proper header
- ✅ Test status endpoint
- ✅ Test logs endpoint
- ✅ Show detailed error messages if anything fails

---

## Common Errors

### Error: 503 - Tunnel Unavailable

**Cause:** Backend is not running or tunnel disconnected

**Solution:**
1. Check workflow is running: https://github.com/galaxykicklock7/GalaxyKickPipelineWin/actions
2. Verify "Start BEST in Headless Mode" step is green
3. Verify "Start LocalTunnel" step is green
4. Check "Keep Running" step shows status checks

### Error: Missing bypass-tunnel-reminder header

**Cause:** Request doesn't include the required header

**Solution:** Add header to ALL requests:
```javascript
headers: {
  'bypass-tunnel-reminder': 'true'
}
```

### Error: Connection timeout

**Cause:** Tunnel URL is wrong or backend crashed

**Solution:**
1. Verify exact tunnel URL from workflow logs
2. Check backend is still running (status checks in logs)
3. Try testing localhost first to isolate issue

---

## Summary

✅ **ALWAYS include:** `bypass-tunnel-reminder: true` header
✅ **Use test script:** `.\test-localtunnel.ps1`
✅ **Check workflow logs** if tests fail
✅ **Set default headers** in your API client to avoid forgetting

---

## Quick Reference

```javascript
// Correct - Will work
fetch(url, { headers: { 'bypass-tunnel-reminder': 'true' } })

// Wrong - Will fail
fetch(url)  // Missing header!
```

**Never forget the header!** ⚠️

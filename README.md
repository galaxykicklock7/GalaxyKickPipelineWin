# BEST Backend - GitHub Actions Deployment

This is the backend version of BEST that runs on GitHub Actions with API access via Cloudflare Tunnel.

## 🚀 Quick Start

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - BEST backend"
git remote add origin https://github.com/YOUR_USERNAME/best-backend.git
git branch -M main
git push -u origin main
```

### 2. Run GitHub Actions

1. Go to your repository on GitHub
2. Click on **Actions** tab
3. Click on **"BEST Headless Server with Cloudflare Tunnel"**
4. Click **"Run workflow"**
5. **Leave all inputs EMPTY** (configure via API later)
6. Set **duration**: 360 (6 hours)
7. Click **"Run workflow"**

### 3. Get Tunnel URL

1. Wait 30-60 seconds for workflow to start
2. Click on the running workflow
3. Click on **"Start Cloudflare Tunnel"** step
4. Look for the URL in logs: `https://xxxxx-xxx-xxx.trycloudflare.com`
5. **Copy this URL** - this is your backend API!

### 4. Use the API

**Test Health:**
```bash
curl https://xxxxx.trycloudflare.com/api/health
```

**Configure:**
```bash
curl -X POST https://xxxxx.trycloudflare.com/api/configure \
  -H "Content-Type: application/json" \
  -d '{
    "rc1": "YourCode1",
    "rc2": "YourCode2",
    "planet": "YourPlanet",
    "device": "312",
    "autorelease": true
  }'
```

**Connect:**
```bash
curl -X POST https://xxxxx.trycloudflare.com/api/connect \
  -H "Content-Type: application/json"
```

**Check Status:**
```bash
curl https://xxxxx.trycloudflare.com/api/status
```

**Get Logs:**
```bash
curl https://xxxxx.trycloudflare.com/api/logs
```

**Disconnect:**
```bash
curl -X POST https://xxxxx.trycloudflare.com/api/disconnect \
  -H "Content-Type: application/json"
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/status` | Get connection status and config |
| GET | `/api/logs` | Get all WebSocket logs |
| POST | `/api/configure` | Update configuration |
| POST | `/api/connect` | Connect to game servers |
| POST | `/api/disconnect` | Disconnect all connections |
| POST | `/api/send` | Send custom command to WebSocket |

## 🔧 Configuration Options

All GUI settings are available via API:

```json
{
  "rc1": "RecoveryCode1",
  "rc2": "RecoveryCode2",
  "rc3": "RecoveryCode3",
  "rc4": "RecoveryCode4",
  "kickrc": "KickCode",
  "rcl1": "AltCode1",
  "rcl2": "AltCode2",
  "rcl3": "AltCode3",
  "rcl4": "AltCode4",
  "planet": "PlanetName",
  "device": "312",
  "autorelease": true,
  "smart": true,
  "lowsecmode": false,
  "exitting": true,
  "sleeping": false,
  "kickmode": true,
  "blacklist": "enemy1\nenemy2\nenemy3",
  "gangblacklist": "clan1\nclan2\nclan3",
  "kblacklist": "kickuser1\nkickuser2",
  "kgangblacklist": "kickclan1\nkickclan2",
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

### Device Types
- `"312"` - Android
- `"323"` - iOS
- `"352"` - Web

## 🌐 Use in Web Application

### JavaScript Example

```javascript
const TUNNEL_URL = "https://xxxxx.trycloudflare.com";

// Configure BEST
async function configure() {
  const response = await fetch(`${TUNNEL_URL}/api/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rc1: "YourCode1",
      rc2: "YourCode2",
      planet: "YourPlanet",
      device: "312",
      autorelease: true
    })
  });
  return response.json();
}

// Connect to game
async function connect() {
  const response = await fetch(`${TUNNEL_URL}/api/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
}

// Check status
async function getStatus() {
  const response = await fetch(`${TUNNEL_URL}/api/status`);
  return response.json();
}

// Use it
configure()
  .then(() => connect())
  .then(() => getStatus())
  .then(status => console.log('Connected:', status.connected));
```

### Python Example

```python
import requests

TUNNEL_URL = "https://xxxxx.trycloudflare.com"

# Configure
config = {
    "rc1": "YourCode1",
    "rc2": "YourCode2",
    "planet": "YourPlanet",
    "device": "312",
    "autorelease": True
}
requests.post(f"{TUNNEL_URL}/api/configure", json=config)

# Connect
requests.post(f"{TUNNEL_URL}/api/connect")

# Check status
status = requests.get(f"{TUNNEL_URL}/api/status").json()
print(f"Connected: {status['connected']}")
```

## 📁 Project Structure

```
github_backend/
├── .github/
│   └── workflows/
│       └── run-best-headless.yml    # GitHub Actions workflow
├── resources/
│   └── app/
│       ├── main.js                  # Modified with Express API
│       ├── package.json             # With express dependencies
│       ├── any.html                 # Original GUI (unused)
│       ├── bestscript.js            # Game logic
│       ├── axios.js                 # HTTP client
│       └── require.js               # Module loader
├── .gitignore                       # Git ignore rules
└── README.md                        # This file
```

## ⚙️ How It Works

1. **GitHub Actions** starts the workflow
2. **Node.js** and dependencies are installed
3. **Electron** starts in headless mode (no GUI)
4. **Express API** server starts on port 3000
5. **Cloudflared** creates tunnel to expose API
6. **Your app** sends JSON to tunnel URL
7. **BEST** connects to game via WebSocket
8. **Status/logs** returned via API

## 🔒 Security Notes

⚠️ **Important:**
- Tunnel URL changes every workflow run
- Anyone with URL can control your instance
- Don't share tunnel URL publicly
- Consider adding API key authentication if needed
- Maximum runtime: 6 hours (GitHub Actions limit)

## 🐛 Troubleshooting

### Workflow doesn't start
- Check if Actions are enabled in repository settings
- Verify workflow file is in `.github/workflows/`

### Can't find tunnel URL
- Wait 30-60 seconds after workflow starts
- Check "Start Cloudflare Tunnel" step in workflow logs
- Look for `https://xxxxx.trycloudflare.com` pattern

### Connection fails
- Verify recovery codes are correct
- Check device type (312, 323, or 352)
- Review logs: `curl TUNNEL_URL/api/logs`

### API returns errors
- Ensure JSON is valid
- Check `Content-Type: application/json` header
- Verify tunnel URL is correct

## 📞 Support

For issues or questions:
1. Check workflow logs in GitHub Actions
2. Test endpoints with curl
3. Verify JSON configuration syntax

## 📄 License

MIT License - Same as BEST

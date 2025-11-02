# Quick Start Guide

## Step 1: Push to GitHub (2 minutes)

```bash
cd github_backend
git init
git add .
git commit -m "Initial commit - BEST backend"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 2: Run Workflow (30 seconds)

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
2. Click: **"BEST Headless Server with Cloudflare Tunnel"**
3. Click: **"Run workflow"** button
4. Leave all inputs empty
5. Set duration: `360` (6 hours)
6. Click: **"Run workflow"**

## Step 3: Get Tunnel URL (30 seconds)

1. Wait 30-60 seconds
2. Click on the running workflow (green dot)
3. Click on job: **"run-best-headless"**
4. Expand step: **"Start Cloudflare Tunnel"**
5. Find URL in logs: `https://xxxxx-xxx-xxx.trycloudflare.com`
6. **Copy this URL!**

## Step 4: Test with curl (1 minute)

Replace `YOUR_TUNNEL_URL` with the URL you copied:

```bash
# Test connection
curl https://YOUR_TUNNEL_URL/api/health

# Configure BEST
curl -X POST https://YOUR_TUNNEL_URL/api/configure \
  -H "Content-Type: application/json" \
  -d '{
    "rc1": "YourCode1",
    "rc2": "YourCode2",
    "planet": "YourPlanet",
    "device": "312"
  }'

# Connect to game
curl -X POST https://YOUR_TUNNEL_URL/api/connect \
  -H "Content-Type: application/json"

# Check status
curl https://YOUR_TUNNEL_URL/api/status

# View logs
curl https://YOUR_TUNNEL_URL/api/logs
```

## Step 5: Use in Your Web App

```html
<!DOCTYPE html>
<html>
<body>
    <input type="text" id="tunnelUrl" placeholder="Tunnel URL">
    <input type="text" id="rc1" placeholder="Code 1">
    <input type="text" id="planet" placeholder="Planet">
    <button onclick="connect()">Connect</button>
    <pre id="output"></pre>

    <script>
        async function connect() {
            const url = document.getElementById('tunnelUrl').value;
            const config = {
                rc1: document.getElementById('rc1').value,
                planet: document.getElementById('planet').value,
                device: "312"
            };
            
            // Configure
            await fetch(`${url}/api/configure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            // Connect
            const res = await fetch(`${url}/api/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await res.json();
            document.getElementById('output').textContent = JSON.stringify(data, null, 2);
        }
    </script>
</body>
</html>
```

## Done! 🎉

Your BEST backend is now running on GitHub Actions and accessible via the tunnel URL!

## Troubleshooting

**Workflow doesn't appear:**
- Make sure you pushed the `.github/workflows/` folder
- Check Actions are enabled in repository settings

**Can't find tunnel URL:**
- Wait a full minute after clicking "Run workflow"
- Refresh the workflow page
- Look in "Start Cloudflare Tunnel" step logs

**API returns 404:**
- Double-check the tunnel URL
- Make sure workflow is still running
- URL changes each time you run the workflow

**Connection fails:**
- Verify your recovery codes are correct
- Try with just one code first (rc1)
- Check device type is "312", "323", or "352"

## Next Steps

- Add API key authentication for security
- Create a proper frontend application
- Monitor logs regularly
- Set up automatic reconnection logic

# Semaphore CI/CD Setup for BEST Backend

This directory contains the Semaphore CI/CD configuration for deploying the BEST Headless Server with LocalTunnel.

## 📁 File Structure

- **`semaphore.yml`** - Main pipeline (trigger point)
- **`deploy.yml`** - Deployment pipeline (accepts parameters)

## 🚀 Quick Setup

### 1. Connect Your Repository to Semaphore

1. Go to [Semaphore CI](https://semaphoreci.com/)
2. Sign up or log in
3. Click "Add Project"
4. Select your repository
5. Semaphore will automatically detect the `.semaphore/semaphore.yml` file

### 2. Trigger Deployment from Frontend

Use Semaphore API to trigger with parameters:

```javascript
// Frontend code example
async function startDeployment(subdomain, duration = 60) {
  const response = await fetch('https://YOUR-ORG.semaphoreci.com/api/v1alpha/promotions', {
    method: 'POST',
    headers: {
      'Authorization': 'Token YOUR_SEMAPHORE_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Deploy Backend',
      pipeline_id: 'PIPELINE_ID_FROM_INITIAL_RUN',
      parameters: {
        env_vars: [
          { name: 'TUNNEL_SUBDOMAIN', value: subdomain },
          { name: 'DURATION', value: duration.toString() }
        ]
      }
    })
  });
  
  return response.json();
}

// Usage
startDeployment('user-custom-subdomain-123', 45);
```

### 3. Manual Trigger (via Semaphore UI)

1. Go to your project in Semaphore
2. Click "Run Workflow"
3. Wait for the "Initialize" block to complete
4. Click "Promote" → "Deploy Backend"
5. Enter parameters:
   - **TUNNEL_SUBDOMAIN**: Your custom subdomain (e.g., "user-123")
   - **DURATION**: Run duration in minutes (default: 60)
6. Click "Start Promotion"

### 4. Configure via curl

Once deployed, configure the bot:

```bash
# Replace YOUR-SUBDOMAIN with the subdomain you used
curl -X POST https://YOUR-SUBDOMAIN.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{
    "rc1": "YOUR_RC1",
    "rc2": "YOUR_RC2",
    "planet": "YOUR_PLANET",
    "device": "312"
  }'

# Connect to game
curl -X POST https://YOUR-SUBDOMAIN.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true"

# Check status
curl -H "bypass-tunnel-reminder: true" https://YOUR-SUBDOMAIN.loca.lt/api/status
```

## 📋 Configuration Options

### Parameterized Promotion

The deployment accepts these parameters via Semaphore promotions:

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `TUNNEL_SUBDOMAIN` | Custom subdomain for LocalTunnel | Yes | "best-backend" |
| `DURATION` | Run duration in minutes (max 60) | No | 60 |

### How Parameters Work

1. **Initial Pipeline** (`semaphore.yml`):
   - Runs automatically on push
   - Waits for promotion with parameters

2. **Deployment Pipeline** (`deploy.yml`):
   - Triggered via promotion
   - Receives `TUNNEL_SUBDOMAIN` and `DURATION` as parameters
   - Uses these values during deployment

## 🔧 Configuration via API

All bot configuration is done via curl commands after the pipeline starts.

**Important:** Replace `YOUR-SUBDOMAIN` with the subdomain you set in Semaphore secrets.

### Configure Bot Settings

```bash
curl -X POST https://YOUR-SUBDOMAIN.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{
    "rc1": "YOUR_RECOVERY_CODE_1",
    "rc2": "YOUR_RECOVERY_CODE_2",
    "rc3": "YOUR_RECOVERY_CODE_3",
    "rc4": "YOUR_RECOVERY_CODE_4",
    "kickrc": "YOUR_KICK_CODE",
    "planet": "YOUR_PLANET_NAME",
    "device": "312"
  }'
```

### Connect to Game Server

```bash
curl -X POST https://YOUR-SUBDOMAIN.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"
```

### Check Connection Status

```bash
curl -H "bypass-tunnel-reminder: true" https://YOUR-SUBDOMAIN.loca.lt/api/status
```

### Disconnect from Game

```bash
curl -X POST https://YOUR-SUBDOMAIN.loca.lt/api/disconnect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"
```

### View Logs

```bash
curl -H "bypass-tunnel-reminder: true" https://YOUR-SUBDOMAIN.loca.lt/api/logs
```

### Machine Type

The pipeline uses `e1-standard-2` machine type (2 vCPUs, 4GB RAM). You can change this in the `semaphore.yml` file:

```yaml
agent:
  machine:
    type: e1-standard-2  # Change to e1-standard-4 for more resources
    os_image: ubuntu2004
```

Available machine types:
- `e1-standard-2` (2 vCPUs, 4GB RAM) - Default
- `e1-standard-4` (4 vCPUs, 8GB RAM)
- `e1-standard-8` (8 vCPUs, 16GB RAM)

## 🔧 Customization

### Change Subdomain or Duration

Pass different parameters when triggering the promotion:

**Via Semaphore UI:**
1. Go to the pipeline run
2. Click "Promote" → "Deploy Backend"
3. Enter your custom values
4. Click "Start Promotion"

**Via API:**
```javascript
// Pass custom parameters
fetch('https://YOUR-ORG.semaphoreci.com/api/v1alpha/promotions', {
  method: 'POST',
  headers: {
    'Authorization': 'Token YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Deploy Backend',
    pipeline_id: 'PIPELINE_ID',
    parameters: {
      env_vars: [
        { name: 'TUNNEL_SUBDOMAIN', value: 'my-custom-subdomain' },
        { name: 'DURATION', value: '45' }
      ]
    }
  })
});
```

### Change Node.js Version

Edit the `NODE_VERSION` environment variable in `semaphore.yml`:

```yaml
env_vars:
  - name: NODE_VERSION
    value: "20"  # Change to "18" or "22" if needed
```

## 📊 Pipeline Stages

### Initial Pipeline (semaphore.yml)
1. **Initialize** - Quick setup, waits for promotion

### Deployment Pipeline (deploy.yml)
1. **Checkout** - Clone the repository
2. **Setup Node.js** - Install Node.js 20
3. **Cache Restore** - Restore cached node_modules
4. **Install System Dependencies** - Install Electron dependencies
5. **Install App Dependencies** - Run `npm install`
6. **Cache Store** - Cache node_modules for future runs
7. **Install LocalTunnel** - Install localtunnel globally
8. **Start BEST Server** - Start the headless server
9. **Start LocalTunnel** - Expose the server via LocalTunnel (using provided subdomain)
10. **Display API Info** - Show API endpoints and tunnel URL
11. **Keep Running** - Monitor and keep the server running (for provided duration)
12. **Cleanup** - Graceful shutdown

## 🔍 Monitoring

### View Logs

1. Go to your project in Semaphore
2. Click on the running workflow
3. Click on the "Deploy for subdomain" job
4. View real-time logs

### Check Server Status

Test your backend with (replace YOUR-SUBDOMAIN):

```bash
curl -H "bypass-tunnel-reminder: true" https://YOUR-SUBDOMAIN.loca.lt/api/health
```

## 🐛 Troubleshooting

### Pipeline Fails to Start

- Check that parameters are provided when promoting
- Verify the subdomain is unique and valid (alphanumeric and hyphens only)
- Check the logs in Semaphore UI

### Server Not Responding

- Check the logs in Semaphore UI
- Verify system dependencies are installed correctly
- Increase the wait time in the verification loop

### Tunnel Not Establishing

- LocalTunnel may be rate-limited or the subdomain may be taken
- Try a different subdomain by passing a new parameter
- Check localtunnel.log in the pipeline output

### Cache Issues

If you encounter dependency issues, clear the cache:

1. Go to Settings → Cache
2. Click "Clear Cache"
3. Re-run the pipeline

## 📚 API Endpoints

Your backend will be available at:

```
https://YOUR-SUBDOMAIN.loca.lt
```

(Replace `YOUR-SUBDOMAIN` with the value you set in `TUNNEL_SUBDOMAIN`)

Available endpoints:
- `GET /api/health` - Health check
- `GET /api/status` - Connection status
- `GET /api/logs` - Server logs
- `POST /api/configure` - Configure the bot
- `POST /api/connect` - Connect to game server
- `POST /api/disconnect` - Disconnect from game server
- `POST /api/send` - Send custom messages

### Example Usage

```bash
# Replace YOUR-SUBDOMAIN with your actual subdomain
SUBDOMAIN="your-subdomain-here"

# Health check
curl -H "bypass-tunnel-reminder: true" https://$SUBDOMAIN.loca.lt/api/health

# Configure
curl -X POST https://$SUBDOMAIN.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{"rc1":"CODE1","rc2":"CODE2","planet":"Earth","device":"312"}'

# Connect
curl -X POST https://$SUBDOMAIN.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true"

# Check status
curl -H "bypass-tunnel-reminder: true" https://$SUBDOMAIN.loca.lt/api/status
```

## 💡 Tips

1. **Dynamic Subdomains**: Pass unique subdomain per user from your frontend
2. **Parameterized Deployments**: Each promotion can have different parameters
3. **Monitoring**: Check the pipeline logs to see connection status updates
4. **Duration Control**: Set custom duration per deployment (max 60 minutes)
5. **Bypass Header**: Always include `-H "bypass-tunnel-reminder: true"` in your curl commands
6. **Frontend Integration**: Use Semaphore API to trigger promotions with parameters from your UI

## 🆚 Differences from GitHub Actions

| Feature | GitHub Actions | Semaphore CI |
|---------|---------------|--------------|
| Configuration | `.github/workflows/*.yml` | `.semaphore/semaphore.yml` + `deploy.yml` |
| Parameters | `workflow_dispatch` inputs | Parameterized promotions |
| Subdomain | Workflow input parameter | Promotion parameter |
| Duration | Workflow input parameter | Promotion parameter |
| Trigger Method | Manual dispatch or API | Initial run + promotion |
| Input Method | Direct inputs + curl | Promotion parameters + curl |
| Caching | `actions/cache@v4` | `cache restore/store` commands |
| Node Setup | `actions/setup-node@v4` | `sem-version node` command |

## 📞 Support

For issues with:
- **Semaphore CI**: Check [Semaphore Docs](https://docs.semaphoreci.com/)
- **LocalTunnel**: Check [LocalTunnel Docs](https://theboroer.github.io/localtunnel-www/)
- **BEST Backend**: Check your project documentation

## 🎉 Success!

Once the pipeline runs successfully, you'll see output like:

```
========================================
LocalTunnel Established
========================================

Your BEST Backend is accessible at https://YOUR-SUBDOMAIN.loca.lt

========================================
```

Now configure it with curl (replace YOUR-SUBDOMAIN):

```bash
curl -X POST https://YOUR-SUBDOMAIN.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{"rc1":"YOUR_CODE","planet":"Earth","device":"312"}'
```

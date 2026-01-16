# Semaphore CI/CD Setup for BEST Backend

This directory contains the Semaphore CI/CD configuration for deploying the BEST Headless Server with LocalTunnel.

## 🚀 Quick Setup

### 1. Connect Your Repository to Semaphore

1. Go to [Semaphore CI](https://semaphoreci.com/)
2. Sign up or log in
3. Click "Add Project"
4. Select your repository
5. Semaphore will automatically detect the `.semaphore/semaphore.yml` file

### 2. Run the Pipeline

**Manual Trigger:**
1. Go to your project in Semaphore
2. Click "Run Workflow"
3. Select the branch you want to deploy
4. Click "Start"

**Automatic Trigger:**
- The pipeline will automatically run on every push to your repository
- You can configure branch filters in the Semaphore UI

### 3. Configure via curl

Once the pipeline is running and the tunnel URL is displayed, use curl commands to configure:

```bash
# Configure the bot
curl -X POST https://best-backend.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{
    "rc1": "YOUR_RC1",
    "rc2": "YOUR_RC2",
    "rc3": "YOUR_RC3",
    "rc4": "YOUR_RC4",
    "kickrc": "YOUR_KICKRC",
    "planet": "YOUR_PLANET",
    "device": "312"
  }'

# Connect to game server
curl -X POST https://best-backend.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"

# Check status
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/status
```

## 📋 Default Configuration

The pipeline uses these default values:

| Variable | Value | Description |
|----------|-------|-------------|
| `TUNNEL_SUBDOMAIN` | "best-backend" | Fixed subdomain for LocalTunnel |
| `DURATION` | 60 | Run duration in minutes (1 hour) |
| `NODE_VERSION` | "20" | Node.js version |
| `API_PORT` | "3000" | API server port |
| `DEVICE` | "312" | Default device type (Android) |

**Your backend will always be available at:**
```
https://best-backend.loca.lt
```

## 🔧 Configuration via API

All bot configuration is done via curl commands after the pipeline starts:

### Configure Bot Settings

```bash
curl -X POST https://best-backend.loca.lt/api/configure \
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
curl -X POST https://best-backend.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"
```

### Check Connection Status

```bash
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/status
```

### Disconnect from Game

```bash
curl -X POST https://best-backend.loca.lt/api/disconnect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"
```

### View Logs

```bash
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/logs
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

### Change Subdomain

Edit the `TUNNEL_SUBDOMAIN` value in `semaphore.yml`:

```yaml
env_vars:
  - name: TUNNEL_SUBDOMAIN
    value: "best-backend"  # Change to your preferred subdomain
```

### Change Run Duration

Edit the `DURATION` value in `semaphore.yml`:

```yaml
env_vars:
  - name: DURATION
    value: "60"  # Change to desired minutes (max 60)
```

### Change Node.js Version

Edit the `NODE_VERSION` environment variable in `semaphore.yml`:

```yaml
env_vars:
  - name: NODE_VERSION
    value: "20"  # Change to "18" or "22" if needed
```

## 📊 Pipeline Stages

The pipeline consists of the following stages:

1. **Checkout** - Clone the repository
2. **Setup Node.js** - Install Node.js 20
3. **Cache Restore** - Restore cached node_modules
4. **Install System Dependencies** - Install Electron dependencies
5. **Install App Dependencies** - Run `npm install`
6. **Cache Store** - Cache node_modules for future runs
7. **Install LocalTunnel** - Install localtunnel globally
8. **Start BEST Server** - Start the headless server
9. **Start LocalTunnel** - Expose the server via LocalTunnel
10. **Display API Info** - Show API endpoints and tunnel URL
11. **Keep Running** - Monitor and keep the server running for 60 minutes
12. **Cleanup** - Graceful shutdown

## 🔍 Monitoring

### View Logs

1. Go to your project in Semaphore
2. Click on the running workflow
3. Click on the "Deploy for subdomain" job
4. View real-time logs

### Check Server Status

The backend is always available at `https://best-backend.loca.lt`. Test it with:

```bash
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/health
```

## 🐛 Troubleshooting

### Pipeline Fails to Start

- Check the logs in Semaphore UI
- Verify Node.js and system dependencies are installing correctly

### Server Not Responding

- Check the logs in Semaphore UI
- Verify system dependencies are installed correctly
- Increase the wait time in the verification loop

### Tunnel Not Establishing

- LocalTunnel may be rate-limited or the subdomain may be taken
- Try changing the subdomain in `semaphore.yml`
- Check localtunnel.log in the pipeline output

### Cache Issues

If you encounter dependency issues, clear the cache:

1. Go to Settings → Cache
2. Click "Clear Cache"
3. Re-run the pipeline

## 📚 API Endpoints

Your backend is available at:

```
https://best-backend.loca.lt
```

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
# Health check
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/health

# Configure
curl -X POST https://best-backend.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{"rc1":"CODE1","rc2":"CODE2","planet":"Earth","device":"312"}'

# Connect
curl -X POST https://best-backend.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true"

# Check status
curl -H "bypass-tunnel-reminder: true" https://best-backend.loca.lt/api/status
```

## 💡 Tips

1. **Consistent URL**: The backend always uses `https://best-backend.loca.lt` for easy access
2. **No Secrets Needed**: All configuration is done via curl commands after deployment
3. **Monitoring**: Check the pipeline logs to see connection status updates
4. **Duration**: Pipeline runs for 60 minutes, then automatically shuts down gracefully
5. **Bypass Header**: Always include `-H "bypass-tunnel-reminder: true"` in your curl commands

## 🆚 Differences from GitHub Actions

| Feature | GitHub Actions | Semaphore CI |
|---------|---------------|--------------|
| Configuration | `.github/workflows/*.yml` | `.semaphore/semaphore.yml` |
| Input Method | `workflow_dispatch` with inputs | curl commands to API |
| Default Subdomain | User-provided input | Fixed: "best-backend" |
| Duration | User-provided input | Fixed: 60 minutes |
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
✅ LocalTunnel Established!
========================================

🌐 Your BEST Backend is now accessible at:

    https://best-backend.loca.lt

========================================
```

Now configure it with curl:

```bash
curl -X POST https://best-backend.loca.lt/api/configure \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json" \
  -d '{"rc1":"YOUR_CODE","planet":"Earth","device":"312"}'
```

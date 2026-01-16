# Semaphore CI/CD Setup for BEST Backend

This directory contains the Semaphore CI/CD configuration for deploying the BEST Headless Server with LocalTunnel.

## 🚀 Quick Setup

### 1. Connect Your Repository to Semaphore

1. Go to [Semaphore CI](https://semaphoreci.com/)
2. Sign up or log in
3. Click "Add Project"
4. Select your repository
5. Semaphore will automatically detect the `.semaphore/semaphore.yml` file

### 2. Configure Secrets (Environment Variables)

In Semaphore UI, create a secret named `deployment-config` with the following variables:

**Required:**
- `TUNNEL_SUBDOMAIN` - Your custom subdomain (e.g., "bharanitest007" for https://bharanitest007.loca.lt)

**Optional:**
- `DURATION` - Run duration in minutes (default: 60, max: 60)
- `RC1`, `RC2`, `RC3`, `RC4` - Recovery codes (if you want auto-configuration)
- `KICKRC` - Kick code
- `PLANET` - Planet name
- `DEVICE` - Device type (312=Android, 323=iOS, 352=Web)

#### How to Add Secrets in Semaphore:

1. Go to your project in Semaphore
2. Click on "Settings" → "Secrets"
3. Click "Create New Secret"
4. Name it `deployment-config`
5. Add environment variables:
   - Click "Add Environment Variable"
   - Name: `TUNNEL_SUBDOMAIN`, Value: `your-subdomain-here`
   - (Optional) Name: `DURATION`, Value: `60`
6. Click "Save Secret"

### 3. Run the Pipeline

**Manual Trigger:**
1. Go to your project in Semaphore
2. Click "Run Workflow"
3. Select the branch you want to deploy
4. Click "Start"

**Automatic Trigger:**
- The pipeline will automatically run on every push to your repository
- You can configure branch filters in the Semaphore UI

### 4. Configure via curl (Recommended)

Once the pipeline is running and the tunnel URL is displayed, use curl commands to configure:

```bash
# Get your tunnel URL from Semaphore logs, then configure
curl -X POST https://YOUR-SUBDOMAIN.loca.lt/api/configure \
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
curl -X POST https://YOUR-SUBDOMAIN.loca.lt/api/connect \
  -H "bypass-tunnel-reminder: true" \
  -H "Content-Type: application/json"

# Check status
curl -H "bypass-tunnel-reminder: true" https://YOUR-SUBDOMAIN.loca.lt/api/status
```

## 📋 Configuration Options

### Environment Variables (via Semaphore Secrets)

Configure these in the Semaphore UI under Settings → Secrets → `deployment-config`:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `TUNNEL_SUBDOMAIN` | Custom subdomain for LocalTunnel | Yes | "best-backend" |
| `DURATION` | Run duration in minutes (max 60) | No | 60 |
| `RC1`, `RC2`, `RC3`, `RC4` | Recovery codes (optional) | No | - |
| `KICKRC` | Kick code (optional) | No | - |
| `PLANET` | Planet name (optional) | No | - |
| `DEVICE` | Device type (optional) | No | "312" |

**Note:** If you don't set `TUNNEL_SUBDOMAIN`, it defaults to "best-backend".

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

### Change Subdomain

Set the `TUNNEL_SUBDOMAIN` environment variable in your Semaphore secret:

1. Go to Settings → Secrets → `deployment-config`
2. Add/Edit variable: `TUNNEL_SUBDOMAIN` = `your-custom-subdomain`
3. Save and re-run the pipeline

### Change Run Duration

Set the `DURATION` environment variable in your Semaphore secret:

1. Go to Settings → Secrets → `deployment-config`
2. Add/Edit variable: `DURATION` = `45` (for 45 minutes, max 60)
3. Save and re-run the pipeline

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

Test your backend with (replace YOUR-SUBDOMAIN):

```bash
curl -H "bypass-tunnel-reminder: true" https://YOUR-SUBDOMAIN.loca.lt/api/health
```

## 🐛 Troubleshooting

### Pipeline Fails to Start

- Check that `TUNNEL_SUBDOMAIN` is set in Semaphore secrets
- Verify the subdomain is unique and valid (alphanumeric and hyphens only)
- Check the logs in Semaphore UI

### Server Not Responding

- Check the logs in Semaphore UI
- Verify system dependencies are installed correctly
- Increase the wait time in the verification loop

### Tunnel Not Establishing

- LocalTunnel may be rate-limited or the subdomain may be taken
- Try a different subdomain by changing `TUNNEL_SUBDOMAIN` in secrets
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

1. **Custom Subdomain**: Set `TUNNEL_SUBDOMAIN` in Semaphore secrets for consistent URLs
2. **No Hardcoded Secrets**: All configuration is done via Semaphore secrets or curl commands
3. **Monitoring**: Check the pipeline logs to see connection status updates
4. **Duration**: Default is 60 minutes, set `DURATION` in secrets to change
5. **Bypass Header**: Always include `-H "bypass-tunnel-reminder: true"` in your curl commands

## 🆚 Differences from GitHub Actions

| Feature | GitHub Actions | Semaphore CI |
|---------|---------------|--------------|
| Configuration | `.github/workflows/*.yml` | `.semaphore/semaphore.yml` |
| Secrets | Repository Secrets | Project Secrets |
| Subdomain | Workflow input parameter | Environment variable in secret |
| Duration | Workflow input parameter | Environment variable in secret |
| Input Method | `workflow_dispatch` inputs + curl | Secrets + curl commands |
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

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

**Optional (for auto-configuration):**
- `RC1` - Recovery Code 1
- `RC2` - Recovery Code 2
- `RC3` - Recovery Code 3
- `RC4` - Recovery Code 4
- `KICKRC` - Kick Code
- `PLANET` - Planet Name
- `DEVICE` - Device Type (312=Android, 323=iOS, 352=Web)
- `DURATION` - Run duration in minutes (default: 60, max: 60)

#### How to Add Secrets in Semaphore:

1. Go to your project in Semaphore
2. Click on "Settings" → "Secrets"
3. Click "Create New Secret"
4. Name it `deployment-config`
5. Add environment variables one by one
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

## 📋 Configuration Options

### Environment Variables

All configuration is done through environment variables in the Semaphore secret:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `TUNNEL_SUBDOMAIN` | Custom subdomain for LocalTunnel | Yes | "best-default" |
| `RC1` | Recovery Code 1 | No | - |
| `RC2` | Recovery Code 2 | No | - |
| `RC3` | Recovery Code 3 | No | - |
| `RC4` | Recovery Code 4 | No | - |
| `KICKRC` | Kick Code | No | - |
| `PLANET` | Planet Name | No | - |
| `DEVICE` | Device Type | No | "312" |
| `DURATION` | Run duration (minutes) | No | 60 |

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

### Change Node.js Version

Edit the `NODE_VERSION` environment variable in `semaphore.yml`:

```yaml
env_vars:
  - name: NODE_VERSION
    value: "20"  # Change to "18" or "22" if needed
```

### Change Run Duration

Set the `DURATION` environment variable in your Semaphore secret (max 60 minutes).

### Disable Auto-Configuration

If you don't want the pipeline to automatically configure and connect to the game, simply don't set the `RC1`, `RC2`, `RC3`, or `RC4` variables in your secret.

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
10. **Configure BEST** - Apply configuration (if provided)
11. **Connect to Game** - Connect to game server (if configured)
12. **Display API Info** - Show API endpoints
13. **Keep Running** - Monitor and keep the server running
14. **Cleanup** - Graceful shutdown

## 🔍 Monitoring

### View Logs

1. Go to your project in Semaphore
2. Click on the running workflow
3. Click on the "Deploy for subdomain" job
4. View real-time logs

### Check Server Status

The pipeline will output the tunnel URL. You can test it with:

```bash
curl -H "bypass-tunnel-reminder: true" https://YOUR-SUBDOMAIN.loca.lt/api/health
```

## 🐛 Troubleshooting

### Pipeline Fails to Start

- Check that all required secrets are set
- Verify the `TUNNEL_SUBDOMAIN` is unique and valid

### Server Not Responding

- Check the logs in Semaphore UI
- Verify system dependencies are installed correctly
- Increase the wait time in the verification loop

### Tunnel Not Establishing

- LocalTunnel may be rate-limited
- Try a different subdomain
- Check localtunnel.log in the pipeline output

### Cache Issues

If you encounter dependency issues, clear the cache:

1. Go to Settings → Cache
2. Click "Clear Cache"
3. Re-run the pipeline

## 📚 API Endpoints

Once deployed, your backend will be available at:

```
https://YOUR-SUBDOMAIN.loca.lt
```

Available endpoints:
- `GET /api/health` - Health check
- `GET /api/status` - Connection status
- `GET /api/logs` - Server logs
- `POST /api/configure` - Configure the bot
- `POST /api/connect` - Connect to game server
- `POST /api/disconnect` - Disconnect from game server
- `POST /api/send` - Send custom messages

## 💡 Tips

1. **Consistent URLs**: Use the same `TUNNEL_SUBDOMAIN` for consistent URLs across deployments
2. **Security**: Store sensitive data (recovery codes) in Semaphore secrets, not in code
3. **Monitoring**: Check the pipeline logs regularly to ensure the server is running smoothly
4. **Duration**: Set appropriate `DURATION` to avoid unnecessary costs (max 60 minutes)

## 🆚 Differences from GitHub Actions

| Feature | GitHub Actions | Semaphore CI |
|---------|---------------|--------------|
| Configuration | `.github/workflows/*.yml` | `.semaphore/semaphore.yml` |
| Secrets | Repository Secrets | Project Secrets |
| Triggers | `workflow_dispatch` with inputs | Environment variables in secrets |
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

    https://YOUR-SUBDOMAIN.loca.lt

========================================
```

Copy this URL and share it with your users!

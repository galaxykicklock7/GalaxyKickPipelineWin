# Deployment Checklist ✅

Use this checklist to ensure successful deployment.

## Pre-Deployment

- [ ] Review `README.md` for overview
- [ ] Review `QUICKSTART.md` for step-by-step guide
- [ ] Ensure you have a GitHub account
- [ ] Have your recovery codes ready (for testing)

## Deployment Steps

### 1. Create GitHub Repository

- [ ] Go to https://github.com/new
- [ ] Repository name: `best-backend` (or your choice)
- [ ] Privacy: **Private** (recommended) or Public
- [ ] Don't initialize with README (we already have files)
- [ ] Click "Create repository"

### 2. Push Code

```bash
cd github_backend
git init
git add .
git commit -m "Initial commit - BEST backend"
git remote add origin https://github.com/YOUR_USERNAME/best-backend.git
git branch -M main
git push -u origin main
```

- [ ] Code pushed successfully
- [ ] Verify files appear on GitHub

### 3. Enable GitHub Actions

- [ ] Go to repository Settings
- [ ] Click on "Actions" in left sidebar
- [ ] Under "Actions permissions", select "Allow all actions and reusable workflows"
- [ ] Click "Save"

### 4. Run Workflow

- [ ] Go to Actions tab
- [ ] Click "BEST Headless Server with Cloudflare Tunnel"
- [ ] Click "Run workflow" button
- [ ] Leave inputs empty (configure via API)
- [ ] Set duration: `360` minutes
- [ ] Click "Run workflow"
- [ ] Wait 10 seconds, refresh page
- [ ] Workflow should show as running (yellow dot)

### 5. Get Tunnel URL

- [ ] Click on running workflow
- [ ] Click on job "run-best-headless"
- [ ] Wait for "Start Cloudflare Tunnel" step to complete
- [ ] Expand "Start Cloudflare Tunnel" step
- [ ] Find URL: `https://xxxxx-xxx-xxx.trycloudflare.com`
- [ ] Copy the URL

### 6. Test API

Replace `YOUR_TUNNEL_URL` with your actual URL:

```bash
# Test 1: Health check
curl https://YOUR_TUNNEL_URL/api/health
# Expected: {"status":"ok","mode":"headless","timestamp":"..."}

# Test 2: Configure
curl -X POST https://YOUR_TUNNEL_URL/api/configure \
  -H "Content-Type: application/json" \
  -d '{"rc1":"TestCode","planet":"TestPlanet","device":"312"}'
# Expected: {"success":true,"message":"Configuration updated",...}

# Test 3: Check status
curl https://YOUR_TUNNEL_URL/api/status
# Expected: {"connected":false,"websockets":{...},...}
```

- [ ] Health check returns OK
- [ ] Configuration works
- [ ] Status returns valid JSON

### 7. Test with Real Codes (Optional)

```bash
curl -X POST https://YOUR_TUNNEL_URL/api/configure \
  -H "Content-Type: application/json" \
  -d '{
    "rc1": "YOUR_REAL_CODE",
    "planet": "YOUR_PLANET",
    "device": "312",
    "autorelease": true
  }'

curl -X POST https://YOUR_TUNNEL_URL/api/connect \
  -H "Content-Type: application/json"
```

Wait 3-5 seconds, then:

```bash
curl https://YOUR_TUNNEL_URL/api/status
# Expected: {"connected":true,"websockets":{"ws1":true,...},...}

curl https://YOUR_TUNNEL_URL/api/logs
# Should show connection logs
```

- [ ] Configuration accepted
- [ ] Connection successful
- [ ] Status shows connected
- [ ] Logs show activity

## Post-Deployment

### Integrate with Your Web App

- [ ] Update your web app with tunnel URL
- [ ] Test configuration from your app
- [ ] Test connection from your app
- [ ] Test status monitoring
- [ ] Verify logs retrieval

### Monitor

- [ ] Check workflow status regularly
- [ ] Monitor for errors in logs
- [ ] Note tunnel URL (changes each run)
- [ ] Set reminder before 6-hour limit

## Common Issues & Solutions

### Issue: Workflow not appearing

**Solution:**
- Verify `.github/workflows/run-best-headless.yml` exists
- Check Actions are enabled in repository settings
- Wait a minute and refresh page

### Issue: Can't find tunnel URL

**Solution:**
- Wait at least 60 seconds after starting workflow
- Check "Start Cloudflare Tunnel" step logs carefully
- Look for pattern: `https://xxxxx.trycloudflare.com`
- URL appears in middle of logs, not at the end

### Issue: API returns 404

**Solution:**
- Verify tunnel URL is correct (no typos)
- Ensure workflow is still running (check Actions tab)
- Remember URL changes each workflow run

### Issue: Configuration fails

**Solution:**
- Check JSON syntax (use jsonlint.com)
- Ensure `Content-Type: application/json` header
- Verify all field names are correct (case-sensitive)

### Issue: Connection fails

**Solution:**
- Verify recovery codes are correct
- Check device type is "312", "323", or "352"
- Try with just one code first
- Check logs for errors

### Issue: Workflow times out

**Solution:**
- GitHub Actions has 6-hour maximum
- Start a new workflow run
- Get new tunnel URL

## Success Criteria

✅ Workflow runs successfully  
✅ Tunnel URL obtained  
✅ API health check passes  
✅ Configuration accepted  
✅ Can connect to game (optional test)  
✅ Status returns valid data  
✅ Logs show activity  

## Next Steps

After successful deployment:

1. **Document your tunnel URL** (it changes each run)
2. **Integrate with your web application**
3. **Test end-to-end workflow**
4. **Set up monitoring/alerts** (optional)
5. **Consider adding authentication** (for security)

## Support

If you encounter issues:

1. Check workflow logs in Actions tab
2. Review error messages carefully
3. Test with curl before testing with your app
4. Verify JSON syntax and field names
5. Ensure recovery codes are correct

## Security Reminder

⚠️ **Important:**
- Never commit recovery codes to Git
- Don't share tunnel URL publicly
- Tunnel URL changes each workflow run
- Anyone with URL can control your instance during runtime

---

**Happy Deploying! 🚀**

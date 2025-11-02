# LocalTunnel Health Check Script
# IMPORTANT: Always include bypass-tunnel-reminder header!

param(
    [Parameter(Mandatory=$true)]
    [string]$TunnelUrl = "https://best-backend.loca.lt"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "LocalTunnel Health Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Testing: $TunnelUrl/api/health" -ForegroundColor Yellow
Write-Host "Header: bypass-tunnel-reminder = true" -ForegroundColor Gray
Write-Host ""

# CRITICAL: Must include bypass-tunnel-reminder header
$headers = @{
    "bypass-tunnel-reminder" = "true"
}

try {
    Write-Host "Sending request..." -ForegroundColor Gray
    
    $response = Invoke-RestMethod `
        -Uri "$TunnelUrl/api/health" `
        -Headers $headers `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "`n✅ SUCCESS! Backend is healthy!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Status: $($response.status)" -ForegroundColor White
    Write-Host "Mode: $($response.mode)" -ForegroundColor White
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor White
    Write-Host "========================================`n" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ FAILED! Backend not responding" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*503*") {
        Write-Host "Error: 503 - Tunnel Unavailable" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Possible causes:" -ForegroundColor White
        Write-Host "  1. GitHub Actions workflow is not running" -ForegroundColor Gray
        Write-Host "  2. Backend API server failed to start" -ForegroundColor Gray
        Write-Host "  3. LocalTunnel didn't connect properly" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Check workflow logs at:" -ForegroundColor White
        Write-Host "https://github.com/galaxykicklock7/GalaxyKickPipelineWin/actions" -ForegroundColor Cyan
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host "========================================`n" -ForegroundColor Red
    exit 1
}

# Test other endpoints if health check passes
Write-Host "Testing other endpoints..." -ForegroundColor Yellow
Write-Host ""

# Test status endpoint
try {
    Write-Host "Testing: $TunnelUrl/api/status" -ForegroundColor Gray
    $status = Invoke-RestMethod `
        -Uri "$TunnelUrl/api/status" `
        -Headers $headers `
        -TimeoutSec 10
    
    Write-Host "✅ Status endpoint working" -ForegroundColor Green
    Write-Host "   Connected: $($status.connected)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "⚠️  Status endpoint failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# Test logs endpoint
try {
    Write-Host "Testing: $TunnelUrl/api/logs" -ForegroundColor Gray
    $logs = Invoke-RestMethod `
        -Uri "$TunnelUrl/api/logs" `
        -Headers $headers `
        -TimeoutSec 10
    
    Write-Host "✅ Logs endpoint working" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠️  Logs endpoint failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 Remember to always include this header:" -ForegroundColor White
Write-Host '   bypass-tunnel-reminder: true' -ForegroundColor Yellow
Write-Host ""

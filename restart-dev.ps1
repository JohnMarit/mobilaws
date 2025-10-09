# Restart Development Servers Script
Write-Host "Restarting Mobilaws Development Servers..." -ForegroundColor Cyan

# Stop all Node processes
Write-Host "Stopping old Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear Vite cache
Write-Host "Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "Vite cache cleared" -ForegroundColor Green
}

# Clear dist folder
Write-Host "Clearing dist folder..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "Dist folder cleared" -ForegroundColor Green
}

Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open Terminal 1 and run: cd ai-backend; npm start" -ForegroundColor White
Write-Host "2. Open Terminal 2 and run: npm run dev" -ForegroundColor White
Write-Host "3. Hard refresh browser: Ctrl+Shift+R" -ForegroundColor White
Write-Host ""

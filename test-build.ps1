# Quick test build - just builds the APK without installing
# Useful for checking if everything is set up correctly

Write-Host "Testing Android build setup..." -ForegroundColor Cyan
Write-Host ""

# Build React app
Write-Host "Building React app..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ React build failed" -ForegroundColor Red
    exit 1
}

# Sync to Android
Write-Host "Syncing to Android..." -ForegroundColor Yellow
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Sync failed" -ForegroundColor Red
    exit 1
}

# Build debug APK
Write-Host "Building debug APK..." -ForegroundColor Yellow
Push-Location android
.\gradlew.bat assembleDebug
$buildResult = $LASTEXITCODE
Pop-Location

if ($buildResult -eq 0) {
    Write-Host ""
    Write-Host "✓ Build test successful!" -ForegroundColor Green
    Write-Host "APK location: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Build test failed" -ForegroundColor Red
    Write-Host "Run .\setup-android-cli.ps1 to check your setup" -ForegroundColor Yellow
    exit 1
}


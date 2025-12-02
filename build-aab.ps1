# Build Android App Bundle (AAB) for Google Play Store
# This creates the signed AAB file needed for Play Store submission

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building AAB for Play Store" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if keystore exists
$keystorePath = "android\app\mobilaws-release.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "⚠ Signing keystore not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to create a signing key first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Run: cd android\app" -ForegroundColor White
    Write-Host "2. Run: keytool -genkey -v -keystore mobilaws-release.keystore -alias mobilaws -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor Cyan
    Write-Host "3. Create android\app\keystore.properties with:" -ForegroundColor White
    Write-Host "   storeFile=mobilaws-release.keystore" -ForegroundColor Cyan
    Write-Host "   storePassword=YOUR_KEYSTORE_PASSWORD" -ForegroundColor Cyan
    Write-Host "   keyAlias=mobilaws" -ForegroundColor Cyan
    Write-Host "   keyPassword=YOUR_KEY_PASSWORD" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "See ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md for details" -ForegroundColor Yellow
    exit 1
}

# Step 1: Build React app
Write-Host "[1/3] Building React web assets..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✓ Web assets built successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to build web assets" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Sync to Android
Write-Host "[2/3] Syncing to Android..." -ForegroundColor Yellow
try {
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        throw "Sync failed"
    }
    Write-Host "✓ Synced to Android successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to sync to Android" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Build AAB
Write-Host "[3/3] Building Android App Bundle (AAB)..." -ForegroundColor Yellow
try {
    Push-Location android
    .\gradlew.bat bundleRelease
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle build failed"
    }
    Pop-Location
    Write-Host "✓ AAB built successfully!" -ForegroundColor Green
} catch {
    Pop-Location
    Write-Host "✗ Failed to build AAB" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host "- Signing configuration in android\app\build.gradle" -ForegroundColor White
    Write-Host "- keystore.properties file exists" -ForegroundColor White
    Write-Host "- Keystore passwords are correct" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AAB Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "AAB location:" -ForegroundColor Yellow
Write-Host "  android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Upload this AAB to Google Play Console" -ForegroundColor White
Write-Host "2. Complete your store listing" -ForegroundColor White
Write-Host "3. Submit for review" -ForegroundColor White
Write-Host ""
Write-Host "See ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md for details" -ForegroundColor Cyan


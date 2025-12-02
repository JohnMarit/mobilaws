# Build and Install Android App
# This script builds your React app, syncs to Android, and installs on connected device

param(
    [string]$BuildType = "debug"  # debug or release
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building Mobilaws Android App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build React app
Write-Host "[1/4] Building React web assets..." -ForegroundColor Yellow
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
Write-Host "[2/4] Syncing to Android..." -ForegroundColor Yellow
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

# Step 3: Build Android APK
Write-Host "[3/4] Building Android $BuildType APK..." -ForegroundColor Yellow
try {
    Push-Location android
    if ($BuildType -eq "release") {
        .\gradlew.bat assembleRelease
    } else {
        .\gradlew.bat assembleDebug
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle build failed"
    }
    Pop-Location
    Write-Host "✓ Android APK built successfully" -ForegroundColor Green
} catch {
    Pop-Location
    Write-Host "✗ Failed to build Android APK" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Java not installed or JAVA_HOME not set" -ForegroundColor White
    Write-Host "- Android SDK not installed" -ForegroundColor White
    Write-Host "- Run .\setup-android-cli.ps1 to check setup" -ForegroundColor White
    exit 1
}

Write-Host ""

# Step 4: Install on device (if connected)
Write-Host "[4/4] Checking for connected device..." -ForegroundColor Yellow
try {
    $devices = adb devices 2>&1
    $deviceCount = ($devices | Select-String "device$" | Measure-Object).Count
    
    if ($deviceCount -gt 0) {
        Write-Host "✓ Found $deviceCount device(s)" -ForegroundColor Green
        Write-Host "Installing APK on device..." -ForegroundColor Yellow
        
        Push-Location android
        if ($BuildType -eq "release") {
            .\gradlew.bat installRelease
        } else {
            .\gradlew.bat installDebug
        }
        Pop-Location
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ App installed successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "The app should now be on your device." -ForegroundColor Cyan
        } else {
            Write-Host "⚠ Build succeeded but installation failed" -ForegroundColor Yellow
            Write-Host "You can manually install:" -ForegroundColor White
            if ($BuildType -eq "release") {
                Write-Host "  adb install android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
            } else {
                Write-Host "  adb install android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
            }
        }
    } else {
        Write-Host "⚠ No device connected" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To install manually:" -ForegroundColor White
        Write-Host "1. Enable USB debugging on your Android device" -ForegroundColor White
        Write-Host "2. Connect via USB" -ForegroundColor White
        Write-Host "3. Run: adb devices (to verify connection)" -ForegroundColor White
        if ($BuildType -eq "release") {
            Write-Host "4. Run: adb install android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
        } else {
            Write-Host "4. Run: adb install android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "⚠ Could not check for devices (adb not found)" -ForegroundColor Yellow
    Write-Host "APK built successfully. Install manually when device is connected." -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($BuildType -eq "release") {
    Write-Host "Release APK location:" -ForegroundColor Yellow
    Write-Host "  android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
} else {
    Write-Host "Debug APK location:" -ForegroundColor Yellow
    Write-Host "  android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
}


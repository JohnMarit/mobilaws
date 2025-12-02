# Android CLI Setup Script for Mobilaws
# This script helps you set up Android development without Android Studio

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mobilaws Android CLI Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Java is installed
Write-Host "Checking for Java JDK..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1
    Write-Host "✓ Java found!" -ForegroundColor Green
    Write-Host $javaVersion[0]
} catch {
    Write-Host "✗ Java not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Java JDK 17 or higher:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://adoptium.net/" -ForegroundColor White
    Write-Host "2. Install it" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install via Chocolatey: choco install temurin17" -ForegroundColor Cyan
    exit 1
}

# Check if Android SDK is installed
Write-Host ""
Write-Host "Checking for Android SDK..." -ForegroundColor Yellow
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    $androidHome = $env:ANDROID_SDK_ROOT
}

if (-not $androidHome) {
    Write-Host "✗ Android SDK not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "ANDROID_HOME is not set. You need to:" -ForegroundColor Yellow
    Write-Host "1. Download Android SDK Command Line Tools:" -ForegroundColor White
    Write-Host "   https://developer.android.com/studio#command-tools" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Extract to a folder (e.g., C:\Android\Sdk\cmdline-tools\latest)" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Run the SDK setup:" -ForegroundColor White
    Write-Host "   C:\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat --licenses" -ForegroundColor Cyan
    Write-Host "   C:\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat `"platform-tools`" `"platforms;android-35`" `"build-tools;35.0.0`"" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4. Set ANDROID_HOME environment variable:" -ForegroundColor White
    Write-Host "   [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\Sdk', 'User')" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5. Add to PATH:" -ForegroundColor White
    Write-Host "   [System.Environment]::SetEnvironmentVariable('Path', `$env:Path + ';C:\Android\Sdk\platform-tools', 'User')" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or install Android Studio (it includes the SDK):" -ForegroundColor Yellow
    Write-Host "   https://developer.android.com/studio" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "✓ Android SDK found at: $androidHome" -ForegroundColor Green
    
    # Check for adb
    $adbPath = Join-Path $androidHome "platform-tools\adb.exe"
    if (Test-Path $adbPath) {
        Write-Host "✓ ADB found" -ForegroundColor Green
    } else {
        Write-Host "✗ ADB not found. Install platform-tools:" -ForegroundColor Red
        Write-Host "   $androidHome\cmdline-tools\latest\bin\sdkmanager.bat `"platform-tools`"" -ForegroundColor Cyan
    }
}

# Check if Gradle wrapper exists
Write-Host ""
Write-Host "Checking Gradle wrapper..." -ForegroundColor Yellow
if (Test-Path "android\gradlew.bat") {
    Write-Host "✓ Gradle wrapper found" -ForegroundColor Green
} else {
    Write-Host "✗ Gradle wrapper not found" -ForegroundColor Red
    Write-Host "Run: npx cap add android" -ForegroundColor Yellow
    exit 1
}

# Check JAVA_HOME
Write-Host ""
Write-Host "Checking JAVA_HOME..." -ForegroundColor Yellow
if ($env:JAVA_HOME) {
    Write-Host "✓ JAVA_HOME is set: $env:JAVA_HOME" -ForegroundColor Green
} else {
    Write-Host "⚠ JAVA_HOME not set (may still work if Java is in PATH)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To set JAVA_HOME, find your Java installation and run:" -ForegroundColor Yellow
    Write-Host "   [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17', 'User')" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Check Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Build your app: .\build-android.ps1" -ForegroundColor White
Write-Host "2. Or test build: .\test-build.ps1" -ForegroundColor White
Write-Host ""


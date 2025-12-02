# Setup Signing Key for Play Store Publishing
# This script helps you create and configure the signing key needed for Play Store

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Play Store Signing Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$keystorePath = "android\app\mobilaws-release.keystore"
$keystorePropsPath = "android\app\keystore.properties"
$buildGradlePath = "android\app\build.gradle"

# Check if keystore already exists
if (Test-Path $keystorePath) {
    Write-Host "⚠ Signing keystore already exists!" -ForegroundColor Yellow
    Write-Host "Location: $keystorePath" -ForegroundColor White
    Write-Host ""
    $overwrite = Read-Host "Do you want to create a new one? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Keeping existing keystore." -ForegroundColor Green
        Write-Host ""
        Write-Host "If you need to configure signing in build.gradle, see:" -ForegroundColor Yellow
        Write-Host "  ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
        exit 0
    }
}

Write-Host "This will create a signing key for your app." -ForegroundColor Yellow
Write-Host "You'll need this key for ALL future app updates!" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠ IMPORTANT: Save your passwords securely!" -ForegroundColor Red
Write-Host ""

# Check if Java keytool is available
try {
    $null = Get-Command keytool -ErrorAction Stop
    Write-Host "✓ Java keytool found" -ForegroundColor Green
} catch {
    Write-Host "✗ Java keytool not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need Java JDK installed to create a signing key." -ForegroundColor Yellow
    Write-Host "Download from: https://adoptium.net/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing Java, run this script again." -ForegroundColor White
    exit 1
}

# Navigate to android/app directory
Push-Location android\app

Write-Host "Creating signing keystore..." -ForegroundColor Yellow
Write-Host ""
Write-Host "You'll be prompted for:" -ForegroundColor White
Write-Host "  1. Keystore password (remember this!)" -ForegroundColor White
Write-Host "  2. Key password (remember this!)" -ForegroundColor White
Write-Host "  3. Your name, organization, etc." -ForegroundColor White
Write-Host ""

# Generate keystore
try {
    keytool -genkey -v -keystore mobilaws-release.keystore -alias mobilaws -keyalg RSA -keysize 2048 -validity 10000
    
    if ($LASTEXITCODE -ne 0) {
        throw "Keytool command failed"
    }
    
    Write-Host ""
    Write-Host "✓ Keystore created successfully!" -ForegroundColor Green
    Write-Host "Location: android\app\mobilaws-release.keystore" -ForegroundColor Cyan
} catch {
    Pop-Location
    Write-Host ""
    Write-Host "✗ Failed to create keystore" -ForegroundColor Red
    Write-Host "Make sure Java is installed and in your PATH" -ForegroundColor Yellow
    exit 1
}

Pop-Location

Write-Host ""

# Create keystore.properties file
Write-Host "Creating keystore.properties file..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Enter your keystore information:" -ForegroundColor White
Write-Host ""

$storePassword = Read-Host "Keystore Password" -AsSecureString
$storePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassword))

$keyPassword = Read-Host "Key Password (can be same as keystore password)" -AsSecureString
$keyPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword))

$keystoreProps = @"
storeFile=mobilaws-release.keystore
storePassword=$storePasswordPlain
keyAlias=mobilaws
keyPassword=$keyPasswordPlain
"@

try {
    $keystoreProps | Out-File -FilePath $keystorePropsPath -Encoding UTF8 -NoNewline
    Write-Host "✓ keystore.properties created" -ForegroundColor Green
} catch {
    Write-Host "⚠ Could not create keystore.properties automatically" -ForegroundColor Yellow
    Write-Host "Create it manually at: $keystorePropsPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Content:" -ForegroundColor Yellow
    Write-Host $keystoreProps -ForegroundColor Cyan
}

Write-Host ""

# Check if build.gradle needs signing config
$buildGradleContent = Get-Content $buildGradlePath -Raw

if ($buildGradleContent -match "signingConfigs") {
    Write-Host "✓ Signing configuration found in build.gradle" -ForegroundColor Green
} else {
    Write-Host "⚠ Signing configuration not found in build.gradle" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to add signing configuration to build.gradle." -ForegroundColor White
    Write-Host ""
    Write-Host "See ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md section:" -ForegroundColor Yellow
    Write-Host "  'Step 3: Configure Signing in Gradle'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or I can add it automatically. Would you like me to? (y/N)" -ForegroundColor Yellow
    $autoConfig = Read-Host
    
    if ($autoConfig -eq "y" -or $autoConfig -eq "Y") {
        Write-Host ""
        Write-Host "Adding signing configuration..." -ForegroundColor Yellow
        
        # Read current build.gradle
        $lines = Get-Content $buildGradlePath
        
        # Find where to insert signing config
        $newContent = @()
        $inserted = $false
        
        foreach ($line in $lines) {
            $newContent += $line
            
            # Insert after "apply plugin: 'com.android.application'"
            if ($line -match "apply plugin: 'com.android.application'" -and -not $inserted) {
                $newContent += ""
                $newContent += "def keystorePropertiesFile = rootProject.file('app/keystore.properties')"
                $newContent += "def keystoreProperties = new Properties()"
                $newContent += "if (keystorePropertiesFile.exists()) {"
                $newContent += "    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))"
                $newContent += "}"
                $inserted = $true
            }
            
            # Insert signingConfigs in android block
            if ($line -match "^\s*android \{" -and $inserted) {
                $newContent += ""
                $newContent += "    signingConfigs {"
                $newContent += "        release {"
                $newContent += "            if (keystorePropertiesFile.exists()) {"
                $newContent += "                storeFile file(keystoreProperties['storeFile'])"
                $newContent += "                storePassword keystoreProperties['storePassword']"
                $newContent += "                keyAlias keystoreProperties['keyAlias']"
                $newContent += "                keyPassword keystoreProperties['keyPassword']"
                $newContent += "            }"
                $newContent += "        }"
                $newContent += "    }"
            }
            
            # Update release buildType
            if ($line -match "release \{" -and $inserted) {
                $newContent += "            signingConfig signingConfigs.release"
            }
        }
        
        try {
            $newContent | Set-Content $buildGradlePath
            Write-Host "✓ Signing configuration added to build.gradle" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not update build.gradle automatically" -ForegroundColor Yellow
            Write-Host "Please add it manually (see guide)" -ForegroundColor White
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠ IMPORTANT REMINDERS:" -ForegroundColor Red
Write-Host "1. Backup your keystore file: android\app\mobilaws-release.keystore" -ForegroundColor Yellow
Write-Host "2. Save your passwords securely (password manager)" -ForegroundColor Yellow
Write-Host "3. You'll need this keystore for ALL future app updates" -ForegroundColor Yellow
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test your app: .\build-android.ps1" -ForegroundColor White
Write-Host "2. Build AAB: .\build-aab.ps1" -ForegroundColor White
Write-Host "3. Create Play Store account: https://play.google.com/console" -ForegroundColor White
Write-Host "4. Upload AAB and complete store listing" -ForegroundColor White
Write-Host ""
Write-Host "See PUBLISH_TO_PLAYSTORE.md for complete guide" -ForegroundColor Cyan


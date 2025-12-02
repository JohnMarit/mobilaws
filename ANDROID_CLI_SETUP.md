# 🖥️ Android Development Without Android Studio

Complete guide to build and test your Mobilaws Android app using **only command-line tools** - no Android Studio required!

## ✅ What You Can Do From Here

- ✅ Build APK and AAB files
- ✅ Install on your Android phone
- ✅ Test the app
- ✅ Generate signing keys
- ✅ Prepare for Play Store submission
- ✅ Everything from your terminal!

## 📋 Prerequisites

You need 3 things installed:

1. **Java JDK 17+** (required for building)
2. **Android SDK** (command-line tools only)
3. **Node.js** (already have this ✅)

## 🚀 Quick Setup

### Step 1: Install Java JDK

**Option A: Download and Install**
1. Go to: https://adoptium.net/
2. Download JDK 17 or higher (Windows x64)
3. Install it
4. Note the installation path (usually `C:\Program Files\Eclipse Adoptium\jdk-17`)

**Option B: Using Chocolatey** (if you have it)
```powershell
choco install temurin17
```

**Set JAVA_HOME** (after installation):
```powershell
# Find your Java installation path, then:
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17', 'User')

# Add Java to PATH
[System.Environment]::SetEnvironmentVariable('Path', $env:Path + ';C:\Program Files\Eclipse Adoptium\jdk-17\bin', 'User')
```

**Verify:**
```powershell
java -version
# Should show: openjdk version "17.x.x" or higher
```

### Step 2: Install Android SDK (Command-Line Tools Only)

**Option A: Standalone SDK (Recommended - Smaller Download)**

1. **Download Command-Line Tools:**
   - Go to: https://developer.android.com/studio#command-tools
   - Download "Command line tools only" (Windows)
   - File: `commandlinetools-win-XXXXXX_latest.zip`

2. **Extract and Setup:**
   ```powershell
   # Create directory structure
   mkdir C:\Android\Sdk\cmdline-tools
   
   # Extract the zip to: C:\Android\Sdk\cmdline-tools\latest
   # (The "latest" folder name is important!)
   ```

3. **Install Required Components:**
   ```powershell
   # Accept licenses
   C:\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat --licenses
   # Type 'y' for each license
   
   # Install platform-tools (includes adb)
   C:\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat "platform-tools"
   
   # Install Android platform and build tools
   C:\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat "platforms;android-35" "build-tools;35.0.0"
   ```

4. **Set Environment Variables:**
   ```powershell
   # Set ANDROID_HOME
   [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\Sdk', 'User')
   
   # Add to PATH
   [System.Environment]::SetEnvironmentVariable('Path', $env:Path + ';C:\Android\Sdk\platform-tools', 'User')
   ```

5. **Restart your terminal** and verify:
   ```powershell
   adb --version
   # Should show: Android Debug Bridge version X.X.X
   ```

**Option B: Install Android Studio** (Includes SDK, but you don't need to use the GUI)
- Download: https://developer.android.com/studio
- Install it (it will set up the SDK automatically)
- You can still use command-line tools from here!

### Step 3: Verify Setup

Run the setup check script:
```powershell
.\setup-android-cli.ps1
```

This will check if everything is installed correctly.

## 🛠️ Available Scripts

I've created helper scripts to make building easy:

### 1. `setup-android-cli.ps1`
Checks if Java, Android SDK, and Gradle are set up correctly.

```powershell
.\setup-android-cli.ps1
```

### 2. `build-android.ps1`
Builds your app and installs on connected device.

```powershell
# Build debug version (default)
.\build-android.ps1

# Build release version
.\build-android.ps1 -BuildType release
```

### 3. `build-aab.ps1`
Builds Android App Bundle (AAB) for Play Store submission.

```powershell
.\build-aab.ps1
```

### 4. `test-build.ps1`
Quick test to verify your setup works.

```powershell
.\test-build.ps1
```

## 📱 Testing on Your Phone

### Enable USB Debugging

1. On your Android phone:
   - Go to **Settings** → **About Phone**
   - Tap **Build Number** 7 times (enables Developer Options)
   - Go back to **Settings** → **Developer Options**
   - Enable **USB Debugging**

2. Connect phone via USB

3. Verify connection:
   ```powershell
   adb devices
   # Should show your device
   ```

4. Build and install:
   ```powershell
   .\build-android.ps1
   ```

## 🔨 Manual Build Commands

If you prefer to run commands manually:

### Development Build
```powershell
# 1. Build React app
npm run build

# 2. Sync to Android
npm run android:sync

# 3. Build debug APK
cd android
.\gradlew.bat assembleDebug

# 4. Install on device
.\gradlew.bat installDebug
```

### Release Build (for testing)
```powershell
npm run build
npm run android:sync
cd android
.\gradlew.bat assembleRelease

# Install manually:
adb install app\build\outputs\apk\release\app-release.apk
```

### Play Store Build (AAB)
```powershell
npm run build
npm run android:sync
cd android
.\gradlew.bat bundleRelease

# Output: android\app\build\outputs\bundle\release\app-release.aab
```

## 🔐 Generating Signing Key

For Play Store, you need a signing key:

```powershell
cd android\app
keytool -genkey -v -keystore mobilaws-release.keystore -alias mobilaws -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- Keystore password (remember this!)
- Key password (remember this!)
- Your name, organization, etc.

**⚠️ CRITICAL:** Backup this keystore file! You cannot update your app without it.

Then create `android\app\keystore.properties`:
```properties
storeFile=mobilaws-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=mobilaws
keyPassword=YOUR_KEY_PASSWORD
```

## 📂 Build Output Locations

After building, your files will be here:

- **Debug APK**: `android\app\build\outputs\apk\debug\app-debug.apk`
- **Release APK**: `android\app\build\outputs\apk\release\app-release.apk`
- **Release AAB**: `android\app\build\outputs\bundle\release\app-release.aab`

## 🆘 Troubleshooting

### "Java not found"
- Install Java JDK 17+ from https://adoptium.net/
- Set JAVA_HOME environment variable
- Restart terminal

### "adb not found"
- Install Android SDK command-line tools
- Set ANDROID_HOME environment variable
- Add platform-tools to PATH
- Restart terminal

### "Gradle build failed"
- Check JAVA_HOME is set correctly
- Verify Java version: `java -version` (should be 17+)
- Try: `cd android && .\gradlew.bat clean`

### "No device found"
- Enable USB debugging on phone
- Connect via USB
- Run: `adb devices` to verify
- Try different USB cable/port

### Build succeeds but app crashes
- Check logs: `adb logcat`
- Verify Firebase config (`google-services.json`) is in `android\app\`
- Test on different device/Android version

## 🔄 Development Workflow

When you make changes to your React app:

```powershell
# 1. Make your code changes in src/

# 2. Build and sync
.\build-android.ps1

# 3. App will be installed on your device automatically
```

Or manually:
```powershell
npm run build
npm run android:sync
cd android
.\gradlew.bat installDebug
```

## 📊 What Each Script Does

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `setup-android-cli.ps1` | Checks your setup | First time, or when troubleshooting |
| `test-build.ps1` | Quick build test | Verify setup works |
| `build-android.ps1` | Build & install | Development, testing |
| `build-aab.ps1` | Build for Play Store | Ready to publish |

## ✅ Quick Start Checklist

- [ ] Install Java JDK 17+
- [ ] Install Android SDK command-line tools
- [ ] Set ANDROID_HOME environment variable
- [ ] Add platform-tools to PATH
- [ ] Run `.\setup-android-cli.ps1` to verify
- [ ] Enable USB debugging on phone
- [ ] Run `.\build-android.ps1` to test

## 🎯 Next Steps

Once your setup is working:

1. **Test the app**: `.\build-android.ps1`
2. **Customize**: Update app icon, name, etc.
3. **Prepare for Play Store**: See `ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md`
4. **Build AAB**: `.\build-aab.ps1` when ready to publish

## 💡 Tips

- **Use a physical device** for testing (no emulator needed!)
- **Keep your keystore safe** - you'll need it for all future updates
- **Test on multiple Android versions** if possible
- **Check logs** with `adb logcat` if something doesn't work

## 📚 Additional Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android SDK Docs**: https://developer.android.com/studio/command-line
- **Gradle Docs**: https://docs.gradle.org

---

**You're all set!** You can now build and test your Android app entirely from the command line. No Android Studio needed! 🎉


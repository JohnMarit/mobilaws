# 📱 Android Build - Quick Reference Card

## 🚀 One-Command Builds

```powershell
# Check if everything is set up
.\setup-android-cli.ps1

# Build and install on device
.\build-android.ps1

# Build for Play Store
.\build-aab.ps1

# Quick test build
.\test-build.ps1
```

## 📋 Prerequisites Checklist

- [ ] Java JDK 17+ installed
- [ ] Android SDK installed (command-line tools)
- [ ] ANDROID_HOME environment variable set
- [ ] Java in PATH (or JAVA_HOME set)
- [ ] USB debugging enabled on phone

## 🔧 Manual Commands

```powershell
# Build React app
npm run build

# Sync to Android
npm run android:sync

# Build debug APK
cd android
.\gradlew.bat assembleDebug

# Build release APK
.\gradlew.bat assembleRelease

# Build AAB for Play Store
.\gradlew.bat bundleRelease

# Install on device
.\gradlew.bat installDebug
# or
adb install app\build\outputs\apk\debug\app-debug.apk
```

## 📂 Output Locations

- Debug APK: `android\app\build\outputs\apk\debug\app-debug.apk`
- Release APK: `android\app\build\outputs\apk\release\app-release.apk`
- AAB: `android\app\build\outputs\bundle\release\app-release.aab`

## 🔍 Troubleshooting

```powershell
# Check Java
java -version

# Check Android SDK
adb --version

# Check connected devices
adb devices

# View logs
adb logcat

# Clean build
cd android
.\gradlew.bat clean
```

## 📚 Full Guides

- Setup: `ANDROID_CLI_SETUP.md`
- Quick Start: `ANDROID_QUICK_START.md`
- Play Store: `ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md`


# 🚀 Android App - Quick Start Guide

Convert and test your Mobilaws app on Android in minutes!

## Prerequisites

✅ Node.js installed
✅ Java JDK 17+ installed
✅ Android SDK (command-line tools) - **Android Studio NOT required!**

> 💡 **New!** You can build entirely from command line. See [ANDROID_CLI_SETUP.md](./ANDROID_CLI_SETUP.md) for setup without Android Studio.

## 5-Minute Setup

### 1. Build Your App
```bash
npm run build
```

### 2. Sync to Android
```bash
npm run android:sync
```

### 3. Build and Install (Command Line - Recommended)
```powershell
# Use the helper script
.\build-android.ps1

# Or manually:
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat installDebug
```

### 4. Alternative: Open in Android Studio (Optional)
```bash
npm run android:open
# Then click the green ▶️ button
```

## 📱 Testing on Your Phone

### Enable USB Debugging:
1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**
5. Connect phone to computer via USB
6. Run: `npm run android:run`

## 🏗️ Building Release APK

For testing the release version on your device:

```bash
cd android
./gradlew assembleRelease
```

Install on your device:
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

## 📦 Next Steps

Ready to publish? See **ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md** for:
- Creating signing keys
- Building production AAB
- Play Store submission
- Screenshots and assets
- Publishing checklist

## 🔄 Development Workflow

When you make code changes:

```bash
# 1. Update your React code
# 2. Build
npm run build

# 3. Sync to Android
npx cap sync android

# 4. App will reload automatically
```

## 🆘 Quick Fixes

**White screen?**
```bash
npm run build && npx cap sync android
```

**Build errors?**
```bash
cd android
./gradlew clean
cd ..
npm run android:sync
```

**Need to reset?**
```bash
rm -rf android
npx cap add android
npm run android:sync
```

## 📚 Resources

- **CLI Setup (No Android Studio)**: `ANDROID_CLI_SETUP.md` ⭐
- Full deployment guide: `ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md`
- Capacitor docs: https://capacitorjs.com
- Android docs: https://developer.android.com

## 🛠️ Helper Scripts

- `.\setup-android-cli.ps1` - Check your setup
- `.\build-android.ps1` - Build and install app
- `.\build-aab.ps1` - Build for Play Store
- `.\test-build.ps1` - Quick build test

Happy building! 🎉


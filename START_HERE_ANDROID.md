# 🚀 START HERE - Android App Development

Welcome! Your Mobilaws project is now set up to build Android apps **entirely from the command line** - no Android Studio required!

## ⚡ Quick Start (3 Steps)

### 1. Install Required Tools

You need 2 things:

**Java JDK 17+**
- Download: https://adoptium.net/
- Install it
- Set JAVA_HOME (see `ANDROID_CLI_SETUP.md`)

**Android SDK Command-Line Tools**
- Download: https://developer.android.com/studio#command-tools
- Extract and set ANDROID_HOME (see `ANDROID_CLI_SETUP.md`)

### 2. Check Your Setup

```powershell
.\setup-android-cli.ps1
```

This will tell you what's installed and what's missing.

### 3. Build Your App

```powershell
# Connect your Android phone (USB debugging enabled)
.\build-android.ps1
```

That's it! Your app will be built and installed on your device.

## 📚 Documentation Guide

| Document | When to Read |
|----------|--------------|
| **`ANDROID_CLI_SETUP.md`** ⭐ | **Start here!** Complete setup guide |
| `ANDROID_QUICK_START.md` | Quick reference for common tasks |
| `QUICK_REFERENCE.md` | Command cheat sheet |
| `ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md` | When ready to publish |
| `PLAY_STORE_CHECKLIST.md` | Before submitting to Play Store |

## 🛠️ Available Scripts

All scripts are in the project root:

| Script | What It Does |
|--------|--------------|
| `.\setup-android-cli.ps1` | Checks if Java, Android SDK, etc. are installed |
| `.\test-build.ps1` | Quick test to verify setup works |
| `.\build-android.ps1` | Builds app and installs on connected device |
| `.\build-aab.ps1` | Builds AAB file for Play Store submission |

## ✅ What You Can Do

- ✅ Build APK files from command line
- ✅ Install on your Android phone
- ✅ Test the app without Android Studio
- ✅ Build AAB for Google Play Store
- ✅ Everything from your terminal!

## 🆘 Troubleshooting

**"Java not found"**
→ Install Java JDK 17+ from https://adoptium.net/

**"adb not found"**
→ Install Android SDK command-line tools (see `ANDROID_CLI_SETUP.md`)

**"Gradle build failed"**
→ Run `.\setup-android-cli.ps1` to check your setup

**Need more help?**
→ See `ANDROID_CLI_SETUP.md` for detailed troubleshooting

## 🎯 Next Steps

1. **Install Java and Android SDK** (see `ANDROID_CLI_SETUP.md`)
2. **Run setup check**: `.\setup-android-cli.ps1`
3. **Test build**: `.\test-build.ps1`
4. **Build and install**: `.\build-android.ps1`
5. **Customize**: Update app icon, name, etc.
6. **Publish**: When ready, see `ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md`

## 💡 Pro Tips

- **Use a physical device** for testing (no emulator needed!)
- **Test on multiple Android versions** if possible
- **Keep your keystore safe** (you'll need it for updates)
- **Check logs** with `adb logcat` if something doesn't work

---

**Ready to start?** Open `ANDROID_CLI_SETUP.md` and follow the setup instructions! 🚀


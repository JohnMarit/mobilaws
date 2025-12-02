# 📋 Google Play Store Publishing Checklist

Use this checklist to ensure you've completed all steps before submitting your Mobilaws app to the Play Store.

## ✅ Pre-Development Setup

- [ ] Android Studio installed and configured
- [ ] Java JDK 17+ installed
- [ ] JAVA_HOME environment variable set
- [ ] Android SDK tools in PATH
- [ ] Node.js 18+ installed

## 🔨 Development & Testing

- [ ] App builds successfully: `npm run build`
- [ ] Android syncs without errors: `npm run android:sync`
- [ ] App opens in Android Studio: `npm run android:open`
- [ ] App runs on physical device
- [ ] App runs on Android emulator
- [ ] All features work correctly on Android
- [ ] Firebase authentication works on Android
- [ ] Chat/AI features work correctly
- [ ] Search functionality works
- [ ] UI looks good on different screen sizes
- [ ] Tested on Android 6.0+ (API 23+)
- [ ] No crashes or major bugs
- [ ] App performs well (smooth scrolling, fast loading)

## 🔐 Security & Signing

- [ ] Generated signing keystore file
- [ ] Keystore password saved securely (password manager)
- [ ] Key alias and password documented
- [ ] Keystore file backed up (at least 2 locations)
- [ ] Created `android/app/keystore.properties`
- [ ] Configured signing in `android/app/build.gradle`
- [ ] Keystore added to `.gitignore` (already done)
- [ ] Test signed release build works

## 🔥 Firebase Configuration

- [ ] `google-services.json` downloaded from Firebase Console
- [ ] `google-services.json` placed in `android/app/`
- [ ] Package name matches: `com.mobilaws.app`
- [ ] Firebase authentication enabled for Android
- [ ] SHA-1 fingerprint added to Firebase (if needed)
- [ ] Tested Firebase features on Android
- [ ] `google-services.json` in `.gitignore` (already done)

## 🎨 App Assets

### App Icon
- [ ] App icon created (512 x 512 px, PNG, 32-bit)
- [ ] Icon follows Google design guidelines
- [ ] Icon clear and recognizable at small sizes
- [ ] No transparency in icon
- [ ] No rounded corners (Android handles this)
- [ ] Generated all required densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] Icons placed in correct `mipmap-*` folders

### Screenshots
- [ ] Minimum 2 screenshots taken
- [ ] Screenshots are 1080 x 1920 px (or similar 9:16 ratio)
- [ ] Screenshots show key features
- [ ] Screenshots use real content (not placeholders)
- [ ] Tablet screenshots (optional but recommended)
- [ ] Screenshots look professional

### Feature Graphic
- [ ] Feature graphic created (1024 x 500 px)
- [ ] Graphic showcases app name and key feature
- [ ] High quality, professional appearance

### Optional Assets
- [ ] Promo graphic (180 x 120 px) - optional
- [ ] TV banner (1280 x 720 px) - if supporting Android TV
- [ ] Promo video recorded - optional but recommended

## 📝 Store Listing Content

### App Information
- [ ] App name finalized: "Mobilaws - Access to Justice" (or your choice)
- [ ] Short description written (80 characters max)
- [ ] Full description written (4000 characters max)
- [ ] Description highlights key features
- [ ] Description mentions AI, Constitution, laws
- [ ] Category selected: Books & Reference or Education
- [ ] Tags/keywords chosen
- [ ] Contact email provided
- [ ] Website URL provided (optional)

### Privacy & Legal
- [ ] Privacy policy created
- [ ] Privacy policy covers:
  - [ ] What data is collected
  - [ ] How data is used
  - [ ] Firebase usage
  - [ ] Third-party services (OpenAI, Google)
  - [ ] User rights
- [ ] Privacy policy hosted online (URL available)
- [ ] Privacy policy URL added to app listing

### Content Rating
- [ ] Content rating questionnaire completed
- [ ] IARC certificate obtained
- [ ] Age rating appropriate

## 🏗️ Build Configuration

### Version Information
- [ ] Version name set in `android/app/build.gradle`: e.g., "1.0.0"
- [ ] Version code set: 1 (increment for each release)
- [ ] Version matches across all configuration files

### Build Settings
- [ ] Release build type configured
- [ ] ProGuard rules set (if using)
- [ ] Signing config added to build.gradle
- [ ] Build succeeds without warnings (critical ones)

### App Permissions
- [ ] Only necessary permissions requested in AndroidManifest.xml
- [ ] Permissions justified in store listing
- [ ] Privacy policy mentions permissions

## 📦 Release Build

- [ ] Web assets built: `npm run build`
- [ ] Synced to Android: `npx cap sync android`
- [ ] Release AAB built: `cd android && ./gradlew bundleRelease`
- [ ] AAB file exists: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] AAB file size is reasonable (< 50 MB)
- [ ] Installed and tested signed release build
- [ ] No debug code or logging in release
- [ ] No hardcoded test credentials
- [ ] All API keys are in environment variables

## 🏪 Play Store Account

- [ ] Google Play Developer account created
- [ ] $25 registration fee paid
- [ ] Identity verification completed
- [ ] Account in good standing
- [ ] Payment profile set up (if paid app)

## 📤 App Submission

### App Access
- [ ] App access information provided
- [ ] Test account credentials provided (if login required)
- [ ] Instructions for reviewers provided

### Store Presence
- [ ] App name entered
- [ ] Short description entered
- [ ] Full description entered
- [ ] App icon uploaded (512x512)
- [ ] Feature graphic uploaded (1024x500)
- [ ] Screenshots uploaded (min 2)
- [ ] Category selected
- [ ] Contact details added
- [ ] Privacy policy URL added

### Content & Ratings
- [ ] Content rating completed
- [ ] Target audience selected
- [ ] News apps declaration (if applicable)
- [ ] COVID-19 declarations (if applicable)
- [ ] Data safety section completed

### Pricing & Distribution
- [ ] Free or paid selected
- [ ] Countries/regions selected
- [ ] Distribution settings configured
- [ ] Content guidelines confirmed
- [ ] US export laws confirmed
- [ ] Government app declaration (if applicable)

### Release
- [ ] Production track selected
- [ ] Release name entered
- [ ] Release notes written (what's new)
- [ ] AAB file uploaded
- [ ] All sections have green checkmarks
- [ ] Reviewed all information for accuracy

## 🚀 Pre-Submission Final Checks

- [ ] Tested release build on physical device
- [ ] App starts without crashes
- [ ] All features functional
- [ ] No placeholder text or content
- [ ] Branding is consistent
- [ ] App name correct everywhere
- [ ] Version numbers correct
- [ ] Screenshots match current version
- [ ] Privacy policy accessible and correct
- [ ] Contact email monitored
- [ ] Ready to respond to user reviews

## 📧 Post-Submission

- [ ] Submission confirmation received
- [ ] Review status monitored in Play Console
- [ ] Prepared to respond to rejection reasons (if any)
- [ ] Marketing materials ready
- [ ] Social media posts prepared
- [ ] Website updated with Play Store link

## 🎯 After Approval

- [ ] App appears in Play Store
- [ ] Download and test from Play Store
- [ ] Monitor crash reports in Play Console
- [ ] Monitor user reviews
- [ ] Respond to user feedback
- [ ] Track download statistics
- [ ] Plan first update

## 🔄 For Future Updates

- [ ] Increment version code (e.g., 1 → 2)
- [ ] Update version name (e.g., 1.0.0 → 1.1.0)
- [ ] Write clear release notes
- [ ] Test update process
- [ ] Build new AAB
- [ ] Upload to Play Console
- [ ] Create new release in Production track

---

## 📊 Quick Reference

### Version Numbering
```
versionCode: Integer that must increase with each release (1, 2, 3, ...)
versionName: String visible to users (1.0.0, 1.1.0, 2.0.0, ...)
```

### Build Commands
```bash
# Build web assets
npm run build

# Sync to Android
npm run android:sync

# Open in Android Studio
npm run android:open

# Build release AAB
cd android && ./gradlew bundleRelease

# Build release APK (for testing)
cd android && ./gradlew assembleRelease
```

### Important Files
```
android/app/build.gradle                              - Version numbers, signing config
android/app/src/main/AndroidManifest.xml             - Permissions, app config
android/app/src/main/res/values/strings.xml          - App name
android/app/keystore.properties                       - Signing credentials (don't commit)
android/app/google-services.json                      - Firebase config (don't commit)
android/app/build/outputs/bundle/release/app-release.aab  - Upload this to Play Store
```

---

## 🆘 Common Issues

### Submission Rejected?
- Check rejection reason in Play Console
- Most common: privacy policy, inappropriate content, crashes
- Fix issue and resubmit

### App Crashes?
- Check crash reports in Play Console
- Test on multiple devices
- Check Firebase logs
- Use `adb logcat` for debugging

### Can't Sign AAB?
- Verify keystore path and passwords
- Check `keystore.properties` configuration
- Ensure keystore file exists and isn't corrupted

### Assets Rejected?
- Icon too small or wrong format
- Screenshots don't meet requirements
- Feature graphic doesn't follow guidelines
- Re-create and resubmit

---

**Time Estimate**: First-time submission takes 2-4 hours of work + 1-3 days review time

**Approval Rate**: ~95% of properly prepared apps are approved on first submission

**Support**: See [ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md](./ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md) for detailed help

Good luck! 🍀📱


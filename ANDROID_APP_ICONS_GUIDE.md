# 📱 Android App Icons Guide

Quick guide to customize your app icon for the Mobilaws Android app.

## Current Setup

The Android app currently uses the default Capacitor icon. Let's replace it with your custom `mobilogo.png`.

## Required Icon Sizes

Android needs multiple icon sizes for different screen densities:

| Density | Size | Location |
|---------|------|----------|
| mdpi | 48 x 48 px | `android/app/src/main/res/mipmap-mdpi/` |
| hdpi | 72 x 72 px | `android/app/src/main/res/mipmap-hdpi/` |
| xhdpi | 96 x 96 px | `android/app/src/main/res/mipmap-xhdpi/` |
| xxhdpi | 144 x 144 px | `android/app/src/main/res/mipmap-xxhdpi/` |
| xxxhdpi | 192 x 192 px | `android/app/src/main/res/mipmap-xxxhdpi/` |

## Quick Setup Options

### Option 1: Use Online Tool (Easiest)

1. Go to: https://icon.kitchen/
2. Upload your `mobilogo.png`
3. Customize as needed
4. Download the Android icon set
5. Extract and replace files in `android/app/src/main/res/`

### Option 2: Use Android Studio (Recommended)

1. Open project in Android Studio:
   ```bash
   npm run android:open
   ```

2. Right-click on `app` → **New** → **Image Asset**

3. Select **Launcher Icons (Adaptive and Legacy)**

4. Choose your source image (`mobilogo.png`)

5. Adjust settings:
   - **Foreground Layer**: Your logo
   - **Background Layer**: Solid color or image
   - **Legacy/Round**: Will be generated automatically

6. Click **Next** → **Finish**

### Option 3: Manual Resize

Use an image editor (Photoshop, GIMP, etc.) to create each size:

1. Resize `mobilogo.png` to each required size
2. Save as `ic_launcher.png` (standard) and `ic_launcher_round.png` (round)
3. Place in respective `mipmap-*` folders

## Icon Design Guidelines

### Best Practices

✅ **Do:**
- Use simple, recognizable design
- High contrast for visibility
- Test at smallest size (48x48)
- Use PNG format with transparency
- Follow Material Design guidelines

❌ **Don't:**
- Use text (hard to read when small)
- Use complex gradients
- Add rounded corners manually (Android handles this)
- Use very thin lines
- Include shadows (Material Design handles depth)

### Adaptive Icons (Android 8.0+)

Modern Android uses adaptive icons with:
- **Foreground layer**: Your logo (108x108 safe zone)
- **Background layer**: Solid color or pattern

```
Total canvas: 108 x 108 dp
Safe zone: 66 x 66 dp (center)
Outside safe zone may be masked
```

## Current Mobilaws Logo

Your `mobilogo.png` is already in the project root. To use it:

### Quick Command (if you have ImageMagick installed)

```bash
# Install ImageMagick: https://imagemagick.org/script/download.php

# Generate all sizes
magick mobilogo.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
magick mobilogo.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
magick mobilogo.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
magick mobilogo.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
magick mobilogo.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# For round icons (same sizes)
magick mobilogo.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
magick mobilogo.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
magick mobilogo.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
magick mobilogo.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
magick mobilogo.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
```

## Splash Screen

The splash screen appears while your app loads. To customize:

### Update Splash Colors

Edit `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:background">@color/ic_launcher_background</item>
</style>
```

### Add Custom Splash Image

1. Add `splash.png` (2732 x 2732 px) to:
   - `android/app/src/main/res/drawable/`
   - `android/app/src/main/res/drawable-land/` (landscape)

2. Update `styles.xml`:
   ```xml
   <item name="android:background">@drawable/splash</item>
   ```

## Verification

After updating icons:

1. **Rebuild the app**:
   ```bash
   npm run android:sync
   ```

2. **Run on device**:
   ```bash
   npm run android:run
   ```

3. **Check**:
   - Home screen icon
   - App drawer icon
   - Recent apps icon
   - Settings icon

## Play Store Icon

For the Play Store listing, you need a separate high-res icon:

- **Size**: 512 x 512 px
- **Format**: PNG (32-bit, no alpha)
- **Upload**: Google Play Console → Store Listing

```bash
# Generate Play Store icon
magick mobilogo.png -resize 512x512 play-store-icon.png
```

## Troubleshooting

**Icons not updating?**
```bash
# Clear app data and rebuild
npm run android:sync
# In Android Studio: Build → Clean Project → Rebuild Project
```

**Wrong icon shape?**
- Android 8+ uses adaptive icons
- Some launchers apply different masks (circle, square, rounded)
- Test on multiple devices/launchers

**Blurry icons?**
- Ensure you're providing all density sizes
- Don't use upscaled low-res images
- Start with high-res source (at least 512x512)

## Resources

- **Icon Kitchen**: https://icon.kitchen/ (automatic generator)
- **Material Design Icons**: https://material.io/design/iconography
- **Android Asset Studio**: http://romannurik.github.io/AndroidAssetStudio/
- **Capacitor Assets**: `npm install @capacitor/assets` (official plugin)

## Using Capacitor Assets Plugin (Advanced)

Install official assets plugin:

```bash
npm install @capacitor/assets --save-dev
```

Configure in `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  // ... existing config
  
  plugins: {
    CapacitorAssets: {
      iconForeground: 'assets/icon-foreground.png',
      iconBackground: '#ffffff',
      splashBackgroundColor: '#ffffff',
      splashImage: 'assets/splash.png'
    }
  }
};
```

Generate assets:

```bash
npx capacitor-assets generate --android
```

---

**Tip**: Keep your source logo in vector format (SVG) at the highest quality possible for future updates and scaling.

Happy designing! 🎨


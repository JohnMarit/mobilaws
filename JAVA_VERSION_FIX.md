# ⚠️ Java Version Issue - Quick Fix

## Problem

You have Java 25 installed, but Android Gradle builds require Java 17. The error `Unsupported class file major version 69` means Java 25 (version 69) is too new.

## Solution Options

### Option 1: Install Java 17 (Recommended)

1. **Download Java 17:**
   - Go to: https://adoptium.net/temurin/releases/?version=17
   - Download: **OpenJDK 17 LTS** for Windows x64
   - Choose the `.msi` installer

2. **Install Java 17:**
   - Run the installer
   - **Important:** During installation, check "Set JAVA_HOME variable"
   - Complete the installation

3. **Verify Installation:**
   ```powershell
   java -version
   # Should show: openjdk version "17.x.x"
   ```

4. **Build AAB:**
   ```powershell
   ./build-aab.ps1
   ```

---

### Option 2: Set JAVA_HOME Temporarily (If you already have Java 17)

If you have Java 17 installed but it's not the default:

1. **Find Java 17 Installation:**
   ```powershell
   # Common locations:
   # C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
   # C:\Program Files\Java\jdk-17.x.x
   ```

2. **Set JAVA_HOME for current session:**
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot"
   $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
   ```

3. **Verify:**
   ```powershell
   java -version
   # Should show version 17
   ```

4. **Build AAB:**
   ```powershell
   ./build-aab.ps1
   ```

---

### Option 3: Use Gradle Properties (Alternative)

Create a file: `android/gradle.properties` and add:

```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.13.11-hotspot
```

Replace the path with your actual Java 17 installation path.

---

## Why This Happens

- **Java 25** is installed on your system
- **Android Gradle Plugin 8.7.2** requires Java 17
- Gradle runs using the system's default Java version
- Even though we configured the build to target Java 17, Gradle itself needs Java 17 to run

---

## After Installing Java 17

Once Java 17 is installed and set as default:

```powershell
# Verify Java version
java -version
# Should show: openjdk version "17.x.x"

# Build the AAB
./build-aab.ps1
```

The AAB file will be created at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Quick Commands

**Check current Java version:**
```powershell
java -version
```

**Find Java installations:**
```powershell
Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory
Get-ChildItem "C:\Program Files\Java" -Directory
```

**Set JAVA_HOME permanently (Windows):**
```powershell
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot', 'Machine')
```
(Requires admin PowerShell, restart terminal after)

---

## Recommended Action

1. Download and install Java 17 from: https://adoptium.net/temurin/releases/?version=17
2. Restart your terminal
3. Run: `./build-aab.ps1`

That's it! The build should complete successfully with Java 17.

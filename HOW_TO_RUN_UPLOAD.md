# 📋 How to Run the Upload Script

## 🎯 Quick Answer

Run it in **PowerShell** from your project folder: `C:\Users\John\Desktop\Mobilaws`

---

## 📝 Step-by-Step Instructions

### Method 1: Using File Explorer (Easiest)

1. **Open File Explorer**
   - Press `Windows Key + E`

2. **Navigate to your project:**
   - Go to: `C:\Users\John\Desktop\Mobilaws`

3. **Open PowerShell in that folder:**
   - Click in the address bar (where it shows the path)
   - Type: `powershell` and press Enter
   - OR right-click in the folder → "Open in Terminal" (if available)
   - OR hold `Shift` and right-click in empty space → "Open PowerShell window here"

4. **Run the script:**
   ```powershell
   .\upload-documents.ps1
   ```

---

### Method 2: Using PowerShell Directly

1. **Open PowerShell:**
   - Press `Windows Key`
   - Type: `PowerShell`
   - Press Enter (or click "Windows PowerShell")

2. **Navigate to your project:**
   ```powershell
   cd "C:\Users\John\Desktop\Mobilaws"
   ```

3. **Run the script:**
   ```powershell
   .\upload-documents.ps1
   ```

---

### Method 3: Using VS Code (If You Have It)

1. **Open VS Code**
2. **Open your project folder:**
   - File → Open Folder
   - Select: `C:\Users\John\Desktop\Mobilaws`

3. **Open Terminal in VS Code:**
   - Press `` Ctrl + ` `` (backtick key)
   - OR: Terminal → New Terminal

4. **Run the script:**
   ```powershell
   .\upload-documents.ps1
   ```

---

## ✅ What You Should See

After running the script, you should see:

```
📄 Mobilaws Document Uploader
================================

📁 Looking for documents in: LAW\

✅ Found PDF files:
   - Penal-Code-Act-South-Sudan-2008.pdf
   - south sudan laws.pdf

📤 Ready to upload 2 file(s) to backend...
   Backend URL: https://mobilaws-ympe.vercel.app/api/upload

Continue? (Y/N):
```

**Type `Y` and press Enter** to continue!

---

## 🐛 Troubleshooting

### "Script cannot be loaded because running scripts is disabled"
**Fix:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then try again.

### "Cannot find path"
**Fix:** Make sure you're in the right folder:
```powershell
cd "C:\Users\John\Desktop\Mobilaws"
pwd  # This should show: C:\Users\John\Desktop\Mobilaws
```

### "File not found"
**Fix:** Make sure the script exists:
```powershell
ls upload-documents.ps1
```
Should show the file. If not, you might be in the wrong folder.

---

## 🎯 Quick Copy-Paste Commands

**If you're already in PowerShell, just copy and paste these:**

```powershell
cd "C:\Users\John\Desktop\Mobilaws"
.\upload-documents.ps1
```

**That's it!** 🚀

---

## 💡 Visual Guide

```
1. Open PowerShell
   ↓
2. Type: cd "C:\Users\John\Desktop\Mobilaws"
   ↓
3. Press Enter
   ↓
4. Type: .\upload-documents.ps1
   ↓
5. Press Enter
   ↓
6. Type: Y (when asked)
   ↓
7. Press Enter
   ↓
8. Wait for upload to complete! ✅
```

---

**Ready?** Open PowerShell and run it! 🚀


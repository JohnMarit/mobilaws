# Fix: usePromptLimit Must Be Used Within PromptLimitProvider

## 🔴 Problem
You're seeing this error even though the code is correct:
```
Uncaught Error: usePromptLimit must be used within a PromptLimitProvider
```

## ✅ Solution: Browser/Vite Cache Issue

The problem is **not** with your code - it's a caching issue. The browser and Vite are showing an old version of `App.tsx` that doesn't have all the context providers.

## 🔧 Quick Fix (Do This Now)

### Step 1: Clear Everything
Run this script we created:
```powershell
powershell -ExecutionPolicy Bypass -File restart-dev.ps1
```

This will:
- Stop all old Node processes
- Clear Vite cache
- Clear dist folder

### Step 2: Restart Backend Server
```bash
cd ai-backend
npm start
```

Wait for this message:
```
✅ Server ready to accept requests
```

### Step 3: Restart Frontend Server
In a **new terminal**:
```bash
npm run dev
```

Wait for:
```
➜  Local:   http://localhost:XXXX/
```

### Step 4: Hard Refresh Browser
1. Open your browser
2. Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)
3. Or press **Ctrl+F5**
4. Or open DevTools (F12) and right-click the refresh button → "Empty Cache and Hard Reload"

## 🔍 How to Verify It's Fixed

Open browser DevTools console (F12) and look for:

### ✅ Good Signs:
```
✅ Google OAuth initialized successfully
```
or
```
⚠️ Firebase not installed - using fallback Google OAuth
```

### ❌ Bad Signs (Still Cached):
```
Error: usePromptLimit must be used within a PromptLimitProvider
```

If you still see the error, try:
1. Close **all** browser tabs with localhost:XXXX
2. Clear browser cache completely (Ctrl+Shift+Delete)
3. Restart browser
4. Navigate to localhost:XXXX again

## 📋 Manual Cache Clear (If Script Doesn't Work)

### Option 1: PowerShell Commands
```powershell
# Stop Node processes
Get-Process -Name "node" | Stop-Process -Force

# Clear Vite cache
Remove-Item -Recurse -Force node_modules\.vite

# Clear dist
Remove-Item -Recurse -Force dist
```

### Option 2: Command Prompt
```cmd
# Stop Node (you'll need to close terminals manually)

# Clear Vite cache
rmdir /s /q node_modules\.vite

# Clear dist
rmdir /s /q dist
```

### Option 3: Manually
1. Close all terminals running Node
2. Delete folder: `node_modules\.vite`
3. Delete folder: `dist`
4. Restart servers

## 🎯 Why This Happened

When you make changes to critical files like `App.tsx`, sometimes:
1. **Vite's hot module replacement (HMR)** doesn't catch the change
2. **Browser caches** the old JavaScript bundle
3. **Old Node processes** keep serving stale files

The solution is to:
- Kill old processes
- Clear Vite's cache
- Force browser to reload everything

## 🔄 Best Practices to Avoid This

### 1. Always Restart Dev Server for Critical Changes
When editing these files, restart the dev server:
- `App.tsx`
- Context provider files
- `main.tsx`
- Configuration files

### 2. Use Hard Refresh Often
Get in the habit of pressing **Ctrl+Shift+R** when:
- Making provider changes
- Something doesn't update
- Seeing unexpected errors

### 3. Check for Multiple Node Processes
If things seem weird:
```powershell
Get-Process -Name "node"
```

If you see multiple old processes, kill them all:
```powershell
Get-Process -Name "node" | Stop-Process -Force
```

### 4. Clear Vite Cache Regularly
If you frequently encounter cache issues:
```bash
# Before starting dev server
rm -rf node_modules/.vite
npm run dev
```

## 🆘 Still Not Working?

### Nuclear Option: Full Reset
```powershell
# 1. Stop everything
Get-Process -Name "node" | Stop-Process -Force

# 2. Clean everything
Remove-Item -Recurse -Force node_modules\.vite
Remove-Item -Recurse -Force dist
npm cache clean --force

# 3. Reinstall (if needed)
# npm install

# 4. Start fresh
cd ai-backend; npm start  # Terminal 1
npm run dev               # Terminal 2

# 5. Hard refresh browser
# Ctrl+Shift+R
```

### Check App.tsx is Correct
Verify your `src/App.tsx` has all providers:
```tsx
<QueryClientProvider>
  <TooltipProvider>
    <AuthProvider>           {/* ✅ Must be here */}
      <SubscriptionProvider> {/* ✅ Must be here */}
        <PromptLimitProvider> {/* ✅ Must be here */}
          <CounselNameProvider> {/* ✅ Must be here */}
            <ChatProvider>
              {/* Routes */}
            </ChatProvider>
          </CounselNameProvider>
        </PromptLimitProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </TooltipProvider>
</QueryClientProvider>
```

## ✅ Success Checklist

- [ ] Ran `restart-dev.ps1` script
- [ ] Backend server started successfully
- [ ] Frontend server started successfully
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] No error in console
- [ ] Can see "Google OAuth initialized" message
- [ ] App loads without errors

## 📞 If All Else Fails

1. Verify `src/App.tsx` has all providers (check above)
2. Check if `src/contexts/FirebaseAuthContext.tsx` exists and exports `AuthProvider`
3. Ensure no TypeScript compilation errors
4. Check browser console for import errors
5. Try incognito/private browsing mode

---

**Remember**: This is a caching issue, not a code issue. The code in `src/App.tsx` is correct!


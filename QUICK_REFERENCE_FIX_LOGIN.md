# 🚨 QUICK REFERENCE: Fix Login in 5 Minutes

## The Error You're Seeing
```
iframe.js:311 Info: The current domain is not authorized for OAuth operations.
Add your domain (www.mobilaws.com) to the OAuth redirect domains list.
```

## The Solution (2 Simple Steps)

---

## ⚡ STEP 1: Firebase Console (2 min)

**Open this URL:**
```
https://console.firebase.google.com/project/mobilaws-46056/authentication/settings
```

**Then do this:**
1. Scroll to "Authorized domains" section
2. Click "Add domain" button
3. Type: `www.mobilaws.com`
4. Click "Add"
5. Click "Add domain" again
6. Type: `mobilaws.com`
7. Click "Add"

**Verify these 4 domains are listed:**
- ✅ localhost
- ✅ mobilaws.com
- ✅ www.mobilaws.com
- ✅ mobilaws-46056.firebaseapp.com

---

## ⚡ STEP 2: Google Cloud Console (3 min)

**Open this URL:**
```
https://console.cloud.google.com/apis/credentials?project=mobilaws-46056
```

**Then do this:**
1. Click on "Web client (auto created by Google Service)"
2. Scroll to "Authorized JavaScript origins"
3. Click "ADD URI" and add: `https://www.mobilaws.com`
4. Click "ADD URI" and add: `https://mobilaws.com`
5. Scroll to "Authorized redirect URIs"
6. Click "ADD URI" and add: `https://www.mobilaws.com/__/auth/handler`
7. Click "ADD URI" and add: `https://mobilaws.com/__/auth/handler`
8. **Click "SAVE" at the bottom** ⚠️ Don't forget this!

**Double-check you added:**

JavaScript Origins:
- ✅ `https://www.mobilaws.com`
- ✅ `https://mobilaws.com`

Redirect URIs (note the `__` double underscore):
- ✅ `https://www.mobilaws.com/__/auth/handler`
- ✅ `https://mobilaws.com/__/auth/handler`

---

## ✅ Test It Works

1. Clear browser cache: `Ctrl + Shift + Delete`
2. Go to: https://www.mobilaws.com
3. Click "Continue with Google"
4. Should work! ✅

---

## 📋 Copy-Paste Values

### For Firebase Console:
```
www.mobilaws.com
mobilaws.com
```

### For Google Cloud Console JavaScript Origins:
```
https://www.mobilaws.com
https://mobilaws.com
```

### For Google Cloud Console Redirect URIs:
```
https://www.mobilaws.com/__/auth/handler
https://mobilaws.com/__/auth/handler
```

---

## 🎯 Quick Links

| Console | Direct Link |
|---------|-------------|
| **Firebase** | https://console.firebase.google.com/project/mobilaws-46056/authentication/settings |
| **Google Cloud** | https://console.cloud.google.com/apis/credentials?project=mobilaws-46056 |
| **Your Site** | https://www.mobilaws.com |

---

## ⚠️ Important

- Use `https://` not `http://` for production URLs
- Note the **double underscore** `__` in `/__/auth/handler`
- Click **SAVE** in Google Cloud Console
- Both steps are required - do not skip either one

---

## 🎉 Done!

After both steps:
- ✅ Users can login
- ✅ Token system works
- ✅ Subscriptions work
- ✅ No more OAuth errors

**Total time: 5 minutes**

---

For detailed guides, see:
- `ACTION_PLAN_FIX_LOGIN.md` - Complete overview
- `FIX_LOGIN_NOW.md` - Detailed step-by-step
- `verify-oauth-setup.ps1` - Check your config


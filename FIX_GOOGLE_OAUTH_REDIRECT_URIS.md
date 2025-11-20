# 🔧 Fix Google OAuth - Add Redirect URIs to Google Cloud Console

## Why You Need This

Firebase Authentication uses Google Cloud OAuth. You need to configure **BOTH**:
1. ✅ Firebase Console (Authorized Domains) - [See FIX_LOGIN_OAUTH_DOMAIN.md]
2. ✅ Google Cloud Console (OAuth Redirect URIs) - **This guide**

## ⚡ Quick Fix (3 Minutes)

### Step 1: Open Google Cloud Console

1. Go to: **https://console.cloud.google.com/**
2. Select your project (should be the same as Firebase: **mobilaws-46056**)

### Step 2: Navigate to OAuth Credentials

1. Click the hamburger menu (☰) in the top-left
2. Navigate to: **APIs & Services** → **Credentials**
3. Or go directly to: https://console.cloud.google.com/apis/credentials

### Step 3: Find Your OAuth 2.0 Client ID

Look for an entry like:
- **Web client (auto created by Google Service)**
- Or your custom OAuth client ID

Click on the client ID to edit it.

### Step 4: Add Authorized JavaScript Origins

In the **"Authorized JavaScript origins"** section, add:

```
https://www.mobilaws.com
https://mobilaws.com
https://mobilaws-46056.firebaseapp.com
```

Click **"ADD URI"** for each one.

### Step 5: Add Authorized Redirect URIs

In the **"Authorized redirect URIs"** section, add:

```
https://www.mobilaws.com/__/auth/handler
https://mobilaws.com/__/auth/handler
https://mobilaws-46056.firebaseapp.com/__/auth/handler
```

**Important:** The `__/auth/handler` path is Firebase's OAuth callback endpoint!

### Step 6: Save Changes

1. Click **"SAVE"** at the bottom
2. Wait a few seconds for changes to propagate

## 📋 Complete List of URIs to Add

### For Production (www.mobilaws.com):

**JavaScript Origins:**
```
https://www.mobilaws.com
https://mobilaws.com
```

**Redirect URIs:**
```
https://www.mobilaws.com/__/auth/handler
https://mobilaws.com/__/auth/handler
```

### For Firebase Hosting:

**JavaScript Origins:**
```
https://mobilaws-46056.firebaseapp.com
```

**Redirect URIs:**
```
https://mobilaws-46056.firebaseapp.com/__/auth/handler
```

### For Development (localhost):

**JavaScript Origins:**
```
http://localhost
http://localhost:5173
http://localhost:8080
http://localhost:3000
```

**Redirect URIs:**
```
http://localhost:5173/__/auth/handler
http://localhost:8080/__/auth/handler
http://localhost:3000/__/auth/handler
```

### For Vercel (if using):

**JavaScript Origins:**
```
https://mobilaws.vercel.app
```

**Redirect URIs:**
```
https://mobilaws.vercel.app/__/auth/handler
```

## ⚠️ Common Mistakes

1. ❌ **Forgetting the `https://` protocol** - Always include it for production domains
2. ❌ **Using `http://` for production** - Must use `https://` for live sites
3. ❌ **Missing the `__/auth/handler` path** - This is required for Firebase OAuth
4. ❌ **Not including both www and non-www** - Users can access your site either way
5. ❌ **Trailing slashes** - Don't add trailing slashes to the URIs

## ✅ Verification Checklist

After configuring Google Cloud Console:

- [ ] Added `https://www.mobilaws.com` to JavaScript origins
- [ ] Added `https://mobilaws.com` to JavaScript origins  
- [ ] Added `https://www.mobilaws.com/__/auth/handler` to redirect URIs
- [ ] Added `https://mobilaws.com/__/auth/handler` to redirect URIs
- [ ] Clicked "SAVE" button
- [ ] Cleared browser cache
- [ ] Tested login on production site

## 🧪 Test Your Setup

1. Open: **https://www.mobilaws.com**
2. Open browser console (F12)
3. Click "Continue with Google" button
4. You should see Google login popup (not an error)
5. After selecting account, you should be logged in ✅

## 📸 Visual Reference

### Google Cloud Console Path:
```
Google Cloud Console
└── Select Project: mobilaws-46056
    └── APIs & Services
        └── Credentials
            └── OAuth 2.0 Client IDs
                └── [Click on your Web client]
                    ├── Authorized JavaScript origins
                    │   └── [Add URIs here]
                    └── Authorized redirect URIs
                        └── [Add URIs here]
```

## 🔍 Finding Your OAuth Client ID

If you can't find your OAuth client:

1. Go to Google Cloud Console → Credentials
2. Look for type: **"OAuth 2.0 Client ID"**
3. It might be named:
   - "Web client (auto created by Google Service)"
   - "Client for Firebase" 
   - Or a custom name you created

## 🆘 Still Getting Errors?

### Error: "redirect_uri_mismatch"
- **Cause:** The redirect URI doesn't match exactly
- **Fix:** Make sure you added `https://www.mobilaws.com/__/auth/handler` (with double underscore)

### Error: "origin_mismatch"  
- **Cause:** The JavaScript origin doesn't match
- **Fix:** Make sure you added `https://www.mobilaws.com` (with https)

### Error: "unauthorized_client"
- **Cause:** OAuth client is not configured correctly
- **Fix:** Check that the client ID in your `.env` matches the one in Google Cloud Console

## 🔗 Related Fixes

1. **FIX_LOGIN_OAUTH_DOMAIN.md** - Add domains to Firebase Console (do this first!)
2. This guide - Add URIs to Google Cloud Console (you are here)
3. Verify environment variables are correct on your hosting platform

## 🎯 Complete Setup Flow

```
1. Firebase Console → Authentication → Settings → Authorized domains
   └── Add: www.mobilaws.com, mobilaws.com

2. Google Cloud Console → APIs & Services → Credentials → OAuth Client
   ├── Add JavaScript origins: https://www.mobilaws.com
   └── Add Redirect URIs: https://www.mobilaws.com/__/auth/handler

3. Test login on your site ✅
```

## 📝 Notes

- Changes take effect immediately (no deployment needed)
- You can have multiple origins and redirect URIs
- Keep localhost URIs for development
- Add preview/staging domains if you use them


# 🚨 URGENT: Fix Login - Add www.mobilaws.com to Firebase Authorized Domains

## The Problem
Users can't login because `www.mobilaws.com` is not authorized in Firebase for OAuth operations.

**Error:** 
```
The current domain is not authorized for OAuth operations. 
Add your domain (www.mobilaws.com) to the OAuth redirect domains list.
```

## ⚡ Quick Fix (2 Minutes)

### Step 1: Open Firebase Console

1. Go to: **https://console.firebase.google.com/**
2. Select your project: **mobilaws-46056**

### Step 2: Navigate to Authorized Domains

1. Click **"Authentication"** in the left sidebar (shield icon)
2. Click the **"Settings"** tab at the top
3. Scroll down to find **"Authorized domains"** section

### Step 3: Add Your Domain

1. Click the **"Add domain"** button
2. Enter: `www.mobilaws.com`
3. Click **"Add"**

### Step 4: Verify All Required Domains Are Listed

Make sure these domains are in the list:
- ✅ `localhost` (for development)
- ✅ `mobilaws.com` (main domain)
- ✅ `www.mobilaws.com` (www subdomain)
- ✅ Any Vercel preview domains (e.g., `mobilaws.vercel.app`)
- ✅ `mobilaws-46056.firebaseapp.com` (Firebase hosting)

**Note:** If `mobilaws.com` (without www) is not listed, add it too!

### Step 5: Test Login

1. Go to: **https://www.mobilaws.com**
2. Try to login with Google
3. The OAuth popup should now work! ✅

## 📸 Visual Guide

### Where to Find Authorized Domains:

```
Firebase Console
└── Select Project: mobilaws-46056
    └── Authentication (shield icon)
        └── Settings tab
            └── Authorized domains section
                └── [Add domain button]
```

## 🔧 Additional Domains to Add (If Not Already There)

If you're using different environments, add these as well:

### Production Domains:
```
mobilaws.com
www.mobilaws.com
```

### Vercel Domains (if using Vercel):
```
mobilaws.vercel.app
mobilaws-git-main-yourusername.vercel.app
```

### Development (should already be there):
```
localhost
```

## ⚠️ Important Notes

1. **Case Sensitive:** Domain names are case-sensitive in some systems
2. **No Protocols:** Don't include `https://` or `http://` - just the domain name
3. **Wildcards:** Firebase doesn't support wildcards (*.mobilaws.com won't work)
4. **Changes are Instant:** No deployment needed - changes take effect immediately

## ✅ Verification

After adding the domains:

1. Open your website: https://www.mobilaws.com
2. Open browser console (F12)
3. Try to login
4. You should see: **✅ Firebase Google login successful**
5. No more "domain not authorized" errors!

## 🎯 Why This Happened

When you deployed to `www.mobilaws.com`, Firebase needs explicit permission to allow OAuth operations from that domain. This is a security feature to prevent unauthorized websites from using your Firebase authentication.

## 📱 Mobile Apps

If you also have mobile apps, you'll need to:
1. Add your app's bundle ID (iOS) or package name (Android)
2. Configure OAuth for mobile in Firebase Console
3. Follow the platform-specific setup guides

## 🚀 Next Steps After Fixing

Once login works:
1. Test the token system
2. Test subscription flow
3. Verify user data is being saved to Firestore
4. Check that users can access premium features

## 🆘 Still Having Issues?

If you still see errors after adding the domain:

1. **Clear browser cache** and cookies
2. **Try incognito/private mode**
3. **Check Google Cloud Console** OAuth settings:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Make sure `www.mobilaws.com` is in "Authorized JavaScript origins"
   - Make sure redirect URIs include Firebase auth domain

4. **Verify environment variables** are set correctly on your hosting platform

## 📞 Support

If login still doesn't work after these steps:
1. Check Firebase Console logs (Authentication → Users → Sign-in methods)
2. Check browser console for other error messages
3. Verify your Firebase API key is correct in environment variables


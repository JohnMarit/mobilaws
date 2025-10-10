# Complete Content Security Policy for Firebase + Google Auth

## 🔒 Full CSP Configuration

This is the complete Content Security Policy needed for Firebase Authentication with Google Sign-In:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 
    https://www.googletagmanager.com 
    https://accounts.google.com 
    https://www.gstatic.com 
    https://apis.google.com;
  style-src 'self' 'unsafe-inline' 
    https://accounts.google.com;
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' 
    https://www.google-analytics.com 
    https://accounts.google.com 
    https://firebase.googleapis.com 
    https://firebaseinstallations.googleapis.com 
    https://*.googleapis.com 
    http://localhost:* 
    ws://localhost:*;
  frame-src 'self' 
    https://accounts.google.com 
    https://accounts.google.com/gsi/;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://accounts.google.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
">
```

## 📝 Breakdown by Directive

### `script-src` - JavaScript Sources
Allows loading scripts from:
- ✅ `'self'` - Your own domain
- ✅ `'unsafe-inline'` - Inline scripts (needed for React/Vite)
- ✅ `'unsafe-eval'` - eval() usage (needed for React dev)
- ✅ `https://www.googletagmanager.com` - Google Analytics
- ✅ `https://accounts.google.com` - Google Sign-In
- ✅ `https://www.gstatic.com` - Google static content
- ✅ `https://apis.google.com` - **Google API scripts (Firebase Auth needs this!)**

### `connect-src` - Network Connections
Allows connections to:
- ✅ `'self'` - Your own API
- ✅ `https://www.google-analytics.com` - Analytics data
- ✅ `https://accounts.google.com` - Google authentication
- ✅ `https://firebase.googleapis.com` - Firebase APIs
- ✅ `https://firebaseinstallations.googleapis.com` - Firebase installations
- ✅ `https://*.googleapis.com` - All Google APIs (wildcard)
- ✅ `http://localhost:*` - Local development
- ✅ `ws://localhost:*` - WebSocket (Vite HMR)

### `frame-src` - iFrame Sources
Allows embedding iframes from:
- ✅ `'self'` - Your own domain
- ✅ `https://accounts.google.com` - Google Sign-In popup
- ✅ `https://accounts.google.com/gsi/` - Google Sign-In iframe

### Other Directives
- `style-src` - CSS sources
- `img-src` - Image sources (allows all HTTPS for user profile pictures)
- `font-src` - Font sources
- `object-src 'none'` - Blocks plugins
- `base-uri 'self'` - Restricts `<base>` tag
- `form-action` - Form submission targets
- `frame-ancestors 'none'` - Prevents clickjacking

## 🔍 Common CSP Errors & Solutions

### Error: "Refused to load script 'https://apis.google.com/js/api.js'"
**Fix:** Add `https://apis.google.com` to `script-src`

### Error: "Refused to connect to 'https://firebase.googleapis.com'"
**Fix:** Add `https://firebase.googleapis.com` to `connect-src`

### Error: "Refused to connect to 'https://firebaseinstallations.googleapis.com'"
**Fix:** Add `https://firebaseinstallations.googleapis.com` to `connect-src`

### Error: "Refused to frame 'https://accounts.google.com/gsi/'"
**Fix:** Add `https://accounts.google.com/gsi/` to `frame-src`

## 🎯 Production Recommendations

For production, consider:

1. **Remove `'unsafe-inline'` and `'unsafe-eval'`** if possible
   - Use nonces or hashes instead
   - May require build configuration changes

2. **Add your production domain** to relevant directives:
   ```html
   connect-src 'self' https://your-domain.com https://api.your-domain.com ...
   ```

3. **Use Report-Only mode first** to test:
   ```html
   <meta http-equiv="Content-Security-Policy-Report-Only" content="...">
   ```

4. **Set up CSP reporting**:
   ```html
   report-uri https://your-domain.com/csp-report;
   ```

## 🧪 Testing Your CSP

1. Open DevTools (F12)
2. Go to Console tab
3. Look for CSP violations:
   - Should be: **0 violations** ✅
   - If you see violations, add the blocked domain to the appropriate directive

## 📋 Quick Reference

| Service | Required Domains |
|---------|-----------------|
| **Firebase Auth** | `firebase.googleapis.com`, `firebaseinstallations.googleapis.com` |
| **Google Sign-In** | `accounts.google.com`, `accounts.google.com/gsi/`, `apis.google.com` |
| **Firebase Analytics** | `firebase.googleapis.com`, `*.googleapis.com` |
| **Google Static Content** | `www.gstatic.com` |
| **Google Analytics** | `www.google-analytics.com`, `www.googletagmanager.com` |

## ✅ Current Status

Your CSP is now configured with all required domains for:
- ✅ Firebase Authentication
- ✅ Google Sign-In
- ✅ Firebase Analytics
- ✅ Firebase Firestore
- ✅ Development server (localhost)

## 🚀 What's Next?

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Test Google Sign-In** - Should work without CSP errors
3. **Check console** - No more "Refused to load" errors
4. **Verify Firebase** - All services should initialize correctly

---

<div align="center">
  <strong>CSP Configuration Complete! 🎉</strong>
</div>


# 🔧 Fix "Can't continue with google.com" Error

## The Problem

You're getting this error because Google OAuth isn't configured to allow sign-ins from `http://localhost:8080` (your dev server).

## Quick Fix (5 minutes)

### Step 1: Go to Google Cloud Console
1. Visit https://console.cloud.google.com/
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Credentials**

### Step 2: Find Your OAuth Client
- Look for your OAuth 2.0 Client ID in the list
- Click the **pencil icon (✏️)** to edit it
- If you don't have one, click **+ CREATE CREDENTIALS** → **OAuth client ID**

### Step 3: Add Authorized Origins
In the **Authorized JavaScript origins** section, add:
```
http://localhost:8080
```

⚠️ **Important:** Also add these common variations:
```
http://localhost:8080
http://127.0.0.1:8080
```

### Step 4: Add Authorized Redirect URIs (Optional but recommended)
In the **Authorized redirect URIs** section, add:
```
http://localhost:8080
http://localhost:8080/
```

### Step 5: Save Changes
1. Click **SAVE** at the bottom
2. Wait 1-2 minutes for changes to propagate

### Step 6: Test Again
1. Refresh your browser (hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`)
2. Try signing in with Google again
3. It should work now! ✅

## Visual Guide

Your Google Cloud Console OAuth configuration should look like this:

```
OAuth 2.0 Client ID
├── Application type: Web application
├── Name: Mobilaws Web App (or your choice)
│
├── Authorized JavaScript origins
│   ├── http://localhost:8080
│   └── http://127.0.0.1:8080
│
└── Authorized redirect URIs
    ├── http://localhost:8080
    └── http://localhost:8080/
```

## Still Not Working?

### Check Your .env File
Make sure you have the correct Client ID in your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

### Verify the Client ID
1. Copy the Client ID from Google Cloud Console
2. Paste it into your `.env` file
3. Restart your dev server: `npm run dev`

### Clear Browser Cache
Sometimes Google caches OAuth settings:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Check Console for Errors
Open browser DevTools (F12) and look for:
```
✅ Google OAuth initialized successfully
```

If you see errors, they'll tell you what's wrong.

## Common Mistakes

❌ **Wrong Port:** Using `5173` instead of `8080`  
✅ **Correct:** `http://localhost:8080`

❌ **Missing Protocol:** Using `localhost:8080`  
✅ **Correct:** `http://localhost:8080`

❌ **Wrong Client ID:** Copy-paste error in `.env`  
✅ **Correct:** Double-check it matches Google Console

## Production Setup

When deploying to production, add your production URL:

```
https://yourdomain.com
https://www.yourdomain.com
```

## Need to Change Ports?

If you want to use a different port (e.g., 5173):

1. **Edit `vite.config.ts`:**
   ```typescript
   server: {
     host: "::",
     port: 5173,  // Change this
   }
   ```

2. **Update Google Cloud Console:**
   - Add `http://localhost:5173` to Authorized JavaScript origins

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

## Testing Checklist

- [ ] Added `http://localhost:8080` to Google Cloud Console
- [ ] Saved changes and waited 1-2 minutes
- [ ] Verified `VITE_GOOGLE_CLIENT_ID` in `.env` file
- [ ] Restarted dev server (`npm run dev`)
- [ ] Hard refreshed browser (`Ctrl+Shift+R`)
- [ ] Tried signing in with Google
- [ ] Checked browser console for errors

## Success! 🎉

Once configured correctly, you should see:
1. Google sign-in popup opens
2. You select your Google account
3. Console shows: `✅ User logged in successfully`
4. Your profile appears in the app

---

**Still stuck?** Check the browser console (F12) for detailed error messages and share them for more specific help.


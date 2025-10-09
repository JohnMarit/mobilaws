# Google Sign-in Button Troubleshooting Guide

## Issue: Google Sign-in Button Not Appearing

If you're not seeing the Google sign-in button, follow this step-by-step troubleshooting guide.

## Step 1: Check Environment Variables

### Create/Update .env File
1. Create a `.env` file in your project root (same level as `package.json`)
2. Add your Google OAuth Client ID:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Get Google OAuth Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Identity
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "OAuth 2.0 Client IDs"
6. Choose "Web application"
7. Add authorized origins:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
8. Copy the Client ID

## Step 2: Use the Debug Panel

### Access Debug Panel
1. Start your development server: `npm run dev`
2. Open the app in your browser
3. Click the **🐛 Bug icon** in the top-right corner (mobile) or top bar (desktop)
4. This will show the Google OAuth Debug Panel

### Check Debug Information
The debug panel will show:
- ✅/❌ Google Script Loaded
- ✅/❌ Client ID Set
- Real-time debug log with timestamps

## Step 3: Test the Authentication Flow

### Method 1: Use Debug Panel
1. Open the debug panel (🐛 icon)
2. Click "Test Google OAuth" button
3. Check the debug log for any errors

### Method 2: Test Login Modal
1. Send 3 prompts as an anonymous user
2. On the 4th prompt, the login modal should appear
3. You should see either:
   - Google's native sign-in button, OR
   - A fallback "Continue with Google" button

## Step 4: Check Browser Console

### Open Developer Tools
1. Press `F12` or right-click → "Inspect"
2. Go to the "Console" tab
3. Look for these messages:

**✅ Good Messages:**
```
📜 Google OAuth script loaded
🔧 Initializing Google OAuth with Client ID: 1234567890...
✅ Google OAuth initialized successfully
✅ Google sign-in button rendered
```

**❌ Error Messages:**
```
❌ VITE_GOOGLE_CLIENT_ID is not set in environment variables
❌ Google OAuth script not loaded
❌ Failed to load Google OAuth script
❌ Error initializing Google OAuth: [error details]
```

## Step 5: Common Issues and Solutions

### Issue 1: "Client ID not set"
**Solution:**
- Check your `.env` file exists and has the correct variable name
- Restart your development server after adding the `.env` file
- Make sure there are no spaces around the `=` sign

### Issue 2: "Google OAuth script not loaded"
**Solution:**
- Check your internet connection
- Try refreshing the page
- Check if your firewall/antivirus is blocking the script

### Issue 3: "Invalid client" error
**Solution:**
- Verify your Client ID is correct
- Check that your domain is added to authorized origins in Google Cloud Console
- Make sure you're using the correct Client ID (not the secret)

### Issue 4: Button appears but doesn't work
**Solution:**
- Check browser console for JavaScript errors
- Verify your domain is authorized in Google Cloud Console
- Try in an incognito/private browser window

## Step 6: Manual Testing

### Test Environment Setup
1. **Check .env file:**
   ```bash
   # In your project root
   cat .env
   # Should show: VITE_GOOGLE_CLIENT_ID=your_client_id
   ```

2. **Restart development server:**
   ```bash
   npm run dev
   ```

3. **Clear browser cache:**
   - Press `Ctrl+Shift+R` (hard refresh)
   - Or clear browser cache completely

### Test Authentication Flow
1. Open app in browser
2. Send 3 prompts (you'll see "1/3", "2/3", "3/3")
3. Try 4th prompt → login modal should appear
4. Click Google sign-in button
5. Complete Google OAuth flow
6. Should see your name and "0/20 tokens today"

## Step 7: Advanced Debugging

### Check Network Tab
1. Open Developer Tools → Network tab
2. Refresh the page
3. Look for requests to:
   - `https://accounts.google.com/gsi/client`
   - Any failed requests (red entries)

### Check Application Tab
1. Open Developer Tools → Application tab
2. Check Local Storage for:
   - `user` (should be empty initially)
   - `promptCount` (should be 0 initially)
   - `dailyTokens` (should exist after first load)

### Manual Console Commands
```javascript
// Check if Google OAuth is loaded
console.log('Google loaded:', !!window.google);
console.log('Google accounts:', !!window.google?.accounts);

// Check environment variable
console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

// Check localStorage
console.log('User:', localStorage.getItem('user'));
console.log('Prompt count:', localStorage.getItem('promptCount'));
```

## Step 8: Production Setup

### For Production Deployment
1. Update Google Cloud Console with your production domain
2. Add production domain to authorized origins
3. Update environment variables in your hosting platform
4. Test the complete flow in production

## Still Having Issues?

### Contact Information
If you're still having trouble:

1. **Check the debug panel** - it will show exactly what's wrong
2. **Check browser console** - look for error messages
3. **Verify Google Cloud Console setup** - make sure everything is configured correctly
4. **Try in different browser** - rule out browser-specific issues

### Debug Information to Collect
When asking for help, provide:
- Screenshot of the debug panel
- Browser console error messages
- Your `.env` file (without the actual Client ID)
- Steps you've already tried

## Quick Fix Checklist

- [ ] `.env` file exists with `VITE_GOOGLE_CLIENT_ID=your_client_id`
- [ ] Development server restarted after adding `.env`
- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized origins include `http://localhost:5173`
- [ ] Browser console shows no errors
- [ ] Debug panel shows "Google Script Loaded: ✅"
- [ ] Debug panel shows "Client ID: ✅ Set"

Follow this checklist in order, and the Google sign-in button should appear and work correctly!

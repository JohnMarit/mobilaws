# Setup Instructions - Google Login & Security

## 🎉 What Has Been Fixed

### 1. Google Login
✅ **Fixed duplicate login buttons** - Now shows only ONE clean Google login button  
✅ **Simplified authentication flow** - Uses Firebase with Google OAuth for reliable authentication  
✅ **Better error handling** - Shows clear error messages if login fails  
✅ **Improved UI** - Professional Google-styled button with loading states

### 2. Security Improvements
✅ **Environment Variables** - All sensitive credentials moved to `.env` file  
✅ **Input Validation** - Comprehensive validation and sanitization of user inputs  
✅ **Rate Limiting** - Protection against spam and abuse (10 messages/min client, 30 req/min server)  
✅ **CSP Headers** - Content Security Policy to prevent XSS attacks  
✅ **CORS Configuration** - Properly configured Cross-Origin Resource Sharing  
✅ **Request Validation** - Server-side validation of all API requests  
✅ **Security Headers** - Added X-Frame-Options, X-Content-Type-Options, etc.

## 🚀 Quick Start

### Step 1: Configure Environment Variables

1. Open the `.env` file in the root directory (it was just created)

2. Update the Google OAuth Client ID:
   ```bash
   VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id-here.apps.googleusercontent.com
   ```

3. If needed, update Firebase credentials (currently set to your existing project)

### Step 2: Get Google OAuth Credentials

If you don't have a Google OAuth Client ID yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing one
3. Click "Create Credentials" → "OAuth 2.0 Client ID"
4. Configure consent screen if prompted
5. Application Type: **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:8080` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
7. Add authorized redirect URIs:
   - `http://localhost:8080` (for development)
   - Your production domain
8. Copy the Client ID and paste it in `.env` file

### Step 3: Restart the Development Server

```bash
# Stop the current dev server (Ctrl+C)

# Start it again
npm run dev

# In another terminal, start the backend if needed
npm run server
```

### Step 4: Test the Login

1. Open the app in your browser
2. Click the "Continue with Google" button
3. Complete the Google sign-in flow
4. You should be logged in successfully!

## 📝 Important Notes

### Security Best Practices

1. **Never commit `.env` file**
   - The `.env` file is already in `.gitignore`
   - Never share your credentials publicly
   - Use different credentials for development and production

2. **Update `.env.example`**
   - The `.env.example` file is a template for reference
   - Share this with your team, not the actual `.env` file

3. **Use HTTPS in Production**
   - Google OAuth requires HTTPS in production
   - Use a service like Netlify, Vercel, or enable HTTPS on your server

### Files Modified

Here's what was changed to fix the issues:

1. **`src/components/LoginModal.tsx`**
   - Simplified to show only one button
   - Better error handling and user feedback
   - Cleaner, more professional UI

2. **`src/lib/firebase.ts`**
   - Moved hardcoded credentials to environment variables
   - Added validation for required Firebase config
   - Better error messages

3. **`src/contexts/AuthContext.tsx`**
   - Already had good Firebase integration
   - Improved error handling

4. **`index.html`**
   - Added Content Security Policy headers
   - Added security headers (X-Frame-Options, X-Content-Type-Options, etc.)
   - Added Permissions Policy

5. **`server-openai.ts`**
   - Added rate limiting middleware
   - Added input validation for all endpoints
   - Added security headers
   - Better error handling

6. **New Files Created**
   - `.env` - Your environment variables
   - `.env.example` - Template for environment variables
   - `src/utils/security.ts` - Security utilities
   - `SECURITY.md` - Comprehensive security documentation
   - `SETUP_INSTRUCTIONS.md` - This file

### Environment Variables Reference

```bash
# Google OAuth (REQUIRED)
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com

# Firebase Configuration (REQUIRED)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend Configuration (REQUIRED)
VITE_BACKEND_URL=http://localhost:8000

# OpenAI API (if using AI features)
VITE_OPENAI_API_KEY=your-openai-api-key
```

## 🔧 Troubleshooting

### Login Button Not Working

1. **Check Console for Errors**
   - Open browser DevTools (F12)
   - Look for error messages in Console tab

2. **Verify Environment Variables**
   - Make sure `VITE_GOOGLE_CLIENT_ID` is set in `.env`
   - Restart the dev server after changing `.env`

3. **Check Google Console**
   - Verify authorized origins include your current URL
   - Make sure OAuth consent screen is configured

### "Google OAuth not configured" Error

This means the `VITE_GOOGLE_CLIENT_ID` is not set or not loaded:

1. Check that `.env` file exists in project root
2. Verify the variable is named exactly `VITE_GOOGLE_CLIENT_ID`
3. Restart the development server
4. Clear browser cache and reload

### Firebase Errors

If you see Firebase initialization errors:

1. Check all `VITE_FIREBASE_*` variables are set in `.env`
2. Verify credentials match your Firebase console
3. Make sure Firebase project is active
4. Check Firebase console for any project issues

### Rate Limiting Issues

If you're being rate limited during development:

1. Clear browser localStorage: `localStorage.clear()`
2. Wait 60 seconds for rate limit to reset
3. Adjust rate limits in code if needed for testing:
   - Client: `src/components/ChatInput.tsx` (line ~100)
   - Server: `server-openai.ts` (line ~69)

## 🎯 Testing Checklist

After setup, verify everything works:

- [ ] Login modal shows ONE Google button
- [ ] Clicking button opens Google sign-in popup
- [ ] Can successfully sign in with Google account
- [ ] User info displays correctly after login
- [ ] Can send chat messages without errors
- [ ] Rate limiting prevents spam (try sending 11+ messages quickly)
- [ ] No console errors in browser DevTools
- [ ] Login persists after page refresh

## 📚 Additional Documentation

- **Security Details**: See `SECURITY.md` for comprehensive security documentation
- **API Documentation**: Check existing documentation for API usage
- **Firebase Setup**: Refer to Firebase console for project configuration

## 💡 Tips

1. **Development vs Production**
   - Use different Google OAuth credentials for dev and production
   - Update CORS settings when deploying
   - Enable HTTPS in production

2. **Security**
   - Review `SECURITY.md` for security best practices
   - Keep dependencies updated regularly
   - Monitor for security vulnerabilities

3. **Performance**
   - Rate limits protect your API quota
   - Input validation prevents malicious requests
   - CSP headers improve browser security

## 🆘 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check server logs for backend errors
3. Verify all environment variables are set
4. Review the security documentation
5. Make sure all dependencies are installed

---

**Setup Complete!** 🎉

Your Google login is now fixed with only one working button, and comprehensive security protections are in place to protect your application and users.


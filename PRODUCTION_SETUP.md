# Production Setup Guide

## Google OAuth Production Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google+ API
   - Google Identity

### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
5. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
6. Click "Create"
7. Copy the Client ID (not the secret)

### Step 3: Environment Configuration

Create a `.env` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Important:** 
- Replace `your_google_client_id_here` with your actual Client ID
- No quotes around the value
- No spaces around the `=` sign

### Step 4: Test the Setup

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test the flow:**
   - Send 3 prompts as an anonymous user
   - On the 4th prompt, you should see the login modal
   - Click "Continue with Google" button
   - Complete the Google OAuth flow
   - You should be logged in and see "0/20 tokens today"

### Step 5: Production Deployment

1. **Update Google Cloud Console:**
   - Add your production domain to authorized origins
   - Add your production domain to authorized redirect URIs

2. **Set environment variables in your hosting platform:**
   - Vercel: Add `VITE_GOOGLE_CLIENT_ID` in project settings
   - Netlify: Add environment variable in site settings
   - Other platforms: Follow their environment variable setup

3. **Deploy:**
   ```bash
   npm run build
   # Deploy the dist/ folder to your hosting platform
   ```

## Current Implementation

### What's Fixed:
- ✅ **Always shows login button** - No more empty space in modal
- ✅ **Production-ready** - Debug information only shows in development
- ✅ **Fallback system** - Custom button works even if Google's native button fails
- ✅ **Robust error handling** - Handles all edge cases gracefully

### User Experience:
1. **Anonymous users:** 3 free prompts, then login required
2. **Authenticated users:** 20 tokens per day (resets daily)
3. **Login flow:** One-click Google OAuth authentication
4. **Visual feedback:** Clear token count and user status

### Token System:
- **Anonymous:** 3 prompts total (never resets)
- **Authenticated:** 20 tokens per day (resets at midnight)
- **UI indicators:** Shows current usage and limits
- **Automatic reset:** Daily token refresh for authenticated users

## Troubleshooting

### If login button doesn't appear:
1. Check your `.env` file has the correct Client ID
2. Restart your development server
3. Check browser console for errors
4. Verify Google Cloud Console setup

### If login doesn't work:
1. Check that your domain is authorized in Google Cloud Console
2. Verify the Client ID is correct
3. Check browser console for OAuth errors
4. Try in an incognito window

### Common errors:
- **"Invalid client"** - Wrong Client ID or unauthorized domain
- **"Access blocked"** - Domain not added to authorized origins
- **"Script not loaded"** - Network or firewall issues

## Security Notes

- Client ID is safe to expose in frontend code
- All authentication is handled by Google's secure infrastructure
- User sessions are stored in localStorage
- No sensitive data is exposed to the client

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Google Cloud Console configuration
3. Test with the development debug panel (🐛 icon)
4. Follow the troubleshooting steps above

The system is now production-ready with a reliable Google OAuth implementation!

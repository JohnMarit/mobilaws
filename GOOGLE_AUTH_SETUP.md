# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Mobilaws application.

## Prerequisites

- A Google Cloud Platform account
- Access to the Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity" if not already enabled

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
5. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
6. Click "Create"
7. Copy the Client ID

## Step 4: Configure Environment Variables

Create a `.env` file in the root directory of your project:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# OpenAI Configuration (for backend)
OPENAI_API_KEY=your_openai_api_key_here
```

Replace `your_google_client_id_here` with the Client ID you copied from step 3.

## Step 5: Test the Implementation

1. Start your development server: `npm run dev`
2. Open the application in your browser
3. Try sending 3 prompts without logging in
4. On the 4th prompt, you should see the login modal
5. Click the Google sign-in button - you should be automatically logged in
6. Verify that you now have 20 tokens per day and see your name in the UI

## Features Implemented

- **Token System**: 3 free prompts for anonymous users, 20 tokens per day for authenticated users
- **Google OAuth**: One-click login with Google accounts (no additional popups)
- **User Session**: Persistent login state across browser sessions
- **Visual Indicators**: Shows prompt/token count and user status in the UI
- **Daily Reset**: Tokens automatically reset at midnight each day
- **Logout Functionality**: Users can sign out when needed
- **Automatic Modal Closure**: Login modal closes automatically after successful authentication

## Security Notes

- The Google Client ID is safe to expose in the frontend
- User authentication state is stored in localStorage
- The backend API key should never be exposed to the frontend
- All sensitive operations are handled server-side

## Troubleshooting

### Common Issues

1. **"Invalid client" error**: Check that your Client ID is correct and the domain is authorized
2. **CORS errors**: Ensure your domain is added to authorized JavaScript origins
3. **Login not working**: Check browser console for errors and verify the Google script is loading
4. **Button not appearing**: Make sure the Google script has loaded before the modal opens
5. **Login not automatic**: Verify that the callback function is properly set up in the AuthContext

### Development vs Production

- For development: Use `http://localhost:5173`
- For production: Use your actual domain with HTTPS
- Update the authorized origins in Google Cloud Console accordingly

## Next Steps

After setting up Google OAuth:

1. Test the complete flow with multiple users
2. Consider adding user profile management
3. Implement rate limiting on the backend
4. Add analytics to track usage patterns

# Google OAuth Setup Guide

To enable real Google authentication instead of mock users, follow these steps:

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized origins:
     - `http://localhost:8081` (for development)
     - `https://yourdomain.com` (for production)
   - Copy the Client ID

## 2. Configure Environment Variables

Create a `.env` file in the project root with:

```env
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
```

Replace `your_actual_client_id_here` with the Client ID from Google Cloud Console.

## 3. Restart the Development Server

After setting up the environment variables:

```bash
npm run dev
```

## 4. Test the Authentication

1. Try to send 4 messages (exceeding the 3 free prompts)
2. The login modal should appear
3. Click "Continue with Google"
4. You should see the real Google sign-in popup
5. Sign in with your actual Google account

## Troubleshooting

- **"Google OAuth is not configured"**: Make sure the `.env` file exists and has the correct Client ID
- **"Google OAuth not available"**: Refresh the page to reload the Google OAuth script
- **Popup blocked**: Allow popups for your domain in your browser settings

## Security Notes

- Never commit the `.env` file to version control
- Use different Client IDs for development and production
- Regularly rotate your OAuth credentials
- Monitor usage in Google Cloud Console

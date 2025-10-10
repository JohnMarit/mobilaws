# Firebase Google Sign-In Setup Guide

## 🎯 Quick Setup (5 Minutes)

### Step 1: Create the .env File

**Option A: Using PowerShell Script (Recommended)**
```powershell
.\setup-firebase.ps1
```

**Option B: Manual Setup**
Create a file named `.env` in the project root and add:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDvGE_on74GR18QQrDyx8OdrKEEneD7DpI
VITE_FIREBASE_AUTH_DOMAIN=mobilaws-46056.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mobilaws-46056
VITE_FIREBASE_STORAGE_BUCKET=mobilaws-46056.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=843281701937
VITE_FIREBASE_APP_ID=1:843281701937:web:9b1227398de4a9384ec910
VITE_FIREBASE_MEASUREMENT_ID=G-SEE513K6TJ
```

### Step 2: Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **mobilaws-46056**
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Click **Enable**
6. Choose a public-facing name for your project (e.g., "Mobilaws")
7. Choose a support email (your email)
8. Click **Save**

### Step 3: Add Authorized Domains

Still in the Firebase Console:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Make sure these domains are listed:
   - `localhost` (should be there by default)
   - Your production domain (if deploying)

### Step 4: Start the Development Server

```bash
npm run dev
```

Your app will be available at: **http://localhost:8080**

### Step 5: Test Google Sign-In

1. Open the app at http://localhost:8080
2. Send 3 messages as an anonymous user
3. On the 4th message, the login modal will appear
4. Click **"Continue with Google"**
5. You should see a Google sign-in popup
6. Select your Google account
7. You'll be automatically logged in!

## ✅ Verification

After signing in, you should see:
- ✅ Your profile picture in the top-right corner
- ✅ Your name displayed
- ✅ "0/20 tokens today" (or your current usage)

Check the browser console (F12) for:
```
✅ Firebase available - using Firebase Auth
✅ Firebase initialized successfully (Auth + Firestore + Analytics)
✅ User authenticated: [Your Name]
```

## 🔧 Troubleshooting

### Issue: "Firebase initialization failed"
**Solution:** 
- Make sure the `.env` file exists in the project root
- Restart the development server: `npm run dev`
- Hard refresh the browser: `Ctrl+Shift+R`

### Issue: "Google sign-in not enabled"
**Solution:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Make sure Google provider is **Enabled** (toggle should be green)
3. Save changes and wait 1-2 minutes

### Issue: "Popup blocked"
**Solution:**
- Allow popups for `localhost:8080` in your browser settings
- Try clicking the button again

### Issue: "Unauthorized domain"
**Solution:**
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add `localhost` if not already present
3. For production, add your production domain

### Issue: Still seeing errors?
**Check browser console (F12):**
- Look for specific error messages
- Common errors will have solutions in the console output

## 📱 Features Available After Sign-In

Once you're signed in with Google, you get:
- ✅ 20 tokens per day (resets at midnight)
- ✅ Session persistence (stay logged in)
- ✅ User data storage in Firestore
- ✅ Subscription management (if enabled)
- ✅ Profile customization

## 🚀 Production Deployment

When deploying to production (e.g., Vercel, Netlify):

### Step 1: Add Production Domain to Firebase

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Click **Add domain**
3. Enter your production domain (e.g., `mobilaws.vercel.app`)
4. Click **Add**

### Step 2: Set Environment Variables

In your hosting platform (Vercel/Netlify), add these environment variables:

```
VITE_FIREBASE_API_KEY=AIzaSyDvGE_on74GR18QQrDyx8OdrKEEneD7DpI
VITE_FIREBASE_AUTH_DOMAIN=mobilaws-46056.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mobilaws-46056
VITE_FIREBASE_STORAGE_BUCKET=mobilaws-46056.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=843281701937
VITE_FIREBASE_APP_ID=1:843281701937:web:9b1227398de4a9384ec910
VITE_FIREBASE_MEASUREMENT_ID=G-SEE513K6TJ
```

### Step 3: Deploy

```bash
npm run build
# Then deploy using your platform's deployment command
```

## 🔒 Security Notes

### What's Public vs Private?

**✅ Safe to Share (Public):**
- Firebase API Key (`VITE_FIREBASE_API_KEY`)
- Auth Domain
- Project ID
- All other Firebase config values

These are meant to be public and are included in your frontend code.

**🔒 Keep Private:**
- Firebase Admin SDK credentials (not used in this setup)
- Database security rules (configure in Firebase Console)
- Your personal Google account credentials

### Security Best Practices

1. **Configure Firestore Security Rules** (in Firebase Console):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

2. **Use Firebase App Check** (optional, for production):
   - Protects your backend resources from abuse
   - Configure in Firebase Console → App Check

3. **Monitor Usage**:
   - Check Firebase Console → Usage and billing
   - Set up budget alerts

## 📊 Firebase Services Enabled

Your app now uses:
- ✅ **Firebase Authentication** - Google sign-in
- ✅ **Cloud Firestore** - User data storage
- ✅ **Firebase Analytics** - Usage tracking (optional)

## 🎉 Success!

You're all set! Your app now has:
- 🔐 Secure Google authentication
- 💾 User data storage in Firebase
- 📊 Analytics tracking
- 🔄 Session persistence
- 🚀 Production-ready setup

Enjoy building with Mobilaws! 🎊


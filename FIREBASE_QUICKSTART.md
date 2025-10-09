# 🚀 Firebase User Storage - Quick Start

## What Was Fixed

✅ **Google Sign-In now saves user data to Firebase Firestore**

Previously, user data was only stored in `localStorage`. Now when users sign in with Google:
1. Their data is automatically saved to your Firebase Firestore database
2. User profiles are created or updated on each login
3. Subscription data is synced between Firestore and the app
4. Everything falls back gracefully if Firebase is unavailable

## Quick Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project" or select existing project
3. Enable Google Analytics (optional)

### Step 2: Get Firebase Config
1. In Firebase Console, click the ⚙️ icon → Project settings
2. Scroll to "Your apps" → Click Web icon (</>)
3. Register your app (name: "Mobilaws Web")
4. Copy the config values

### Step 3: Enable Firestore
1. Firebase Console → **Firestore Database**
2. Click **"Create database"**
3. Choose location (e.g., us-central1)
4. Start in **Test Mode** (for development)

### Step 4: Create .env File
Create a `.env` file in your project root:

```env
# Copy your Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com

# Paste Firebase config values here
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 5: Test It!
```bash
npm run dev
```

1. Open your app in the browser
2. Sign in with Google
3. Check browser console for: `✅ New user created in Firestore`
4. Go to Firebase Console → Firestore → Check the `users` collection

## Firestore Security Rules (Important!)

After testing, update your security rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can only read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## What Data Is Stored?

When a user signs in, this data is saved to Firestore:

```javascript
{
  id: "google-user-id",
  name: "User Name",
  email: "user@example.com", 
  picture: "https://...",
  createdAt: "2025-01-01T...",
  lastLoginAt: "2025-01-01T..."
}
```

## Verify It's Working

### ✅ Success Indicators:
- Browser console shows: `✅ Firebase initialized successfully (Auth + Firestore)`
- After sign-in: `✅ New user created in Firestore` (first time)
- Or: `✅ User data updated in Firestore` (returning user)
- Firebase Console → Firestore shows `users` collection with your data

### ❌ If You See Errors:
- `⚠️ Missing Firebase configuration` → Check your `.env` file
- `⚠️ Firestore not initialized` → Enable Firestore in Firebase Console
- `Permission denied` → Update Firestore security rules

## Files Changed

| File | What Changed |
|------|-------------|
| `src/lib/firebase.ts` | Added Firestore initialization |
| `src/lib/userService.ts` | **NEW** - User data management functions |
| `src/contexts/AuthContext.tsx` | Auto-save users to Firestore on Google login |
| `src/contexts/FirebaseAuthContext.tsx` | Auto-save users to Firestore on Firebase Auth |

## Next Steps

✅ **Working Now:**
- Google Sign-In saves users to Firestore
- User data persists in your backend
- Timestamps track user activity

🚀 **Recommended Next:**
1. Update Firestore security rules (production mode)
2. Add subscription management
3. Store chat history per user
4. Add user profile editing

## Need More Details?

See **FIREBASE_USER_STORAGE_SETUP.md** for:
- Complete documentation
- Troubleshooting guide
- Security best practices
- API reference

---

**That's it!** Your app now stores user data in Firebase. 🎉


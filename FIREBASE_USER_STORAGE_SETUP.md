# Firebase User Storage Integration Guide

## Overview

Your Mobilaws application now stores user data in Firebase Firestore when users sign in with Google. This ensures that user information is persisted in your Firebase backend and can be accessed across sessions.

## ✅ What's Been Implemented

### 1. **Firestore Integration**
- Added Firestore to Firebase initialization (`src/lib/firebase.ts`)
- Created user service with functions to save and retrieve user data (`src/lib/userService.ts`)
- Updated both `AuthContext` and `FirebaseAuthContext` to automatically save user data

### 2. **User Data Storage**
When a user signs in with Google (either via Firebase Auth or fallback OAuth):
1. User credentials are decoded from the Google JWT token
2. User data is automatically saved to Firestore in the `users` collection
3. If the user already exists, their `lastLoginAt` timestamp is updated
4. If it's a new user, a new document is created with `createdAt` timestamp

### 3. **Data Sync**
- User data is synced with Firestore on every login
- Subscription information is fetched from Firestore if available
- Falls back to local storage if Firestore is unavailable

## 📁 Files Modified/Created

### New Files:
1. **`src/lib/userService.ts`** - User data management functions

### Modified Files:
1. **`src/lib/firebase.ts`** - Added Firestore initialization
2. **`src/contexts/AuthContext.tsx`** - Added Firestore sync for fallback OAuth
3. **`src/contexts/FirebaseAuthContext.tsx`** - Added Firestore sync for Firebase Auth

## 🔧 Setup Instructions

### Step 1: Configure Firebase Environment Variables

Create a `.env` file in your project root if you haven't already:

```env
# Google OAuth (for fallback authentication)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

### Step 2: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Go to Project Settings (⚙️ icon)
4. Scroll down to "Your apps" section
5. Click on the Web app (</>) icon or add a new web app
6. Copy the configuration values to your `.env` file

### Step 3: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose a location (preferably close to your users)
4. Start in **production mode** or **test mode**:
   - **Test mode** (for development): Open access for 30 days
   - **Production mode**: You'll need to set up security rules

### Step 4: Configure Firestore Security Rules

Go to **Firestore Database** → **Rules** and add these rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Admin can read all users (optional)
    match /users/{userId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Step 5: Test the Integration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Sign in with Google:**
   - Send 3 prompts without logging in
   - On the 4th prompt, the login modal will appear
   - Click "Continue with Google" and sign in

3. **Check the Console:**
   Look for these success messages:
   ```
   ✅ Firebase initialized successfully (Auth + Firestore)
   ✅ User logged in successfully: [Your Name]
   ✅ New user created in Firestore: [your-email@gmail.com]
   ```
   Or if you're signing in again:
   ```
   ✅ User data updated in Firestore: [your-email@gmail.com]
   ```

4. **Verify in Firebase Console:**
   - Go to Firebase Console → Firestore Database
   - You should see a `users` collection
   - Click on it to see your user document
   - Your document ID is your user ID
   - Check that the data includes: name, email, picture, createdAt, lastLoginAt

## 📊 Data Structure

### Users Collection

```javascript
users/{userId}
{
  id: "google-user-id",
  name: "John Doe",
  email: "john.doe@gmail.com",
  picture: "https://lh3.googleusercontent.com/...",
  subscription: {
    planId: "standard",
    tokensRemaining: 120,
    tokensUsed: 0,
    totalTokens: 120,
    isActive: true
  },
  createdAt: Timestamp,
  lastLoginAt: Timestamp
}
```

## 🔐 Security Features

### Current Implementation:
- ✅ Users are authenticated via Google OAuth
- ✅ User data is automatically synced to Firestore
- ✅ Firestore security rules prevent unauthorized access
- ✅ Timestamps track user registration and login times
- ✅ Graceful fallback to localStorage if Firestore is unavailable

### Best Practices:
- 🔒 Always use Firestore security rules
- 🔒 Never expose Firebase config in public repositories
- 🔒 Use environment variables for sensitive data
- 🔒 Validate user input before saving to Firestore
- 🔒 Set up Firebase App Check for additional security

## 🚀 Available Functions

### `saveUserToFirestore(userData)`
Saves or updates user data in Firestore.
- Creates new user document if user doesn't exist
- Updates existing user document with latest data
- Updates `lastLoginAt` timestamp on every login

### `getUserFromFirestore(userId)`
Retrieves user data from Firestore.
- Returns user data including subscription info
- Returns `null` if user doesn't exist
- Useful for syncing user data across devices

### `updateUserSubscription(userId, subscription)`
Updates only the subscription data for a user.
- Used when user purchases or updates their subscription
- Keeps other user data unchanged

## 🐛 Troubleshooting

### Issue: "⚠️ Firebase not initialized"
**Solution:** Check that all Firebase environment variables are set in `.env` file

### Issue: "⚠️ Firestore not initialized, skipping user save"
**Solution:** 
1. Verify Firebase is properly configured
2. Check browser console for initialization errors
3. Ensure Firestore is enabled in Firebase Console

### Issue: "Permission denied" errors in Firestore
**Solution:**
1. Go to Firebase Console → Firestore Database → Rules
2. Update security rules to allow authenticated users to read/write their data
3. For development, you can temporarily use test mode

### Issue: User data not appearing in Firestore
**Solution:**
1. Check browser console for error messages
2. Verify you're signed in with Google
3. Check Firebase Console → Firestore to see if the collection exists
4. Make sure Firestore security rules allow write access

## 📝 Next Steps

### Recommended Enhancements:
1. **Add user profile editing** - Allow users to update their profile
2. **Implement user preferences** - Store user settings in Firestore
3. **Add chat history** - Store conversation history per user
4. **Implement analytics** - Track user engagement and usage patterns
5. **Add subscription management** - Integrate with Stripe or other payment providers

## 🎯 Testing Checklist

- [ ] Firebase environment variables configured
- [ ] Firestore database created and enabled
- [ ] Security rules configured
- [ ] User can sign in with Google
- [ ] User document created in Firestore
- [ ] User data visible in Firebase Console
- [ ] `lastLoginAt` updates on subsequent logins
- [ ] Console shows success messages
- [ ] No errors in browser console

## 🔍 Monitoring User Data

To view user data in Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database** in the left sidebar
4. Browse the `users` collection
5. Click on a user ID to see their full data

You can also export data:
- Click on a collection
- Use the "Export" option to download data as JSON

## 📚 Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)

---

**Need Help?** Check the browser console for detailed error messages and refer to the troubleshooting section above.


# 🚀 START HERE - Firebase Google Sign-In Setup

## ⚡ Super Quick Setup (2 Commands)

### 1️⃣ Create .env File
```powershell
.\setup-firebase.ps1
```

### 2️⃣ Start Your App
```powershell
npm run dev
```

That's it! Open http://localhost:8080 and your Google Sign-In should work! 🎉

---

## ⚠️ Important: Enable Google Sign-In in Firebase

**Before testing, you MUST enable Google sign-in in Firebase Console:**

1. Click this link: https://console.firebase.google.com/project/mobilaws-46056/authentication/providers
2. Click on **Google** provider
3. Toggle **Enable** to ON
4. Choose a support email (your email)
5. Click **Save**

> **Why?** Firebase requires you to explicitly enable Google sign-in for security reasons.

---

## 🧪 Test Your Setup

### Method 1: Use the Test Page
1. Open `test-firebase-auth.html` in your browser
2. Click "Sign In with Google"
3. If it works, your setup is correct! ✅

### Method 2: Test in Your App
1. Go to http://localhost:8080
2. Send 3 messages (free limit for anonymous users)
3. On the 4th message, login modal appears
4. Click "Continue with Google"
5. Sign in with your Google account
6. You should see your profile picture in the top-right corner!

---

## ✅ What to Expect

### In Browser Console (F12):
```
✅ Firebase available - using Firebase Auth
✅ Firebase initialized successfully (Auth + Firestore + Analytics)
✅ Firebase Google login successful
✅ User authenticated: [Your Name]
```

### In Your App:
- Your profile picture in the top-right
- Your name displayed
- "0/20 tokens today" (instead of "3 free prompts")

---

## ❌ Common Issues

| Issue | Solution |
|-------|----------|
| "Firebase initialization failed" | Run `.\setup-firebase.ps1` to create .env file |
| "Google sign-in not enabled" | Enable Google provider in Firebase Console (link above) |
| "Popup blocked" | Allow popups for localhost:8080 in browser settings |
| Nothing happens | Check browser console (F12) for error messages |

---

## 📚 Need More Help?

- **Quick Guide:** `SETUP_COMPLETE.md`
- **Detailed Guide:** `FIREBASE_GOOGLE_SIGNIN_SETUP.md`
- **Troubleshooting:** Check the guides above

---

## 🎯 What You Get

After setup, your users can:
- ✅ Sign in with Google (one click)
- ✅ Get 20 tokens per day (instead of 3 free)
- ✅ Stay logged in (session persistence)
- ✅ See their profile and usage
- ✅ Access premium features (if enabled)

---

## 🔥 Let's Go!

1. Run: `.\setup-firebase.ps1`
2. Enable Google in Firebase Console
3. Run: `npm run dev`
4. Test at: http://localhost:8080

**That's all!** 🚀

---

<div align="center">
  <strong>Made with ❤️ for Mobilaws</strong>
</div>


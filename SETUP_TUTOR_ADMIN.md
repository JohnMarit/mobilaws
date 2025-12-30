# 🎓 Setup Tutor Admin Access

## Quick Check: Is Your Email Already a Tutor Admin?

### Option 1: Try Accessing the Portal
1. Sign in to https://www.mobilaws.com with your Google account
2. Visit: https://www.mobilaws.com/tutor-admin
3. If you see the Tutor Admin Portal → ✅ You're already set up!
4. If you see "Access Denied" → ❌ You need to be added

### Option 2: Check via API
```bash
# Replace YOUR_EMAIL with your actual email
curl https://mobilaws-backend.vercel.app/api/tutor-admin/check/YOUR_EMAIL
```

---

## 🚀 Create Tutor Admin Account

### Method 1: Using the Script (Easiest)

```bash
# Replace with your email and name
node create-tutor-admin.js your-email@example.com "Your Name"
```

**Example:**
```bash
node create-tutor-admin.js john@example.com "John Doe"
```

### Method 2: Using API Directly

```bash
curl -X POST https://mobilaws-backend.vercel.app/api/tutor-admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "name": "Your Name",
    "specializations": ["Constitutional Law", "Criminal Law"],
    "bio": "Expert legal tutor"
  }'
```

### Method 3: Using Firebase Console (Manual)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your Mobilaws project

2. **Open Firestore Database**
   - Click "Firestore Database" in the left menu

3. **Create Collection** (if it doesn't exist)
   - Click "Start collection"
   - Collection ID: `tutorAdmins`
   - Click "Next"

4. **Add Document**
   - Document ID: (Auto-generate or use your email)
   - Add these fields:
     ```
     email: "your-email@example.com" (string)
     name: "Your Name" (string)
     active: true (boolean)
     createdAt: [Click "timestamp" and select "now"]
     updatedAt: [Click "timestamp" and select "now"]
     ```
   - Optional fields:
     ```
     picture: "https://your-photo-url.jpg" (string)
     specializations: ["Law Topic 1", "Law Topic 2"] (array)
     bio: "Your bio text" (string)
     ```

5. **Save** the document

---

## ✅ Verify Access

After creating your tutor admin account:

1. **Sign Out** from Mobilaws (if already signed in)
2. **Sign In** again with your Google account (same email)
3. **Visit**: https://www.mobilaws.com/tutor-admin
4. You should see the Tutor Admin Portal! 🎉

---

## 🔍 Troubleshooting

### "Access Denied" Error

**Possible causes:**
1. Email doesn't match exactly (case-sensitive)
2. Account not created yet
3. `active: false` in Firestore
4. Not signed in with the correct Google account

**Solutions:**
1. Check email spelling (must match Google sign-in email exactly)
2. Verify `active: true` in Firestore
3. Sign out and sign in again
4. Clear browser cache and cookies

### "404 Not Found" Error

**Possible causes:**
1. Route not deployed yet
2. Build failed

**Solutions:**
1. Wait for Vercel deployment to complete
2. Check Vercel deployment logs
3. Verify build succeeded

### API Returns Error

**Possible causes:**
1. Backend not deployed
2. API URL incorrect
3. Firebase permissions issue

**Solutions:**
1. Check backend is deployed: https://mobilaws-backend.vercel.app/api/healthz
2. Verify API URL in script matches your backend
3. Check Firebase Admin SDK is configured

---

## 📧 Need Help?

If you're still having issues:

1. **Check Browser Console** (F12) for errors
2. **Check Network Tab** for API call failures
3. **Verify Firebase** - Make sure Firestore is enabled
4. **Check Backend Logs** - Look at Vercel function logs

---

## 🎯 Quick Reference

**Your Email:** `[Your email here]`  
**API Endpoint:** `https://mobilaws-backend.vercel.app/api/tutor-admin`  
**Portal URL:** `https://www.mobilaws.com/tutor-admin`  
**Firestore Collection:** `tutorAdmins`

---

**Once set up, you can:**
- ✅ Upload educational documents
- ✅ Generate AI-powered learning content
- ✅ Manage content and publish modules
- ✅ Respond to learner questions
- ✅ Handle quiz requests

**Happy Teaching! 📚✨**


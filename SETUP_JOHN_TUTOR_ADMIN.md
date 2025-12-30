# 🔐 Setup Tutor Admin for johnmarit42@gmail.com

## Most Secure Method: Firebase Console (Recommended)

### Step 1: Access Firebase Console
1. Go to: https://console.firebase.google.com
2. Sign in with your Google account
3. Select your **Mobilaws** project

### Step 2: Open Firestore Database
1. Click **"Firestore Database"** in the left sidebar
2. You should see your database

### Step 3: Create tutorAdmins Collection
1. If `tutorAdmins` collection doesn't exist:
   - Click **"Start collection"**
   - Collection ID: `tutorAdmins`
   - Click **"Next"**

2. If `tutorAdmins` collection already exists:
   - Click on it
   - Click **"Add document"**

### Step 4: Add Your Account
Add a new document with these exact fields:

```
Document ID: [Auto-ID] (or use: johnmarit42-gmail-com)

Fields:
┌─────────────────┬──────────┬────────────────────────────────────┐
│ Field           │ Type     │ Value                              │
├─────────────────┼──────────┼────────────────────────────────────┤
│ email           │ string   │ johnmarit42@gmail.com              │
│ name            │ string   │ John Marit                         │
│ active          │ boolean  │ true                               │
│ specializations │ array    │ ["Constitutional Law",             │
│                 │          │  "Criminal Law",                   │
│                 │          │  "International Law"]              │
│ bio             │ string   │ Legal Education Expert             │
│ createdAt       │ timestamp│ [Click timestamp icon → "now"]     │
│ updatedAt       │ timestamp│ [Click timestamp icon → "now"]     │
└─────────────────┴──────────┴────────────────────────────────────┘
```

### Detailed Field Instructions:

1. **email**: 
   - Type: `string`
   - Value: `johnmarit42@gmail.com`
   - ⚠️ MUST match your Google sign-in email exactly

2. **name**:
   - Type: `string`
   - Value: `John Marit`

3. **active**:
   - Type: `boolean`
   - Value: `true` (toggle on)

4. **specializations** (optional but recommended):
   - Type: `array`
   - Click "Add item" for each:
     - Item 0: `Constitutional Law`
     - Item 1: `Criminal Law`
     - Item 2: `International Law`

5. **bio** (optional):
   - Type: `string`
   - Value: `Legal Education Expert`

6. **createdAt**:
   - Type: `timestamp`
   - Click the timestamp icon button
   - Select "Set to current time"

7. **updatedAt**:
   - Type: `timestamp`
   - Click the timestamp icon button
   - Select "Set to current time"

### Step 5: Save
Click **"Save"** at the bottom

---

## ✅ Verify Access

1. **Sign out** from https://www.mobilaws.com (if signed in)
2. **Sign in** with johnmarit42@gmail.com using Google OAuth
3. **Visit**: https://www.mobilaws.com/tutor-admin
4. You should see the **Tutor Admin Portal** 🎉

---

## 🔒 Security Benefits of This Method

1. ✅ **No API exposure** - Direct database access
2. ✅ **Firebase authentication required** - Must be signed into Firebase Console
3. ✅ **Audit trail** - Firebase logs all changes
4. ✅ **Fine-grained permissions** - Only Firebase admins can create
5. ✅ **No credential transmission** - No email sent over network

---

## 🆘 Troubleshooting

### "Access Denied" after setup
- **Solution**: Sign out completely and sign in again
- Clear browser cache/cookies
- Use incognito/private window
- Verify email matches exactly (case-sensitive)

### Can't see Firestore Database
- **Solution**: Make sure Firestore is enabled in your Firebase project
- Check Firebase Console → Build → Firestore Database

### Document fields won't save
- **Solution**: Ensure all required fields are present:
  - `email` (string)
  - `name` (string)  
  - `active` (boolean)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)

---

## 📸 Visual Guide

When adding the document, it should look like this:

```
Document: [auto-generated-id]
│
├─ email: "johnmarit42@gmail.com"
├─ name: "John Marit"
├─ active: ✓ true
├─ specializations: 
│  ├─ 0: "Constitutional Law"
│  ├─ 1: "Criminal Law"
│  └─ 2: "International Law"
├─ bio: "Legal Education Expert"
├─ createdAt: December 31, 2025 at 12:00:00 PM UTC
└─ updatedAt: December 31, 2025 at 12:00:00 PM UTC
```

---

## 🎯 Next Steps After Setup

Once you can access the portal:

1. **Upload a test document** (PDF/DOCX)
2. **Set access levels** (free/basic/standard/premium)
3. **Review AI-generated content**
4. **Publish your first module**

**Happy Teaching! 📚✨**


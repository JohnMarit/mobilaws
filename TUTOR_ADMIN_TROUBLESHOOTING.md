# Tutor Admin Access Troubleshooting Guide

## Problem: "Access Denied" when accessing /tutor-admin

This guide will help you diagnose and fix tutor admin access issues.

## Quick Fix (Try This First)

1. **Sign Out Completely**
   - Click the sign out button in Mobilaws
   - Clear browser cache (Ctrl+Shift+Delete)

2. **Sign In Again**
   - Sign in with your Google account
   - Make sure you use the EXACT email that was registered as tutor admin

3. **Try Again**
   - Navigate to `/tutor-admin`
   - It should work now

## Diagnostic Tools

### 1. Check Tutor Admin Status
Open `check-tutor-status.html` in your browser:
- Enter your email to check if a tutor admin account exists
- View all registered tutor admins
- Get detailed diagnostic information

### 2. Check Browser Console
1. Press F12 to open Developer Tools
2. Click the "Console" tab
3. Look for error messages marked with ❌
4. The console will show detailed information about what's wrong

## Common Issues and Solutions

### Issue 1: Email Mismatch
**Symptom:** Account exists but still getting access denied

**Cause:** The email in your tutor admin account doesn't match your Google sign-in email exactly

**Solution:**
1. Open `check-tutor-status.html`
2. Click "List All Tutor Admins" to see registered emails
3. Sign in with Google and check what email you're using (top right corner)
4. Make sure they match EXACTLY (case-sensitive, no spaces)

### Issue 2: Account Not Active
**Symptom:** Account exists but marked as inactive

**Cause:** The tutor admin account has `active: false` in Firestore

**Solution:**
1. Go to Firebase Console (console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Find the `tutorAdmins` collection
5. Find your account document
6. Make sure `active` field is set to `true`

### Issue 3: No Account Exists
**Symptom:** "No tutor admin account found" in diagnostics

**Cause:** You haven't created a tutor admin account yet

**Solution:**
1. Open `create-tutor-admin.html`
2. Enter your Google email EXACTLY as it appears in Google
3. Enter your name
4. Click "Create Tutor Admin Account"
5. Wait for success message
6. Sign out from Mobilaws
7. Sign in again
8. Try accessing /tutor-admin

### Issue 4: Backend API Error
**Symptom:** Network errors or 500 errors in console

**Cause:** Backend API is having issues

**Solution:**
1. Check if https://mobilaws-backend.vercel.app/api is accessible
2. Wait a few minutes and try again
3. Check Vercel dashboard for backend deployment status
4. Contact system administrator

### Issue 5: Firebase Not Initialized
**Symptom:** "Firebase not initialized" or "Firestore not available" errors

**Cause:** Firebase configuration issue on backend

**Solution:**
1. Check backend environment variables:
   - `FIREBASE_SERVICE_ACCOUNT_KEY` must be set
   - Must contain valid Firebase admin credentials
2. Redeploy backend if needed
3. Check Vercel logs for Firebase initialization errors

### Issue 6: Cached Old Session
**Symptom:** Still getting access denied after creating account

**Cause:** Browser has cached old authentication state

**Solution:**
1. Sign out completely
2. Clear browser cache and cookies
3. Close all browser tabs
4. Open new browser window
5. Sign in again
6. Try accessing /tutor-admin

## Step-by-Step Diagnostic Procedure

### Step 1: Verify Account Exists
```bash
1. Open check-tutor-status.html
2. Enter your email
3. Click "Check Tutor Admin Status"
4. Expected result: "✅ SUCCESS - Tutor Admin Account Found!"
```

If account not found → Go to "Create Account" below

### Step 2: Verify Email Match
```bash
1. In Mobilaws, check your profile email (top right)
2. In check-tutor-status.html results, check the tutor admin email
3. They must match EXACTLY
```

If emails don't match → Update account or sign in with correct Google account

### Step 3: Check Browser Console
```bash
1. Press F12
2. Go to Console tab
3. Navigate to /tutor-admin
4. Look for detailed error messages
5. The logs will show exactly what's wrong
```

### Step 4: Clear Cache and Retry
```bash
1. Sign out
2. Press Ctrl+Shift+Delete
3. Clear "Cached images and files" and "Cookies"
4. Close browser
5. Reopen and sign in
6. Try /tutor-admin again
```

## Creating a New Tutor Admin Account

### Method 1: Using HTML Form (Easiest)
1. Open `create-tutor-admin.html` in your browser
2. Enter your Google email (check Google account settings for exact email)
3. Enter your name
4. Click "Create Tutor Admin Account"
5. Wait for success message
6. **Important:** Sign out and sign in again
7. Navigate to `/tutor-admin`

### Method 2: Using Firebase Console (Advanced)
1. Go to https://console.firebase.google.com
2. Select your Mobilaws project
3. Go to "Firestore Database"
4. Click "Start collection" or select `tutorAdmins` collection
5. Add a new document with these fields:
   ```
   email: "your-email@example.com" (string)
   name: "Your Name" (string)
   active: true (boolean)
   specializations: ["General Law"] (array)
   bio: "Tutor admin" (string)
   createdAt: (current timestamp)
   updatedAt: (current timestamp)
   ```
6. Save the document
7. Sign out and sign in to Mobilaws
8. Try accessing `/tutor-admin`

## API Endpoints for Debugging

### Check Tutor Status
```
GET https://mobilaws-backend.vercel.app/api/tutor-admin/check/{email}
```
Response when authorized:
```json
{
  "isTutorAdmin": true,
  "tutor": {
    "id": "abc123",
    "email": "your-email@example.com",
    "name": "Your Name",
    "active": true,
    "specializations": ["General Law"],
    "createdAt": { "seconds": 1234567890 }
  }
}
```

### List All Tutors
```
GET https://mobilaws-backend.vercel.app/api/tutor-admin/all
```

### Create Tutor Admin
```
POST https://mobilaws-backend.vercel.app/api/tutor-admin/create
Content-Type: application/json

{
  "email": "your-email@example.com",
  "name": "Your Name",
  "specializations": ["General Law"],
  "bio": "Tutor admin account"
}
```

## Still Having Issues?

### Check These Common Mistakes

1. ✅ Email has extra spaces: "user@example.com " ❌
2. ✅ Email has wrong case: "User@Example.com" vs "user@example.com"
3. ✅ Using different Google account than registered
4. ✅ Not signed out and back in after creating account
5. ✅ Browser cache not cleared
6. ✅ Multiple Google accounts signed in (using wrong one)

### Advanced Debugging

1. **Check Network Tab:**
   - F12 → Network tab
   - Navigate to /tutor-admin
   - Look for API call to `/api/tutor-admin/check/...`
   - Check response data

2. **Check Local Storage:**
   - F12 → Application tab → Local Storage
   - Look for 'user' key
   - Verify email is correct

3. **Check Backend Logs:**
   - Go to Vercel dashboard
   - Select mobilaws-backend project
   - View function logs
   - Look for tutor admin check requests

## Contact Information

If none of these solutions work, gather the following information:
1. Screenshot of `check-tutor-status.html` results
2. Browser console logs (F12 → Console)
3. Network tab showing API requests (F12 → Network)
4. Your Google account email (the one you're trying to use)

Then contact the system administrator with this information.

## Prevention

To avoid this issue in the future:
1. Always use the same Google account for Mobilaws
2. Don't manually edit Firestore data unless necessary
3. Use the diagnostic tools before making changes
4. Keep a note of which email is your tutor admin email
5. Clear cache if you haven't accessed the portal in a while


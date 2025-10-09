# 🚀 Vercel Production Deployment Setup

## Issue: "Google OAuth is not configured" on mobilaws.vercel.app

Your production site needs environment variables configured in Vercel.

## Quick Fix (5 minutes)

### Step 1: Configure Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Find your project: **mobilaws**
   - Click on the project name

2. **Open Settings:**
   - Click **"Settings"** tab at the top
   - Click **"Environment Variables"** in the left sidebar

3. **Add These Environment Variables:**

Click **"Add New"** for each variable:

#### Google OAuth:
```
Name: VITE_GOOGLE_CLIENT_ID
Value: 843281701937-m1qi0rt6q7r33h45801n0nueu44krod8.apps.googleusercontent.com
Environment: Production, Preview, Development (select all)
```

#### Firebase Configuration:
```
Name: VITE_FIREBASE_API_KEY
Value: AIzaSyDvGE_on74GR18QQrDyx8OdrKEEneD7DpI
Environment: Production, Preview, Development (select all)
```

```
Name: VITE_FIREBASE_AUTH_DOMAIN
Value: mobilaws-46056.firebaseapp.com
Environment: Production, Preview, Development (select all)
```

```
Name: VITE_FIREBASE_PROJECT_ID
Value: mobilaws-46056
Environment: Production, Preview, Development (select all)
```

```
Name: VITE_FIREBASE_STORAGE_BUCKET
Value: mobilaws-46056.firebasestorage.app
Environment: Production, Preview, Development (select all)
```

```
Name: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 843281701937
Environment: Production, Preview, Development (select all)
```

```
Name: VITE_FIREBASE_APP_ID
Value: 1:843281701937:web:9b1227398de4a9384ec910
Environment: Production, Preview, Development (select all)
```

#### Backend URL (if applicable):
```
Name: VITE_BACKEND_URL
Value: http://localhost:8000
Environment: Production, Preview, Development (select all)
```

### Step 2: Add Production Domain to Google OAuth

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Make sure project is: **mobilaws-46056**

2. **Edit OAuth Client:**
   - Find your OAuth 2.0 Client ID
   - Click the ✏️ (edit) icon

3. **Add Production URLs:**

   Under **"Authorized JavaScript origins"**, add:
   ```
   https://mobilaws.vercel.app
   ```

   Under **"Authorized redirect URIs"**, add:
   ```
   https://mobilaws.vercel.app
   https://mobilaws.vercel.app/
   ```

4. **Keep existing localhost URLs:**
   ```
   http://localhost:8080
   http://127.0.0.1:8080
   ```

5. **Click SAVE**

### Step 3: Redeploy on Vercel

After adding environment variables, you need to redeploy:

**Option A: Via Vercel Dashboard**
1. Go to your project in Vercel
2. Click **"Deployments"** tab
3. Find the latest deployment
4. Click the ⋯ (three dots) menu
5. Click **"Redeploy"**
6. Confirm

**Option B: Via Git Push**
```powershell
git commit --allow-empty -m "Trigger Vercel redeploy"
git push
```

### Step 4: Wait & Test

1. Wait 1-2 minutes for deployment to complete
2. Visit: https://mobilaws.vercel.app
3. Try signing in with Google
4. It should work now! ✅

## Verification

### ✅ Success Indicators:
- No "Google OAuth is not configured" error
- Google sign-in button works
- You can successfully log in
- Your name appears in the UI after login

### ❌ Still Not Working?

**Check Environment Variables:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure all variables are added
3. Make sure "Production" is checked for each variable

**Check Google Cloud Console:**
1. Make sure `https://mobilaws.vercel.app` is in Authorized JavaScript origins
2. Wait 1-2 minutes after saving changes

**Check Browser Console:**
1. Press F12 to open DevTools
2. Look for error messages
3. You should see: `✅ Google OAuth initialized successfully`

## Production vs Development

### Development (localhost:8080):
- Uses `.env` file
- Google OAuth authorized for: `http://localhost:8080`

### Production (vercel.app):
- Uses Vercel environment variables
- Google OAuth authorized for: `https://mobilaws.vercel.app`

## Security Notes

⚠️ **Public Environment Variables:**
- All `VITE_*` variables are PUBLIC and bundled into your frontend
- Never put secret API keys in `VITE_*` variables
- Firebase config is safe to expose (it's meant to be public)
- Google Client ID is safe to expose (it's meant to be public)

🔒 **Keep Private:**
- OpenAI API keys → Backend only
- Database passwords → Backend only
- Private keys → Backend only

## Troubleshooting

### Issue: "Error 400: redirect_uri_mismatch"
**Fix:** Add your Vercel URL to Google OAuth authorized redirect URIs

### Issue: Environment variables not loading
**Fix:** 
1. Make sure variable names start with `VITE_`
2. Redeploy after adding variables
3. Check that "Production" is selected

### Issue: Firebase not initialized
**Fix:** Make sure all Firebase variables are added to Vercel

### Issue: Google OAuth still not working
**Fix:**
1. Clear browser cache
2. Try incognito/private mode
3. Check Google Cloud Console authorized origins
4. Wait 2-3 minutes after making changes

## Complete Checklist

- [ ] All environment variables added to Vercel
- [ ] "Production" environment selected for all variables
- [ ] Google OAuth configured with Vercel URL
- [ ] Redeployed on Vercel
- [ ] Waited 2 minutes for changes to propagate
- [ ] Tested sign-in on production site
- [ ] Verified user data is saved to Firebase

## Next Steps

Once Google OAuth is working:
1. Test all features on production
2. Monitor Firebase Console for user sign-ins
3. Consider setting up a custom domain
4. Configure Firebase security rules for production

---

**Need the backend API?** You'll need to deploy the backend separately (e.g., Railway, Render, or Heroku) and update `VITE_BACKEND_URL` to point to it.


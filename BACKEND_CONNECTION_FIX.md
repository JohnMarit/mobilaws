# 🔧 Fix: Backend Connection Failed

## Problem

The debug tool shows "Failed to fetch" error when trying to check published modules.

## Root Causes

1. **Backend not deployed** - The backend API isn't running
2. **Wrong API URL** - The URL in the debug tool doesn't match your backend
3. **CORS issue** - Backend isn't configured to allow requests from your domain
4. **Firestore not configured** - Backend can't connect to Firestore

## Quick Diagnosis

### Step 1: Check Backend is Running

Open this URL in your browser:
```
https://mobilaws-ympe.vercel.app/api/health
```

**Expected:** Should return `OK` or `{"status":"ok"}`  
**If error:** Backend is not deployed or not running

### Step 2: Use the Connection Checker

Open `check-backend.html` in your browser. It will:
- ✅ Test backend health endpoint
- ✅ Test module fetching
- ✅ Show detailed error messages
- ✅ Provide troubleshooting steps

### Step 3: Check Vercel Deployment

1. Go to https://vercel.com/dashboard
2. Find your backend project (mobilaws-ympe or similar)
3. Check deployment status:
   - ✅ **Ready** = Backend is deployed
   - ⚠️ **Building** = Wait for deployment to finish
   - ❌ **Failed** = Check build logs for errors

## Solutions

### Solution 1: Deploy Backend

If backend is not deployed:

```bash
cd ai-backend
git add .
git commit -m "Deploy backend"
git push origin main
```

Wait 2-3 minutes for Vercel to deploy.

### Solution 2: Set Environment Variables

Backend needs these environment variables in Vercel:

1. Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables
2. Add these variables:

```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
OPENAI_API_KEY=sk-...
```

3. Redeploy after adding variables

### Solution 3: Fix CORS

If you see CORS errors in browser console:

The backend should already have CORS configured. Check `ai-backend/api/index.ts`:

```typescript
app.use(cors({
  origin: '*', // Allow all origins
  credentials: true
}));
```

### Solution 4: Check Firestore Connection

Backend needs Firebase credentials to work. Verify:

1. `FIREBASE_SERVICE_ACCOUNT_KEY` is set in Vercel
2. Service account has Firestore permissions
3. Firestore is enabled in Firebase Console

## Testing Steps

### Test 1: Health Check

```bash
curl https://mobilaws-ympe.vercel.app/api/health
```

**Expected:** `OK` or `{"status":"ok"}`

### Test 2: Fetch Modules

```bash
curl https://mobilaws-ympe.vercel.app/api/tutor-admin/modules
```

**Expected:** JSON array of modules (might be empty)

### Test 3: Check Logs

1. Go to Vercel Dashboard → Your Backend Project
2. Click on latest deployment
3. Click "View Function Logs"
4. Look for errors

## Common Errors & Fixes

### Error: "Failed to fetch"

**Cause:** Backend not accessible  
**Fix:** Deploy backend, check URL is correct

### Error: "CORS policy"

**Cause:** CORS not configured  
**Fix:** Backend should have `cors()` middleware

### Error: "500 Internal Server Error"

**Cause:** Backend error (Firestore, Firebase, etc.)  
**Fix:** Check Vercel function logs, verify env vars

### Error: "404 Not Found"

**Cause:** Wrong API URL or route doesn't exist  
**Fix:** Verify URL matches backend deployment

## Quick Checklist

- [ ] Backend deployed to Vercel
- [ ] Backend URL is correct (`https://mobilaws-ympe.vercel.app/api`)
- [ ] Environment variables set in Vercel
- [ ] `/api/health` endpoint returns OK
- [ ] `/api/tutor-admin/modules` returns array
- [ ] Firestore indexes deployed
- [ ] Module is published in database

## Next Steps

1. Open `check-backend.html` to run automated tests
2. Fix any failing tests
3. Deploy Firestore indexes: `deploy-firestore-indexes.bat`
4. Verify module is published in tutor admin portal
5. Test again with `debug-published-modules.html`

After fixing the backend connection, users will be able to see published modules!


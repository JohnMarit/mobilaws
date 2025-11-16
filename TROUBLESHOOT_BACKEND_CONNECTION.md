# 🔍 Backend Connection Troubleshooting

## Step 1: Verify Backend is Actually Running

Open this URL in your browser:
```
https://mobilaws-ympe.vercel.app/healthz
```

**Expected Response:**
```json
{"status":"ok"}
```

**If you see this** ✅ - Backend is running
**If you see error** ❌ - Backend deployment failed

---

## Step 2: Did You Redeploy Frontend?

⚠️ **CRITICAL:** Changing environment variables does NOT automatically update the deployed app!

### You MUST redeploy:

1. Go to Vercel Dashboard
2. Select your **FRONTEND** project (mobilaws)
3. Go to **Deployments** tab
4. Click **"⋯"** on the latest deployment
5. Click **"Redeploy"**
6. Wait 1-2 minutes

**Without redeploying, the frontend still has the OLD environment variables!**

---

## Step 3: Clear Browser Cache

After redeploying:

1. **Hard refresh:** `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or open in **Incognito/Private mode**
3. Check browser console (F12)

Look for:
```
✅ VITE_API_URL is set: https://mobilaws-ympe.vercel.app/api
```

If you see localhost, the redeploy didn't work or cache is stale.

---

## Step 4: Check CORS Configuration

Your backend needs to allow your frontend URL.

### Backend Environment Variables (on mobilaws-ympe project):

Make sure these are set:
```
CORS_ORIGINS=https://mobilaws.vercel.app
FRONTEND_URL=https://mobilaws.vercel.app
```

⚠️ No trailing slashes!
⚠️ Must match EXACTLY

If these are wrong or missing:
1. Go to backend project (mobilaws-ympe)
2. Settings → Environment Variables
3. Update/add these
4. Redeploy backend

---

## Step 5: Check Console Errors

Open browser console (F12) on your frontend:

### Look for:

**Good Signs:**
```
✅ VITE_API_URL is set: https://mobilaws-ympe.vercel.app/api
✅ Backend connected
```

**Bad Signs:**
```
❌ CORS error
❌ Failed to fetch
❌ Backend not connected
```

---

## Common Issues

### Issue 1: "Backend offline" after updating variable

**Cause:** Didn't redeploy frontend
**Fix:** Redeploy frontend from Deployments tab

### Issue 2: CORS errors

**Cause:** CORS_ORIGINS doesn't match frontend URL
**Fix:** Update backend environment variables

### Issue 3: Still showing localhost

**Cause:** Browser cache
**Fix:** Hard refresh or incognito mode

### Issue 4: 404 errors

**Cause:** Backend routes not working
**Fix:** Check backend deployment logs

---

## Quick Verification Commands

### Test Backend Health:
```
curl https://mobilaws-ympe.vercel.app/healthz
```

Expected: `{"status":"ok"}`

### Test Backend Root:
```
curl https://mobilaws-ympe.vercel.app/
```

Expected: JSON with backend info

### Test User Sync Endpoint:
```
curl -X POST https://mobilaws-ympe.vercel.app/api/users/sync \
  -H "Content-Type: application/json" \
  -d '{"id":"test","email":"test@example.com","name":"Test"}'
```

Expected: `{"success":true,...}`

---

## Still Not Working?

### Check Deployment Status:

1. **Backend:** https://vercel.com/dashboard (mobilaws-ympe project)
   - Status should be "Ready" with green checkmark
   
2. **Frontend:** https://vercel.com/dashboard (mobilaws project)
   - Status should be "Ready" with green checkmark
   - Check "Latest Deployment" timestamp - should be AFTER you changed the variable

### Check Environment Variables:

1. Backend project → Settings → Environment Variables
   - `CORS_ORIGINS` should include your frontend URL
   
2. Frontend project → Settings → Environment Variables
   - `VITE_API_URL` should point to backend

---

## Most Likely Issue

**You updated the variable but didn't redeploy the frontend!**

Environment variables are baked into the build. Just changing them doesn't update running deployments.

**Fix:**
1. Deployments tab
2. Redeploy
3. Wait 2 minutes
4. Hard refresh browser
5. Should work!


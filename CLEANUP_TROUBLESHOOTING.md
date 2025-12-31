# Cleanup Module - Troubleshooting "Failed to Fetch" Error

## Quick Diagnosis

If you see "Failed to fetch", follow these steps:

### Step 1: Check if Backend is Deployed

1. **Check Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Find your backend project (usually `mobilaws-backend` or `ai-backend`)
   - Check if the latest deployment is successful
   - Look for deployment status: ✅ "Ready" or ❌ "Failed"

2. **Check Deployment Logs:**
   - Click on the latest deployment
   - Check for any build errors
   - Make sure the cleanup endpoint is included in the build

### Step 2: Verify API URL

1. **Find Your Backend URL:**
   - In Vercel dashboard, your backend project → Settings → Domains
   - Or check the deployment URL (usually something like `mobilaws-backend.vercel.app`)

2. **Test the Endpoint:**
   - Open browser console (F12)
   - Run this command:
   ```javascript
   fetch('https://YOUR-BACKEND-URL.vercel.app/api/tutor-admin/all')
     .then(r => r.json())
     .then(d => console.log('✅ Backend is up:', d))
     .catch(e => console.error('❌ Backend error:', e));
   ```
   - Replace `YOUR-BACKEND-URL` with your actual backend URL

3. **Update HTML File:**
   - Open `cleanup-modules.html`
   - Find line ~237: `const API_URL = 'https://mobilaws-backend.vercel.app/api';`
   - Change to your actual backend URL
   - Save and refresh

### Step 3: Verify Endpoint Exists

Test if the cleanup endpoint exists:

```bash
# In browser console or terminal:
curl -X POST https://YOUR-BACKEND-URL.vercel.app/api/tutor-admin/cleanup-modules \
  -H "Content-Type: application/json"
```

**If you get 404:**
- The endpoint doesn't exist → Backend changes not deployed
- Deploy backend: `cd ai-backend && git push`

**If you get CORS error:**
- Backend needs CORS configuration
- Check backend CORS settings

**If you get 500:**
- Backend is deployed but has an error
- Check Vercel function logs

### Step 4: Check Browser Console

1. Open `cleanup-modules.html`
2. Press F12 → Console tab
3. Click the cleanup button
4. Look for detailed error messages
5. Check Network tab for the failed request

**Common errors:**

**"Failed to fetch" (no other details)**
- ❌ Backend not deployed
- ❌ Wrong API URL
- ❌ Network issue
- ❌ CORS blocked

**"404 Not Found"**
- ❌ Endpoint doesn't exist
- ❌ Backend changes not deployed
- ❌ Wrong URL path

**"CORS policy" error**
- ❌ Backend CORS not configured
- ❌ Need to add your domain to CORS whitelist

**"500 Internal Server Error"**
- ✅ Backend is deployed and reachable
- ❌ Backend code has an error
- Check Vercel function logs

## Quick Fix Checklist

- [ ] Backend code committed: `cd ai-backend && git status`
- [ ] Backend code pushed: `git push`
- [ ] Vercel deployment successful (check dashboard)
- [ ] Waited 1-2 minutes after deployment
- [ ] API URL in HTML matches your backend URL
- [ ] Tested backend endpoint manually (see Step 2)
- [ ] Checked browser console for detailed errors
- [ ] Checked Network tab in browser DevTools

## Most Common Issues

### Issue 1: Backend Not Deployed (90% of cases)

**Symptom:** "Failed to fetch" with no response

**Solution:**
```bash
cd ai-backend
git add .
git commit -m "Add cleanup endpoint"
git push
```
Wait 1-2 minutes, then try again.

### Issue 2: Wrong API URL (5% of cases)

**Symptom:** "Failed to fetch" but backend works for other endpoints

**Solution:**
1. Find your actual backend URL in Vercel
2. Update `cleanup-modules.html` line ~237
3. Refresh the page

### Issue 3: CORS Issue (3% of cases)

**Symptom:** CORS policy error in console

**Solution:**
- Check backend CORS configuration
- Add your domain to allowed origins
- Or deploy HTML file to same domain as backend

### Issue 4: Endpoint Not Found (2% of cases)

**Symptom:** 404 error

**Solution:**
- Verify the route is exported in backend
- Check Vercel deployment logs for build errors
- Make sure route file is included in build

## Manual Testing

If HTML file doesn't work, test directly:

### Using Browser Console

```javascript
// Replace with your backend URL
const API_URL = 'https://YOUR-BACKEND-URL.vercel.app/api';

fetch(`${API_URL}/tutor-admin/cleanup-modules`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(d => console.log('✅ Success:', d))
  .catch(e => console.error('❌ Error:', e));
```

### Using curl

```bash
curl -X POST https://YOUR-BACKEND-URL.vercel.app/api/tutor-admin/cleanup-modules \
  -H "Content-Type: application/json" \
  -v
```

The `-v` flag shows detailed connection info.

## Still Having Issues?

1. **Check Vercel Function Logs:**
   - Vercel Dashboard → Your Backend → Functions → Logs
   - Look for errors when calling the endpoint

2. **Test Other Endpoints:**
   - Try: `/api/tutor-admin/all`
   - If this works but cleanup doesn't → cleanup endpoint issue
   - If this doesn't work → general backend/deployment issue

3. **Verify Code is Deployed:**
   - Check if `ai-backend/src/routes/tutor-admin.ts` has the cleanup route
   - Check if `ai-backend/src/lib/ai-content-generator.ts` has `deleteNonTutorModules`
   - Verify both files are in git and pushed

4. **Contact Support:**
   - Share browser console errors
   - Share Vercel deployment logs
   - Share the API URL you're using

## Expected Behavior After Fix

Once everything is working:

1. ✅ Click "Delete Non-Tutor Modules"
2. ✅ See "Checking backend connection..."
3. ✅ See "Running cleanup..."
4. ✅ See success message with results
5. ✅ Console shows detailed cleanup logs

## Summary

**Most likely cause:** Backend not deployed yet

**Quick fix:** 
```bash
cd ai-backend
git add .
git commit -m "Add cleanup endpoint"
git push
# Wait 1-2 minutes
# Try again
```

**If still fails:** Check API URL matches your backend URL in Vercel dashboard


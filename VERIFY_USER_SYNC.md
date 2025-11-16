# How to Verify User Sync is Working

## 🧪 Testing Checklist

### Step 1: Check Frontend Sync Call

1. Open your production site in browser
2. Open **Developer Tools** (F12)
3. Go to **Console** tab
4. Sign in with Google
5. Look for these messages:

**✅ Success:**
```
📡 Syncing user to backend: https://your-backend.com/api/users/sync
✅ User synced to backend: {success: true, user: {id: "...", email: "...", name: "..."}}
```

**❌ Failure (Backend not deployed):**
```
Access to fetch at 'http://localhost:8000/api/users/sync' from origin 
'https://mobilaws.vercel.app' has been blocked by CORS policy
⚠️ Failed to sync user to backend (admin list)
```

---

### Step 2: Check Backend Logs

If you deployed to **Railway**:

1. Go to [railway.app](https://railway.app/dashboard)
2. Click on your backend service
3. Click **"Deployments"** → **"View Logs"**
4. When a user signs in, you should see:

```
✅ User synced: { id: '...', email: '...', name: '...' }
```

If you deployed to **Render**:

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click on your web service
3. Click **"Logs"** tab
4. Look for sync messages

---

### Step 3: Test Admin Panel

1. Go to `/admin/login` on your site
2. Sign in with your admin Google account
3. Click **"Users"** tab
4. You should see a list of users who have signed in

**✅ Working:**
```
User ID         | Name        | Email                | Status   | Created
k91SzXxlGeVBk... | John Doe   | john@example.com    | Active   | Nov 16, 2025
a82KwYxmHfWCk... | Jane Smith | jane@example.com    | Active   | Nov 15, 2025
```

**❌ Not Working:**
```
No users found
```

---

### Step 4: Manual Backend Test

You can manually test the sync endpoint:

1. Open a new terminal
2. Run this command (replace URL with your backend):

```bash
curl -X POST https://your-backend.railway.app/api/users/sync \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test123",
    "email": "test@example.com",
    "name": "Test User",
    "picture": "https://via.placeholder.com/150"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "test123",
    "email": "test@example.com",
    "name": "Test User",
    "picture": "https://via.placeholder.com/150",
    "status": "active",
    "createdAt": "2025-11-16T10:30:00.000Z",
    "updatedAt": "2025-11-16T10:30:00.000Z"
  }
}
```

3. Then check admin panel - "Test User" should appear in users list

---

## 🔍 Debugging Common Issues

### Issue 1: "Failed to fetch" Error

**Cause:** Backend is not running or URL is wrong

**Fix:**
1. Check `VITE_API_URL` in Vercel environment variables
2. Make sure it ends with `/api`
3. Test backend URL directly in browser: `https://your-backend.com/healthz`
   - Should return: `{"status": "ok"}`

---

### Issue 2: CORS Error

**Cause:** Backend CORS settings don't allow your frontend origin

**Fix:**
1. Check backend environment variables:
   ```
   FRONTEND_URL=https://mobilaws.vercel.app
   CORS_ORIGINS=https://mobilaws.vercel.app
   ```
2. Restart backend service
3. Try sign-in again

---

### Issue 3: Admin Panel Shows "No Users"

**Possible Causes:**

1. **Backend not deployed** → Deploy backend first
2. **Admin not authorized** → Check `ADMIN_EMAILS` environment variable
3. **No users have signed in yet** → Test by signing in first
4. **Backend restarted** → In-memory storage is cleared (use database)

**Debug Steps:**

1. Check backend logs for sync messages
2. Manually test the sync endpoint (see Step 4 above)
3. Check admin/users endpoint directly:
   ```bash
   curl https://your-backend.railway.app/api/admin/users \
     -H "x-admin-email: your-admin@email.com" \
     -H "x-admin-token: your-token"
   ```

---

### Issue 4: Users Disappear After Backend Restart

**Cause:** In-memory storage (Map) is cleared on restart

**Solution:**
- Use a database (PostgreSQL, MongoDB, etc.)
- See "Optional: Upgrade to Database Storage" in USER_TRACKING_GUIDE.md

**Temporary Workaround:**
- Keep backend running without restarts
- Export user data before maintenance

---

## 📊 Expected User Flow

```
1. User visits https://mobilaws.vercel.app
   └─> Opens page

2. User clicks "Sign in with Google"
   └─> Redirected to Google OAuth

3. User authorizes app
   └─> Redirected back to app

4. Frontend receives Google user data
   └─> FirebaseAuthContext.tsx line 98-159

5. Frontend calls POST /api/users/sync
   └─> Sends: {id, email, name, picture}

6. Backend receives sync request
   └─> ai-backend/src/routes/users.ts line 11-46

7. Backend stores user in Map
   └─> adminStorage.users.set(id, userRecord)

8. Backend returns success
   └─> {success: true, user: {...}}

9. Admin opens /admin/dashboard
   └─> AdminContext.tsx calls getUsers()

10. Frontend calls GET /api/admin/users
    └─> With admin headers

11. Backend returns user list
    └─> Reads from adminStorage.users

12. Admin panel displays users
    └─> UserManagement.tsx renders table
```

---

## ✅ Success Criteria

After deploying backend and setting environment variables:

- [ ] User can sign in with Google
- [ ] Browser console shows successful sync message
- [ ] Backend logs show user sync
- [ ] Admin panel shows user in Users tab
- [ ] User count in Overview tab is correct
- [ ] No CORS errors in console
- [ ] No "Failed to fetch" errors

---

## 🆘 Still Not Working?

1. **Check all environment variables** are set correctly
2. **Hard refresh** browser (Ctrl+Shift+R)
3. **Clear browser cache**
4. **Try incognito mode**
5. **Check backend is actually running** (visit health endpoint)
6. **Review backend logs** for errors
7. **Verify admin email is in whitelist** (`ADMIN_EMAILS`)

If still having issues, check:
- PRODUCTION_FIX_GUIDE.md
- ERROR_RESOLUTION_SUMMARY.md
- Backend deployment logs

---

## 🎯 Quick Test Script

Save this as `test-user-sync.sh`:

```bash
#!/bin/bash

BACKEND_URL="https://your-backend.railway.app"

echo "Testing user sync endpoint..."
curl -X POST $BACKEND_URL/api/users/sync \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_'$(date +%s)'",
    "email": "test@example.com",
    "name": "Test User"
  }'

echo -e "\n\nTesting admin users endpoint..."
curl $BACKEND_URL/api/admin/users \
  -H "x-admin-email: your-admin@email.com" \
  -H "x-admin-token: test-token"
```

Run: `bash test-user-sync.sh`


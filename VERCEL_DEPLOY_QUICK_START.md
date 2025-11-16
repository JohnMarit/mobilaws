# ⚡ Quick Start: Deploy Backend to Vercel

## ✅ Code is Ready!

All code changes are complete. Your backend is ready to deploy.

---

## 🚀 5-Minute Deployment

### Step 1: Go to Vercel Dashboard
👉 [vercel.com/dashboard](https://vercel.com/dashboard)

### Step 2: Create New Project
1. Click **"Add New Project"**
2. Import your **Mobilaws** GitHub repository
3. **IMPORTANT:** Set **Root Directory** to: `ai-backend`

### Step 3: Add Environment Variables
Click **"Environment Variables"** and add these (minimum required):

```bash
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=https://mobilaws.vercel.app
CORS_ORIGINS=https://mobilaws.vercel.app
ADMIN_EMAILS=thuchabraham42@gmail.com
NODE_ENV=production
```

**Replace:**
- `your_openai_key` with your actual OpenAI API key
- `https://mobilaws.vercel.app` with your actual frontend URL

### Step 4: Deploy
Click **"Deploy"** and wait 2-5 minutes.

### Step 5: Copy Backend URL
After deployment, copy your backend URL:
```
https://mobilaws-backend.vercel.app
```

### Step 6: Update Frontend
1. Go to your **frontend** Vercel project
2. Settings → Environment Variables
3. Add/Update:
   ```
   VITE_API_URL=https://mobilaws-backend.vercel.app/api
   ```
   (Use YOUR backend URL from Step 5)
4. Redeploy frontend

### Step 7: Test
Visit: `https://your-backend.vercel.app/healthz`

Should return: `{"status": "ok"}`

---

## ✅ Done!

Your backend is now deployed! 🎉

**Next Steps:**
- Test user sign-in
- Check admin panel
- Sync previous users (click "Sync from Firestore")

---

## 📋 Full Guide

For detailed instructions, see:
**VERCEL_BACKEND_DEPLOYMENT_COMPLETE.md**

---

## 🆘 Troubleshooting

**Build fails?**
→ Check Root Directory is set to `ai-backend`

**CORS error?**
→ Verify `CORS_ORIGINS` matches your frontend URL exactly

**Users not syncing?**
→ Check `VITE_API_URL` is set correctly in frontend

**Need help?**
→ See VERCEL_BACKEND_DEPLOYMENT_COMPLETE.md for detailed troubleshooting


# Setup API URL - Fix "Failed to Fetch" Error

## 🔧 The Problem

Your frontend is trying to connect to `localhost:8000` even when deployed to Vercel. This doesn't work because:

1. **Localhost** = Your local computer
2. **Vercel** = A remote server

When deployed, your frontend needs to connect to your **deployed backend**, not localhost!

## ✅ The Solution

### For Local Development

Create `.env.local` in the root directory:

```bash
VITE_API_URL=http://localhost:8000/api
```

### For Vercel Deployment

You have **TWO options**:

## Option 1: Deploy Backend to Railway (Recommended ⭐)

### Step 1: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `ai-backend` folder as root directory
6. Click "Deploy"

### Step 2: Get Your Backend URL

Railway will give you a URL like:
```
https://mobilaws-backend.up.railway.app
```

### Step 3: Set Environment Variables on Railway

Add these in Railway dashboard:

```bash
OPENAI_API_KEY=your_openai_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=thuchabraham42@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@mobilaws.com
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
NODE_ENV=production
PORT=8000
```

### Step 4: Update Vercel (Frontend)

In Vercel project settings → Environment Variables:

```bash
VITE_API_URL=https://mobilaws-backend.up.railway.app/api
```

### Step 5: Redeploy

Redeploy your Vercel frontend, and it should work!

## Option 2: Keep Backend on Your Computer

If you want to test with your local backend:

### Step 1: Expose Your Local Backend

Use a service like **ngrok** or **Cloudflare Tunnel**:

```bash
# Install ngrok
npm install -g ngrok

# Expose port 8000
ngrok http 8000
```

You'll get a URL like:
```
https://abc123.ngrok.io
```

### Step 2: Update Vercel

Set environment variable:

```bash
VITE_API_URL=https://abc123.ngrok.io/api
```

⚠️ **Note**: This is temporary and only for testing!

## 🎯 Quick Fix for Right Now

### Temporary Solution:

Update your frontend code to use a deployed backend URL:

**Edit `src/lib/api.ts`** and change:

```typescript
export const API_BASE_URL = 'https://your-backend-url.com/api';
```

## 📋 Complete Setup Checklist

- [ ] Backend is running somewhere (Railway/local/Vercel)
- [ ] You have the backend URL
- [ ] Set `VITE_API_URL` in Vercel environment variables
- [ ] Redeploy frontend
- [ ] Test magic link login
- [ ] Check browser console for errors

## 🧪 Test Your Setup

### 1. Check Backend is Running

Open in browser:
```
https://your-backend-url.com/healthz
```

Should see:
```json
{
  "status": "healthy"
}
```

### 2. Check Frontend API URL

Open browser console on your Vercel app:

```javascript
console.log(import.meta.env.VITE_API_URL)
```

Should show your backend URL, not `localhost`!

### 3. Test Magic Link

1. Go to your Vercel app `/admin/login`
2. Enter email
3. Click "Send Magic Link"
4. Should work without "Failed to fetch" error

## 🐛 Still Not Working?

### Check These:

1. **Backend URL is correct**:
   - Should end with `/api`
   - Should be HTTPS in production
   - No trailing slash

2. **CORS is configured**:
   - Backend has `CORS_ORIGINS` set to your Vercel URL
   - Includes https://

3. **Environment variable is set**:
   - In Vercel project settings
   - Named exactly: `VITE_API_URL`
   - Starts with `VITE_`

4. **Redeployed after changes**:
   - Environment variables only apply after redeploy
   - Click "Redeploy" in Vercel

## 💡 Recommended Setup

```
Your Computer:
├── Frontend Code (push to GitHub)
└── Backend Code (push to GitHub)

Vercel (Frontend):
└── Deploys from GitHub
    └── Uses: VITE_API_URL=https://backend.railway.app/api

Railway (Backend):
└── Deploys from GitHub
    └── Environment variables configured
```

## 🚀 Quick Railway Setup

```bash
# 1. Push code to GitHub

# 2. Go to railway.app

# 3. New Project → From GitHub → Select repo → Select ai-backend folder

# 4. Add environment variables (see above)

# 5. Copy the Railway URL

# 6. Add to Vercel: VITE_API_URL=https://your-app.railway.app/api

# 7. Redeploy Vercel

# Done! ✅
```

---

**Bottom Line**: Your frontend on Vercel needs to know where your backend is. Set `VITE_API_URL` to your backend URL!

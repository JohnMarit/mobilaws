# Fix Vercel Deployment - Step by Step

## 🎯 Current Situation

You deployed to Vercel but getting:
- ❌ "Failed to fetch"
- ❌ "CSP violation"
- ❌ "Connection refused"

**Root Cause**: Your backend isn't deployed anywhere! The frontend has nowhere to connect.

## ✅ Solution: Deploy Backend + Configure Frontend

### Option 1: Deploy Backend to Railway (Easiest - 5 minutes)

#### Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click "Login with GitHub"
3. Authorize Railway

#### Step 2: Deploy Backend

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `Mobilaws` repository
4. **Important**: Set **Root Directory** to `ai-backend`
5. Click "Deploy"

#### Step 3: Add Environment Variables on Railway

Click on your deployed service → Variables tab → Add these:

```bash
NODE_ENV=production
PORT=8000

# OpenAI (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=thuchabraham42@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@mobilaws.com

# Frontend URL (Your Vercel URL)
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app

# Database (optional for now)
# VECTOR_BACKEND=chroma
# CHROMA_DIR=./storage/chroma
# DOCS_DIR=./storage/documents

# Stripe (if using payments)
# STRIPE_SECRET_KEY=sk_live_xxx
# STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### Step 4: Get Your Railway URL

After deployment, Railway gives you a URL like:
```
https://mobilaws-backend-production.up.railway.app
```

Copy this URL!

#### Step 5: Configure Vercel Frontend

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   ```
   Name: VITE_API_URL
   Value: https://mobilaws-backend-production.up.railway.app/api
   ```
   (Use YOUR Railway URL + `/api`)

5. Click **Save**

#### Step 6: Redeploy Vercel

1. Go to **Deployments** tab
2. Click the three dots (•••) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to finish

#### Step 7: Update Railway CORS

Go back to Railway → Variables → Update:
```bash
FRONTEND_URL=https://your-actual-vercel-url.vercel.app
CORS_ORIGINS=https://your-actual-vercel-url.vercel.app
```

Replace with your actual Vercel URL!

#### Step 8: Test! 🎉

1. Go to: `https://your-app.vercel.app/admin/login`
2. Enter: `thuchabraham42@gmail.com`
3. Click "Send Magic Link"
4. Should work now! ✅

---

### Option 2: Use Vercel for Backend Too

#### Step 1: Create New Vercel Project for Backend

1. Go to Vercel dashboard
2. Click "Add New" → "Project"
3. Import your repository again
4. **Root Directory**: Set to `ai-backend`
5. **Framework Preset**: Other
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`

#### Step 2: Add Environment Variables

Same as Railway (see above), add all the env vars in Vercel settings.

#### Step 3: Deploy

Click "Deploy" and wait.

#### Step 4: Get Backend URL

After deployment, copy the URL:
```
https://mobilaws-backend.vercel.app
```

#### Step 5: Update Frontend Vercel Project

In your **frontend** Vercel project:
- Settings → Environment Variables
- Add: `VITE_API_URL=https://mobilaws-backend.vercel.app/api`

#### Step 6: Redeploy Frontend

Deployments → Redeploy

---

### Option 3: Run Backend on Your Computer (Temporary)

⚠️ **Only for testing - not recommended for production**

#### Step 1: Expose Your Local Backend

```bash
# Install ngrok
npm install -g ngrok

# Start your backend
cd ai-backend
npm run dev

# In another terminal, expose it
ngrok http 8000
```

Copy the HTTPS URL:
```
https://abc123.ngrok.io
```

#### Step 2: Update Vercel

Environment Variables:
```
VITE_API_URL=https://abc123.ngrok.io/api
```

⚠️ **Note**: This ngrok URL changes every time you restart!

---

## 🧪 Verify It's Working

### Test Backend

Open in browser:
```
https://your-backend-url.railway.app/healthz
```

Should see:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

### Test Frontend

1. Open browser console (F12)
2. Go to your Vercel app
3. In console, type:
   ```javascript
   console.log(import.meta.env.VITE_API_URL)
   ```
4. Should show your Railway URL, **not** `undefined` or `localhost`

### Test Magic Link

1. Go to `/admin/login`
2. Enter email
3. Click "Send Magic Link"
4. Should work without errors! ✅

---

## 📧 Gmail App Password Setup

To send emails, you need a Gmail App Password:

1. Go to [Google Account](https://myaccount.google.com)
2. Security → 2-Step Verification (enable if not enabled)
3. Security → App passwords
4. Select "Mail" and "Other (Custom name)"
5. Name it "Mobilaws"
6. Copy the 16-character password
7. Use this as `EMAIL_PASSWORD` in Railway

---

## 🐛 Troubleshooting

### "Failed to fetch" still appears

**Check**:
1. Is VITE_API_URL set correctly in Vercel?
2. Did you redeploy after adding the variable?
3. Is your backend actually running? (Test the /healthz endpoint)

### "CSP violation"

**Fixed**: The CSP in `index.html` has been updated to allow Railway, Vercel, and other hosting providers.

### Backend won't deploy

**Common issues**:
1. Missing `OPENAI_API_KEY`
2. Wrong root directory (should be `ai-backend`)
3. Node version mismatch - Set engines in package.json:
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

### Email not sending

**Check**:
1. Gmail App Password is correct (16 characters, no spaces)
2. EMAIL_USER is your full Gmail address
3. EMAIL_HOST is `smtp.gmail.com`
4. EMAIL_PORT is `587`

---

## ✅ Final Checklist

- [ ] Backend deployed to Railway/Vercel
- [ ] Backend environment variables set
- [ ] Backend /healthz endpoint works
- [ ] Frontend VITE_API_URL set in Vercel
- [ ] Frontend redeployed after adding env var
- [ ] CORS configured with correct Vercel URL
- [ ] Gmail App Password configured
- [ ] Magic link login tested
- [ ] No CSP errors in console
- [ ] Admin dashboard accessible

---

## 🎯 Quick Commands

```bash
# Test backend locally
cd ai-backend
npm run dev

# Test backend health (replace with your URL)
curl https://your-backend.railway.app/healthz

# Check frontend env (in browser console)
console.log(import.meta.env.VITE_API_URL)
```

---

## 💡 Pro Tips

1. **Railway is easier than Vercel for backends** - It's designed for long-running processes
2. **Always set VITE_API_URL** - Without it, production won't work
3. **Test /healthz endpoint first** - If this doesn't work, nothing will
4. **Redeploy after env changes** - Vercel needs a redeploy to pick up new variables
5. **Check browser console** - It will show you exactly what URL it's trying to connect to

---

**Your CSP has been fixed! Now just deploy your backend and set VITE_API_URL!** 🚀

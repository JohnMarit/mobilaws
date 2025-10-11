# Deploy Backend to Railway (5 Minutes)

## 🎯 Why Railway?

Your `ai-backend` is a full Express server with:
- OpenAI API calls
- Vector database (Chroma)
- RAG system
- Magic link authentication
- Long-running processes

**Firebase Functions** doesn't support this well. **Railway** does! And it's free.

## 🚀 Step-by-Step Deployment

### Step 1: Sign Up (1 minute)

1. Go to [railway.app](https://railway.app)
2. Click "Login with GitHub"
3. Authorize Railway to access your repos

### Step 2: Deploy (2 minutes)

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `Mobilaws` repository
4. **Important**: Set **Root Directory** to `ai-backend`
5. Click "Deploy"

Railway will automatically:
- Detect it's a Node.js app
- Run `npm install`
- Run `npm run build`
- Start your server

### Step 3: Add Environment Variables (2 minutes)

Click on your service → **Variables** tab → Add these:

```bash
# Required
NODE_ENV=production
PORT=8000

# OpenAI (YOU MUST HAVE THIS)
OPENAI_API_KEY=sk-proj-your_openai_key_here

# Your Vercel Frontend URL
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app

# Email for Magic Links
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=thuchabraham42@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@mobilaws.com

# Vector Database
VECTOR_BACKEND=chroma
CHROMA_DIR=./storage/chroma
DOCS_DIR=./storage/documents

# LLM Settings
LLM_MODEL=gpt-4o
EMBED_MODEL=text-embedding-3-large
TEMPERATURE=0.1
MAX_TOKENS=1024
TOP_K=5

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### Step 4: Get Your Railway URL

After deployment completes:
1. Click on your service
2. Go to **Settings** tab
3. Scroll to **Domains**
4. You'll see a URL like: `https://mobilaws-backend-production.up.railway.app`
5. **Copy this URL!**

### Step 5: Configure Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Mobilaws** project
3. Go to **Settings** → **Environment Variables**
4. Add or update:

```bash
VITE_API_URL=https://mobilaws-backend-production.up.railway.app/api
```

**Important**: Add `/api` at the end!

5. Click **Save**

### Step 6: Update Railway CORS

Go back to Railway → Variables → Update these with your ACTUAL Vercel URL:

```bash
FRONTEND_URL=https://your-actual-app.vercel.app
CORS_ORIGINS=https://your-actual-app.vercel.app
```

### Step 7: Redeploy Vercel

1. Vercel Dashboard → Your Project
2. **Deployments** tab
3. Click ••• on latest deployment
4. Click "Redeploy"

## ✅ Test It!

### Test 1: Backend Health

Open in browser:
```
https://your-railway-url.up.railway.app/healthz
```

Should see:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

### Test 2: Frontend Connection

1. Go to your Vercel app
2. Open browser console (F12)
3. Type:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

Should show your Railway URL!

### Test 3: Magic Link

1. Go to: `https://your-app.vercel.app/admin/login`
2. Enter: `thuchabraham42@gmail.com`
3. Click "Send Magic Link"
4. Should work! ✅

## 📧 Gmail App Password

To send magic link emails:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not enabled)
3. Go back to Security → **App passwords**
4. Create new app password for "Mail"
5. Copy the 16-character password
6. Use as `EMAIL_PASSWORD` in Railway

## 💰 Pricing

Railway Free Tier includes:
- $5 credit per month
- More than enough for development
- About 500 hours of runtime

Your backend will cost ~$0 for testing!

## 🐛 Troubleshooting

### "OPENAI_API_KEY is required"

**Solution**: Add `OPENAI_API_KEY` in Railway variables

### Build fails

**Check**:
1. Root directory is set to `ai-backend`
2. Railway can access your repo
3. Check deployment logs for errors

### "Failed to fetch" on Vercel

**Check**:
1. Is `VITE_API_URL` set correctly?
2. Did you redeploy Vercel after adding it?
3. Does Railway URL end with `/api`?
4. Test the /healthz endpoint

### CORS errors

**Check**:
1. `CORS_ORIGINS` matches your Vercel URL exactly
2. Includes `https://`
3. No trailing slash

## 📋 Complete Environment Variable List for Railway

```bash
NODE_ENV=production
PORT=8000
OPENAI_API_KEY=sk-proj-xxxxx
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=thuchabraham42@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=noreply@mobilaws.com
VECTOR_BACKEND=chroma
CHROMA_DIR=./storage/chroma
DOCS_DIR=./storage/documents
LLM_MODEL=gpt-4o
EMBED_MODEL=text-embedding-3-large
TEMPERATURE=0.1
MAX_TOKENS=1024
TOP_K=5
CHUNK_SIZE=1000
CHUNK_OVERLAP=150
```

**Optional** (if using payments):
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## ✅ Success Checklist

- [ ] Railway account created
- [ ] Backend deployed to Railway
- [ ] All environment variables added
- [ ] Railway URL copied
- [ ] VITE_API_URL set in Vercel
- [ ] Vercel redeployed
- [ ] /healthz endpoint works
- [ ] Magic link tested
- [ ] No errors in console

---

**That's it! Your backend will be running on Railway and your frontend on Vercel!** 🎉

# 🚀 Quick Fix: Vercel + Firebase Setup

## Your Current Setup

- ✅ **Frontend**: Vercel (React app)
- ✅ **User Auth**: Firebase Authentication  
- ❌ **AI Backend**: Needs deployment (currently `ai-backend` folder)

## The Problem

Firebase is for **user authentication** (login/signup).  
But your **AI backend** (`ai-backend` folder) is a full Express server that:
- Calls OpenAI API
- Runs RAG (vector search)
- Handles magic links
- Manages subscriptions

**Firebase Functions can't run this!** You need a real server.

## The Solution

**Deploy `ai-backend` to Railway** (it's free and takes 5 minutes)

### Why Railway?
- ✅ Free tier ($5/month credit)
- ✅ Your Express server runs as-is
- ✅ Perfect for AI backends
- ✅ Easy setup

## 5-Minute Setup

### 1. Deploy to Railway

```
1. Go to railway.app
2. Login with GitHub
3. New Project → From GitHub → Select ai-backend folder
4. Click Deploy
```

### 2. Add These Environment Variables in Railway

```bash
NODE_ENV=production
PORT=8000
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app
EMAIL_USER=thuchabraham42@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 3. Get Railway URL

After deployment:
- Copy URL: `https://mobilaws-backend.railway.app`

### 4. Set in Vercel

Vercel → Settings → Environment Variables:

```bash
VITE_API_URL=https://mobilaws-backend.railway.app/api
```

### 5. Redeploy Vercel

Vercel → Deployments → Redeploy

## Test

1. Go to: `https://your-app.vercel.app/admin/login`
2. Enter: `thuchabraham42@gmail.com`
3. Click "Send Magic Link"
4. ✅ Should work!

## Final Architecture

```
┌─────────────────┐
│     Vercel      │  ← React Frontend
│   (Frontend)    │  ← Firebase Auth (users)
└────────┬────────┘
         │
         ↓ API Calls
┌─────────────────┐
│    Railway      │  ← AI Backend
│   (ai-backend)  │  ← OpenAI, RAG, etc
└─────────────────┘
```

## Cost

- Vercel: Free
- Firebase: Free (Auth)
- Railway: Free ($5 credit/month)

**Total: $0** 🎉

---

**See `RAILWAY_DEPLOYMENT_SIMPLE.md` for detailed steps!**

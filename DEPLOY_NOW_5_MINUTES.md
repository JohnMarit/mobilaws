# Deploy Your Backend NOW (5 Minutes)

## 🎯 You Don't Need Django!

Your Node.js backend works perfectly with Vercel. Just deploy it!

## ⚡ Super Quick: Deploy to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy Backend
```bash
cd ai-backend
vercel --prod
```

Answer the prompts:
- Set up project? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name? **mobilaws-backend**
- Directory? **./ai-backend**
- Override settings? **No**

### 3. Add Environment Variables

While it's deploying, go to [Vercel Dashboard](https://vercel.com):

1. Find your **mobilaws-backend** project
2. Settings → Environment Variables
3. Add these:

```bash
NODE_ENV=production
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=https://your-frontend.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=thuchabraham42@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@mobilaws.com
LLM_MODEL=gpt-4o
EMBED_MODEL=text-embedding-3-large
TEMPERATURE=0.1
MAX_TOKENS=1024
```

### 4. Redeploy Backend

```bash
vercel --prod
```

### 5. Copy Backend URL

You'll get something like:
```
https://mobilaws-backend.vercel.app
```

### 6. Update Frontend

Go to your **frontend** Vercel project:
- Settings → Environment Variables
- Add/Update:

```bash
VITE_API_URL=https://mobilaws-backend.vercel.app/api
```

### 7. Redeploy Frontend

In Vercel dashboard:
- Deployments → Latest → Redeploy

## ✅ Test

1. Go to: `https://your-app.vercel.app/admin/login`
2. Enter: `thuchabraham42@gmail.com`
3. Click "Send Magic Link"
4. Should work! 🎉

---

## 🎯 Alternative: Railway (Even Better)

Railway has no timeouts and better performance:

```bash
1. Go to railway.app
2. Login with GitHub
3. New Project → From GitHub → ai-backend
4. Add same environment variables
5. Copy Railway URL
6. Set VITE_API_URL in frontend Vercel
7. Done!
```

**Railway is better for AI workloads!**

---

## 💡 Key Points

- ✅ Your Node.js backend works with Vercel
- ✅ No Django needed
- ✅ No code changes needed
- ✅ Deploy in 5 minutes
- ✅ Magic links will work perfectly

**Just deploy it!** 🚀

---

## 📚 More Info

- **Vercel deployment**: `VERCEL_NODEJS_BACKEND.md`
- **Railway deployment**: `RAILWAY_DEPLOYMENT_SIMPLE.md`
- **Comparison**: `DEPLOYMENT_OPTIONS_COMPARISON.md`

**Start with Railway - it's easier and better!**

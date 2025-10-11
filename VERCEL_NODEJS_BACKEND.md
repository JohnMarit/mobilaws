# Deploy Node.js Backend to Vercel

## Yes, Your Node.js Backend Works on Vercel!

Your `ai-backend` can be deployed to Vercel with a few small changes.

## 🚀 Step-by-Step Setup

### Step 1: Create Vercel Configuration

Create `ai-backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/src/server.js"
    }
  ]
}
```

### Step 2: Update package.json

Add build script if not present:

```json
{
  "scripts": {
    "build": "tsc",
    "vercel-build": "npm run build"
  }
}
```

### Step 3: Deploy Backend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Go to backend folder
cd ai-backend

# Deploy
vercel --prod
```

### Step 4: Set Environment Variables on Vercel

In Vercel dashboard for your **backend project**:

```bash
NODE_ENV=production
OPENAI_API_KEY=your_key
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=https://your-frontend.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=thuchabraham42@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@mobilaws.com
LLM_MODEL=gpt-4o
EMBED_MODEL=text-embedding-3-large
```

### Step 5: Get Backend URL

After deployment, Vercel gives you:
```
https://mobilaws-backend.vercel.app
```

### Step 6: Update Frontend

In your **frontend** Vercel project:

```bash
VITE_API_URL=https://mobilaws-backend.vercel.app/api
```

### Step 7: Redeploy Frontend

Done! ✅

## ⚠️ Important Limitations

Vercel Serverless has limits:
- 10 second timeout (Hobby)
- 60 second timeout (Pro)
- No persistent file storage
- Cold starts

**For AI/RAG backend, Railway is still better**, but this works!

## 🎯 Quick Deploy

```bash
cd ai-backend
vercel --prod
# Answer prompts
# Copy the URL
```

Then set `VITE_API_URL` in frontend Vercel project.

---

**This is MUCH faster than rewriting in Django!**

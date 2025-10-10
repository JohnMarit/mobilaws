# Vercel Deployment Guide - Magic Link Auth

Complete guide to deploy Mobilaws with magic link authentication to Vercel.

## 🎯 Overview

You need to deploy TWO separate projects:
1. **Frontend** - Your React app (to Vercel)
2. **Backend** - Your Express API (to Vercel, Railway, or Heroku)

## 📋 Prerequisites

- Vercel account
- Backend hosting (Vercel Serverless, Railway, or Heroku)
- Domain name (optional but recommended)

## 🔧 Frontend Deployment (Vercel)

### Step 1: Set Environment Variables

In your Vercel project settings, add:

```bash
# Required: Your backend URL
VITE_API_URL=https://your-backend.vercel.app/api

# Optional: Stripe (if using payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
```

### Step 2: Build Settings

Vercel should auto-detect these, but verify:

```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 3: Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🖥️ Backend Deployment Options

### Option 1: Vercel Serverless (Easiest)

**Create `api-backend/vercel.json`**:

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
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Set Environment Variables** in Vercel:

```bash
# OpenAI
OPENAI_API_KEY=your_openai_key

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@mobilaws.com
FRONTEND_URL=https://your-frontend.vercel.app

# Stripe (optional)
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Database (recommended for production)
# DATABASE_URL=your_database_url

# Other settings
PORT=8000
NODE_ENV=production
CORS_ORIGINS=https://your-frontend.vercel.app
```

**Deploy Backend**:

```bash
cd ai-backend
vercel --prod
```

### Option 2: Railway (Recommended for Long-Running Servers)

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect your GitHub repo
4. Select `ai-backend` folder
5. Add environment variables (same as above)
6. Deploy!

Railway gives you a URL like: `https://your-app.railway.app`

### Option 3: Heroku

```bash
# Install Heroku CLI
# Create new app
heroku create mobilaws-backend

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key
heroku config:set EMAIL_HOST=smtp.gmail.com
# ... (all other env vars)

# Deploy
git subtree push --prefix ai-backend heroku main
```

## 🔗 Connect Frontend to Backend

### Update Frontend Environment

In Vercel (Frontend project), set:

```bash
VITE_API_URL=https://your-backend-url.com/api
```

**Examples**:
- Railway: `https://mobilaws-backend.railway.app/api`
- Vercel: `https://mobilaws-backend.vercel.app/api`
- Heroku: `https://mobilaws-backend.herokuapp.com/api`

### Update Backend CORS

In backend environment variables, set:

```bash
CORS_ORIGINS=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
```

## 📧 Email Service Configuration

### For Gmail

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Google Account → Security → 2-Step Verification
   - App passwords → Generate
3. Use app password as `EMAIL_PASSWORD`

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@mobilaws.com
```

### For SendGrid (Recommended for Production)

```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

## 🧪 Testing Deployed App

### 1. Test Backend Health

```bash
curl https://your-backend-url.com/healthz
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

### 2. Test Magic Link

1. Go to: `https://your-frontend.vercel.app/admin/login`
2. Enter: `thuchabraham42@gmail.com`
3. Click "Send Magic Link"
4. Check your email inbox
5. Click the link in email
6. Should redirect to admin dashboard

## 🔒 Production Security Checklist

- [ ] Use HTTPS for everything
- [ ] Set secure CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting on backend
- [ ] Use production Stripe keys
- [ ] Configure email service properly
- [ ] Set up monitoring (Sentry)
- [ ] Enable logging
- [ ] Use a real database (not in-memory)
- [ ] Set up backups

## 🐛 Troubleshooting

### "Failed to fetch" Error

**Problem**: Frontend can't connect to backend

**Solutions**:
1. Check `VITE_API_URL` is set correctly in Vercel
2. Verify backend is deployed and running
3. Check CORS settings on backend
4. Test backend health endpoint

### "CORS Error"

**Problem**: Cross-origin request blocked

**Solution**:
Update backend `CORS_ORIGINS`:
```bash
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com
```

### Magic Link Not Received

**Problem**: Email not being sent

**Solutions**:
1. Check email service credentials
2. Verify `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`
3. Check spam folder
4. Test email service separately
5. Check backend logs for errors

### "Token Expired" or "Invalid Token"

**Problem**: Token storage issue

**Solution**:
- Use Redis for token storage in production
- Ensure backend stays running (not serverless for tokens)
- Or use database for token persistence

## 📊 Recommended Architecture

```
┌─────────────────┐
│   Vercel        │
│   (Frontend)    │
│   React App     │
└────────┬────────┘
         │ HTTPS
         │
    ┌────▼────┐
    │  CORS   │
    └────┬────┘
         │
┌────────▼────────┐
│   Railway       │
│   (Backend)     │
│   Express API   │
└────────┬────────┘
         │
    ┌────▼────┐
    │Database │
    │Redis    │
    │Email    │
    └─────────┘
```

## 🎯 Post-Deployment Steps

1. **Test All Features**:
   - Magic link login
   - Admin dashboard
   - User management
   - Subscription system
   - Payment gateway

2. **Monitor**:
   - Set up error tracking (Sentry)
   - Monitor backend logs
   - Check email delivery
   - Track API usage

3. **Optimize**:
   - Enable caching
   - Optimize images
   - Minify assets
   - Use CDN

## 📝 Environment Variables Checklist

### Frontend (.env or Vercel Settings)

```bash
VITE_API_URL=https://your-backend.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Backend (Railway/Vercel Settings)

```bash
# Required
OPENAI_API_KEY=sk-xxx
NODE_ENV=production
PORT=8000

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@mobilaws.com

# Frontend
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=https://your-frontend.vercel.app

# Stripe (if using)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Database (recommended)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## 🚀 Quick Deploy Commands

```bash
# Frontend
cd mobilaws
vercel --prod

# Backend (if using Vercel)
cd ai-backend
vercel --prod

# Update environment variables
vercel env add VITE_API_URL
vercel env add EMAIL_HOST
# ... etc
```

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Nodemailer Guide](https://nodemailer.com/)
- [Stripe Deployment](https://stripe.com/docs/keys)

## ✅ Deployment Success Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed (Railway/Vercel/Heroku)
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] Email service working
- [ ] Magic link login tested
- [ ] Admin dashboard accessible
- [ ] All features working
- [ ] Monitoring enabled
- [ ] Backups configured

---

**Your backend needs to be running somewhere!** The frontend on Vercel can't work without it.

**Recommended**: Deploy backend to Railway - it's free, easy, and perfect for Node.js apps!

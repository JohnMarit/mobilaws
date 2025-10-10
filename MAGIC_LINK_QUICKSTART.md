# Magic Link Authentication - Quick Start

Get started with passwordless authentication in 2 minutes!

## 🚀 Quick Setup

### 1. Start Servers

```bash
# Terminal 1 - Backend
cd ai-backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### 2. Access Admin Login

```
http://localhost:5173/admin/login
```

### 3. Enter Your Email

```
Email: thuchabraham42@gmail.com
```

Click **"Send Magic Link"**

### 4. Get the Link

**Development Mode** - Check the backend console for:

```
================================================================================
📧 MAGIC LINK EMAIL (Development Mode)
================================================================================
To: thuchabraham42@gmail.com

🔗 Magic Link:
http://localhost:5173/admin/verify?token=abc123...
================================================================================
```

### 5. Click the Link

Copy the URL from console and paste in browser, or:
- Frontend console also shows the link
- Click it to verify and login

### 6. Done! 🎉

You're now logged into the admin dashboard!

## 🔑 How It Works

1. **Enter email** → System generates unique token
2. **Token sent** → Email with magic link (console in dev mode)
3. **Click link** → Token verified automatically
4. **Logged in** → Redirected to dashboard

## ⚡ Key Features

- ✅ **No Password** - Just your email
- ✅ **15-Min Expiry** - Links expire for security
- ✅ **One-Time Use** - Each link works once
- ✅ **Auto-Login** - Click and you're in

## 🧪 Testing

### Test Flow

1. Go to `/admin/login`
2. Enter: `thuchabraham42@gmail.com`
3. Click "Send Magic Link"
4. Check backend console
5. Copy verification URL
6. Paste in browser
7. You're logged in!

### Test with curl

```bash
# Request link
curl -X POST http://localhost:8000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "thuchabraham42@gmail.com", "type": "admin"}'

# Use token from response
curl -X POST http://localhost:8000/api/auth/verify-magic-link \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR-TOKEN-HERE"}'
```

## 📧 Production Setup

When ready for production, add to `ai-backend/.env`:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@mobilaws.com
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

## 🎯 Admin Email

**Current Admin Email**: `thuchabraham42@gmail.com`

To add more admins, update `ai-backend/src/routes/auth.ts`:

```typescript
const validAdminEmails = [
  'admin@mobilaws.com', 
  'thuchabraham42@gmail.com',
  'new-admin@example.com'  // Add here
];
```

## 🔒 Security

- Tokens expire in **15 minutes**
- Each token **single-use only**
- Email verification required
- No passwords to steal

## 📚 Full Documentation

See [MAGIC_LINK_AUTH_GUIDE.md](./MAGIC_LINK_AUTH_GUIDE.md) for complete details.

---

**You're all set!** 🎊 
Magic link authentication is ready to use.

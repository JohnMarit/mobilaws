# Quick Start: Magic Link Authentication

## 🚀 Start the System

### Step 1: Start Backend Server

Open a **NEW terminal** and run:

```bash
cd ai-backend
npm run dev
```

Wait for this message:
```
✅ Server ready to accept requests
```

### Step 2: Start Frontend

Open **ANOTHER terminal** and run:

```bash
npm run dev
```

Wait for:
```
Local: http://localhost:5173/
```

## 🔐 Test Magic Link Login

### 1. Access Admin Login

Open browser: `http://localhost:5173/admin/login`

### 2. Enter Your Email

```
Email: thuchabraham42@gmail.com
```

Click **"Send Magic Link"**

### 3. Get the Magic Link

**Check the BACKEND terminal console** for:

```
================================================================================
📧 MAGIC LINK EMAIL (Development Mode)
================================================================================
To: thuchabraham42@gmail.com

🔗 Magic Link:
http://localhost:5173/admin/verify?token=abc123-def456-ghi789
================================================================================
```

### 4. Click the Link

- Copy the URL from the backend console
- Paste in your browser
- You'll be automatically logged in!

## ✅ What Should Happen

1. Email input form appears
2. After clicking "Send Magic Link", you see success message
3. Backend console shows the magic link URL
4. Click the URL → Auto login → Redirect to dashboard

## 🔧 Troubleshooting

### "Failed to fetch" Error

**Cause**: Backend server is not running

**Solution**:
1. Open a terminal
2. Run: `cd ai-backend && npm run dev`
3. Wait for "Server ready" message
4. Try magic link again

### Backend Won't Start

**If you see TypeScript errors**:

```bash
cd ai-backend
npm run build
```

If build fails, the tsconfig has been updated to allow the code to compile.

### Port Already in Use

```bash
# Kill process on port 8000
netstat -ano | findstr :8000
# Note the PID (last column)
taskkill /PID <PID> /F
```

## 📋 Complete Startup Checklist

- [ ] Backend server running (`cd ai-backend && npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Browser open to `http://localhost:5173/admin/login`
- [ ] Entered email: `thuchabraham42@gmail.com`
- [ ] Clicked "Send Magic Link"
- [ ] Checked backend console for magic link
- [ ] Clicked the magic link URL
- [ ] Successfully logged into admin dashboard

## 🎯 Your Admin Email

```
thuchabraham42@gmail.com
```

This email is authorized for admin access!

## 💡 Development Mode

In development, emails are **logged to the console** instead of being sent. This makes testing fast and easy!

**Production**: Configure email service in `ai-backend/.env` to send real emails.

---

**Need help?** Check `MAGIC_LINK_AUTH_GUIDE.md` for complete documentation.

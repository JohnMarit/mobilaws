# Magic Link Authentication Guide

Passwordless authentication system using secure email-based magic links for Mobilaws.

## 🎯 Overview

The magic link authentication system provides a secure, passwordless login experience for both regular users and administrators. Instead of remembering passwords, users simply enter their email and receive a one-time login link.

## ✨ Features

- **Passwordless Authentication**: No passwords to remember or manage
- **Email-Based Security**: One-time links sent via email
- **Time-Limited Tokens**: Links expire after 15 minutes
- **Single-Use Links**: Each link can only be used once
- **Admin & User Support**: Separate flows for admins and users
- **Development Mode**: Console logging for easy testing
- **Beautiful UI**: Modern, user-friendly interface

## 🏗️ Architecture

### Backend Components

1. **Email Service** (`ai-backend/src/services/emailService.ts`)
   - Sends magic link emails
   - Beautiful HTML email templates
   - Development mode with console logging
   - Production-ready email delivery

2. **Auth Routes** (`ai-backend/src/routes/auth.ts`)
   - `POST /api/auth/magic-link` - Request a magic link
   - `POST /api/auth/verify-magic-link` - Verify and authenticate
   - `GET /api/auth/magic-link-status/:token` - Check token status
   - `GET /api/auth/magic-link-stats` - Get statistics

3. **Token Storage**
   - In-memory Map for demo (15-minute TTL)
   - Automatic cleanup of expired tokens
   - Production recommendation: Redis or database

### Frontend Components

1. **Admin Login** (`src/pages/AdminLogin.tsx`)
   - Email input form
   - Magic link request UI
   - Success confirmation screen
   - Development mode token display

2. **Admin Verify** (`src/pages/AdminVerify.tsx`)
   - Token verification page
   - Loading states
   - Success/error handling
   - Automatic dashboard redirect

3. **Admin Context** (`src/contexts/AdminContext.tsx`)
   - `setAdminFromToken()` - Authenticate from magic link
   - Session management
   - Token storage in localStorage

## 🚀 How It Works

### User Flow

1. **User visits admin login**
   ```
   http://localhost:5173/admin/login
   ```

2. **User enters email**
   - Email: `thuchabraham42@gmail.com`
   - Clicks "Send Magic Link"

3. **System generates token**
   - Creates unique UUID token
   - Stores with 15-minute expiration
   - Sends email with verification link

4. **User receives email**
   - Beautiful HTML email
   - "Sign In to Mobilaws" button
   - Direct link to verification page

5. **User clicks link**
   ```
   http://localhost:5173/admin/verify?token=<unique-token>
   ```

6. **System verifies token**
   - Checks token exists
   - Validates not expired
   - Confirms not already used
   - Marks as used
   - Creates admin session

7. **User authenticated**
   - Redirected to admin dashboard
   - Session stored in localStorage
   - Full admin access granted

### Security Features

- ✅ **Time-Limited**: Tokens expire after 15 minutes
- ✅ **Single-Use**: Each token can only be used once
- ✅ **Email Verification**: Confirms email ownership
- ✅ **No Password Storage**: No passwords to leak
- ✅ **Automatic Cleanup**: Expired tokens removed
- ✅ **HTTPS Ready**: Secure in production

## 📧 Email Configuration

### Development Mode (Current)

Emails are logged to the console instead of being sent:

```bash
================================================================================
📧 MAGIC LINK EMAIL (Development Mode)
================================================================================
To: thuchabraham42@gmail.com
Subject: Admin Login - Mobilaws
Type: admin

🔗 Magic Link:
http://localhost:5173/admin/verify?token=abc123...

📝 Token:
abc123-def456-ghi789
================================================================================
```

### Production Setup

Add to `ai-backend/.env`:

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@mobilaws.com
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

#### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification
   - App passwords → Generate
3. Use app password as `EMAIL_PASSWORD`

#### Other Email Services

**SendGrid**:
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

**AWS SES**:
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-smtp-username
EMAIL_PASSWORD=your-ses-smtp-password
```

**Mailgun**:
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@yourdomain.com
EMAIL_PASSWORD=your-mailgun-password
```

## 🧪 Testing

### Test in Development

1. **Start Backend**:
   ```bash
   cd ai-backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

3. **Request Magic Link**:
   - Go to `http://localhost:5173/admin/login`
   - Enter: `thuchabraham42@gmail.com`
   - Click "Send Magic Link"

4. **Check Console**:
   ```
   Look for the magic link in the backend console
   Copy the URL or token
   ```

5. **Verify Token**:
   - Copy the verification URL from console
   - Paste in browser
   - Should auto-login and redirect

### Test with curl

```bash
# Request magic link
curl -X POST http://localhost:8000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "thuchabraham42@gmail.com", "type": "admin"}'

# Verify token (use token from previous response)
curl -X POST http://localhost:8000/api/auth/verify-magic-link \
  -H "Content-Type: application/json" \
  -d '{"token": "your-token-here"}'

# Check token status
curl http://localhost:8000/api/auth/magic-link-status/your-token-here

# Get statistics
curl http://localhost:8000/api/auth/magic-link-stats
```

## 📱 User Experience

### Admin Login Screen

```
┌─────────────────────────────────┐
│         🏛️ Mobilaws             │
│        Admin Login              │
│ Sign in to access the admin     │
│          dashboard              │
├─────────────────────────────────┤
│                                 │
│  Admin Email                    │
│  ┌───────────────────────────┐ │
│  │ 📧 thuchabraham42@...     │ │
│  └───────────────────────────┘ │
│  We'll send a secure login      │
│  link to your email             │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 📧 Send Magic Link        │ │
│  └───────────────────────────┘ │
│                                 │
│  🔐 Secure Login:               │
│  No password needed! We'll      │
│  send you a secure one-time     │
│  link via email.                │
│                                 │
│     ← Back to Main Site         │
└─────────────────────────────────┘
```

### Success Screen

```
┌─────────────────────────────────┐
│         🏛️ Mobilaws             │
│        Admin Login              │
│ Check your email for the magic  │
│            link                 │
├─────────────────────────────────┤
│  ✅ Magic link sent!            │
│                                 │
│  We've sent a secure login      │
│  link to thuchabraham42@...     │
│                                 │
│  The link will expire in        │
│  15 minutes                     │
│                                 │
│  Next steps:                    │
│  1. Check your email inbox      │
│  2. Click "Sign In" button      │
│  3. You'll be automatically     │
│     logged in                   │
│                                 │
│  💡 Development Mode:           │
│  Check the browser console      │
│  for the magic link token       │
│                                 │
│  ┌───────────────────────────┐ │
│  │   Send Another Link       │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

## 🔐 Security Best Practices

### Current Implementation

- Token expiration (15 minutes)
- Single-use tokens
- Email verification
- Automatic token cleanup

### Production Enhancements

1. **Use Redis for Token Storage**:
   ```typescript
   import Redis from 'ioredis';
   const redis = new Redis();
   
   // Store with automatic expiration
   await redis.setex(`magic:${token}`, 900, JSON.stringify(data));
   ```

2. **Rate Limiting**:
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5 // 5 requests per window
   });
   
   app.use('/api/auth/magic-link', limiter);
   ```

3. **IP Tracking**:
   ```typescript
   // Log IP addresses for security
   const ip = req.ip || req.headers['x-forwarded-for'];
   console.log(`Magic link requested from IP: ${ip}`);
   ```

4. **Email Domain Validation**:
   ```typescript
   const allowedDomains = ['mobilaws.com', 'gmail.com'];
   const domain = email.split('@')[1];
   if (!allowedDomains.includes(domain)) {
     return res.status(403).json({ error: 'Domain not allowed' });
   }
   ```

## 🎨 Email Template

The magic link email includes:

- **Mobilaws branding** with logo
- **Clear call-to-action** button
- **Security notice** about expiration
- **Plain text fallback** link
- **Responsive design** for mobile
- **Professional styling**

### Email Preview

```html
🏛️ Mobilaws
Admin Sign In Request

Hello,

You requested to sign in to your admin account. 
Click the button below to securely sign in:

┌─────────────────────────┐
│  🔐 Sign In to Mobilaws │
└─────────────────────────┘

⚠️ Security Notice: This link will expire in 
15 minutes and can only be used once.

If you didn't request this sign-in link, 
you can safely ignore this email.

---
© 2025 Mobilaws - South Sudan Legal System
```

## 📊 API Response Examples

### Request Magic Link

**Request**:
```json
POST /api/auth/magic-link
{
  "email": "thuchabraham42@gmail.com",
  "type": "admin"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Magic link sent! Check your email.",
  "token": "abc123-def456-ghi789" // Only in development
}
```

**Response** (Error):
```json
{
  "error": "Not authorized for admin access"
}
```

### Verify Magic Link

**Request**:
```json
POST /api/auth/verify-magic-link
{
  "token": "abc123-def456-ghi789"
}
```

**Response** (Success):
```json
{
  "success": true,
  "type": "admin",
  "admin": {
    "id": "admin_1234567890",
    "email": "thuchabraham42@gmail.com",
    "name": "Admin User",
    "role": "admin",
    "permissions": ["users", "subscriptions", "support", "settings"],
    "authenticatedAt": "2025-10-10T12:00:00.000Z"
  },
  "token": "session_abc123",
  "message": "Admin authentication successful"
}
```

**Response** (Error):
```json
{
  "error": "Invalid or expired token"
}
```

## 🛠️ Troubleshooting

### Common Issues

**Email not received**:
- Check spam folder
- Verify email address is correct
- Check backend console for errors
- Ensure email service is configured

**Token expired**:
- Links expire after 15 minutes
- Request a new magic link
- Check system time is correct

**Token already used**:
- Each link can only be used once
- Request a new magic link

**Verification failed**:
- Check backend is running
- Verify token is complete (not truncated)
- Check browser console for errors

### Debug Mode

Check backend console for detailed logs:

```bash
✅ Magic link generated for thuchabraham42@gmail.com (admin)
✅ Admin authenticated: thuchabraham42@gmail.com
```

Check browser console for magic link:

```javascript
🔗 Magic Link Token: abc123-def456-ghi789
🔗 Verification URL: http://localhost:5173/admin/verify?token=abc123...
```

## 🚀 Deployment

### Environment Variables Checklist

- [ ] `EMAIL_HOST` - SMTP server host
- [ ] `EMAIL_PORT` - SMTP port (usually 587)
- [ ] `EMAIL_SECURE` - Use TLS (true/false)
- [ ] `EMAIL_USER` - SMTP username
- [ ] `EMAIL_PASSWORD` - SMTP password
- [ ] `EMAIL_FROM` - Sender email address
- [ ] `FRONTEND_URL` - Your production URL
- [ ] `NODE_ENV=production` - Enable production mode

### Pre-Launch Testing

1. Test with real email service
2. Verify emails arrive quickly (< 30 seconds)
3. Test on mobile devices
4. Check spam folder placement
5. Verify links work across browsers
6. Test token expiration
7. Verify single-use enforcement

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Magic Link Best Practices](https://www.imperva.com/learn/authentication/magic-link/)
- [Email Authentication Security](https://owasp.org/www-community/controls/Email_Authentication)

## 🎉 Benefits

### For Users
- ✅ No password to remember
- ✅ Faster login process
- ✅ More secure (no password reuse)
- ✅ Works on any device

### For Admins (You)
- ✅ No password reset requests
- ✅ Better security
- ✅ Easy to audit
- ✅ Modern UX

### For Security
- ✅ No password database to breach
- ✅ Email-based verification
- ✅ Time-limited access
- ✅ Single-use tokens

---

**Magic Link Authentication is now active!** 🎊

Admin Email: `thuchabraham42@gmail.com`

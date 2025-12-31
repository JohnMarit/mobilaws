# Mobilaws Learning Hub - Installation & Setup Guide

## 📋 Prerequisites

- Node.js 22.x or higher
- npm or yarn
- Firebase account
- OpenAI API key
- Git

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd ai-backend
npm install
cd ..
```

### 2. Install New Package

```bash
# Install html2canvas for certificate generation
npm install html2canvas@^1.4.1
```

### 3. Environment Variables

Create `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Configuration
VITE_API_URL=https://mobilaws-ympe.vercel.app/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Create `.env` file in `ai-backend` directory:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 4. Firebase Setup

#### a. Create Firestore Collections:

1. **learningProgress**
   - Stores user learning data
   - Auto-created on first use

2. **generatedModules**
   - Stores AI-generated lessons
   - Auto-created by tutor admin

3. **examAttempts**
   - Stores exam attempts
   - Auto-created on first exam

4. **certificates**
   - Stores earned certificates
   - Auto-created on first certificate

5. **lessonRequests**
   - Tracks lesson generation requests
   - Auto-created on first request

#### b. Update Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Learning progress
    match /learningProgress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Generated modules (public read, admin write)
    match /generatedModules/{moduleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'tutor';
    }
    
    // Exam attempts
    match /examAttempts/{attemptId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Certificates
    match /certificates/{certId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Lesson requests
    match /lessonRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
    
    // Leaderboard
    match /leaderboard/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && userId == request.auth.uid;
    }
  }
}
```

### 5. Build & Run

#### Development Mode:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd ai-backend
npm run server:dev
```

#### Production Build:

```bash
# Build frontend
npm run build

# Build backend
cd ai-backend
npm run build
```

---

## 🔧 Configuration

### Frontend Configuration

Update `src/lib/api.ts` if needed:

```typescript
export function getApiUrl(endpoint: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://mobilaws-ympe.vercel.app/api';
  return `${baseUrl}/${endpoint}`;
}
```

### Backend Configuration

Update `ai-backend/src/env.ts` if needed:

```typescript
export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  // ... other config
};
```

---

## 🧪 Testing

### Test AI Lesson Generation:

```bash
# Using curl
curl -X POST http://localhost:3001/api/ai-lessons/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "moduleId": "module-123",
    "moduleName": "Constitutional Law",
    "completedLessons": [],
    "tier": "premium",
    "numberOfLessons": 5
  }'
```

### Test Certificate Generation:

1. Complete an exam with 70%+ score
2. Click "View & Download Certificate"
3. Enter your name
4. Click "Download Certificate"
5. Check downloads folder for PNG file

### Test Favorites:

1. Open Learning Hub
2. Click heart icon on any course
3. Refresh page
4. Verify favorite persists

### Test Progress Sync:

1. Complete a lesson
2. Check browser console for "✅ User data updated in Firestore"
3. Open Firebase Console
4. Navigate to Firestore > learningProgress
5. Verify your progress is saved

---

## 🐛 Troubleshooting

### Issue: "Failed to generate lessons"

**Solution:**
- Check OpenAI API key is valid
- Verify API has credits
- Check backend logs for errors
- Ensure module exists in Firestore

### Issue: "Certificate not downloading"

**Solution:**
- Check browser allows downloads
- Disable pop-up blocker
- Try different browser
- Check console for errors

### Issue: "Progress not saving"

**Solution:**
- Verify user is logged in
- Check Firebase connection
- Review Firestore rules
- Check browser console

### Issue: "Animations not working"

**Solution:**
- Clear browser cache
- Verify `animations.css` is imported
- Check for CSS conflicts
- Update browser

---

## 📦 Deployment

### Vercel Deployment (Frontend):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Backend Deployment:

```bash
# Deploy to your backend hosting
cd ai-backend
npm run build
# Upload dist folder to your server
```

### Environment Variables (Production):

Set these in your hosting platform:

**Frontend (Vercel):**
- `VITE_API_URL`
- `VITE_FIREBASE_*` (all Firebase config)
- `VITE_GOOGLE_CLIENT_ID`

**Backend:**
- `OPENAI_API_KEY`
- `FIREBASE_*` (all Firebase Admin config)
- `PORT`
- `NODE_ENV=production`

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Update Firestore security rules
- [ ] Enable Firebase App Check
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Use HTTPS only
- [ ] Enable CSP headers
- [ ] Validate all user inputs
- [ ] Sanitize database queries
- [ ] Monitor error logs
- [ ] Set up backup strategy

---

## 📊 Monitoring

### Firebase Console:
- Monitor Firestore usage
- Check authentication logs
- Review security rules
- Track API calls

### Application Logs:
- Check browser console
- Review backend logs
- Monitor API responses
- Track error rates

### Performance:
- Use Lighthouse for audits
- Monitor page load times
- Check bundle sizes
- Optimize images

---

## 🆘 Support

### Getting Help:

1. **Check Documentation**: Review `LEARNING_HUB_ENHANCEMENTS.md`
2. **Console Logs**: Check browser and backend logs
3. **Firebase Console**: Verify data in Firestore
4. **GitHub Issues**: Report bugs
5. **Email Support**: support@mobilaws.com

### Common Commands:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .vite

# Reset Firebase local emulator
firebase emulators:start --clear-data

# Check for updates
npm outdated

# Update dependencies
npm update
```

---

## ✅ Verification Steps

After installation, verify everything works:

1. [ ] Frontend loads without errors
2. [ ] Backend API responds
3. [ ] User can login
4. [ ] Learning Hub opens
5. [ ] Courses display correctly
6. [ ] Favorites work
7. [ ] Lessons can be started
8. [ ] Quizzes work
9. [ ] Progress saves
10. [ ] Exams can be taken
11. [ ] Certificates generate
12. [ ] AI lesson generation works
13. [ ] Animations are smooth
14. [ ] Mobile responsive
15. [ ] Security features active

---

## 🎉 Success!

If all steps completed successfully, you now have:

✅ Fully functional Learning Hub
✅ AI-powered lesson generation
✅ Modern certificate system
✅ Secure data storage
✅ Beautiful UI with animations
✅ Favorites and filtering
✅ Progress tracking
✅ Mobile responsive design

**Next Steps:**
1. Customize branding
2. Add more content
3. Invite users
4. Monitor usage
5. Gather feedback
6. Iterate and improve

---

**Version**: 2.0.0
**Last Updated**: December 31, 2025
**Support**: support@mobilaws.com


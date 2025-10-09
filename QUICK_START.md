# Quick Start Guide - Mobilaws

## 🚀 Start Your Application

### Option 1: Start Both Servers (Recommended)

**Terminal 1 - Backend Server:**
```bash
cd ai-backend
npm start
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev
```

### Option 2: Start Frontend Only
```bash
npm run dev
```
*Note: Some AI features won't work without the backend*

## 📍 Access Your Application

- **Frontend**: http://localhost:8081 (or check terminal output)
- **Backend**: http://localhost:3001
- **Backend Health**: http://localhost:3001/healthz

## ✅ Verify Everything is Working

### 1. Check Backend Status
Look for this in the backend terminal:
```
🚀 Mobilaws AI Backend Server Started
🔗 Server URL: http://localhost:3001
✅ Server ready to accept requests
```

### 2. Check Frontend Status
Look for this in the frontend terminal:
```
VITE vX.X.X  ready in XXX ms
➜  Local:   http://localhost:8081/
```

### 3. Check Browser Console
- Open DevTools (F12)
- Look for: `✅ Google OAuth initialized successfully`
- Or: `⚠️ Firebase not installed - using fallback Google OAuth`

## 🔧 Current Configuration

### Authentication (Working):
- ✅ Google OAuth Sign-in (Fallback Mode)
- ✅ Session persistence
- ✅ User data storage

### Backend (Running):
- ✅ AI Chat endpoint
- ✅ RAG search functionality
- ✅ Document processing
- ✅ Health checks

### Features Available:
- ✅ Constitution search
- ✅ AI legal assistant
- ✅ Chat interface
- ✅ Document retrieval
- ✅ User subscriptions

## 🐛 Common Issues & Solutions

### Issue: Port already in use
```bash
# Find and kill the process
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess | Stop-Process

# Or use a different port:
npm run dev -- --port 8082
```

### Issue: Backend not responding
```bash
# Restart the backend server
cd ai-backend
npm start
```

### Issue: Environment variables not loaded
```bash
# Create .env file if missing (at project root)
echo "VITE_GOOGLE_CLIENT_ID=your_client_id" > .env
```

### Issue: Disk space error
```bash
# Clear npm cache
npm cache clean --force

# Or clean node_modules
rm -rf node_modules
npm install
```

## 📋 Environment Variables Needed

Create a `.env` file in the project root:
```env
# Google OAuth (for authentication)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# OpenAI (for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key

# Backend URL (optional, defaults to localhost:3001)
VITE_BACKEND_URL=http://localhost:3001
```

## 🎯 What to Test

### 1. Authentication:
- [ ] Click "Sign In" button
- [ ] Google OAuth popup appears
- [ ] Successfully sign in
- [ ] User info displays correctly

### 2. Search Functionality:
- [ ] Search for a constitutional article
- [ ] Results display correctly
- [ ] Can read full article content

### 3. AI Chat:
- [ ] Open chat interface
- [ ] Ask a legal question
- [ ] Receive AI response
- [ ] Chat history persists

### 4. Backend Connection:
- [ ] Check console for "Backend connected" message
- [ ] AI features work properly
- [ ] No connection errors

## 📱 Available Scripts

```bash
# Frontend Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Check code quality

# Backend Development
cd ai-backend
npm start               # Start backend server
npm run dev             # Start with hot reload

# Both Servers
# Use two terminal windows to run both simultaneously
```

## 🔄 Development Workflow

### 1. Morning Startup:
```bash
# Terminal 1
cd ai-backend && npm start

# Terminal 2
npm run dev
```

### 2. Make Changes:
- Edit files in `src/` for frontend
- Edit files in `ai-backend/src/` for backend
- Changes auto-reload (hot module replacement)

### 3. Test:
- Check browser for UI changes
- Check console for errors
- Test authentication flow
- Test AI features

### 4. End of Day:
- Commit your changes: `git add . && git commit -m "message"`
- Stop servers: `Ctrl+C` in both terminals

## 🎨 Key Files to Know

### Frontend:
- `src/App.tsx` - Main app component
- `src/pages/Index.tsx` - Home page
- `src/contexts/FirebaseAuthContext.tsx` - Authentication
- `src/lib/ai-chat.ts` - AI chat logic

### Backend:
- `ai-backend/src/server.ts` - Main server file
- `ai-backend/src/routes/chat.ts` - Chat endpoint
- `ai-backend/src/routes/search.ts` - Search endpoint
- `ai-backend/src/rag/` - RAG implementation

## 🌟 Pro Tips

1. **Keep both servers running** during development
2. **Check both terminal outputs** for errors
3. **Use browser DevTools** to debug frontend issues
4. **Check backend logs** for API errors
5. **Clear cache** if you see stale data: `Ctrl+Shift+R`

## 📚 Additional Resources

- `FIREBASE_SETUP_COMPLETE.md` - Firebase integration details
- `FIREBASE_INTEGRATION_GUIDE.md` - Complete Firebase guide
- `README.md` - Project overview
- `PRODUCTION_SETUP.md` - Deployment guide

## 🎉 You're Ready!

Both servers should now be running. Open http://localhost:8081 in your browser to start using Mobilaws!

---

**Need Help?**
- Check console for error messages
- Review the troubleshooting section above
- Check the documentation files listed above

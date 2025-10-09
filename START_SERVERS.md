# 🚀 Start Mobilaws Servers

Quick reference for starting all required services after security fix.

---

## Prerequisites

✅ Run the security fix first: `.\fix-security.ps1`

---

## Start All Services (3 Terminals)

### Terminal 1: Chroma Vector Store
```powershell
# Using Docker (recommended)
docker run -p 8000:8000 chromadb/chroma

# OR using Python
pip install chromadb
chroma run --path ./ai-backend/storage/chroma
```
**Status:** Keep running, shows Chroma logs

---

### Terminal 2: Backend Server
```powershell
cd ai-backend
npm install    # First time only
npm run dev
```
**Expected output:**
```
🚀 Mobilaws AI Backend Server Started
=====================================
🔗 Server URL: http://localhost:8000
🧠 LLM Model: gpt-4o
✅ Server ready to accept requests
```
**Status:** Keep running, shows API request logs

---

### Terminal 3: Frontend
```powershell
npm run dev
```
**Expected output:**
```
  VITE vX.X.X  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```
**Status:** Keep running, shows frontend build logs

---

## Verify Everything Works

### 1. Check Health
```powershell
curl http://localhost:8000/healthz
```
**Expected:** `{"ok":true}`

### 2. Open Browser
Go to: http://localhost:5173

**Expected in Console (F12):**
```
✅ Secure backend connected - no API keys exposed!
```

### 3. Test Chat
- Type a question in the chat
- You should see streaming responses
- Look for "Sources:" at the end with citations

---

## Quick Upload Test

Upload a sample document:

```powershell
# Create test document
"PENAL CODE`nArticle 1: Theft is punishable by imprisonment." | Out-File test.txt -Encoding utf8

# Upload it
curl -F "files=@test.txt" http://localhost:8000/api/upload
```

**Expected:** `"indexed_chunks": X` where X > 0

Then ask: "What is the penalty for theft?"

---

## Stop All Services

Press `Ctrl+C` in each terminal to stop:
1. Frontend (Terminal 3)
2. Backend (Terminal 2)  
3. Chroma (Terminal 1)

---

## Troubleshooting

### Port Already in Use
If port 8000 is busy:
1. Edit `ai-backend/.env`: `PORT=3001`
2. Edit frontend `.env`: `VITE_BACKEND_URL=http://localhost:3001`
3. Restart backend

### Backend Won't Start
- Check `ai-backend/.env` has `OPENAI_API_KEY`
- Run `npm install` in `ai-backend/`
- Make sure Chroma is running first

### Frontend Shows "Backend Offline"
- Make sure backend is running on port 8000
- Check `VITE_BACKEND_URL` in frontend `.env`
- Check browser console for error details

---

## Daily Workflow

After initial setup, you only need:

1. Start Chroma (Terminal 1)
2. Start Backend (Terminal 2): `cd ai-backend && npm run dev`
3. Start Frontend (Terminal 3): `npm run dev`

That's it! 🎉



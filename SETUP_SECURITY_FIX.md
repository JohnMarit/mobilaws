# 🔒 Security Fix Setup Instructions

## URGENT: Complete These Steps to Secure Your Application

Your OpenAI API key is currently exposed in the frontend. Follow these steps to secure it:

---

## Step 1: Secure the Frontend .env File

**Open:** `C:\Users\John\Desktop\Mobilaws\.env`

**Replace the entire contents with:**
```env
# Backend API URL - Points to your secure RAG backend
VITE_BACKEND_URL=http://localhost:8000
```

**⚠️ IMPORTANT:** Delete or comment out the `VITE_OPENAI_API_KEY` line completely!

---

## Step 2: Configure the Backend .env File

**Navigate to backend:**
```powershell
cd ai-backend
```

**Copy the example file:**
```powershell
Copy-Item .env.example .env
```

**Open:** `C:\Users\John\Desktop\Mobilaws\ai-backend\.env`

**Add your OpenAI API key:** (move it from frontend to backend)
```env
OPENAI_API_KEY=your-openai-api-key-here
```

Keep all other settings as-is (or customize as needed).

---

## Step 3: Start Chroma Vector Store (Required)

**Option A: Using Docker (Recommended)**
```powershell
docker run -p 8000:8000 chromadb/chroma
```

**Option B: Using Python**
```powershell
pip install chromadb
chroma run --path ./ai-backend/storage/chroma
```

Leave this running in a separate terminal.

---

## Step 4: Start the Backend Server

**Open a new terminal in the project root:**
```powershell
cd C:\Users\John\Desktop\Mobilaws\ai-backend
npm install
npm run dev
```

**You should see:**
```
🚀 Mobilaws AI Backend Server Started
✅ Server ready to accept requests
```

Leave this running.

---

## Step 5: Start the Frontend

**Open another terminal in the project root:**
```powershell
cd C:\Users\John\Desktop\Mobilaws
npm run dev
```

---

## Step 6: Verify Security

Open your browser DevTools (F12):

**✅ Good Signs:**
- Console shows: "✅ Secure backend connected - no API keys exposed!"
- Network tab shows requests to `localhost:8000/api/*`
- No `sk-` API keys visible anywhere

**❌ Bad Signs (if you see these, security fix incomplete):**
- "VITE_OPENAI_API_KEY" visible in any files
- Direct requests to `api.openai.com`
- Rate limit errors (429)

---

## Step 7: Test the System

### Upload a Legal Document
```powershell
# Create a test document
"PENAL CODE OF SOUTH SUDAN`nArticle 1: Theft`nAny person who steals property shall be liable to imprisonment." | Out-File -Encoding utf8 test-law.txt

# Upload it
curl -F "files=@test-law.txt" http://localhost:8000/api/upload
```

**Expected response:** `"indexed_chunks": N` where N > 0

### Test Chat
Go to your frontend (usually http://localhost:5173) and:
1. Type a question about theft
2. You should see:
   - Streaming response (word by word)
   - Citations at the end (Source + Page)
   - No rate limit errors

---

## Quick Reference

### Frontend .env (Safe - Public)
```env
VITE_BACKEND_URL=http://localhost:8000
```

### Backend .env (Secret - Never Commit)
```env
OPENAI_API_KEY=sk-your-key-here
VECTOR_BACKEND=chroma
PORT=8000
```

---

## What Changed?

### Before (INSECURE ❌)
```
Browser → OpenAI API (exposed key)
```

### After (SECURE ✅)
```
Browser → Backend API → OpenAI (hidden key)
            ↓
        Vector Store (RAG)
```

---

## Troubleshooting

### "Backend not available"
- Make sure backend is running: `npm run dev` in `ai-backend/`
- Check `VITE_BACKEND_URL=http://localhost:8000` in frontend `.env`

### "Connection refused on port 8000"
- Check if Chroma is running (it also uses port 8000)
- Either change backend port in `ai-backend/.env`: `PORT=3001`
- Or run Chroma on different port

### "OpenAI API key not found"
- Check `ai-backend/.env` has `OPENAI_API_KEY=sk-...`
- Make sure you copied `.env.example` to `.env`

### Still seeing rate limit errors (429)
- Make sure frontend `.env` does NOT have `VITE_OPENAI_API_KEY`
- Clear browser cache and restart frontend dev server
- Check browser DevTools → no requests to `api.openai.com`

---

## Deployment Checklist

When deploying to production:

### Frontend
- [ ] Set `VITE_BACKEND_URL` to production backend URL
- [ ] Verify no API keys in frontend code
- [ ] Deploy to Vercel/Netlify/etc.

### Backend
- [ ] Set `OPENAI_API_KEY` in backend environment
- [ ] Use Pinecone or Qdrant (not Chroma)
- [ ] Set `CORS_ORIGINS` to frontend domain
- [ ] Deploy to Heroku/Render
- [ ] Set `API_KEY_REQUIRED=true` for production

---

**Need help?** Check `SECURITY_FIXED.md` for detailed explanation of all changes.



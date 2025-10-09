# Mobilaws - AI-Powered Legal Assistant for South Sudan

> **🔒 Security Update:** This application now features a secure backend architecture with no exposed API keys.

## Overview

Mobilaws is a comprehensive AI legal assistant specializing in South Sudan laws and penal codes. It features:

- 🤖 **RAG-Powered AI Chat** - Retrieval Augmented Generation with legal document citations
- 📄 **Document Upload** - Index PDF/TXT/DOCX legal documents
- 🔍 **Semantic Search** - Find relevant legal provisions instantly
- 💬 **SSE Streaming** - Real-time streaming responses
- 🔒 **Secure Architecture** - No API keys exposed in browser
- ⚖️ **Legal-Optimized** - Tailored prompts for South Sudan law

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React + TypeScript)                  │
│  - Chat Interface                               │
│  - Document Upload UI                           │
│  - Search Interface                             │
└─────────────────┬───────────────────────────────┘
                  │ VITE_BACKEND_URL
                  │ (no secrets)
┌─────────────────▼───────────────────────────────┐
│  Backend (Node.js + Express + LangChain)        │
│  - RAG Pipeline                                 │
│  - Vector Store (Chroma/Pinecone/Qdrant)        │
│  - OpenAI Integration (secure)                  │
│  - SSE Streaming                                │
└─────────────────┬───────────────────────────────┘
                  │ OPENAI_API_KEY
                  │ (secret, server-side)
┌─────────────────▼───────────────────────────────┐
│  OpenAI API + Vector Database                   │
│  - GPT-4o for reasoning                         │
│  - text-embedding-3-large for embeddings        │
│  - Document chunks with metadata                │
└─────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Run Security Fix (Required First Time)

```powershell
# Automatically moves API key to backend and secures frontend
.\fix-security.ps1
```

### 2. Start Backend

```powershell
# Terminal 1: Start Chroma vector store
docker run -p 8000:8000 chromadb/chroma

# Terminal 2: Start backend server
cd ai-backend
npm install     # First time only
npm run dev
```

### 3. Start Frontend

```powershell
# Terminal 3: Start frontend
npm run dev
```

### 4. Open Browser

Navigate to: http://localhost:5173

✅ You should see: "🤖 Secure AI Backend Online"

## 📁 Project Structure

```
Mobilaws/
├── ai-backend/                 # Secure RAG backend
│   ├── src/
│   │   ├── server.ts          # Express server
│   │   ├── routes/            # API endpoints
│   │   │   ├── health.ts      # GET /healthz
│   │   │   ├── upload.ts      # POST /api/upload
│   │   │   ├── search.ts      # GET /api/search
│   │   │   └── chat.ts        # POST /api/chat (SSE)
│   │   └── rag/               # RAG pipeline
│   │       ├── llm.ts         # OpenAI integration
│   │       ├── vectorstore.ts # Vector DB factory
│   │       ├── loaders.ts     # Document loaders
│   │       └── retriever.ts   # RAG chain
│   ├── storage/
│   │   ├── documents/         # Uploaded docs
│   │   └── chroma/            # Vector DB
│   ├── package.json
│   └── .env                   # 🔒 Secret keys here
│
├── src/
│   ├── components/
│   │   └── ChatInterface.tsx  # Main chat UI
│   ├── lib/
│   │   ├── backend-service.ts # ✅ Secure backend client
│   │   └── openai-chat.ts.DEPRECATED # ❌ Old insecure version
│   └── ...
│
├── .env                       # 🔒 VITE_BACKEND_URL only (no secrets)
├── fix-security.ps1           # Automated security setup
├── START_SERVERS.md           # Quick start guide
├── SECURITY_AND_SETUP_COMPLETE.md # Complete documentation
└── README.md                  # This file
```

## 🔒 Security Features

### ✅ What's Secure Now

1. **No Exposed API Keys**
   - OpenAI key stored in backend only
   - Frontend has no access to secrets
   - API key never visible in browser

2. **Backend-Mediated Requests**
   - All AI requests go through backend
   - Rate limiting possible
   - Usage tracking enabled
   - Access control available

3. **Environment Separation**
   - Frontend `.env`: Only `VITE_BACKEND_URL` (public)
   - Backend `.env`: All secrets (private)
   - `.env` files in `.gitignore`

### ❌ What Was Fixed

1. ~~Exposed `VITE_OPENAI_API_KEY` in frontend~~
2. ~~Direct OpenAI API calls from browser~~
3. ~~`dangerouslyAllowBrowser: true` flag~~
4. ~~No RAG implementation~~
5. ~~No document upload capability~~

## 📡 API Endpoints

### Backend (http://localhost:8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/healthz` | GET | Health check |
| `/api/upload` | POST | Upload documents (PDF/TXT/DOCX) |
| `/api/search?q=...&k=5` | GET | Semantic search |
| `/api/chat` | POST | Streaming chat (SSE) |

### Examples

**Upload Document:**
```powershell
curl -F "files=@penal-code.pdf" http://localhost:8000/api/upload
```

**Search:**
```powershell
curl "http://localhost:8000/api/search?q=theft&k=5"
```

**Chat (SSE):**
```powershell
curl -N -H "Content-Type: application/json" \
     -H "Accept: text/event-stream" \
     -d '{"message":"What is the penalty for theft?"}' \
     http://localhost:8000/api/chat
```

## 🧪 Testing

### Verify Security

Open browser DevTools (F12):

✅ **Good:**
- Console: "✅ Secure backend connected"
- Network: Requests to `localhost:8000/api/*`
- No `sk-` API keys visible

❌ **Bad:**
- Requests to `api.openai.com` directly
- `VITE_OPENAI_API_KEY` visible
- 429 rate limit errors

### Test RAG

1. Upload a test document:
   ```powershell
   "Article 1: Theft - punishable by imprisonment" | Out-File test.txt -Encoding utf8
   curl -F "files=@test.txt" http://localhost:8000/api/upload
   ```

2. Ask in chat: "What is the penalty for theft?"

3. Check response includes:
   - Relevant answer
   - **Sources:** with citations
   - No "I don't know" (should find the document)

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. Set environment variable:
   ```
   VITE_BACKEND_URL=https://your-backend-url.herokuapp.com
   ```

2. Deploy:
   ```powershell
   npm run build
   # Deploy dist/ folder
   ```

### Backend (Heroku/Render)

1. Use Pinecone or Qdrant (not Chroma):
   ```env
   VECTOR_BACKEND=pinecone
   PINECONE_API_KEY=your-key
   PINECONE_ENV=your-env
   PINECONE_INDEX=mobilaws
   ```

2. Deploy:
   ```powershell
   cd ai-backend
   heroku create your-app
   heroku config:set OPENAI_API_KEY=sk-...
   heroku config:set VECTOR_BACKEND=pinecone
   # ... set other vars
   git push heroku main
   ```

See `ai-backend/README.md` for full deployment guide.

## 📚 Documentation

| File | Description |
|------|-------------|
| **SECURITY_AND_SETUP_COMPLETE.md** | Complete overview and setup |
| **START_SERVERS.md** | Quick start reference |
| **SETUP_SECURITY_FIX.md** | Step-by-step security setup |
| **SECURITY_FIXED.md** | Detailed security explanation |
| **ai-backend/README.md** | Backend documentation |
| **ai-backend/QUICKSTART.md** | Backend quick start |

## 🔧 Configuration

### Frontend `.env`
```env
VITE_BACKEND_URL=http://localhost:8000
```

### Backend `ai-backend/.env`
```env
# OpenAI
OPENAI_API_KEY=sk-your-key-here
LLM_MODEL=gpt-4o
EMBED_MODEL=text-embedding-3-large

# Vector Store
VECTOR_BACKEND=chroma  # or pinecone/qdrant
CHROMA_DIR=./storage/chroma

# Server
PORT=8000
TZ=Africa/Juba
TEMPERATURE=0.1
MAX_TOKENS=1024
TOP_K=5
```

## 🆘 Troubleshooting

### "Backend not available"
- Ensure backend is running: `cd ai-backend && npm run dev`
- Check `VITE_BACKEND_URL=http://localhost:8000` in frontend `.env`

### "Port 8000 already in use"
- Backend and Chroma both use 8000
- Change backend port: `PORT=3001` in `ai-backend/.env`
- Update frontend: `VITE_BACKEND_URL=http://localhost:3001`

### Still seeing 429 errors
- Make sure frontend `.env` has NO `VITE_OPENAI_API_KEY`
- Run `.\fix-security.ps1` again
- Clear browser cache

### Chroma connection errors
- Start Chroma: `docker run -p 8000:8000 chromadb/chroma`
- Or use Python: `chroma run --path ./ai-backend/storage/chroma`

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Shadcn/ui components

### Backend
- Node.js 18+
- Express.js
- LangChain.js
- OpenAI (GPT-4o)
- Chroma / Pinecone / Qdrant
- TypeScript
- Zod validation

## 📄 License

MIT

## 🤝 Contributing

See contribution guidelines in docs.

---

**⚖️ Legal Disclaimer:** This system provides informational assistance only and does not constitute legal advice. Always consult qualified legal professionals for legal matters.

---

**For detailed setup instructions, see: `SECURITY_AND_SETUP_COMPLETE.md`**



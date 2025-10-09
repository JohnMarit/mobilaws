# Mobilaws Backend - Quick Start Guide

Get your RAG-powered legal assistant backend running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- (Optional) Chroma running locally for vector storage

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd ai-backend
npm install
```

This will install all required packages including LangChain, OpenAI, Express, and vector store clients.

### 2. Configure Environment

Copy the example environment file and edit it:

```bash
cp .env.example .env
```

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

Edit `.env` and set your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. (Optional) Start Chroma Vector Store

If using Chroma (default), you need to run a Chroma server:

**Option A: Using Docker (Recommended)**
```bash
docker run -p 8000:8000 chromadb/chroma
```

**Option B: Using Python**
```bash
pip install chromadb
chroma run --path ./storage/chroma
```

> **Note:** If you're using Pinecone or Qdrant instead, skip this step and configure those services in your `.env` file.

### 4. Start the Backend

**Development mode (with hot reload):**
```bash
npm run dev
```

You should see:
```
🚀 Mobilaws AI Backend Server Started
=====================================
🌍 Environment: development
🔗 Server URL: http://localhost:8000
🌐 Timezone: Africa/Juba
🧠 LLM Model: gpt-4o
📊 Embedding Model: text-embedding-3-large
🗄️  Vector Backend: chroma
✅ Server ready to accept requests
```

### 5. Test the Backend

**Health check:**
```bash
curl http://localhost:8000/healthz
```

Expected: `{"ok":true}`

**Upload a sample document:**
```bash
# Create a test document
echo "PENAL CODE OF SOUTH SUDAN
Article 1: Theft
Any person who steals property shall be liable to imprisonment." > test-law.txt

# Upload it
curl -F "files=@test-law.txt" http://localhost:8000/api/upload
```

Expected response includes `"indexed_chunks": N` where N > 0.

**Search:**
```bash
curl "http://localhost:8000/api/search?q=theft&k=3"
```

**Chat (SSE streaming):**
```bash
curl -N \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message":"What is the penalty for theft?"}' \
  http://localhost:8000/api/chat
```

You should see streaming tokens followed by citations!

## Common Issues

### "OPENAI_API_KEY is required"
Make sure you've created a `.env` file (not just `.env.example`) and added your actual API key.

### "Connection refused" on port 8000
If using Chroma, make sure the Chroma server is running. The backend uses port 8000 by default, and Chroma also uses 8000. You may need to change one of them:

```env
# In .env
PORT=3001
```

### "Cannot find module" errors
Run `npm install` again to ensure all dependencies are installed.

### Chroma connection errors
Make sure Chroma is running on `http://localhost:8000`. If you changed Chroma's port, you'll need to update the vectorstore configuration in `src/rag/vectorstore.ts`.

## Next Steps

- **Connect your frontend:** Update your frontend's API endpoint to `http://localhost:8000`
- **Add more documents:** Upload PDFs, TXT, or DOCX files via `/api/upload`
- **Production deployment:** See [README.md](README.md) for Heroku/Render deployment instructions
- **Use production vector store:** Switch to Pinecone or Qdrant for production (see `.env.example`)

## Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use Pinecone or Qdrant instead of Chroma
- [ ] Enable API key authentication (`API_KEY_REQUIRED=true`)
- [ ] Configure CORS origins to match your frontend domain
- [ ] Set up proper logging and monitoring
- [ ] Review and adjust `TEMPERATURE`, `MAX_TOKENS`, `TOP_K` for your use case

## Need Help?

Check the [README.md](README.md) for full documentation, or open an issue on GitHub.

---

Happy building! ⚖️🤖



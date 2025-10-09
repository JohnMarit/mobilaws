# Mobilaws AI Backend

Production-ready Node.js + Express + LangChain RAG backend for legal document search and question answering, optimized for South Sudan law.

## Features

- 📄 **Document Upload & Indexing**: Upload PDFs, TXT, and DOCX files for automatic chunking and embedding
- 🔍 **Semantic Search**: Find relevant legal document snippets with metadata
- 💬 **Streaming Chat**: SSE-based streaming chat with citations
- 🗄️ **Flexible Vector Stores**: Support for Chroma (local), Pinecone, and Qdrant
- 🔐 **Optional API Key Auth**: Secure your endpoints with API key authentication
- ⚖️ **Legal-Optimized**: Tailored prompts and responses for legal Q&A

## Architecture

```
ai-backend/
├── src/
│   ├── server.ts           # Express server setup
│   ├── env.ts              # Environment configuration with Zod validation
│   ├── sse.ts              # Server-Sent Events utilities
│   ├── routes/
│   │   ├── health.ts       # Health check endpoint
│   │   ├── upload.ts       # Document upload & indexing
│   │   ├── search.ts       # Semantic search endpoint
│   │   └── chat.ts         # Streaming chat endpoint
│   └── rag/
│       ├── index.ts        # Main RAG orchestration
│       ├── loaders.ts      # Document loaders (PDF/TXT/DOCX)
│       ├── splitter.ts     # Text chunking
│       ├── vectorstore.ts  # Vector store factory
│       ├── llm.ts          # OpenAI LLM & embeddings
│       └── retriever.ts    # RAG chain & prompting
├── storage/
│   ├── documents/          # Uploaded documents (dev)
│   └── chroma/             # Chroma persistence (dev)
└── ...
```

## Quick Start

### 1. Install Dependencies

```bash
cd ai-backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Required variables:**
- `OPENAI_API_KEY` - Your OpenAI API key
- `VECTOR_BACKEND` - Vector store to use (`chroma`, `pinecone`, or `qdrant`)

**For Chroma (default, local development):**
```env
VECTOR_BACKEND=chroma
CHROMA_DIR=./storage/chroma
```

**For Pinecone (production recommended):**
```env
VECTOR_BACKEND=pinecone
PINECONE_API_KEY=your-key
PINECONE_ENV=your-env
PINECONE_INDEX=your-index
```

**For Qdrant:**
```env
VECTOR_BACKEND=qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-key
QDRANT_COLLECTION=mobilaws_legal
```

### 3. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:8000`

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```bash
GET /healthz
```

**Response:**
```json
{ "ok": true }
```

### Upload Documents
```bash
POST /api/upload
Content-Type: multipart/form-data
```

**Example:**
```bash
curl -F "files=@/path/to/law.pdf" \
     -F "files=@/path/to/statute.txt" \
     http://localhost:8000/api/upload
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "originalName": "law.pdf",
      "savedName": "law-1234567890.pdf",
      "size": 102400,
      "path": "./storage/documents/law-1234567890.pdf"
    }
  ],
  "indexed_chunks": 42
}
```

### Search Documents
```bash
GET /api/search?q=<query>&k=<number>
```

**Example:**
```bash
curl "http://localhost:8000/api/search?q=theft%20penalties&k=5"
```

**Response:**
```json
{
  "query": "theft penalties",
  "k": 5,
  "count": 5,
  "matches": [
    {
      "rank": 1,
      "source": "penal-code.pdf",
      "page": 23,
      "title": "Penal Code",
      "text": "Section 45: Theft is punishable by..."
    }
  ]
}
```

### Streaming Chat
```bash
POST /api/chat
Content-Type: application/json
Accept: text/event-stream
```

**Example:**
```bash
curl -N \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message":"What are the penalties for robbery?"}' \
  http://localhost:8000/api/chat
```

**SSE Event Stream:**
```
event: metadata
data: {"convoId":null,"timestamp":"2025-10-04T12:00:00.000Z"}

event: token
data: {"text":"According"}

event: token
data: {"text":" to"}

event: token
data: {"text":" Section"}

...

event: done
data: {"citations":[{"source":"penal-code.pdf","page":45}]}
```

**With API Key (if enabled):**
```bash
curl -N \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -H "X-API-Key: your-secret-key" \
  -d '{"message":"Your question","convoId":"optional-id"}' \
  http://localhost:8000/api/chat
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8000` | Server port |
| `TZ` | No | `Africa/Juba` | Timezone |
| `OPENAI_API_KEY` | **Yes** | - | OpenAI API key |
| `LLM_MODEL` | No | `gpt-4o` | Chat model |
| `EMBED_MODEL` | No | `text-embedding-3-large` | Embedding model |
| `VECTOR_BACKEND` | No | `chroma` | Vector store: `chroma`, `pinecone`, or `qdrant` |
| `CHROMA_DIR` | No | `./storage/chroma` | Chroma persistence directory |
| `DOCS_DIR` | No | `./storage/documents` | Uploaded documents directory |
| `PINECONE_API_KEY` | Conditional | - | Required if `VECTOR_BACKEND=pinecone` |
| `PINECONE_ENV` | Conditional | - | Required if `VECTOR_BACKEND=pinecone` |
| `PINECONE_INDEX` | Conditional | - | Required if `VECTOR_BACKEND=pinecone` |
| `QDRANT_URL` | Conditional | - | Required if `VECTOR_BACKEND=qdrant` |
| `QDRANT_API_KEY` | No | - | Optional for Qdrant |
| `QDRANT_COLLECTION` | No | `mobilaws_legal` | Qdrant collection name |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed origins |
| `API_KEY_REQUIRED` | No | `false` | Enable API key auth |
| `API_KEY_SECRET` | Conditional | - | Required if `API_KEY_REQUIRED=true` |
| `TEMPERATURE` | No | `0.1` | LLM temperature (0-2) |
| `MAX_TOKENS` | No | `1024` | Max tokens per response |
| `TOP_K` | No | `5` | Default number of search results |
| `CHUNK_SIZE` | No | `1000` | Text chunk size in tokens |
| `CHUNK_OVERLAP` | No | `150` | Overlap between chunks |

## Deployment

### Heroku

1. Create a Heroku app:
```bash
heroku create your-app-name
```

2. Set environment variables:
```bash
heroku config:set OPENAI_API_KEY=your-key
heroku config:set VECTOR_BACKEND=pinecone
heroku config:set PINECONE_API_KEY=your-key
# ... set other required vars
```

3. Deploy:
```bash
git push heroku main
```

### Render

1. Connect your GitHub repository
2. Set environment variables in the Render dashboard
3. Use build command: `npm run build`
4. Use start command: `npm start`

**Note:** For production deployments, use **Pinecone** or **Qdrant** instead of Chroma, as Heroku/Render have ephemeral filesystems.

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

### Project Structure

- **`src/env.ts`** - Environment configuration with Zod validation
- **`src/sse.ts`** - SSE streaming utilities
- **`src/routes/`** - API route handlers
- **`src/rag/`** - RAG pipeline components
  - `loaders.ts` - File loaders for PDF/TXT/DOCX
  - `splitter.ts` - Text chunking with overlap
  - `vectorstore.ts` - Vector store factory (Chroma/Pinecone/Qdrant)
  - `llm.ts` - OpenAI chat and embeddings
  - `retriever.ts` - RAG chain with legal-optimized prompting
  - `index.ts` - Main RAG orchestration

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **LLM Orchestration:** LangChain.js
- **LLM Provider:** OpenAI (GPT-4o)
- **Embeddings:** OpenAI text-embedding-3-large
- **Vector Stores:** Chroma (local), Pinecone, Qdrant
- **Document Processing:** pdf-parse, mammoth (DOCX)
- **Validation:** Zod

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

---

**⚖️ Legal Disclaimer:** This system provides informational assistance only and does not constitute legal advice. Always consult qualified legal professionals for legal matters.



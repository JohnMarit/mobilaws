// server-openai.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const app = express();

// Security: Configure CORS properly
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security: Limit request body size to prevent DoS attacks
app.use(express.json({ limit: '10mb' }));

// Security: Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// Security: Rate limiting middleware
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const entry = rateLimitStore.get(clientId);

    // Clean up expired entries
    if (rateLimitStore.size > 1000) {
      for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime < now) {
          rateLimitStore.delete(key);
        }
      }
    }

    if (!entry || entry.resetTime < now) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please wait before making another request',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
    }

    entry.count++;
    next();
  };
}

// Apply rate limiting to all routes (30 requests per minute)
app.use(rateLimit(30, 60000));
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Load law data
let lawData: any[] = [];
try {
  const lawDataPath = path.join(process.cwd(), 'public', 'law.json');
  const lawDataRaw = fs.readFileSync(lawDataPath, 'utf8');
  lawData = JSON.parse(lawDataRaw);
  console.log(`Loaded ${lawData.length} law articles`);
} catch (error) {
  console.error('Failed to load law data:', error);
}

// Law search function
function searchLawArticles(query: string, limit: number = 3): any[] {
  if (!query.trim()) {
    return lawData.slice(0, limit);
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  // Check if query is for a specific article number
  const articleMatch = normalizedQuery.match(/^(?:article\s*)?(\d+)$/);
  if (articleMatch) {
    const articleNum = parseInt(articleMatch[1]);
    const exactMatch = lawData.find(article => article.article === articleNum);
    return exactMatch ? [exactMatch] : [];
  }

  // Search by keywords with improved scoring
  const results: any[] = [];
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 2);

  for (const article of lawData) {
    let score = 0;
    const searchableText = [
      article.title,
      article.text,
      article.chapter,
      article.part,
      ...(article.tags || [])
    ].join(' ').toLowerCase();

    // Exact phrase match (highest priority)
    if (searchableText.includes(normalizedQuery)) {
      score += 200;
    }

    // Title matches (very high priority)
    if (article.title.toLowerCase().includes(normalizedQuery)) {
      score += 150;
    }

    // Tag matches (high priority)
    if (article.tags && article.tags.some((tag: string) => tag.toLowerCase().includes(normalizedQuery))) {
      score += 100;
    }

    // Individual word matches
    for (const word of queryWords) {
      if (searchableText.includes(word)) {
        score += 20;
      }
    }

    // Boost for articles that start with the query
    if (article.title.toLowerCase().startsWith(normalizedQuery)) {
      score += 50;
    }

    if (score > 0) {
      results.push({ ...article, score });
    }
  }

  // Sort by score and return top results
  return results
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit)
    .map(({ score, ...article }) => article); // Remove score from final results
}

app.post("/api/chat/stream", async (req, res) => {
  try {
    const { messages = [] } = req.body;
    
    // Security: Validate request body
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages must be an array' });
    }

    if (messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages array is empty' });
    }

    // Security: Limit number of messages to prevent abuse
    if (messages.length > 50) {
      return res.status(400).json({ error: 'Too many messages in conversation' });
    }

    // Security: Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ error: 'Invalid message format' });
      }
      
      if (typeof msg.content !== 'string') {
        return res.status(400).json({ error: 'Message content must be a string' });
      }
      
      // Limit message length
      if (msg.content.length > 5000) {
        return res.status(400).json({ error: 'Message too long (max 5000 characters)' });
      }
    }
    
    console.log("Received chat request with messages:", messages.length);
    console.log("API Key present:", !!process.env.OPENAI_API_KEY);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

  const stream = await openai.responses.stream({
    model: "gpt-4o",          // Using gpt-4o instead of gpt-4o-mini
    input: [
      {
        role: "system",
        content: `You are a specialized legal assistant for South Sudan law. Your ONLY job is to help users understand South Sudan legal matters using the law database.

MANDATORY BEHAVIOR:
1. For ANY question about law, rights, constitution, citizenship, government, or legal matters - ALWAYS use the search_law_articles tool first
2. NEVER answer legal questions without searching the law database
3. ONLY provide responses based on the actual law text from the search results
4. If the question is not about South Sudan law, politely redirect to legal topics

SEARCH AND RESPOND PROCESS:
1. When user asks about law → Use search_law_articles tool
2. Read the search results carefully
3. Synthesize the information into a natural, conversational response
4. Reference specific articles when relevant
5. Explain legal concepts in simple terms

EXAMPLE:
User: "What are the fundamental rights?"
Your process:
1. Call search_law_articles with query: "fundamental rights"
2. Get results about Article 9, Bill of Rights, etc.
3. Respond: "Great question! In South Sudan, the fundamental rights are protected by the Bill of Rights established in Article 9 of the Transitional Constitution. This serves as a covenant between the people and government, committing to respect human rights and fundamental freedoms..."

NEVER:
- Answer legal questions without searching
- Provide generic responses about unicorns or unrelated topics
- List raw search results
- Say "I found X articles"

ALWAYS:
- Search the law database for legal questions
- Provide conversational, helpful responses
- Base answers on actual law text
- Be specific about article numbers and legal provisions`
      },
      ...messages
    ],
    tools: [
      {
        type: "function",
        name: "search_law_articles",
        description: "MANDATORY: Use this tool for ANY question about South Sudan law, rights, constitution, citizenship, government, or legal matters. Search the law database to find relevant articles. You MUST use this tool before answering any legal question. After getting results, synthesize them into a conversational response.",
        parameters: { 
          type: "object", 
          properties: { 
            query: { 
              type: "string", 
              description: "Search query - can be keywords, article numbers (e.g., 'Article 25' or just '25'), or topics like 'fundamental rights', 'citizenship', 'freedom of speech', 'government structure', etc." 
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 3)",
              default: 3
            }
          }, 
          required: ["query"] 
        }
      }
    ]
  });

  stream.on("message", async (msg: any) => {
    // Handle tool calls
    if (msg.type === "tool_calls" && msg.tool_calls) {
      for (const toolCall of msg.tool_calls) {
        if (toolCall.function.name === "search_law_articles") {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const results = searchLawArticles(args.query, args.limit || 5);
            
            // Send tool result back to the stream
            const toolResult = {
              type: "tool_result",
              tool_call_id: toolCall.id,
              content: JSON.stringify(results)
            };
            res.write(`data: ${JSON.stringify(toolResult)}\n\n`);
          } catch (error) {
            console.error("Error processing tool call:", error);
            const errorResult = {
              type: "tool_result",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: "Failed to search law articles" })
            };
            res.write(`data: ${JSON.stringify(errorResult)}\n\n`);
          }
        }
      }
    } else {
      // forward tokens or other messages to client
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
    }
  });

  stream.on("end", () => { res.write(`data: ${JSON.stringify({ done:true })}\n\n`); res.end(); });
  stream.on("error", (e:any) => { 
    console.error("Stream error:", e);
    console.error("Error details:", JSON.stringify(e, null, 2));
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`); 
    res.end(); 
  });
  } catch (error: any) {
    console.error("API error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
});

// Test endpoint to verify server is working
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "AI Law Server is running", 
    lawArticlesLoaded: lawData.length,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to check API key
app.get("/api/test-key", async (req, res) => {
  try {
    console.log("Testing API key...");
    const testResponse = await openai.responses.stream({
      model: "gpt-4o",
      input: [{ role: "user", content: "Say 'API key test successful'" }]
    });
    
    let responseText = "";
    for await (const chunk of testResponse) {
      if (chunk.type === "message" && chunk.content) {
        responseText += chunk.content;
      }
    }
    
    res.json({ 
      success: true, 
      message: "API key test successful",
      response: responseText
    });
  } catch (error: any) {
    console.error("API key test failed:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error
    });
  }
});

app.listen(3001, () => console.log("AI server on :3001"));

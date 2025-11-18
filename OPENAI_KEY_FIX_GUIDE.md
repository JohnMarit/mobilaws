# 🔧 Fix OpenAI API Key Issue - Chat Not Working

## The Problem

Your backend is online (✅ health check works), but when you try to chat, you get:
> "I'm sorry, I encountered an error while processing your request."

**Root Cause:** Your OpenAI API key is either missing or invalid in Vercel environment variables.

---

## 📋 Step 1: Check Current Configuration

1. Open in browser: `https://mobilaws-ympe.vercel.app/api/env-check`

2. Look at the response, specifically the `openai` section:
   ```json
   {
     "status": "Environment Check",
     "openai": {
       "keyExists": true,
       "keyLength": 164,
       "keyPrefix": "sk-proj",
       "isValid": true  // ← This should be TRUE
     }
   }
   ```

3. **If `isValid: false`:**
   - The OpenAI key is missing or incorrect
   - Continue to Step 2

4. **If `isValid: true`:**
   - The key exists but might be expired/invalid
   - Get a new key from OpenAI (Step 2)

---

## 🔑 Step 2: Get Your OpenAI API Key

### Option A: Use Existing Key
1. Check your local `.env` file or previous notes
2. Your OpenAI key should start with `sk-proj-` or `sk-`
3. Copy the FULL key (usually 150+ characters)

### Option B: Generate New Key
1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Name it: `Mobilaws Backend Production`
4. Copy the key immediately (you can't see it again!)
5. Save it somewhere safe

---

## ⚙️ Step 3: Update Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard

2. **Select Backend Project:**
   - Click on `mobilaws-ympe` (your backend project)

3. **Go to Settings:**
   - Click **Settings** tab
   - Click **Environment Variables** in sidebar

4. **Update OPENAI_API_KEY:**
   
   **If variable exists:**
   - Click **Edit** (pencil icon) next to `OPENAI_API_KEY`
   - Paste your new key
   - Click **Save**
   
   **If variable doesn't exist:**
   - Click **Add New** button
   - Key: `OPENAI_API_KEY`
   - Value: `sk-proj-YOUR_FULL_KEY_HERE`
   - Select all environments: **Production**, **Preview**, **Development**
   - Click **Save**

5. **Verify Other Required Variables:**
   
   Make sure these are also set:
   ```
   LLM_MODEL=gpt-4o
   EMBED_MODEL=text-embedding-3-large
   TEMPERATURE=0.1
   MAX_TOKENS=1024
   VECTOR_BACKEND=chroma
   CHROMA_DIR=./storage/chroma
   DOCS_DIR=./storage/documents
   CORS_ORIGINS=https://mobilaws.vercel.app
   FRONTEND_URL=https://mobilaws.vercel.app
   ADMIN_EMAILS=thuchabraham42@gmail.com
   ```

---

## 🚀 Step 4: Redeploy Backend

**Important:** Updating environment variables does NOT automatically update your deployed app!

1. **In Vercel Dashboard:**
   - Still in `mobilaws-ympe` project
   - Go to **Deployments** tab

2. **Redeploy:**
   - Find the latest deployment (top of list)
   - Click **"⋯"** (three dots) on the right
   - Click **"Redeploy"**
   - Confirm by clicking **"Redeploy"** again

3. **Wait for deployment:**
   - Watch the deployment log
   - Should complete in 1-2 minutes
   - Look for ✅ "Ready" status

---

## ✅ Step 5: Verify Fix

### Test 1: Environment Check
1. Open: `https://mobilaws-ympe.vercel.app/api/env-check`
2. Verify `openai.isValid: true`

### Test 2: Try Chatting
1. Go to your app: `https://mobilaws.vercel.app`
2. Ask a question: "What is Article 1 of the Penal Code?"
3. You should get a proper response with citations!

---

## 🐛 Troubleshooting

### Still Getting Error After Fixing?

#### Problem: Invalid API Key Error
**Solution:**
- Your OpenAI key might be invalid or expired
- Generate a new key from https://platform.openai.com/api-keys
- Update in Vercel and redeploy

#### Problem: Rate Limit Error
**Solution:**
- Your OpenAI account has no credits
- Add payment method at https://platform.openai.com/account/billing
- GPT-4o costs ~$0.01 per query

#### Problem: CORS Error
**Solution:**
```
CORS_ORIGINS=https://mobilaws.vercel.app
```
Make sure it matches your frontend URL exactly (no trailing slash)

---

## 📊 Check Backend Logs (Advanced)

If chat is still not working:

1. Go to Vercel Dashboard → `mobilaws-ympe` project
2. Click **Deployments** → Click your latest deployment
3. Click **"Functions"** tab
4. Click on any function (e.g., `api/index`)
5. Click **"Logs"**
6. Try to send a chat message
7. Watch for errors like:
   - `❌ Chat error: Invalid API key`
   - `❌ Chat error: Rate limit exceeded`
   - `❌ Chat error: Model not found`

Share these logs if you need help!

---

## 🎯 Quick Summary

```bash
# The issue:
Backend online ✅ → but Chat failing ❌

# The fix:
1. Check: https://mobilaws-ympe.vercel.app/api/env-check
2. Get OpenAI key: https://platform.openai.com/api-keys
3. Add to Vercel: Settings → Environment Variables → OPENAI_API_KEY
4. Redeploy: Deployments → ⋯ → Redeploy
5. Test: Ask a question in chat!
```

---

## 💰 Note About OpenAI Costs

- **GPT-4o:** ~$0.01-0.03 per chat query (depends on length)
- **Embeddings:** Very cheap (~$0.0001 per document chunk)
- **Monthly estimate:** $5-20 for moderate usage

Set up billing at: https://platform.openai.com/account/billing

---

## Need Help?

If chat is still not working after following this guide:

1. Check backend logs (see "Check Backend Logs" section above)
2. Visit the diagnostic endpoint and share the response
3. Try a simple test query like "Hello"

The backend is successfully deployed - we just need to configure the OpenAI API key! 🎉


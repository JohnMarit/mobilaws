# ⚙️ Vercel Environment Variables Setup - Qdrant

## ✅ Your Qdrant Credentials

I've extracted and organized your credentials:

### 1. Cluster URL
```
https://a14f9956-8342-480b-92b2-a127189446ef.eu-west-2-0.aws.cloud.qdrant.io
```
**Important:** Use this URL WITHOUT the `:6333` port (that's for REST API, we need HTTP API)

### 2. API Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.4kgl46HtGxvn1iBWcJks-7GeeNieIFec8oDknTxFW34
```

### 3. Collection Name
```
mobilaws_legal
```

---

## 📋 Step-by-Step: Add to Vercel

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on project: **`mobilaws-ympe`** (your backend project)

### Step 2: Open Environment Variables
1. Click **"Settings"** tab (top menu)
2. Click **"Environment Variables"** in the left sidebar

### Step 3: Update/Add Variables

#### Variable 1: VECTOR_BACKEND
- **If exists:** Click "Edit" (pencil icon)
- **If new:** Click "Add New"
- **Key:** `VECTOR_BACKEND`
- **Value:** `qdrant`
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

#### Variable 2: QDRANT_URL
- Click **"Add New"**
- **Key:** `QDRANT_URL`
- **Value:** `https://a14f9956-8342-480b-92b2-a127189446ef.eu-west-2-0.aws.cloud.qdrant.io`
- **Important:** NO trailing slash, NO port number
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

#### Variable 3: QDRANT_API_KEY
- Click **"Add New"**
- **Key:** `QDRANT_API_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.4kgl46HtGxvn1iBWcJks-7GeeNieIFec8oDknTxFW34`
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

#### Variable 4: QDRANT_COLLECTION
- Click **"Add New"**
- **Key:** `QDRANT_COLLECTION`
- **Value:** `mobilaws_legal`
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

### Step 4: Delete Old Chroma Variables (if they exist)
Look for and **DELETE** these (not needed for Qdrant):
- `CHROMA_DIR`
- `DOCS_DIR`

---

## 🚀 Step 5: Redeploy Backend

⚠️ **CRITICAL:** Environment variables don't update automatically!

1. **Still in Vercel Dashboard:**
   - Click **"Deployments"** tab (top menu)
2. **Find latest deployment** (should be at the top)
3. **Click:** "⋯" (three dots) on the right side
4. **Click:** "Redeploy"
5. **Confirm:** Click "Redeploy" again in the popup
6. **Wait:** 1-2 minutes for deployment to complete
   - Watch the build log
   - Should show ✅ "Ready" when done

---

## ✅ Step 6: Verify Configuration

**Test that Qdrant is configured:**

Open this URL in your browser:
```
https://mobilaws-ympe.vercel.app/api/env-check
```

**Expected Response:**
```json
{
  "status": "Environment Check",
  "openai": {
    "isValid": true
  },
  "vectorStore": {
    "backend": "qdrant",        // ← Should be "qdrant"
    "configured": true,          // ← Should be true
    "url": "***configured***"   // ← Should show this
  }
}
```

**If you see this:** ✅ **Qdrant is configured!** You can now upload documents!

**If not:**
- Double-check all 4 variables are set correctly
- Make sure you selected all environments
- Make sure backend was redeployed
- Wait 30 seconds and check again

---

## 🎯 After Verification

Once `/api/env-check` shows Qdrant is configured:

1. **Run upload script:**
   ```powershell
   .\upload-documents.ps1
   ```

2. **Your PDFs will be indexed into Qdrant**

3. **Chat will work!** 🎉

---

## 🐛 Troubleshooting

### Still shows "chroma" after redeploy
- Check `VECTOR_BACKEND` is set to `qdrant` (not `chroma`)
- Make sure you selected all environments
- Wait 1 minute and check again

### "Cannot connect to Qdrant"
- Verify `QDRANT_URL` has NO trailing slash
- Verify `QDRANT_URL` has NO port number (`:6333`)
- Check cluster is "Running" in Qdrant dashboard
- Make sure API key is correct (no extra spaces)

### "Invalid API key"
- Make sure you copied the FULL key
- Check for extra spaces at start/end
- Create a new API key in Qdrant if needed

---

## 📊 Summary of Variables

| Variable | Value |
|----------|-------|
| `VECTOR_BACKEND` | `qdrant` |
| `QDRANT_URL` | `https://a14f9956-8342-480b-92b2-a127189446ef.eu-west-2-0.aws.cloud.qdrant.io` |
| `QDRANT_API_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.4kgl46HtGxvn1iBWcJks-7GeeNieIFec8oDknTxFW34` |
| `QDRANT_COLLECTION` | `mobilaws_legal` |

---

## ✅ Checklist

- [ ] Added `VECTOR_BACKEND=qdrant` to Vercel
- [ ] Added `QDRANT_URL` to Vercel (no port, no trailing slash)
- [ ] Added `QDRANT_API_KEY` to Vercel
- [ ] Added `QDRANT_COLLECTION=mobilaws_legal` to Vercel
- [ ] Selected all environments for each variable
- [ ] Deleted old `CHROMA_DIR` and `DOCS_DIR` (if they existed)
- [ ] Redeployed backend
- [ ] Verified `/api/env-check` shows Qdrant configured
- [ ] Ready to upload documents! 🚀

---

**Ready?** Go to Vercel and add these variables now! 🎯


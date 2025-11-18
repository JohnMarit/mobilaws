# 🚀 Setup Qdrant Cloud NOW (5 minutes)

## ⚠️ Current Status

Your environment check shows:
- ✅ OpenAI: Configured correctly
- ❌ Vector Store: Still using `chroma` (won't work on Vercel)

**You MUST set up Qdrant before uploading documents!**

---

## 📋 Step-by-Step Setup

### Step 1: Create Qdrant Cloud Account (2 min)

1. **Go to:** https://cloud.qdrant.io/
2. **Click:** "Sign Up" (top right)
3. **Choose:** Sign up with Google (easiest) or Email
4. **Verify email** if needed

**No credit card required!** Free tier is enough.

---

### Step 2: Create Your First Cluster (2 min)

1. **After login**, you'll see the dashboard
2. **Click:** "Create Cluster" button (big green button)
3. **Fill in:**
   - **Cluster name:** `mobilaws-legal`
   - **Plan:** Select **"Free"** (1GB storage - plenty!)
   - **Region:** Choose closest to you:
     - `eu-west-1` (Europe - good for Africa)
     - `us-east-1` (USA)
     - `ap-south-1` (Asia)
4. **Click:** "Create Cluster"
5. **Wait:** 1-2 minutes for cluster to be ready

---

### Step 3: Get Your Credentials (1 min)

Once cluster is ready:

1. **Click on your cluster:** `mobilaws-legal`
2. **Copy the Cluster URL:**
   - Looks like: `https://abc123def.eu-west-1-0.aws.cloud.qdrant.io`
   - Copy the FULL URL
3. **Go to "API Keys" tab:**
   - Click "Create API Key"
   - Name it: `mobilaws-backend`
   - **Copy the key immediately!** (starts with `qdrant_`)
   - You can't see it again!

**Save both somewhere safe:**
- Cluster URL: `https://...`
- API Key: `qdrant_...`

---

### Step 4: Update Vercel Environment Variables (3 min)

1. **Go to:** https://vercel.com/dashboard
2. **Select project:** `mobilaws-ympe` (your backend)
3. **Click:** Settings → Environment Variables

#### Update Existing Variable:
- Find: `VECTOR_BACKEND`
- **Change value from:** `chroma`
- **To:** `qdrant`
- Click "Save"

#### Add New Variables (3 total):

**Variable 1:**
- **Key:** `QDRANT_URL`
- **Value:** `https://your-cluster-id.region.cloud.qdrant.io` (paste your cluster URL)
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click "Save"

**Variable 2:**
- **Key:** `QDRANT_API_KEY`
- **Value:** `qdrant_your_api_key_here` (paste your API key)
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click "Save"

**Variable 3:**
- **Key:** `QDRANT_COLLECTION`
- **Value:** `mobilaws_legal`
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click "Save"

#### Delete These (if they exist):
- `CHROMA_DIR` (not needed for Qdrant)
- `DOCS_DIR` (not needed for Qdrant)

---

### Step 5: Redeploy Backend (1 min)

⚠️ **CRITICAL:** Environment variables don't update automatically!

1. **Still in Vercel Dashboard:**
   - Go to **"Deployments"** tab
2. **Find latest deployment** (top of list)
3. **Click:** "⋯" (three dots) on the right
4. **Click:** "Redeploy"
5. **Confirm:** Click "Redeploy" again
6. **Wait:** 1-2 minutes for deployment

---

### Step 6: Verify It Works (30 sec)

**Test the configuration:**

Open in browser:
```
https://mobilaws-ympe.vercel.app/api/env-check
```

**Expected response:**
```json
{
  "vectorStore": {
    "backend": "qdrant",      // ← Should be "qdrant"
    "configured": true,        // ← Should be true
    "url": "***configured***" // ← Should show this
  }
}
```

**If you see this:** ✅ You're ready to upload documents!

**If not:** Check that:
- All 3 variables are set in Vercel
- Backend was redeployed
- Wait 30 seconds and check again

---

## ✅ After Qdrant is Configured

Once `api/env-check` shows Qdrant is configured:

1. **Run upload script:**
   ```powershell
   .\upload-documents.ps1
   ```

2. **Your PDFs will be indexed into Qdrant**

3. **Chat will work!** 🎉

---

## 🐛 Troubleshooting

### "Cluster creation failed"
- Try a different region
- Wait a few minutes and try again
- Check Qdrant status page

### "Invalid API key" in Vercel
- Make sure you copied the FULL key (starts with `qdrant_`)
- Check for extra spaces
- Create a new API key if needed

### "Cannot connect to Qdrant"
- Check cluster is "Running" in Qdrant dashboard
- Verify URL has no trailing slash
- Make sure you redeployed after adding variables

### Still shows "chroma" after redeploy
- Double-check `VECTOR_BACKEND=qdrant` is set
- Make sure you selected all environments (Production, Preview, Development)
- Wait 1 minute and check again

---

## 📊 What You're Setting Up

```
Before (Broken):
Backend → tries localhost Chroma → FAILS ❌

After (Working):
Backend → Qdrant Cloud (HTTPS) → SUCCESS ✅
```

---

## 💰 Cost: FREE!

- Qdrant Cloud Free Tier: **$0**
- 1GB storage (enough for ~100,000 document chunks)
- Unlimited requests
- No credit card required

---

## 🎯 Quick Checklist

- [ ] Created Qdrant Cloud account
- [ ] Created cluster `mobilaws-legal`
- [ ] Got Cluster URL
- [ ] Got API Key
- [ ] Updated `VECTOR_BACKEND=qdrant` in Vercel
- [ ] Added `QDRANT_URL` in Vercel
- [ ] Added `QDRANT_API_KEY` in Vercel
- [ ] Added `QDRANT_COLLECTION=mobilaws_legal` in Vercel
- [ ] Redeployed backend
- [ ] Verified `/api/env-check` shows Qdrant configured
- [ ] Ready to upload documents! 🚀

---

## 🚀 Ready to Start?

**Go to:** https://cloud.qdrant.io/ and sign up!

**Total time:** ~5 minutes

**After setup:** Run `.\upload-documents.ps1` to upload your PDFs!

---

Need help with any step? Let me know! 🙌


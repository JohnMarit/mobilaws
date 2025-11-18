# 🚀 Quick Upload Instructions

## ✅ You're Ready to Upload!

I found your PDFs in the `LAW` folder:
- ✅ `Penal-Code-Act-South-Sudan-2008.pdf`
- ✅ `south sudan laws.pdf`

---

## 📋 Next Steps (2 minutes)

### Step 1: Make Sure Qdrant is Configured

**First, verify your backend is ready:**

Open this URL in your browser:
```
https://mobilaws-ympe.vercel.app/api/env-check
```

**Check these values:**
- ✅ `openai.isValid: true`
- ✅ `vectorStore.backend: "qdrant"`
- ✅ `vectorStore.configured: true`

**If any are ❌:** You need to set up Qdrant first (see `QUICK_FIX_CHECKLIST.md`)

---

### Step 2: Run the Upload Script

**Open PowerShell in your project folder:**

```powershell
cd "C:\Users\John\Desktop\Mobilaws"
.\upload-documents.ps1
```

**What will happen:**
1. Script finds your PDFs in the `LAW` folder
2. Shows you what it found
3. Asks for confirmation (type `Y`)
4. Uploads each file to your backend
5. Backend processes and indexes them into Qdrant
6. Shows you results!

**Expected output:**
```
📄 Mobilaws Document Uploader
================================

📁 Looking for documents in: LAW\

✅ Found PDF files:
   - Penal-Code-Act-South-Sudan-2008.pdf
   - south sudan laws.pdf

📤 Ready to upload 2 file(s) to backend...
   Backend URL: https://mobilaws-ympe.vercel.app/api/upload

Continue? (Y/N): Y

🚀 Starting upload...

   📤 Uploading: Penal-Code-Act-South-Sudan-2008.pdf...
      ✅ Uploaded (245 chunks indexed)
   📤 Uploading: south sudan laws.pdf...
      ✅ Uploaded (189 chunks indexed)

✅ All uploads successful!

📊 Results:
   Files uploaded: 2
   Total chunks indexed: 434

📄 Uploaded files:
   ✅ Penal-Code-Act-South-Sudan-2008.pdf (1234.56 KB)
   ✅ south sudan laws.pdf (987.65 KB)

🎉 Documents are now indexed and searchable!
```

---

### Step 3: Test It Works!

**Test 1: Search API**
Open in browser:
```
https://mobilaws-ympe.vercel.app/api/search?q=article%201&k=3
```

Should return legal document chunks!

**Test 2: Chat in Your App**
1. Go to: https://mobilaws.vercel.app
2. Ask: "What is Article 1 of the Penal Code?"
3. Should get a proper answer with citations! 🎉

---

## 🐛 Troubleshooting

### "LAW folder not found"
- Make sure you're running the script from: `C:\Users\John\Desktop\Mobilaws`
- Check the folder is named exactly `LAW` (uppercase)

### "Upload failed" or "Cannot reach backend"
- Check backend is online: `https://mobilaws-ympe.vercel.app/healthz`
- Should return: `{"ok":true}`
- If not, backend might not be deployed

### "No supported files found"
- Make sure files are `.pdf`, `.docx`, `.doc`, or `.txt`
- Check files are actually in the `LAW` folder

### "Qdrant not configured" error
- You need to set up Qdrant Cloud first
- Follow: `QUICK_FIX_CHECKLIST.md` (Steps 1-5)
- Then come back and upload documents

### Upload succeeds but chat still doesn't work
- Wait 30 seconds (indexing takes time)
- Test search: `/api/search?q=test`
- Check backend logs in Vercel

---

## 📊 What Happens During Upload

```
Your PDFs (LAW folder)
    ↓
PowerShell script uploads to backend
    ↓
Backend extracts text from PDFs
    ↓
Backend splits into searchable chunks
    ↓
Backend creates embeddings (vectors)
    ↓
Backend stores in Qdrant Cloud
    ↓
Documents are now searchable! ✅
```

**You don't need to do anything with Qdrant directly** - the backend handles everything automatically!

---

## 🎯 After Upload

Your legal documents will be:
- ✅ Indexed in Qdrant Cloud
- ✅ Searchable via `/api/search`
- ✅ Available for AI chat responses
- ✅ Ready to answer user questions!

---

## 💡 Pro Tips

1. **Upload order doesn't matter** - upload all files at once
2. **File size limit:** 50MB per file
3. **Multiple uploads:** You can run the script again to add more documents
4. **Update documents:** Upload a new version with the same name to replace

---

## 🚀 Ready?

Just run:
```powershell
.\upload-documents.ps1
```

That's it! 🎉


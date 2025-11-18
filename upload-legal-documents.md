# 📄 How to Upload Your Legal Documents

## 🎯 Quick Answer

**You upload to your BACKEND API** → Backend automatically indexes them into Qdrant → Documents become searchable for chat!

**You don't upload directly to Qdrant** - the backend handles that automatically.

---

## 📋 What Documents You Have

I found these legal documents in your project:

1. ✅ **`Penal-Code-Act-South-Sudan-2008.md`** - Penal Code Act (Markdown format)
2. ✅ **`public/law.json`** - Structured legal articles (JSON format)
3. ✅ **`law.md`** - Additional legal content (Markdown format)

---

## ⚠️ Important: File Format Requirements

Your backend accepts these formats:
- ✅ `.pdf` (PDF documents)
- ✅ `.txt` (Plain text)
- ✅ `.doc` / `.docx` (Word documents)
- ❌ `.md` (Markdown) - **NOT directly supported**
- ❌ `.json` - **NOT directly supported**

---

## 🔄 Solution: Convert Your Files

### Option 1: Convert Markdown to PDF (Recommended)

**Using Online Tool:**
1. Go to: https://www.markdowntopdf.com/ or https://dillinger.io/
2. Upload your `Penal-Code-Act-South-Sudan-2008.md`
3. Click "Export as PDF"
4. Download the PDF

**Using VS Code:**
1. Install "Markdown PDF" extension
2. Open `Penal-Code-Act-South-Sudan-2008.md`
3. Right-click → "Markdown PDF: Export (pdf)"
4. Save the PDF

### Option 2: Convert Markdown to DOCX

1. Use: https://www.markdowntopdf.com/ (also supports DOCX)
2. Or use Pandoc: `pandoc file.md -o file.docx`

### Option 3: Convert JSON to Text/PDF

For `law.json`, you can:
1. Create a simple script to convert JSON to readable text
2. Or manually copy content to a Word document
3. Or use the script I'll create below

---

## 🚀 Upload Methods

### Method 1: Using PowerShell (Windows - Easiest)

I'll create a script for you! See `upload-documents.ps1` below.

### Method 2: Using Postman

1. Open Postman (or download: https://www.postman.com/)
2. Create new request:
   - **Method:** POST
   - **URL:** `https://mobilaws-ympe.vercel.app/api/upload`
   - **Body:** Select "form-data"
   - **Key:** `files` (change type to "File")
   - **Value:** Click "Select Files" → Choose your PDF/DOCX file
3. Click "Send"
4. Repeat for each document

### Method 3: Using curl (Mac/Linux)

```bash
curl -X POST https://mobilaws-ympe.vercel.app/api/upload \
  -F "files=@Penal-Code-Act-South-Sudan-2008.pdf" \
  -F "files=@law.pdf"
```

### Method 4: Using Browser (Simple Test)

You can't upload directly from browser, but you can test the endpoint.

---

## 📝 Step-by-Step Process

### Step 1: Convert Your Documents

**For `Penal-Code-Act-South-Sudan-2008.md`:**
1. Open in VS Code or online markdown editor
2. Export as PDF or DOCX
3. Save as: `Penal-Code-Act-South-Sudan-2008.pdf`

**For `law.json`:**
- Option A: Convert to text file (see script below)
- Option B: Manually create a Word document with the content
- Option C: Use the JSON directly (I'll show you how)

### Step 2: Upload to Backend

Use one of the methods above (PowerShell script is easiest!)

### Step 3: Verify Upload

Check if documents were indexed:
```
https://mobilaws-ympe.vercel.app/api/search?q=article%201&k=3
```

Should return results if documents are indexed!

### Step 4: Test Chat

Go to your app and ask: "What is Article 1 of the Penal Code?"

---

## ✅ What Happens When You Upload

```
1. You upload PDF/DOCX → Backend API (/api/upload)
   ↓
2. Backend extracts text from document
   ↓
3. Backend splits into chunks (for better search)
   ↓
4. Backend creates embeddings (vector representations)
   ↓
5. Backend stores in Qdrant Cloud (automatically!)
   ↓
6. Documents are now searchable for chat! ✅
```

**You don't need to do anything with Qdrant directly** - the backend handles everything!

---

## 🎯 Recommended Documents to Upload

Priority order:

1. **Penal Code Act** (most important - users ask about this)
2. **Constitutional documents** (if you have them)
3. **Other legal acts** (criminal code, civil code, etc.)

Start with the Penal Code - that's what most users will ask about!

---

## 🐛 Troubleshooting

### "Invalid file type" error
- Make sure file is `.pdf`, `.txt`, `.doc`, or `.docx`
- Convert markdown files to PDF first

### "Upload failed" error
- Check backend is deployed: `https://mobilaws-ympe.vercel.app/healthz`
- Check file size (max 50MB)
- Try uploading one file at a time

### "No results found" after upload
- Wait 30 seconds (indexing takes time)
- Try searching: `/api/search?q=test`
- Check backend logs in Vercel

### Documents uploaded but chat still doesn't work
- Make sure Qdrant is configured (see previous guides)
- Check `/api/env-check` shows Qdrant configured
- Verify documents were indexed: `/api/search?q=penal`

---

## 📊 After Upload: What to Expect

**Response from upload:**
```json
{
  "success": true,
  "files": [
    {
      "originalName": "Penal-Code-Act-South-Sudan-2008.pdf",
      "savedName": "Penal-Code-Act-South-Sudan-2008-1234567890.pdf",
      "size": 245678,
      "path": "/path/to/file"
    }
  ],
  "indexed_chunks": 150  // Number of searchable chunks created
}
```

**Good indicators:**
- `success: true` ✅
- `indexed_chunks: 100+` ✅ (means document was processed)
- No errors ✅

---

## 🚀 Ready to Upload?

1. Convert your markdown files to PDF
2. Use the PowerShell script (I'll create it next)
3. Upload and verify
4. Test chat!

Let me know when you're ready and I'll help you upload! 🎉


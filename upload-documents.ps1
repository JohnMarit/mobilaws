# PowerShell Script to Upload Legal Documents to Mobilaws Backend
# Usage: .\upload-documents.ps1

$backendUrl = "https://mobilaws-ympe.vercel.app/api/upload"

Write-Host "📄 Mobilaws Document Uploader" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if files exist
$filesToUpload = @()

# Check for PDF files
$pdfFiles = Get-ChildItem -Path "." -Filter "*.pdf" -ErrorAction SilentlyContinue
if ($pdfFiles) {
    Write-Host "✅ Found PDF files:" -ForegroundColor Green
    foreach ($file in $pdfFiles) {
        Write-Host "   - $($file.Name)" -ForegroundColor Gray
        $filesToUpload += $file
    }
    Write-Host ""
}

# Check for DOCX files
$docxFiles = Get-ChildItem -Path "." -Filter "*.docx" -ErrorAction SilentlyContinue
if ($docxFiles) {
    Write-Host "✅ Found DOCX files:" -ForegroundColor Green
    foreach ($file in $docxFiles) {
        Write-Host "   - $($file.Name)" -ForegroundColor Gray
        $filesToUpload += $file
    }
    Write-Host ""
}

# Check for DOC files
$docFiles = Get-ChildItem -Path "." -Filter "*.doc" -ErrorAction SilentlyContinue
if ($docFiles) {
    Write-Host "✅ Found DOC files:" -ForegroundColor Green
    foreach ($file in $docFiles) {
        Write-Host "   - $($file.Name)" -ForegroundColor Gray
        $filesToUpload += $file
    }
    Write-Host ""
}

# Check for TXT files
$txtFiles = Get-ChildItem -Path "." -Filter "*.txt" -ErrorAction SilentlyContinue
if ($txtFiles) {
    Write-Host "✅ Found TXT files:" -ForegroundColor Green
    foreach ($file in $txtFiles) {
        Write-Host "   - $($file.Name)" -ForegroundColor Gray
        $filesToUpload += $file
    }
    Write-Host ""
}

if ($filesToUpload.Count -eq 0) {
    Write-Host "❌ No supported files found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Supported formats: .pdf, .docx, .doc, .txt" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Tip: Convert your .md files to PDF first:" -ForegroundColor Cyan
    Write-Host "   1. Use https://www.markdowntopdf.com/" -ForegroundColor Gray
    Write-Host "   2. Or install 'Markdown PDF' extension in VS Code" -ForegroundColor Gray
    Write-Host ""
    exit
}

Write-Host "📤 Ready to upload $($filesToUpload.Count) file(s) to backend..." -ForegroundColor Cyan
Write-Host "   Backend URL: $backendUrl" -ForegroundColor Gray
Write-Host ""

# Ask for confirmation
$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "❌ Upload cancelled" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "🚀 Starting upload..." -ForegroundColor Cyan
Write-Host ""

# Prepare form data
$form = @{}
$fileIndex = 0
foreach ($file in $filesToUpload) {
    $form["files"] = Get-Item -Path $file.FullName
    $fileIndex++
}

try {
    # Upload files
    Write-Host "📤 Uploading files..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri $backendUrl -Method Post -Form $form -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✅ Upload successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Results:" -ForegroundColor Cyan
    Write-Host "   Files uploaded: $($response.files.Count)" -ForegroundColor Gray
    Write-Host "   Chunks indexed: $($response.indexed_chunks)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📄 Uploaded files:" -ForegroundColor Cyan
    foreach ($fileInfo in $response.files) {
        Write-Host "   ✅ $($fileInfo.originalName) ($([math]::Round($fileInfo.size/1KB, 2)) KB)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🎉 Documents are now indexed and searchable!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Test search:" -ForegroundColor Cyan
    Write-Host "   https://mobilaws-ympe.vercel.app/api/search?q=article%201&k=3" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💬 Try chatting in your app now!" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "   1. Check backend is deployed: https://mobilaws-ympe.vercel.app/healthz" -ForegroundColor Gray
    Write-Host "   2. Check Qdrant is configured: https://mobilaws-ympe.vercel.app/api/env-check" -ForegroundColor Gray
    Write-Host "   3. Make sure files are under 50MB" -ForegroundColor Gray
    Write-Host ""
}


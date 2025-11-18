# Upload documents using curl (more reliable than Invoke-RestMethod)
# Usage: .\upload-with-curl.ps1

$backendUrl = "https://mobilaws-ympe.vercel.app/api/upload"
$lawFolder = "LAW"

Write-Host "📄 Mobilaws Document Uploader (curl version)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if curl is available
try {
    $curlVersion = curl.exe --version 2>&1 | Select-Object -First 1
    Write-Host "✅ Using: $curlVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ curl not found! Installing curl..." -ForegroundColor Red
    Write-Host "Please install curl or use a newer Windows version (Windows 10 1803+)" -ForegroundColor Yellow
    exit
}

# Check if LAW folder exists
if (-not (Test-Path $lawFolder)) {
    Write-Host "❌ LAW folder not found!" -ForegroundColor Red
    exit
}

# Get PDF files
$pdfFiles = Get-ChildItem -Path $lawFolder -Filter "*.pdf" -ErrorAction SilentlyContinue

if (-not $pdfFiles -or $pdfFiles.Count -eq 0) {
    Write-Host "❌ No PDF files found in LAW folder!" -ForegroundColor Red
    exit
}

Write-Host "📁 Found $($pdfFiles.Count) PDF file(s) in LAW folder:" -ForegroundColor Cyan
foreach ($file in $pdfFiles) {
    Write-Host "   - $($file.Name) ($([math]::Round($file.Length/1KB, 2)) KB)" -ForegroundColor Gray
}
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

$uploadedCount = 0
$totalChunks = 0
$uploadedFiles = @()

foreach ($file in $pdfFiles) {
    Write-Host "   📤 Uploading: $($file.Name)..." -ForegroundColor Yellow
    
    $filePath = $file.FullName
    
    # Use curl to upload
    $curlCommand = "curl.exe -X POST `"$backendUrl`" -F `"files=@$filePath`" -H `"Accept: application/json`""
    
    try {
        $result = Invoke-Expression $curlCommand | ConvertFrom-Json
        
        if ($result.success) {
            $uploadedCount++
            $totalChunks += $result.indexed_chunks
            $uploadedFiles += $result.files[0]
            Write-Host "      ✅ Uploaded ($($result.indexed_chunks) chunks indexed)" -ForegroundColor Green
        } else {
            Write-Host "      ❌ Upload failed: $($result.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "      ❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "      💡 Error details: $_" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

if ($uploadedCount -gt 0) {
    Write-Host "✅ Upload complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Results:" -ForegroundColor Cyan
    Write-Host "   Files uploaded: $uploadedCount" -ForegroundColor Gray
    Write-Host "   Total chunks indexed: $totalChunks" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📄 Uploaded files:" -ForegroundColor Cyan
    foreach ($fileInfo in $uploadedFiles) {
        Write-Host "   ✅ $($fileInfo.originalName) ($([math]::Round($fileInfo.size/1KB, 2)) KB)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🎉 Documents are now indexed and searchable!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Test search:" -ForegroundColor Cyan
    Write-Host "   https://mobilaws-ympe.vercel.app/api/search?q=article%201&k=3" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💬 Try chatting in your app now!" -ForegroundColor Cyan
} else {
    Write-Host "❌ No files were uploaded successfully" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check backend is online: https://mobilaws-ympe.vercel.app/healthz" -ForegroundColor Gray
    Write-Host "   2. Check Qdrant is configured: https://mobilaws-ympe.vercel.app/api/env-check" -ForegroundColor Gray
    Write-Host "   3. Make sure PDF files are valid" -ForegroundColor Gray
}

Write-Host ""


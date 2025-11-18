# Upload documents immediately (no confirmation prompt)
# Usage: .\upload-now.ps1

$backendUrl = "https://mobilaws-ympe.vercel.app/api/upload"
$lawFolder = "LAW"

Write-Host "📄 Mobilaws Document Uploader" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Get PDF files
$pdfFiles = Get-ChildItem -Path $lawFolder -Filter "*.pdf" -ErrorAction SilentlyContinue

if (-not $pdfFiles -or $pdfFiles.Count -eq 0) {
    Write-Host "❌ No PDF files found in LAW folder!" -ForegroundColor Red
    exit
}

Write-Host "📁 Found $($pdfFiles.Count) PDF file(s):" -ForegroundColor Cyan
foreach ($file in $pdfFiles) {
    Write-Host "   - $($file.Name)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "🚀 Starting upload..." -ForegroundColor Cyan
Write-Host ""

$uploadedCount = 0
$totalChunks = 0

foreach ($file in $pdfFiles) {
    Write-Host "   📤 Uploading: $($file.Name)..." -ForegroundColor Yellow
    
    $filePath = $file.FullName
    
    # Use curl to upload
    $result = & curl.exe -X POST "$backendUrl" -F "files=@$filePath" -H "Accept: application/json" --silent --show-error 2>&1
    
    try {
        $jsonResult = $result | ConvertFrom-Json
        
        if ($jsonResult.success) {
            $uploadedCount++
            $totalChunks += $jsonResult.indexed_chunks
            Write-Host "      ✅ Success! ($($jsonResult.indexed_chunks) chunks indexed)" -ForegroundColor Green
        } else {
            Write-Host "      ❌ Failed: $($jsonResult.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "      ❌ Failed: $result" -ForegroundColor Red
    }
}

Write-Host ""
if ($uploadedCount -gt 0) {
    Write-Host "✅ Upload complete!" -ForegroundColor Green
    Write-Host "   Files uploaded: $uploadedCount" -ForegroundColor Gray
    Write-Host "   Total chunks indexed: $totalChunks" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎉 Documents are now searchable!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Test: https://mobilaws-ympe.vercel.app/api/search?q=article%201" -ForegroundColor Cyan
    Write-Host "💬 Try chatting in your app now!" -ForegroundColor Cyan
} else {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
}
Write-Host ""


# Convert law.json to a readable text file for upload
# Usage: .\convert-json-to-text.ps1

Write-Host "📄 Converting law.json to text format..." -ForegroundColor Cyan
Write-Host ""

$jsonPath = "public\law.json"
$outputPath = "law-documents.txt"

if (-not (Test-Path $jsonPath)) {
    Write-Host "❌ File not found: $jsonPath" -ForegroundColor Red
    exit
}

try {
    # Read JSON file
    $jsonContent = Get-Content $jsonPath -Raw | ConvertFrom-Json
    
    Write-Host "✅ Loaded $($jsonContent.Count) legal articles" -ForegroundColor Green
    Write-Host ""
    
    # Create text content
    $textContent = @()
    $textContent += "SOUTH SUDAN LEGAL DOCUMENTS"
    $textContent += "=" * 50
    $textContent += ""
    $textContent += "This document contains legal articles and provisions from South Sudan."
    $textContent += "Generated from law.json"
    $textContent += ""
    $textContent += "=" * 50
    $textContent += ""
    
    foreach ($article in $jsonContent) {
        $textContent += ""
        $textContent += "ARTICLE $($article.article)"
        $textContent += "-" * 30
        
        if ($article.title) {
            $textContent += "Title: $($article.title)"
        }
        
        if ($article.chapter) {
            $textContent += "Chapter: $($article.chapter)"
        }
        
        if ($article.part) {
            $textContent += "Part: $($article.part)"
        }
        
        $textContent += ""
        
        if ($article.text) {
            $textContent += $article.text
        }
        
        if ($article.tags -and $article.tags.Count -gt 0) {
            $textContent += ""
            $textContent += "Tags: $($article.tags -join ', ')"
        }
        
        if ($article.lawSource) {
            $textContent += ""
            $textContent += "Source: $($article.lawSource)"
        }
        
        $textContent += ""
        $textContent += "=" * 50
    }
    
    # Write to file
    $textContent | Out-File -FilePath $outputPath -Encoding UTF8
    
    $fileSize = (Get-Item $outputPath).Length / 1KB
    
    Write-Host "✅ Conversion complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 Output file: $outputPath" -ForegroundColor Cyan
    Write-Host "   Size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🚀 Next step: Upload this file using upload-documents.ps1" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "❌ Error converting file:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}


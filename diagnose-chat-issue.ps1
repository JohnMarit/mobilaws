# Diagnostic Script to Check Why Chat Isn't Working
# Usage: .\diagnose-chat-issue.ps1

$backendUrl = "https://mobilaws-ympe.vercel.app"

Write-Host "🔍 Diagnosing Chat Issue" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend Health
Write-Host "1️⃣ Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/healthz" -Method Get -ErrorAction Stop
    if ($health.ok) {
        Write-Host "   ✅ Backend is online" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backend health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Cannot reach backend: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Environment Configuration
Write-Host "2️⃣ Checking Environment Configuration..." -ForegroundColor Yellow
try {
    $envCheck = Invoke-RestMethod -Uri "$backendUrl/api/env-check" -Method Get -ErrorAction Stop
    Write-Host "   OpenAI Valid: $($envCheck.openai.isValid)" -ForegroundColor $(if ($envCheck.openai.isValid) { "Green" } else { "Red" })
    Write-Host "   Vector Backend: $($envCheck.vectorStore.backend)" -ForegroundColor $(if ($envCheck.vectorStore.backend -eq "qdrant") { "Green" } else { "Red" })
    Write-Host "   Vector Configured: $($envCheck.vectorStore.configured)" -ForegroundColor $(if ($envCheck.vectorStore.configured) { "Green" } else { "Red" })
    
    if (-not $envCheck.vectorStore.configured) {
        Write-Host "   ⚠️  Qdrant is not properly configured!" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Cannot check environment: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Search Endpoint (Check if documents are indexed)
Write-Host "3️⃣ Testing Search Endpoint (checks if documents are indexed)..." -ForegroundColor Yellow
try {
    $searchResult = Invoke-RestMethod -Uri "$backendUrl/api/search?q=article&k=3" -Method Get -ErrorAction Stop
    
    if ($searchResult -and $searchResult.Count -gt 0) {
        Write-Host "   ✅ Search works! Found $($searchResult.Count) results" -ForegroundColor Green
        Write-Host "   📄 First result: $($searchResult[0].text.Substring(0, [Math]::Min(100, $searchResult[0].text.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Search works but returned no results" -ForegroundColor Yellow
        Write-Host "   💡 This means documents might not be uploaded yet!" -ForegroundColor Yellow
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $errorMsg = $responseBody
    }
    Write-Host "   ❌ Search failed: $errorMsg" -ForegroundColor Red
    Write-Host "   💡 This might mean documents are not uploaded!" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Chat Endpoint (Direct test)
Write-Host "4️⃣ Testing Chat Endpoint Directly..." -ForegroundColor Yellow
try {
    $chatBody = @{
        message = "What is Article 1?"
        convoId = $null
    } | ConvertTo-Json
    
    Write-Host "   📤 Sending test message: 'What is Article 1?'" -ForegroundColor Gray
    
    # Note: Chat uses SSE streaming, so we'll just check if endpoint responds
    $chatResponse = Invoke-WebRequest -Uri "$backendUrl/api/chat" -Method Post -Body $chatBody -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    
    if ($chatResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Chat endpoint responds (status 200)" -ForegroundColor Green
        Write-Host "   💡 If you still get errors, check backend logs in Vercel" -ForegroundColor Yellow
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   ❌ Chat endpoint error: HTTP $statusCode" -ForegroundColor Red
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    } else {
        Write-Host "   ❌ Chat endpoint error: $errorMsg" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Check if documents exist in LAW folder
Write-Host "5️⃣ Checking Local Documents..." -ForegroundColor Yellow
$lawFolder = "LAW"
if (Test-Path $lawFolder) {
    $pdfFiles = Get-ChildItem -Path $lawFolder -Filter "*.pdf" -ErrorAction SilentlyContinue
    if ($pdfFiles) {
        Write-Host "   ✅ Found $($pdfFiles.Count) PDF file(s) in LAW folder:" -ForegroundColor Green
        foreach ($file in $pdfFiles) {
            Write-Host "      - $($file.Name) ($([math]::Round($file.Length/1KB, 2)) KB)" -ForegroundColor Gray
        }
        Write-Host "   💡 Run .\upload-documents.ps1 to upload these!" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️  No PDF files found in LAW folder" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  LAW folder not found" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "📊 DIAGNOSIS SUMMARY" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$fixes = @()

# Check each test result and provide recommendations
Write-Host "🔍 Analysis:" -ForegroundColor Yellow
Write-Host ""

# Check if documents are indexed
try {
    $searchTest = Invoke-RestMethod -Uri "$backendUrl/api/search?q=test&k=1" -Method Get -ErrorAction Stop
    if (-not $searchTest -or $searchTest.Count -eq 0) {
        $issues += "No documents indexed in Qdrant"
        $fixes += "Run: .\upload-documents.ps1 to upload your PDFs"
    }
} catch {
    $issues += "Search endpoint not working"
    $fixes += "Check backend logs in Vercel"
}

if ($issues.Count -gt 0) {
    Write-Host "❌ Issues Found:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "   - $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "🔧 Recommended Fixes:" -ForegroundColor Yellow
    foreach ($fix in $fixes) {
        Write-Host "   - $fix" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ All basic checks passed!" -ForegroundColor Green
    Write-Host "💡 If chat still doesn't work, check:" -ForegroundColor Yellow
    Write-Host "   1. Backend logs in Vercel (Deployments → Functions → Logs)" -ForegroundColor Gray
    Write-Host "   2. Try a simple test query like 'Hello'" -ForegroundColor Gray
    Write-Host "   3. Check browser console for frontend errors" -ForegroundColor Gray
}

Write-Host ""


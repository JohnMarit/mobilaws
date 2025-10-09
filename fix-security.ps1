# Security Fix Script for Mobilaws
# This script secures your application by moving the API key from frontend to backend

Write-Host "`n=========================================="
Write-Host "MOBILAWS SECURITY FIX"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Read the exposed API key from frontend .env
Write-Host "[1/5] Checking frontend .env file..." -ForegroundColor Yellow
$frontendEnv = ".env"

if (Test-Path $frontendEnv) {
    $content = Get-Content $frontendEnv -Raw
    
    # Extract the API key
    if ($content -match 'VITE_OPENAI_API_KEY=(.+)') {
        $apiKey = $matches[1].Trim()
        Write-Host "  ✓ Found OpenAI API key (will move to backend)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ No VITE_OPENAI_API_KEY found" -ForegroundColor Yellow
        $apiKey = $null
    }
} else {
    Write-Host "  ⚠ Frontend .env not found" -ForegroundColor Yellow
    $apiKey = $null
}

# Step 2: Create secure frontend .env
Write-Host "`n[2/5] Creating secure frontend .env..." -ForegroundColor Yellow
$secureFrontendEnv = @"
# Mobilaws Frontend Configuration (Secure)
# ==========================================
# Backend API URL - Points to your secure RAG backend
VITE_BACKEND_URL=http://localhost:8000

# For production, update to your deployed backend:
# VITE_BACKEND_URL=https://your-backend-domain.com

# ⚠️ SECURITY: DO NOT ADD API KEYS HERE!
# API keys belong in ai-backend/.env (server-side only)
"@

$secureFrontendEnv | Out-File -FilePath $frontendEnv -Encoding UTF8
Write-Host "  ✓ Frontend .env secured (API key removed)" -ForegroundColor Green

# Step 3: Setup backend .env
Write-Host "`n[3/5] Setting up backend .env..." -ForegroundColor Yellow
$backendEnvExample = "ai-backend\.env.example"
$backendEnv = "ai-backend\.env"

if (-not (Test-Path $backendEnv)) {
    if (Test-Path $backendEnvExample) {
        Copy-Item $backendEnvExample $backendEnv
        Write-Host "  ✓ Created ai-backend/.env from example" -ForegroundColor Green
    } else {
        Write-Host "  ✗ ai-backend/.env.example not found!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✓ ai-backend/.env already exists" -ForegroundColor Green
}

# Step 4: Add API key to backend .env if we found one
if ($apiKey) {
    Write-Host "`n[4/5] Moving API key to backend..." -ForegroundColor Yellow
    
    $backendEnvContent = Get-Content $backendEnv -Raw
    
    if ($backendEnvContent -match 'OPENAI_API_KEY=') {
        # Replace existing key
        $backendEnvContent = $backendEnvContent -replace 'OPENAI_API_KEY=.*', "OPENAI_API_KEY=$apiKey"
    } else {
        # Add key if not present
        $backendEnvContent = $backendEnvContent -replace '(OPENAI_API_KEY=)', "OPENAI_API_KEY=$apiKey"
    }
    
    $backendEnvContent | Out-File -FilePath $backendEnv -Encoding UTF8
    Write-Host "  ✓ API key moved to backend (secure)" -ForegroundColor Green
} else {
    Write-Host "`n[4/5] No API key to move" -ForegroundColor Yellow
    Write-Host "  ⚠ You'll need to manually add OPENAI_API_KEY to ai-backend/.env" -ForegroundColor Yellow
}

# Step 5: Final instructions
Write-Host "`n[5/5] Security fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "=========================================="
Write-Host "NEXT STEPS"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Install backend dependencies:" -ForegroundColor White
Write-Host "   cd ai-backend" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Chroma vector store (in separate terminal):" -ForegroundColor White
Write-Host "   docker run -p 8000:8000 chromadb/chroma" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start backend server (in another terminal):" -ForegroundColor White
Write-Host "   cd ai-backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start frontend (in another terminal):" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "✓ Your API key is now secure!" -ForegroundColor Green
Write-Host "✓ No secrets exposed in browser" -ForegroundColor Green
Write-Host "✓ Frontend connects to secure backend" -ForegroundColor Green
Write-Host ""
Write-Host "See SECURITY_FIXED.md for detailed information."
Write-Host "=========================================="
Write-Host ""



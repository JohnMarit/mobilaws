#!/usr/bin/env pwsh
# OAuth Configuration Verification Script
# This script helps verify your Firebase and Google OAuth configuration

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  OAuth Configuration Verification" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Read and check environment variables
    $envContent = Get-Content ".env" -Raw
    
    Write-Host ""
    Write-Host "Checking Firebase Configuration..." -ForegroundColor Yellow
    Write-Host ""
    
    $requiredVars = @(
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_AUTH_DOMAIN",
        "VITE_FIREBASE_PROJECT_ID",
        "VITE_GOOGLE_CLIENT_ID"
    )
    
    $allPresent = $true
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=(.+)") {
            $value = $matches[1].Trim()
            if ($value -ne "" -and $value -ne "your_" -and -not $value.StartsWith("your_")) {
                Write-Host "  ✅ $var is set" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $var is not configured properly" -ForegroundColor Red
                $allPresent = $false
            }
        } else {
            Write-Host "  ❌ $var is missing" -ForegroundColor Red
            $allPresent = $false
        }
    }
    
    Write-Host ""
    
    # Extract project ID
    if ($envContent -match "VITE_FIREBASE_PROJECT_ID=(.+)") {
        $projectId = $matches[1].Trim()
        Write-Host "Firebase Project ID: $projectId" -ForegroundColor Cyan
        Write-Host ""
    }
    
    # Extract auth domain
    if ($envContent -match "VITE_FIREBASE_AUTH_DOMAIN=(.+)") {
        $authDomain = $matches[1].Trim()
        Write-Host "Firebase Auth Domain: $authDomain" -ForegroundColor Cyan
        Write-Host ""
    }
    
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create a .env file with your Firebase configuration." -ForegroundColor Yellow
    Write-Host "See: FIREBASE_GOOGLE_SIGNIN_SETUP.md" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Required Configuration Steps" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Firebase Console - Authorized Domains" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "1. Go to: https://console.firebase.google.com/" -ForegroundColor White
Write-Host "2. Select project: mobilaws-46056" -ForegroundColor White
Write-Host "3. Go to: Authentication → Settings → Authorized domains" -ForegroundColor White
Write-Host "4. Make sure these domains are added:" -ForegroundColor White
Write-Host "   ✓ localhost" -ForegroundColor Green
Write-Host "   ✓ mobilaws.com" -ForegroundColor Green
Write-Host "   ✓ www.mobilaws.com" -ForegroundColor Green
Write-Host "   ✓ mobilaws-46056.firebaseapp.com" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 2: Google Cloud Console - OAuth URIs" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "1. Go to: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host "2. Select the same project: mobilaws-46056" -ForegroundColor White
Write-Host "3. Click on your OAuth 2.0 Client ID" -ForegroundColor White
Write-Host "4. Add Authorized JavaScript origins:" -ForegroundColor White
Write-Host "   ✓ https://www.mobilaws.com" -ForegroundColor Green
Write-Host "   ✓ https://mobilaws.com" -ForegroundColor Green
Write-Host "   ✓ https://mobilaws-46056.firebaseapp.com" -ForegroundColor Green
Write-Host "5. Add Authorized redirect URIs:" -ForegroundColor White
Write-Host "   ✓ https://www.mobilaws.com/__/auth/handler" -ForegroundColor Green
Write-Host "   ✓ https://mobilaws.com/__/auth/handler" -ForegroundColor Green
Write-Host "   ✓ https://mobilaws-46056.firebaseapp.com/__/auth/handler" -ForegroundColor Green
Write-Host "6. Click SAVE" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Quick Links" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Firebase Console:" -ForegroundColor Yellow
Write-Host "https://console.firebase.google.com/project/mobilaws-46056/authentication/settings" -ForegroundColor Blue
Write-Host ""
Write-Host "Google Cloud Console:" -ForegroundColor Yellow
Write-Host "https://console.cloud.google.com/apis/credentials?project=mobilaws-46056" -ForegroundColor Blue
Write-Host ""
Write-Host "Your Production Site:" -ForegroundColor Yellow
Write-Host "https://www.mobilaws.com" -ForegroundColor Blue
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Testing" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After configuring both Firebase and Google Cloud Console:" -ForegroundColor White
Write-Host ""
Write-Host "1. Clear browser cache" -ForegroundColor White
Write-Host "2. Open: https://www.mobilaws.com" -ForegroundColor White
Write-Host "3. Open browser console (F12)" -ForegroundColor White
Write-Host "4. Click 'Continue with Google'" -ForegroundColor White
Write-Host "5. Should see: ✅ Firebase Google login successful" -ForegroundColor Green
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Detailed Guides" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Master Guide:     FIX_LOGIN_NOW.md" -ForegroundColor White
Write-Host "Firebase Setup:   FIX_LOGIN_OAUTH_DOMAIN.md" -ForegroundColor White
Write-Host "Google OAuth:     FIX_GOOGLE_OAUTH_REDIRECT_URIS.md" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""


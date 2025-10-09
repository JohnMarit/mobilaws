# Google OAuth Setup Script for Windows PowerShell
# This script helps you set up Google OAuth for the Mobilaws application

Write-Host "🔧 Google OAuth Setup for Mobilaws" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host "📋 Please follow these steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to: https://console.developers.google.com/" -ForegroundColor White
Write-Host "2. Create a new project or select existing project" -ForegroundColor White
Write-Host "3. Enable Google+ API" -ForegroundColor White
Write-Host "4. Create OAuth 2.0 credentials" -ForegroundColor White
Write-Host "5. Add authorized origins:" -ForegroundColor White
Write-Host "   - http://localhost:8081" -ForegroundColor Gray
Write-Host "   - https://yourdomain.com (for production)" -ForegroundColor Gray
Write-Host "6. Copy the Client ID" -ForegroundColor White
Write-Host ""

$clientId = Read-Host "Enter your Google Client ID"

if ([string]::IsNullOrWhiteSpace($clientId)) {
    Write-Host "❌ Client ID cannot be empty" -ForegroundColor Red
    exit
}

# Create .env file
$envContent = @"
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=$clientId

# Backend Configuration (optional)
VITE_BACKEND_URL=http://localhost:8000

# OpenAI Configuration (optional)
VITE_OPENAI_API_KEY=your_openai_api_key_here
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host ""
Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server: npm run dev" -ForegroundColor White
Write-Host "2. Test the authentication by sending 4 messages" -ForegroundColor White
Write-Host "3. The Google sign-in popup should appear" -ForegroundColor White
Write-Host ""
Write-Host "📖 For more details, see: GOOGLE_OAUTH_SETUP.md" -ForegroundColor Blue

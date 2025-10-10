# Firebase Setup Script for Mobilaws
# This script creates the .env file with your Firebase configuration

Write-Host "🔥 Setting up Firebase for Mobilaws..." -ForegroundColor Cyan
Write-Host ""

# Create .env file content
$envContent = @"
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDvGE_on74GR18QQrDyx8OdrKEEneD7DpI
VITE_FIREBASE_AUTH_DOMAIN=mobilaws-46056.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mobilaws-46056
VITE_FIREBASE_STORAGE_BUCKET=mobilaws-46056.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=843281701937
VITE_FIREBASE_APP_ID=1:843281701937:web:9b1227398de4a9384ec910
VITE_FIREBASE_MEASUREMENT_ID=G-SEE513K6TJ

# Google OAuth (Fallback - Optional)
# If you want to use standalone Google OAuth as a fallback, add your Client ID here:
# VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
"@

# Check if .env file already exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Setup cancelled. Your existing .env file was not modified." -ForegroundColor Red
        exit 0
    }
    
    # Backup existing .env
    Copy-Item ".env" ".env.backup"
    Write-Host "✅ Created backup: .env.backup" -ForegroundColor Green
}

# Create .env file
$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✅ Successfully created .env file with Firebase configuration!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "  ✓ Firebase API Key: Configured" -ForegroundColor Green
Write-Host "  ✓ Firebase Auth Domain: mobilaws-46056.firebaseapp.com" -ForegroundColor Green
Write-Host "  ✓ Firebase Project ID: mobilaws-46056" -ForegroundColor Green
Write-Host "  ✓ Firebase Storage: Configured" -ForegroundColor Green
Write-Host "  ✓ Firebase Analytics: Enabled" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm run dev" -ForegroundColor White
Write-Host "  2. Open: http://localhost:8080" -ForegroundColor White
Write-Host "  3. Test Google Sign-in by sending 4 messages" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security Note:" -ForegroundColor Yellow
Write-Host "  The .env file is in .gitignore and will not be committed to Git" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Firebase Authentication is now ready!" -ForegroundColor Green
Write-Host ""


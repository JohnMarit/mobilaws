# Create Tutor Admin Account Script
# Run with: .\create-tutor-admin.ps1

$API_URL = "https://mobilaws-backend.vercel.app/api"

Write-Host ""
Write-Host "Create Tutor Admin Account" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

# Get email
$email = Read-Host "`nEnter your email address (must match Google sign-in)"
if ([string]::IsNullOrWhiteSpace($email)) {
    Write-Host "ERROR: Email is required!" -ForegroundColor Red
    exit 1
}

# Validate email format
if ($email -notmatch '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$') {
    Write-Host "ERROR: Invalid email format!" -ForegroundColor Red
    exit 1
}

# Get name
$name = Read-Host "Enter your name"
if ([string]::IsNullOrWhiteSpace($name)) {
    $name = "Tutor Admin"
    Write-Host "Using default name: $name" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Creating tutor admin account..." -ForegroundColor Yellow
Write-Host "   Email: $email" -ForegroundColor Gray
Write-Host "   Name: $name" -ForegroundColor Gray
Write-Host "   API: $API_URL" -ForegroundColor Gray

# Create JSON body
$body = @{
    email = $email
    name = $name
    specializations = @("General Law")
    bio = "Tutor admin account"
} | ConvertTo-Json

try {
    # Make API call
    $response = Invoke-RestMethod -Uri "$API_URL/tutor-admin/create" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    if ($response.success -and $response.tutor) {
        Write-Host ""
        Write-Host "SUCCESS! Tutor admin account created!" -ForegroundColor Green
        Write-Host "   ID: $($response.tutor.id)" -ForegroundColor Gray
        Write-Host "   Email: $($response.tutor.email)" -ForegroundColor Gray
        Write-Host "   Name: $($response.tutor.name)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Sign out from Mobilaws" -ForegroundColor White
        Write-Host "   2. Sign in again with your Google account" -ForegroundColor White
        Write-Host "   3. Visit: https://www.mobilaws.com/tutor-admin" -ForegroundColor White
    }
    elseif ($response.tutor) {
        Write-Host ""
        Write-Host "INFO: Tutor admin account already exists!" -ForegroundColor Yellow
        Write-Host "   ID: $($response.tutor.id)" -ForegroundColor Gray
        Write-Host "   Email: $($response.tutor.email)" -ForegroundColor Gray
        Write-Host "   Name: $($response.tutor.name)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "You can access the portal now!" -ForegroundColor Green
        Write-Host "   Visit: https://www.mobilaws.com/tutor-admin" -ForegroundColor White
    }
    else {
        Write-Host ""
        Write-Host "ERROR: Failed to create tutor admin account" -ForegroundColor Red
        Write-Host "   Error: $($response.error)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Try creating manually in Firebase Console:" -ForegroundColor Yellow
        Write-Host "   1. Go to Firebase Console -> Firestore Database" -ForegroundColor White
        Write-Host "   2. Create collection: tutorAdmins" -ForegroundColor White
        Write-Host "   3. Add document with:" -ForegroundColor White
        Write-Host "      email: `"$email`"" -ForegroundColor Gray
        Write-Host "      name: `"$name`"" -ForegroundColor Gray
        Write-Host "      active: true" -ForegroundColor Gray
        Write-Host "      createdAt: [current timestamp]" -ForegroundColor Gray
        Write-Host "      updatedAt: [current timestamp]" -ForegroundColor Gray
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "ERROR: Error creating tutor admin account:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Alternative: Create manually in Firebase Console" -ForegroundColor Yellow
    Write-Host "   See instructions above or use the HTML file: create-tutor-admin.html" -ForegroundColor White
    exit 1
}

Write-Host ""

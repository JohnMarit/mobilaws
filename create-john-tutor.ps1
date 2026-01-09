# Create tutor admin for johnmarit42@gmail.com
$body = @{
    email = "johnmarit42@gmail.com"
    name = "John Marit"
    specializations = @("Constitutional Law", "Criminal Law", "International Law")
    bio = "Legal Education Expert"
}

$jsonBody = $body | ConvertTo-Json -Depth 10

Write-Host "Creating tutor admin account..." -ForegroundColor Yellow
Write-Host "Email: johnmarit42@gmail.com" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod `
        -Uri "https://mobilaws-backend.vercel.app/api/tutor-admin/create" `
        -Method POST `
        -ContentType "application/json" `
        -Body $jsonBody `
        -ErrorAction Stop

    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Tutor admin account created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Account Details:" -ForegroundColor Cyan
    Write-Host "  Email: $($response.tutor.email)" -ForegroundColor White
    Write-Host "  Name: $($response.tutor.name)" -ForegroundColor White
    Write-Host "  ID: $($response.tutor.id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Sign out from https://www.mobilaws.com" -ForegroundColor White
    Write-Host "  2. Sign in with johnmarit42@gmail.com" -ForegroundColor White
    Write-Host "  3. Visit: https://www.mobilaws.com/tutor-admin" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "ERROR: Could not create via API" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "You'll need to create it manually in Firebase Console:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.firebase.google.com" -ForegroundColor White
    Write-Host "2. Select Mobilaws project" -ForegroundColor White
    Write-Host "3. Open Firestore Database" -ForegroundColor White
    Write-Host "4. Click 'Start collection'" -ForegroundColor White
    Write-Host "5. Collection ID: tutorAdmins" -ForegroundColor White
    Write-Host "6. Add document with fields from SETUP_JOHN_TUTOR_ADMIN.md" -ForegroundColor White
    exit 1
}



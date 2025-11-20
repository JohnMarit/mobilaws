# PowerShell script to test user sync
$backendUrl = "https://mobilaws-ympe.vercel.app"

Write-Host "🔍 Testing User Sync to Backend" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health check
Write-Host "1️⃣ Testing backend health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$backendUrl/healthz" -Method Get -ErrorAction Stop
    Write-Host "✅ Backend is online:" -ForegroundColor Green
    Write-Host ($healthResponse | ConvertTo-Json) -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend health check failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Sync a test user
Write-Host "2️⃣ Testing user sync endpoint..." -ForegroundColor Yellow
$testUser = @{
    id = "test-user-$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "testuser@example.com"
    name = "Test User"
    picture = "https://via.placeholder.com/150"
} | ConvertTo-Json

Write-Host "📤 Sending test user data..." -ForegroundColor Gray

try {
    $syncResponse = Invoke-RestMethod -Uri "$backendUrl/api/users/sync" -Method Post -Body $testUser -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ User sync successful!" -ForegroundColor Green
    Write-Host ($syncResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
} catch {
    Write-Host "❌ User sync failed:" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more details
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Get admin users
Write-Host "3️⃣ Testing admin users endpoint..." -ForegroundColor Yellow
$adminEmail = "thuchabraham42@gmail.com"
$adminToken = "test-token"

$headers = @{
    "x-admin-email" = $adminEmail
    "x-admin-token" = $adminToken
}

try {
    $usersResponse = Invoke-RestMethod -Uri "$backendUrl/api/admin/users?page=1&limit=20" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "✅ Retrieved users list:" -ForegroundColor Green
    Write-Host "Total users: $($usersResponse.users.Count)" -ForegroundColor Gray
    
    if ($usersResponse.users.Count -gt 0) {
        Write-Host ""
        Write-Host "📋 Users in database:" -ForegroundColor Cyan
        foreach ($user in $usersResponse.users) {
            Write-Host "  • $($user.name) ($($user.email)) - Status: $($user.status)" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "⚠️ No users found in database!" -ForegroundColor Yellow
        Write-Host "💡 Users need to sign up with Google first, then they'll be synced automatically" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to retrieve users:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Testing complete!" -ForegroundColor Green


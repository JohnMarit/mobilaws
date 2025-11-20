# Domain Diagnostic Script
# This checks what's different between the two domains

Write-Host "`n🔍 Diagnosing Domain Configuration`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Test mobilaws.vercel.app
Write-Host "`n📍 Testing: mobilaws.vercel.app" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

try {
    $response1 = curl.exe -s https://mobilaws.vercel.app/
    Write-Host "Status: " -NoNewline
    Write-Host "✅ Reachable" -ForegroundColor Green
    
    # Check for backend status in the response
    if ($response1 -match "Backend") {
        Write-Host "Backend Status: Found in HTML" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to reach mobilaws.vercel.app" -ForegroundColor Red
}

# Get headers from mobilaws.vercel.app
Write-Host "`nHeaders:" -ForegroundColor Cyan
$headers1 = curl.exe -sI https://mobilaws.vercel.app/ | Select-String "x-vercel|server|cache"
$headers1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

# Test www.mobilaws.com
Write-Host "`n`n📍 Testing: www.mobilaws.com" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

try {
    $response2 = curl.exe -s https://www.mobilaws.com/
    Write-Host "Status: " -NoNewline
    Write-Host "✅ Reachable" -ForegroundColor Green
    
    # Check for backend status in the response
    if ($response2 -match "Backend") {
        Write-Host "Backend Status: Found in HTML" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to reach www.mobilaws.com" -ForegroundColor Red
}

# Get headers from www.mobilaws.com
Write-Host "`nHeaders:" -ForegroundColor Cyan
$headers2 = curl.exe -sI https://www.mobilaws.com/ | Select-String "x-vercel|server|cache"
$headers2 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

# Compare deployment IDs
Write-Host "`n`n🔍 Checking Vercel Deployment IDs`n" -ForegroundColor Cyan
Write-Host "-" * 60 -ForegroundColor Gray

$vercelId1 = curl.exe -sI https://mobilaws.vercel.app/ | Select-String "x-vercel-id"
$vercelId2 = curl.exe -sI https://www.mobilaws.com/ | Select-String "x-vercel-id"

Write-Host "mobilaws.vercel.app:" -ForegroundColor Yellow
Write-Host "  $vercelId1" -ForegroundColor Gray

Write-Host "`nwww.mobilaws.com:" -ForegroundColor Yellow
Write-Host "  $vercelId2" -ForegroundColor Gray

if ($vercelId1 -eq $vercelId2) {
    Write-Host "`n✅ SAME deployment ID - domains point to same deployment" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  DIFFERENT deployment IDs - domains point to DIFFERENT deployments!" -ForegroundColor Red
    Write-Host "`nThis is the problem! www.mobilaws.com is pointing to a different/older deployment." -ForegroundColor Yellow
}

# Check DNS
Write-Host "`n`n🌐 DNS Resolution`n" -ForegroundColor Cyan
Write-Host "-" * 60 -ForegroundColor Gray

Write-Host "mobilaws.vercel.app:" -ForegroundColor Yellow
$dns1 = Resolve-DnsName -Name mobilaws.vercel.app -Type CNAME -ErrorAction SilentlyContinue
if ($dns1) {
    $dns1 | ForEach-Object { Write-Host "  $($_.Type): $($_.NameHost)" -ForegroundColor Gray }
} else {
    Write-Host "  No CNAME found (using A record)" -ForegroundColor Gray
}

Write-Host "`nwww.mobilaws.com:" -ForegroundColor Yellow
$dns2 = Resolve-DnsName -Name www.mobilaws.com -Type CNAME -ErrorAction SilentlyContinue
if ($dns2) {
    $dns2 | ForEach-Object { Write-Host "  $($_.Type): $($_.NameHost)" -ForegroundColor Gray }
} else {
    Write-Host "  No CNAME found (using A record)" -ForegroundColor Gray
}

# Summary
Write-Host "`n`n📋 SUMMARY & RECOMMENDATIONS`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

if ($vercelId1 -ne $vercelId2) {
    Write-Host "`n🎯 ACTION REQUIRED:" -ForegroundColor Red
    Write-Host "  www.mobilaws.com is pointing to a different deployment!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✅ FIX:" -ForegroundColor Green
    Write-Host "  1. Go to Vercel Dashboard" -ForegroundColor White
    Write-Host "  2. Find the project that has 'mobilaws.vercel.app' (the working one)" -ForegroundColor White
    Write-Host "  3. Go to Settings → Domains" -ForegroundColor White
    Write-Host "  4. Add domain: www.mobilaws.com" -ForegroundColor White
    Write-Host "  5. Remove www.mobilaws.com from any other projects" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "`n✅ Domains point to same deployment" -ForegroundColor Green
    Write-Host "  Issue might be browser cache. Try:" -ForegroundColor White
    Write-Host "  1. Hard refresh: Ctrl+Shift+R" -ForegroundColor White
    Write-Host "  2. Clear browser cache" -ForegroundColor White
    Write-Host "  3. Try incognito/private mode" -ForegroundColor White
}

Write-Host "`n" -ForegroundColor Gray


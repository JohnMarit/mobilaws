# Set Java 17 for Android build
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Java version set to:" -ForegroundColor Green
java -version

Write-Host "`nBuilding AAB with Java 17..." -ForegroundColor Yellow
./build-aab.ps1

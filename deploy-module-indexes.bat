@echo off
echo ========================================
echo Deploying Firestore Indexes for Modules
echo ========================================
echo.

echo This will deploy the missing index for:
echo - generatedModules collection
echo - tutorId + createdAt fields
echo.

echo Make sure you're logged in to Firebase CLI
echo.

pause

echo.
echo Deploying indexes...
firebase deploy --only firestore:indexes

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo The index may take a few minutes to build.
echo Check status at: https://console.firebase.google.com
echo Navigate to: Firestore Database ^> Indexes
echo.

pause


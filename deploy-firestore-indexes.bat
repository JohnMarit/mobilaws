@echo off
echo ========================================
echo Deploying Firestore Indexes
echo ========================================
echo.
echo This will create the required composite indexes for tutor admin portal.
echo.
echo Prerequisites:
echo - Firebase CLI installed (npm install -g firebase-tools)
echo - Logged in to Firebase (firebase login)
echo - Firebase project initialized (firebase init)
echo.
pause
echo.
echo Deploying indexes...
firebase deploy --only firestore:indexes
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo SUCCESS! Indexes deployment started.
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Wait 5-10 minutes for indexes to build
    echo 2. Check Firebase Console - Firestore - Indexes tab
    echo 3. Wait until all indexes show "Enabled" status
    echo 4. Refresh your tutor admin page
    echo.
    echo The page should now load without crashing!
) else (
    echo ========================================
    echo ERROR! Deployment failed.
    echo ========================================
    echo.
    echo Possible issues:
    echo - Firebase CLI not installed: npm install -g firebase-tools
    echo - Not logged in: firebase login
    echo - Project not initialized: firebase init firestore
    echo - Wrong directory: Make sure you're in the project root
    echo.
)
pause


# Firestore Rules Update Guide

## 📋 How to Update Firebase Firestore Rules

### Method 1: Using Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Update the Rules**
   - Copy the updated rules from `firestore.rules` file
   - Paste them into the Firebase Console editor
   - Click "Publish" button

4. **Verify**
   - Rules should publish within a few seconds
   - You'll see a success message

### Method 2: Using Firebase CLI

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done)
   ```bash
   firebase init firestore
   ```
   - Select your project
   - Use existing `firestore.rules` file

4. **Deploy Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### Method 3: Using VSCode Firebase Extension

1. **Install Extension**
   - Install "Firebase" extension in VSCode
   - Marketplace: `firebase-extension-pack`

2. **Login**
   - Use the extension to login to Firebase
   - Command Palette: `Firebase: Login`

3. **Deploy**
   - Right-click on `firestore.rules` file
   - Select "Deploy Firestore Rules"

## ✅ New Rules Added

The following collections now have security rules:

### 1. **userLessons** - User-Specific Lessons
```javascript
match /userLessons/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow write: if isOwner(userId) && isValidDataSize();
}
```
- Users can read/write only their own lessons
- Admins can read all lessons

### 2. **learningProgress** - Learning Progress Tracking
```javascript
match /learningProgress/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow write: if isOwner(userId) && isValidDataSize();
}
```
- Users can read/write only their own progress
- Admins can read all progress

### 3. **examAttempts** - Exam Attempts
```javascript
match /examAttempts/{attemptId} {
  allow read: if isAuthenticated() && 
                 (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() && 
                   request.resource.data.userId == request.auth.uid &&
                   isValidDataSize();
  allow update, delete: if false;
}
```
- Users can read their own attempts
- Users can create their own attempts
- Attempts are immutable once created

### 4. **certificates** - Certificates
```javascript
match /certificates/{certId} {
  allow read: if isAuthenticated() && 
                 (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() && 
                   request.resource.data.userId == request.auth.uid &&
                   isValidDataSize();
  allow update, delete: if false;
}
```
- Users can read their own certificates
- Users can create their own certificates (when passing exams)
- Certificates are immutable once issued

### 5. **lessonRequests** - Lesson Generation Requests
```javascript
match /lessonRequests/{requestId} {
  allow read: if isAuthenticated() && 
                 (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() && 
                   request.resource.data.userId == request.auth.uid &&
                   isValidDataSize();
  allow update, delete: if false;
}
```
- Users can read their own requests
- Users can create their own requests
- Requests are immutable once created

### 6. **leaderboard** - Leaderboard
```javascript
match /leaderboard/{userId} {
  allow read: if isAuthenticated();
  allow write: if isOwner(userId) && isValidDataSize();
}
```
- All authenticated users can read leaderboard
- Users can update their own entry

### 7. **generatedModules** - Published Modules
```javascript
match /generatedModules/{moduleId} {
  allow read: if isAuthenticated();
  allow write: if false;
}
```
- Authenticated users can read published modules
- Only backend (Admin SDK) can write

### 8. **tutorContent** - Tutor Content
```javascript
match /tutorContent/{contentId} {
  allow read: if isAuthenticated();
  allow write: if false;
}
```
- Authenticated users can read
- Only backend (Admin SDK) can write

### 9. **tutorAdmins** - Tutor Admins
```javascript
match /tutorAdmins/{tutorId} {
  allow read: if isAuthenticated();
  allow write: if false;
}
```
- Authenticated users can read
- Only backend (Admin SDK) can write

## 🔒 Security Features

All rules include:
- ✅ **Authentication Required**: Users must be logged in
- ✅ **Owner Verification**: Users can only access their own data
- ✅ **Admin Access**: Admins can read all data
- ✅ **Data Size Limits**: 1MB max per document
- ✅ **Immutable Records**: Exam attempts, certificates, and requests cannot be modified after creation

## 📝 Testing Rules

### Test in Firebase Console:

1. Go to Firestore Database → Rules tab
2. Click "Rules Playground" (bottom of editor)
3. Test scenarios:
   - User reading their own data ✅
   - User reading another user's data ❌
   - User writing their own data ✅
   - User writing another user's data ❌
   - Admin reading any data ✅

### Common Test Cases:

```javascript
// Test 1: User reads their own lessons
authenticated: true
request.auth.uid: "user123"
resource.data.userId: "user123"
Expected: ✅ ALLOW

// Test 2: User reads another user's lessons
authenticated: true
request.auth.uid: "user123"
resource.data.userId: "user456"
Expected: ❌ DENY

// Test 3: User creates their own certificate
authenticated: true
request.auth.uid: "user123"
request.resource.data.userId: "user123"
Expected: ✅ ALLOW

// Test 4: User tries to modify existing certificate
authenticated: true
request.auth.uid: "user123"
resource.data.userId: "user123"
Expected: ❌ DENY (update not allowed)
```

## ⚠️ Important Notes

1. **Rules Update Time**: Rules typically take effect within 1-2 minutes
2. **Backend Writes**: Collections marked `allow write: if false` can only be written via Firebase Admin SDK (backend)
3. **Testing**: Always test rules in Rules Playground before deploying
4. **Backup**: Keep a backup of your current rules before updating

## 🚨 Troubleshooting

### Issue: "Permission denied" errors

**Solution:**
- Check that user is authenticated
- Verify userId matches request.auth.uid
- Check rules are published (wait 1-2 minutes)
- Clear browser cache and retry

### Issue: Rules not updating

**Solution:**
- Wait 2-3 minutes for propagation
- Check Firebase Console for errors
- Verify syntax is correct (use Rules Playground)
- Try redeploying

### Issue: Backend can't write

**Solution:**
- Backend uses Admin SDK, so client rules don't apply
- If backend has issues, check:
  - Service account credentials
  - Firebase Admin SDK initialization
  - Network connectivity

## ✅ Verification Checklist

After updating rules:

- [ ] Rules deployed successfully (no errors)
- [ ] Rules Playground tests pass
- [ ] Users can read their own data
- [ ] Users cannot read other users' data
- [ ] Users can create their own records
- [ ] Immutable records cannot be updated
- [ ] Admin can read all data
- [ ] Backend can write (via Admin SDK)

---

**Last Updated**: Rules updated for user-specific lessons feature
**File**: `firestore.rules`
**Version**: 2.0


# Leaderboard Troubleshooting Guide

## Problem: Not Seeing Other Users on Leaderboard

### Solution Implemented

The leaderboard now:
1. **Automatically fetches ALL users from Firebase Auth** (up to 1000)
2. **Adds them to Firestore leaderboard collection** with 0 XP
3. **Randomly shuffles users with same XP** (e.g., all users with 0 XP appear randomly)
4. **Returns users sorted by XP** (highest first), with random order for ties

---

## How to Test

### Option 1: Automatic (Happens on Every Leaderboard Request)
1. Open the app
2. Navigate to Learning Hub → Leaderboard tab
3. The leaderboard will auto-populate with all users

### Option 2: Manual Trigger (Force Populate)
Use this to manually populate the leaderboard:

```bash
# Development
curl -X POST http://localhost:8000/api/leaderboard/populate

# Production
curl -X POST https://mobilaws-ympe.vercel.app/api/leaderboard/populate
```

**Response:**
```json
{
  "success": true,
  "message": "Leaderboard populated with 10 users",
  "totalEntries": 10
}
```

---

## Debugging Steps

### 1. Check Backend Logs
When leaderboard is fetched, you should see:
```
🔄 Auto-populating leaderboard with Firebase Auth users...
📊 Found 10 users in Firebase Auth
✅ Leaderboard populated: 8 added, 2 updated
📊 Retrieved 10 entries from leaderboard
✅ Returning 10 sorted entries
```

### 2. Check Frontend Console
When leaderboard loads, you should see:
```
🔄 Loading leaderboard data...
📡 Fetching leaderboard from: https://...
📨 Response status: 200
✅ Leaderboard data received: { entries: [...] }
📊 Retrieved 10 top learners: [...]
```

### 3. Check Firestore Database
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Look for `leaderboard` collection
4. Should see documents with:
   - Document ID = User UID
   - Fields: `userId`, `userName`, `userPicture`, `xp`, `level`, `lessonsCompleted`, `lastUpdated`

### 4. Verify Firebase Auth Users
1. Go to Firebase Console → Authentication
2. Check "Users" tab
3. Ensure you have multiple users registered
4. Note: Users must have signed in at least once

---

## Common Issues & Fixes

### Issue: "No learners yet. Be the first!"

**Possible Causes:**
1. Firebase Admin SDK not initialized
2. No users in Firebase Auth
3. API endpoint not reachable

**Fixes:**
- Check `FIREBASE_SERVICE_ACCOUNT` environment variable is set
- Verify at least one user is logged in
- Check backend is running and accessible

### Issue: Only Seeing Current User

**Possible Causes:**
1. Auto-populate function failed
2. Firebase Admin permissions issue
3. Firestore collection is empty

**Fixes:**
- Check backend logs for errors during population
- Manually trigger population: `POST /api/leaderboard/populate`
- Verify Firebase service account has read/write permissions

### Issue: Leaderboard Shows Incorrect Sorting

**Possible Causes:**
1. XP values not updating
2. Client-side sorting issue

**Fixes:**
- Check learning progress is saving to Firebase
- Verify `/api/learning/progress` endpoint is working
- Force refresh the leaderboard

---

## API Endpoints

### Get Leaderboard
```
GET /api/leaderboard
```
**Response:**
```json
{
  "entries": [
    {
      "userId": "abc123",
      "userName": "John Doe",
      "userPicture": "https://...",
      "xp": 240,
      "level": 3,
      "lessonsCompleted": 5,
      "lastUpdated": "2025-01-15T10:30:00Z"
    },
    {
      "userId": "def456",
      "userName": "Jane Smith",
      "xp": 0,
      "level": 1,
      "lessonsCompleted": 0,
      "lastUpdated": "2025-01-15T09:00:00Z"
    }
  ]
}
```

### Initialize User in Leaderboard
```
POST /api/leaderboard/init
Content-Type: application/json

{
  "userId": "abc123",
  "userName": "John Doe",
  "userPicture": "https://..."
}
```

### Update User Progress
```
POST /api/leaderboard/update
Content-Type: application/json

{
  "userId": "abc123",
  "userName": "John Doe",
  "xp": 240,
  "level": 3,
  "lessonsCompleted": 5,
  "userPicture": "https://..."
}
```

### Manually Populate Leaderboard
```
POST /api/leaderboard/populate
```

---

## Expected Behavior

### When Users Have Same XP (e.g., 0 XP)
- Users are **randomly shuffled** each time
- No user is prioritized over another
- Order changes on each refresh

### When Users Have Different XP
- **Highest XP users appear first**
- Users with same XP are randomly ordered within that tier
- Example order:
  1. User A (500 XP)
  2. User B (500 XP) ← Random order
  3. User C (500 XP) ← Random order
  4. User D (120 XP)
  5. User E (0 XP) ← Random order
  6. User F (0 XP) ← Random order

### Top 10 Display
- Shows the first 10 users from sorted list
- If fewer than 10 users exist, shows all
- User's own entry is highlighted if in top 10
- If not in top 10, shows progress needed

---

## Quick Checklist

- [ ] Backend is running
- [ ] Firebase Admin SDK initialized (`FIREBASE_SERVICE_ACCOUNT` set)
- [ ] At least 2+ users registered in Firebase Auth
- [ ] Users have logged in at least once
- [ ] Firestore `leaderboard` collection exists
- [ ] API endpoint `/api/leaderboard` is accessible
- [ ] Frontend can fetch from API (check CORS)
- [ ] Console shows successful data retrieval

---

## Manual Reset (If Needed)

To clear and rebuild the leaderboard:

1. **Delete Firestore Collection:**
   - Go to Firebase Console → Firestore
   - Delete `leaderboard` collection

2. **Trigger Re-Population:**
   ```bash
   curl -X POST https://your-api.com/api/leaderboard/populate
   ```

3. **Refresh Frontend:**
   - Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
   - Or close and reopen the app


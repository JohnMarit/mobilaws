# 🔧 Fix: Users Can't See Published Modules

## Problem

Users cannot see published courses in their Learning Hub even after the tutor admin clicks "Publish".

## Root Cause

**Missing Firestore Composite Index**

The query that fetches published modules requires a composite index:
```
Collection: generatedModules
Fields: published (ASC) + accessLevels (ARRAY_CONTAINS) + createdAt (DESC)
```

Without this index, Firestore cannot execute the query and returns an empty array.

## Solution

### Step 1: Update Firestore Indexes

The `firestore.indexes.json` file has been updated with the required index.

### Step 2: Deploy the Index

Run the deployment script:

**Windows:**
```bash
deploy-firestore-indexes.bat
```

**Mac/Linux:**
```bash
firebase deploy --only firestore:indexes
```

### Step 3: Wait for Index Creation

After deploying, Firestore will build the index. This can take:
- **Small database:** 1-5 minutes
- **Large database:** 10-30 minutes

Check index status:
1. Go to Firebase Console
2. Navigate to: **Firestore Database** → **Indexes**
3. Wait until status changes from "Building" to "Enabled"

### Step 4: Test

1. Open `debug-published-modules.html` in your browser
2. Click "Check Published Modules Only"
3. Should see your published modules for each tier

## Quick Test

Open the debug tool to verify:

```bash
# Open in browser
debug-published-modules.html
```

This will show:
- ✅ All modules (published and unpublished)
- ✅ What users see per tier
- ✅ Module details (ID, access levels, lessons, etc.)

## Expected Results

After deploying the index:

### For Tutor Admin:
- Click "Publish" → Shows "Published" badge
- Module marked as `published: true` in Firestore

### For Users:
- Published modules appear in Learning Hub
- Modules filtered by user's tier (free/basic/standard/premium)
- Only modules with matching access levels are shown

## Troubleshooting

### Issue: Still no modules after deploying index

**Check 1: Index Status**
- Go to Firebase Console → Firestore → Indexes
- Verify index status is "Enabled" (not "Building")

**Check 2: Module is Actually Published**
- Open `debug-published-modules.html`
- Click "Check All Modules"
- Verify your module shows `PUBLISHED` badge
- If not, click "Publish" again in tutor admin portal

**Check 3: Access Levels Match**
- Module must have the user's tier in `accessLevels` array
- Example: If user is "free", module must have "free" in accessLevels

**Check 4: Backend is Running**
- Visit: `https://mobilaws-ympe.vercel.app/api/health`
- Should return: `{"status":"ok"}`

### Issue: Index deployment fails

**Solution:**
```bash
# Login to Firebase
firebase login

# Select correct project
firebase use your-project-id

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Issue: "Index already exists" error

This is fine! It means the index is already deployed. Just wait for it to finish building.

## Index Configuration

The required index in `firestore.indexes.json`:

```json
{
  "collectionGroup": "generatedModules",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "published",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "accessLevels",
      "arrayConfig": "CONTAINS"
    },
    {
      "fieldPath": "createdAt",
      "order": "DESCENDING"
    }
  ]
}
```

This allows the query:
```javascript
db.collection('generatedModules')
  .where('published', '==', true)
  .where('accessLevels', 'array-contains', 'free')
  .orderBy('createdAt', 'desc')
```

## Summary

1. ✅ Updated `firestore.indexes.json` with required index
2. ⚠️ **YOU NEED TO:** Deploy the index using `deploy-firestore-indexes.bat`
3. ⚠️ **YOU NEED TO:** Wait for index to build (check Firebase Console)
4. ✅ Use `debug-published-modules.html` to verify modules are visible
5. ✅ Users will see published modules after index is ready

After deploying the index, published modules will appear in the Learning Hub!


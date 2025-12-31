# Module Cleanup Guide - Remove Non-Tutor Admin Courses

## Overview

This guide explains how to remove all courses/modules that were **NOT** created by tutor admins from your Firestore database.

## What Gets Deleted

The cleanup function will delete modules where:
- ❌ The `tutorId` field is missing
- ❌ The `tutorId` field is empty/null
- ❌ The `tutorId` doesn't match any active tutor admin ID

## What Gets Kept

Modules will be kept if:
- ✅ They have a valid `tutorId` field
- ✅ The `tutorId` matches an active tutor admin ID in the `tutorAdmins` collection

## How to Run the Cleanup

### Option 1: Using the HTML Page (Recommended)

1. **Open `cleanup-modules.html` in your browser**
2. **Read the warning carefully**
3. **Check the confirmation checkbox**
4. **Click "Delete Non-Tutor Modules"**
5. **Confirm the final dialog**
6. **Wait for completion** (may take a few seconds)
7. **Review the results**

### Option 2: Using API Directly

**Endpoint:**
```
POST https://mobilaws-backend.vercel.app/api/tutor-admin/cleanup-modules
```

**Request:**
```bash
curl -X POST https://mobilaws-backend.vercel.app/api/tutor-admin/cleanup-modules \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Cleanup complete. Deleted X module(s).",
  "result": {
    "deleted": 5,
    "total": 10,
    "kept": 5,
    "tutorAdminIds": ["id1", "id2"],
    "errors": []
  }
}
```

## Before Running Cleanup

### Step 1: Verify Tutor Admins

1. Go to Firebase Console → Firestore
2. Open the `tutorAdmins` collection
3. Verify all active tutor admin accounts
4. Make sure you have the correct tutor admin IDs

### Step 2: Review Modules

1. Go to Firebase Console → Firestore
2. Open the `generatedModules` collection
3. Review modules and their `tutorId` fields
4. Identify which modules should be kept vs deleted

### Step 3: Backup (Optional but Recommended)

If you want to backup before deleting:

1. Export Firestore data:
   ```bash
   gcloud firestore export gs://YOUR-BUCKET/backup-$(date +%Y%m%d)
   ```

2. Or use Firebase Console:
   - Go to Firestore → Settings → Export

## After Running Cleanup

### Verify Results

1. Check the cleanup results summary
2. Go to Firebase Console → Firestore → `generatedModules`
3. Verify only tutor admin modules remain
4. Check that `tutorId` fields match tutor admin IDs

### Check for Errors

If any errors occurred:
- Review the error messages in the cleanup results
- Check backend logs in Vercel dashboard
- Verify Firestore permissions
- Check network connectivity

## Technical Details

### Database Collections Involved

1. **tutorAdmins** (read-only)
   - Used to get list of valid tutor admin IDs
   - Only active tutors (`active: true`) are considered

2. **generatedModules** (read + delete)
   - All modules are scanned
   - Invalid modules are deleted

### Cleanup Logic

```typescript
// Pseudocode
tutorAdminIds = getAllActiveTutorAdminIds()
allModules = getAllModules()

modulesToDelete = allModules.filter(module => {
  return !module.tutorId || 
         !tutorAdminIds.includes(module.tutorId)
})

deleteModules(modulesToDelete)
```

### Batch Processing

- Modules are deleted in batches of 500 (Firestore limit)
- Progress is logged for each batch
- Errors in one batch don't stop the cleanup

## Safety Features

1. ✅ **Confirmation Required** - Must check checkbox and confirm dialog
2. ✅ **Dry Run Capability** - Check results before confirming
3. ✅ **Detailed Logging** - See exactly what will be deleted
4. ✅ **Error Handling** - Errors don't crash the cleanup
5. ✅ **Batch Processing** - Handles large datasets safely

## Troubleshooting

### Error: "Firestore not initialized"

**Cause:** Backend Firebase Admin SDK not properly configured

**Solution:**
1. Check backend environment variables
2. Verify `FIREBASE_SERVICE_ACCOUNT_KEY` is set
3. Redeploy backend if needed

### Error: "Permission denied"

**Cause:** Firestore security rules blocking deletion

**Solution:**
1. Check Firestore security rules
2. Ensure backend has admin permissions
3. Verify service account has proper roles

### No Modules Deleted

**Possible causes:**
1. All modules have valid tutorId values
2. All modules match tutor admin IDs
3. No modules exist in the collection

**Check:**
- Review cleanup results summary
- Check Firebase Console for modules
- Verify tutor admin IDs

### Some Modules Not Deleted

**Possible causes:**
1. Modules have valid tutorId matching a tutor admin
2. Cleanup only deletes invalid modules
3. This is expected behavior - valid modules should remain

## Example Cleanup Output

```
═══════════════════════════════════════════════
🧹 CLEANUP: Deleting modules not created by tutor admins
═══════════════════════════════════════════════
📋 Found 2 tutor admin(s):
   • John Doe (john@example.com) - ID: abc123
   • Jane Smith (jane@example.com) - ID: xyz789

📦 Found 10 total module(s)

🗑️  Modules to delete: 5

📋 Modules that will be deleted:
   1. "Old Course 1" (ID: mod1, tutorId: MISSING)
   2. "Old Course 2" (ID: mod2, tutorId: invalid-id)
   3. "Test Module" (ID: mod3, tutorId: )
   4. "Legacy Course" (ID: mod4, tutorId: old-tutor-id)
   5. "Demo Module" (ID: mod5, tutorId: MISSING)

✅ Deleted batch 1: 5 module(s)

═══════════════════════════════════════════════
✅ CLEANUP COMPLETE
   Total modules: 10
   Deleted: 5
   Kept: 5
   Errors: 0
═══════════════════════════════════════════════
```

## Files Created/Modified

### Backend Files

- ✅ `ai-backend/src/lib/ai-content-generator.ts`
  - Added `deleteNonTutorModules()` function

- ✅ `ai-backend/src/routes/tutor-admin.ts`
  - Added `POST /api/tutor-admin/cleanup-modules` endpoint
  - Exported `deleteNonTutorModules` from imports

### Frontend/Utility Files

- ✅ `cleanup-modules.html`
  - User-friendly cleanup interface
  - Safety confirmations
  - Detailed results display

- ✅ `MODULE_CLEANUP_GUIDE.md`
  - This guide

## Deployment

After making changes, deploy the backend:

```bash
cd ai-backend
git add .
git commit -m "Add cleanup function to delete non-tutor admin modules"
git push
```

Wait for Vercel deployment (1-2 minutes), then use `cleanup-modules.html` to run the cleanup.

## Summary

**Purpose:** Remove courses/modules not created by tutor admins  
**Safety:** Multiple confirmations required  
**Reversible:** No (deletions are permanent)  
**Backend Required:** Yes (must deploy first)  
**Time:** Usually completes in seconds  

**Quick Start:**
1. Deploy backend changes
2. Open `cleanup-modules.html`
3. Confirm and run cleanup
4. Review results ✅


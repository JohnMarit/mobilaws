# Document Migration & Progress Inference Guide

## Overview

This guide explains how to migrate old documents (uploaded before the sequential learning system) and infer user progress based on their completed lessons.

## 🎯 What This Solves

### Problem
- Old documents (uploaded before the sequential system) don't have page-by-page data
- Users who completed lessons in old modules don't have progress tracking
- Progress percentage shows 0% even though users have completed lessons

### Solution
- **Automatic Migration**: When users request lessons from old modules, the system automatically:
  1. Extracts pages from the source document
  2. Infers their progress based on completed lessons
  3. Initializes their progress tracker
  4. Shows accurate progress percentage

## 🔄 How It Works

### Automatic Migration Flow

```
User requests lessons from old module
        ↓
System checks for document pages
        ↓
Pages not found? → Migrate document
        ↓
Extract pages from source file
        ↓
Save to documentPages collection
        ↓
Infer user's progress from completed lessons
        ↓
Initialize userPageProgress
        ↓
Continue with lesson generation
        ↓
Show accurate progress %
```

### Progress Inference Logic

```typescript
// Calculate completion ratio
completionRatio = completedLessons / totalAvailableLessons

// Estimate page position
estimatedPage = floor(completionRatio * totalPages)

// Example:
// User completed 10 out of 20 lessons (50%)
// Document has 50 pages
// Estimated position: page 25 (50% of 50)
```

## 📡 API Endpoints

### 1. Migrate Single Module

**Endpoint:** `POST /api/migration/module/:moduleId`

**Purpose:** Extract and save pages for a specific module

**Example:**
```bash
curl -X POST https://your-backend.com/api/migration/module/module-123
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully migrated: 50 pages extracted",
  "totalPages": 50
}
```

### 2. Batch Migrate All Old Modules

**Endpoint:** `POST /api/migration/batch`

**Purpose:** Migrate multiple old modules at once

**Body:**
```json
{
  "limit": 50
}
```

**Example:**
```bash
curl -X POST https://your-backend.com/api/migration/batch \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 50,
    "successful": 45,
    "failed": 2,
    "skipped": 3
  },
  "details": [
    {
      "moduleId": "module-123",
      "status": "success",
      "message": "Successfully migrated: 50 pages extracted"
    },
    // ... more results
  ]
}
```

### 3. Infer User Progress

**Endpoint:** `POST /api/migration/infer-progress`

**Purpose:** Calculate estimated progress based on completed lessons

**Body:**
```json
{
  "userId": "user-123",
  "moduleId": "module-456"
}
```

**Response:**
```json
{
  "success": true,
  "estimatedPage": 25,
  "totalPages": 50,
  "progressPercentage": 50,
  "message": "Estimated progress: page 25 of 50 (50%)"
}
```

### 4. Initialize User Progress

**Endpoint:** `POST /api/migration/initialize-progress`

**Purpose:** Set up progress tracker for a user based on completed lessons

**Body:**
```json
{
  "userId": "user-123",
  "moduleId": "module-456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User progress initialized successfully",
  "progressPercentage": 50
}
```

### 5. Get User's Comprehensive Progress

**Endpoint:** `GET /api/migration/user-progress/:userId`

**Purpose:** Get progress across all modules for a user

**Example:**
```bash
curl https://your-backend.com/api/migration/user-progress/user-123
```

**Response:**
```json
{
  "success": true,
  "userId": "user-123",
  "totalModules": 5,
  "modules": [
    {
      "moduleId": "module-1",
      "moduleName": "Constitutional Law",
      "totalPages": 50,
      "currentPage": 25,
      "progressPercentage": 50,
      "completedLessons": 10,
      "totalLessons": 20
    },
    // ... more modules
  ]
}
```

### 6. Refresh All User Progress

**Endpoint:** `POST /api/migration/refresh-user-progress`

**Purpose:** Recalculate and update progress for all user's modules

**Body:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refreshed progress for 5 modules",
  "modules": [
    {
      "moduleId": "module-1",
      "moduleName": "Constitutional Law",
      "success": true,
      "progressPercentage": 50
    },
    // ... more modules
  ]
}
```

## 🚀 Deployment Steps

### 1. Deploy Code

```bash
# Deploy backend with migration code
cd ai-backend
vercel --prod
```

### 2. Migrate Old Modules (Optional - Batch)

If you want to migrate all modules at once instead of waiting for automatic migration:

```bash
# Migrate up to 50 modules
curl -X POST https://your-backend.com/api/migration/batch \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'
```

**OR** use the frontend admin panel (if available):
- Navigate to Admin Dashboard
- Click "Migrate Old Documents"
- Select number of modules to migrate
- Click "Start Migration"

### 3. Verify Migration

Check Firestore Console:
- Collection: `documentPages`
- Should see entries for migrated modules
- Each entry has `pages` array with content

### 4. Test User Progress

1. Log in as a user with completed lessons
2. Navigate to a module
3. Request new lessons
4. Check that progress % is displayed correctly

## 🔍 Automatic vs Manual Migration

### Automatic Migration (Recommended)

**How it works:**
- System detects missing pages when user requests lessons
- Automatically migrates the module
- Infers and initializes user progress
- Happens transparently in the background

**Advantages:**
- ✅ No admin intervention needed
- ✅ Only migrates modules that users actually use
- ✅ Reduces server load
- ✅ User-friendly

**When to use:**
- Default behavior - always enabled
- Best for most cases

### Manual/Batch Migration

**How it works:**
- Admin triggers migration via API endpoint
- All modules migrated at once
- Can specify limit (e.g., 50 modules)

**Advantages:**
- ✅ All modules ready upfront
- ✅ Predictable timeline
- ✅ Can schedule during off-peak hours

**When to use:**
- Large number of old modules
- Want to migrate before user access
- Maintenance window available

## 📊 Monitoring Migration

### Check Migration Status

**Query Firestore:**
```javascript
// Get all modules
db.collection('generatedModules')
  .where('published', '==', true)
  .get()

// Check which have pages
db.collection('documentPages')
  .get()
  
// Compare counts to see how many need migration
```

### Monitor Backend Logs

Look for these log messages:
- `📦 No pages found - attempting to migrate old module...`
- `✅ Migrated module {id}: {N} pages extracted`
- `📊 Inferred progress for user {id}, module {id}`
- `✅ Initialized progress for user {id}, module {id}`

### Track Failed Migrations

Failed migrations usually mean:
- Source file no longer exists
- File path is invalid
- File is corrupted

**Check logs for:**
- `❌ Error migrating module {id}:`
- `Source file not found or no longer exists`

## 🐛 Troubleshooting

### Issue: "Source file not found"

**Cause:** Original uploaded file was deleted or moved

**Solution:**
1. File cannot be recovered - use RAG fallback
2. Module will continue to work, just without sequential pages
3. Users won't see progress %, but can still learn

**Prevention:**
- Don't delete source files from server
- Keep backups of uploaded documents

### Issue: "No pages could be extracted"

**Cause:** Document format not supported or corrupted

**Solution:**
1. Check file format (should be PDF, DOCX, or TXT)
2. Try re-uploading the document
3. If corrupt, ask tutor to upload a new copy

### Issue: Progress showing 0% after migration

**Cause:** User hasn't completed any lessons yet

**Solution:**
- This is correct behavior
- Progress will update as user completes lessons

### Issue: Progress seems incorrect

**Cause:** Estimation algorithm

**Solution:**
- Progress is estimated based on lesson completion ratio
- Not 100% accurate for old modules
- Becomes accurate as user continues with sequential lessons

## 📈 Progress Calculation Details

### For New Modules (Post-Sequential System)

```typescript
// Exact tracking
currentPage = userPageProgress.lastPageCovered
progressPercentage = (currentPage / totalPages) * 100
```

### For Old Modules (Pre-Sequential System)

```typescript
// Estimated based on completed lessons
completionRatio = completedLessons / totalAvailableLessons
estimatedPage = floor(completionRatio * totalPages)
progressPercentage = (estimatedPage / totalPages) * 100
```

### After First Sequential Request

```typescript
// Switches to exact tracking
// Uses actual page position from sequential generation
progressPercentage = (lastPageCovered / totalPages) * 100
```

## 🎓 Example Scenarios

### Scenario 1: User with Completed Lessons

**Before Migration:**
- User: "I completed 15 lessons"
- System: "Progress: 0%" (no tracking)

**After Migration:**
- User: Requests more lessons
- System: Detects old module → Migrates → Infers progress
- User: "Progress: 50%" (based on 15/30 lessons completed)

### Scenario 2: User Starting Fresh

**Old Module:**
- User: First time accessing module
- System: Migrates → Initializes at page 0
- User: "Progress: 0%" (starting from beginning)

### Scenario 3: Batch Migration

**Admin Action:**
- Admin: Triggers batch migration for 50 modules
- System: Migrates all 50 modules, extracts pages
- Result: All users see accurate progress when they log in

## ✅ Verification Checklist

After deployment and migration:

- [ ] Backend deployed with migration code
- [ ] Can access migration API endpoints
- [ ] Automatic migration works (test with old module)
- [ ] Progress inference calculates correctly
- [ ] User progress initializes properly
- [ ] Progress % displays in UI
- [ ] RAG fallback works if file missing
- [ ] No errors in logs

## 🔐 Security Considerations

### API Access

Migration endpoints should be:
- [ ] Protected (admin only for batch operations)
- [ ] Rate limited (prevent abuse)
- [ ] Logged (audit trail)

### Data Privacy

User progress data:
- [ ] Only accessible by the user and admins
- [ ] Follows Firestore security rules
- [ ] Not exposed publicly

## 🚀 Future Enhancements

### Phase 1 (Current) ✅
- [x] Automatic migration on lesson request
- [x] Progress inference from completed lessons
- [x] Batch migration API
- [x] Comprehensive progress tracking

### Phase 2 (Planned)
- [ ] UI for admin to trigger migrations
- [ ] Progress recalculation button for users
- [ ] Migration status dashboard
- [ ] Bulk user progress refresh

### Phase 3 (Future)
- [ ] Improved progress estimation algorithm
- [ ] Machine learning-based inference
- [ ] Historical progress analytics
- [ ] Migration scheduling

## 📞 Support

For issues with migration:

1. Check backend logs for errors
2. Verify source files still exist
3. Test with manual migration API
4. Check Firestore for page data
5. Contact system administrator if needed

## 📝 Summary

**What We Built:**
- Automatic migration system for old documents
- Progress inference from completed lessons
- Batch migration capabilities
- Comprehensive progress tracking across all modules

**Benefits:**
- ✅ All modules now show progress
- ✅ Automatic - no user action needed
- ✅ Accurate estimation for old modules
- ✅ Seamless transition to sequential system

**Status:**
✅ **READY FOR DEPLOYMENT**

---

*Document Migration System v1.0.0*  
*Last Updated: January 12, 2026*

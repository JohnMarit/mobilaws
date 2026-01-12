# Image Upload Troubleshooting Guide

## Problem
Tutor admin uploads course images successfully, but users don't see them in the Learning Hub.

## Latest Fixes Applied

### 1. **Fixed Missing `imageUrl` in Frontend Interface** ✅
- Added `imageUrl?: string` to `GeneratedModule` interface in `LearningContext.tsx`
- This was causing the field to be dropped when data was received from backend

### 2. **Added Loading State** ✅
- Exposed `modulesLoading` from `LearningContext`
- Shows "Loading courses..." spinner instead of "No courses available" while loading

### 3. **Enhanced Event System** ✅
- Fixed event dispatching after image upload/delete
- Added proper event listener in `LearningContext`
- Added toast notifications when modules update

### 4. **Added Refresh Button** ✅
- Users can manually refresh courses to see latest images
- Button shows spinner while loading
- Located next to search input in My Learning tab

### 5. **Comprehensive Logging** ✅
- Backend logs image upload/delete operations
- Backend verifies Firestore updates
- Frontend logs when images are detected
- Event dispatch and receipt are logged

## How to Debug

### Step 1: Upload Image (Tutor Admin)
1. Go to Tutor Admin Portal
2. Click "Manage Image" on a course
3. Upload an image
4. Check browser console for:
   ```
   ✅ Image upload successful, dispatching event...
   📢 Dispatching modules-updated event
   ```

### Step 2: Check Backend Logs
Look for these messages in your backend console:
```
📤 Updating module {moduleId} with image (size: X chars)
✅ Image successfully saved to module {moduleId}
✅ Updated module image: {moduleId} (has imageUrl: true)
🔍 Verification - Module {moduleId} imageUrl exists: true
```

### Step 3: Check User View (Learning Hub)
1. Open Learning Hub (or refresh if already open)
2. Click the refresh button (🔄 icon) next to search
3. Check browser console for:
   ```
   📢 Modules updated event received, reloading modules...
   🖼️ Modules with images: [{id, title, hasImage: true}]
   📸 Module "Course Title" has imageUrl: data:image/...
   ```

### Step 4: Verify Data Flow

#### Backend → Frontend
```
1. Firestore has imageUrl? → Check in Firebase Console
2. Backend returns imageUrl? → Check backend logs "HasImage: true"
3. Frontend receives imageUrl? → Check "🖼️ Modules with images"
4. Frontend displays imageUrl? → Check "📸 Module has imageUrl"
```

## Common Issues & Solutions

### Issue 1: "Image uploaded" but not in Firestore
**Symptoms**: Backend says success, but Firestore doesn't have `imageUrl` field

**Solution**:
- Check backend logs for "🔍 Verification - Module X imageUrl exists: false"
- Check for Firestore permission errors
- Verify `moduleId` is correct

**Code to check**:
```typescript
// In ai-backend/src/lib/ai-content-generator.ts
await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).update(updateData);
```

### Issue 2: Image in Firestore but not reaching frontend
**Symptoms**: Firestore has `imageUrl`, but frontend logs show "🖼️ Modules with images: []"

**Solution**:
- Check frontend `GeneratedModule` interface has `imageUrl?: string`
- Check backend query returns the field (not filtered out)
- Verify `...data` spread operator includes imageUrl

**Code to check**:
```typescript
// In src/contexts/LearningContext.tsx
interface GeneratedModule {
  // ... other fields
  imageUrl?: string; // ← Must be here!
}
```

### Issue 3: Frontend receives imageUrl but doesn't display
**Symptoms**: Console shows "📸 Module has imageUrl" but image not visible

**Solution**:
- Check if `module.imageUrl` condition in JSX
- Verify image data URL is valid base64
- Check browser console for image load errors
- Inspect element to see if `<img>` tag is rendered

**Code to check**:
```tsx
// In src/components/LearningHub.tsx
{module.imageUrl ? (
  <div className="w-24 h-24 ...">
    <img src={module.imageUrl} alt={module.title} />
  </div>
) : (
  // Icon fallback
)}
```

### Issue 4: Events not triggering reload
**Symptoms**: Upload succeeds but Learning Hub doesn't update

**Solution**:
1. Check "📢 Dispatching modules-updated event" appears
2. Check "📢 Modules updated event received" appears
3. Manually click refresh button (🔄) in Learning Hub
4. Hard refresh browser (Ctrl+Shift+R)

**Code to check**:
```typescript
// In src/pages/TutorAdminPortal.tsx
window.dispatchEvent(new Event('modules-updated'));

// In src/contexts/LearningContext.tsx
window.addEventListener('modules-updated', handleModulesUpdated);
```

## Manual Testing Checklist

- [ ] **Upload Test**
  - [ ] Upload image as tutor admin
  - [ ] See success toast
  - [ ] Check backend logs
  - [ ] Check Firestore console (imageUrl field exists)

- [ ] **Display Test**
  - [ ] Open Learning Hub as user
  - [ ] See loading spinner
  - [ ] See course with image
  - [ ] Click refresh button
  - [ ] Image persists after refresh

- [ ] **Update Test**
  - [ ] Upload different image for same course
  - [ ] Old image replaced with new one
  - [ ] Users see updated image

- [ ] **Delete Test**
  - [ ] Delete course image
  - [ ] Icon shows instead of image
  - [ ] Users see icon (not broken image)

## Emergency Workarounds

### If images still don't show:

1. **Force reload for users**:
   - Users can click the refresh button (🔄)
   - Or hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

2. **Check Firestore directly**:
   ```bash
   # Firebase Console → Firestore Database
   # Navigate to: generatedModules/{moduleId}
   # Verify 'imageUrl' field exists and has base64 data
   ```

3. **Test with one specific course**:
   - Note the `moduleId` from backend logs
   - Search for that course in Learning Hub
   - Check if that specific course shows image

4. **Clear browser cache**:
   - Sometimes cached data prevents updates
   - Clear localStorage for the site
   - Reload page

## Performance Considerations

Base64 encoding increases document size:
- Small image (50KB) → ~67KB base64
- Medium image (200KB) → ~267KB base64
- Large image (1MB) → ~1.3MB base64

**Recommendations**:
- Compress images before upload (client-side)
- Limit image size to 200KB max
- Consider migrating to Firebase Storage URLs for production
- Use image optimization libraries (sharp, imagemin)

## Next Steps for Production

1. **Implement image compression**:
   ```typescript
   // In TutorAdminPortal.tsx handleImageSelect
   const compressImage = async (file: File) => {
     // Use canvas or library to compress
   }
   ```

2. **Migrate to Firebase Storage**:
   - Upload to Storage bucket
   - Store download URL in Firestore
   - Benefits: Better performance, CDN, smaller documents

3. **Add image validation**:
   - File type check (JPEG, PNG only)
   - Size limit (200KB max)
   - Dimension limit (max 1000x1000)

4. **Implement image caching**:
   - Service worker caching
   - Browser cache headers
   - Lazy loading for images

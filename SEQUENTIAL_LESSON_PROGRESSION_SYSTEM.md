# Sequential Lesson Progression System

## Overview

The Sequential Lesson Progression System ensures that users learn **everything** from uploaded documents systematically, from page 1 to the last page, without repetition or skipping content.

## Problem Solved

**Before:** Users complained that:
- Lessons were repeating the same content
- They weren't seeing new information
- The AI was generating random lessons from the document without order

**After:** 
- Users progress sequentially through documents from page 1 to the last page
- Each lesson request generates content from the next set of pages
- No repetition - users only see each page's content once
- Complete coverage - all document content is eventually covered

## How It Works

### 1. Document Upload & Processing

When a tutor admin uploads a document:

1. **Document is extracted page-by-page**
   - PDFs: Extracted with page numbers preserved
   - DOCX: Split by page breaks or ~2000 characters per page
   - TXT: Split by form feeds or ~2000 characters per page

2. **Pages are saved to Firestore**
   - Collection: `documentPages`
   - Structure:
     ```javascript
     {
       moduleId: "module-123",
       contentId: "content-456",
       tutorId: "tutor-789",
       title: "Constitutional Law Module",
       totalPages: 50,
       pages: [
         { pageNumber: 1, content: "...", totalPages: 50 },
         { pageNumber: 2, content: "...", totalPages: 50 },
         // ... all pages
       ],
       createdAt: Timestamp,
       updatedAt: Timestamp
     }
     ```

3. **Original module is created** with initial lessons from the beginning of the document

### 2. User Progress Tracking

Each user has their own progress tracker for each module:

- Collection: `userPageProgress`
- Document ID: `{userId}_{moduleId}`
- Structure:
  ```javascript
  {
    userId: "user-123",
    moduleId: "module-456",
    contentId: "content-789",
    lastPageCovered: 10,        // Last page used for lesson generation
    totalPagesInDocument: 50,   // Total pages in document
    lessonsGenerated: 2,        // Number of lesson sets requested
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
  ```

### 3. Sequential Lesson Generation

When a user requests more lessons:

1. **System fetches user's current progress**
   - Determines which page they left off at (e.g., page 10)

2. **Next sequential pages are retrieved**
   - If they request 5 lessons, get pages 11-15
   - If near the end, get remaining pages
   - If at the end, loop back to review material

3. **AI generates lessons from ONLY those pages**
   - Prompt explicitly states: "Create lessons from pages X-Y"
   - AI is instructed to cover material sequentially
   - No content from other pages is used

4. **Progress is updated**
   - `lastPageCovered` updated to 15
   - `lessonsGenerated` incremented
   - Next request will start from page 16

### 4. Progress Tracking & Feedback

Users receive progress feedback:

```javascript
{
  success: true,
  lessons: [...],
  documentProgress: {
    pagesCompleted: 15,
    currentProgress: 30,  // 30% through document
    message: "You've covered 30% of the document (up to page 15). Keep learning to see more!"
  }
}
```

## Implementation Details

### New Files Created

1. **`ai-backend/src/lib/document-page-storage.ts`**
   - `saveDocumentPages()` - Save document pages
   - `getDocumentPagesByModuleId()` - Get pages for a module
   - `getUserPageProgress()` - Get/create user progress
   - `updateUserPageProgress()` - Update user's position
   - `getNextPagesForLessons()` - Get next sequential pages
   - `getDocumentProgressPercentage()` - Calculate completion %

### Modified Files

2. **`ai-backend/src/lib/ai-content-generator.ts`**
   - Added `extractDocumentPages()` function
   - Modified `generateLearningModule()` to save pages
   - Pages saved after successful module creation

3. **`ai-backend/src/routes/ai-lessons.ts`**
   - Replaced RAG retrieval with sequential page fetching
   - Added progress tracking updates
   - Modified AI prompt to emphasize sequential coverage
   - Returns progress information to frontend

## Database Collections

### `documentPages`
Stores complete documents broken into pages.

**Fields:**
- `moduleId` - Reference to generated module
- `contentId` - Reference to uploaded content
- `tutorId` - Who uploaded it
- `title` - Document title
- `totalPages` - Total number of pages
- `pages[]` - Array of page objects
  - `pageNumber` - Page number (1-indexed)
  - `content` - Text content of page
  - `totalPages` - Total pages (for reference)
- `createdAt` - When saved
- `updatedAt` - Last updated

### `userPageProgress`
Tracks each user's progress through each module.

**Document ID:** `{userId}_{moduleId}`

**Fields:**
- `userId` - User ID
- `moduleId` - Module ID
- `contentId` - Source content ID
- `lastPageCovered` - Last page number used for lessons
- `totalPagesInDocument` - Total pages
- `lessonsGenerated` - Number of lesson requests
- `createdAt` - When started
- `updatedAt` - Last lesson request

## Benefits

### ✅ Complete Coverage
- Every page of the document is eventually covered
- No content is skipped or missed
- Users get comprehensive understanding

### ✅ No Repetition
- Each page is used only once per user
- Lessons progress naturally through the material
- Users always see new content

### ✅ Personalized Learning Paths
- Each user has their own progress
- Can restart or review if needed
- Progress persists across sessions

### ✅ Progress Visibility
- Users see how far they've progressed (%)
- Clear indication of pages covered
- Motivates completion

### ✅ Fallback to RAG
- If no sequential pages available (old modules), uses RAG
- Graceful degradation for existing content
- No breaking changes

## Example Flow

### Tutor Uploads 50-Page Document

1. Document processed → 50 pages extracted
2. Saved to `documentPages` collection
3. Initial module created with first few lessons

### User Requests Lessons (Request #1)

1. Progress check: `lastPageCovered = 0`
2. Fetch pages 1-5
3. Generate 5 lessons from pages 1-5
4. Update: `lastPageCovered = 5`
5. Response: "You've covered 10% of the document"

### User Requests Lessons (Request #2)

1. Progress check: `lastPageCovered = 5`
2. Fetch pages 6-10
3. Generate 5 lessons from pages 6-10
4. Update: `lastPageCovered = 10`
5. Response: "You've covered 20% of the document"

### ...continues until page 50

### User Requests Lessons (After Completion)

1. Progress check: `lastPageCovered = 50` (all pages covered)
2. System provides review material from last pages
3. User can restart from page 1 if desired

## API Changes

### POST `/api/ai-lessons/generate`

**Request:**
```json
{
  "userId": "user-123",
  "moduleId": "module-456",
  "moduleName": "Constitutional Law",
  "completedLessons": [],
  "tier": "premium",
  "numberOfLessons": 5,
  "difficulty": "medium"
}
```

**Response (New):**
```json
{
  "success": true,
  "lessons": [...],
  "totalLessons": 15,
  "message": "Successfully generated 5 new lessons!",
  "requestCount": 2,
  "maxRequests": "unlimited",
  "documentProgress": {
    "pagesCompleted": 10,
    "currentProgress": 20,
    "message": "You've covered 20% of the document (up to page 10). Keep learning to see more!"
  }
}
```

## Future Enhancements

### Potential Improvements

1. **User Control**
   - Allow users to jump to specific sections
   - Restart from beginning option
   - Bookmark favorite pages

2. **Advanced Progress Tracking**
   - Time spent per page
   - Quiz performance per section
   - Difficulty adjustment based on performance

3. **Better Page Splitting**
   - Use actual PDF page boundaries
   - Semantic splitting (by sections/chapters)
   - Preserve headings and structure

4. **Review System**
   - Spaced repetition of difficult content
   - Automatic review sessions
   - Quiz-based progress verification

## Testing

To test the system:

1. **Upload a document as tutor admin**
   - Use a multi-page PDF or DOCX
   - Check that pages are saved in `documentPages` collection

2. **Request lessons as a user**
   - First request should use pages 1-5
   - Check `userPageProgress` collection for progress
   - Verify progress percentage in response

3. **Request more lessons**
   - Next request should use pages 6-10
   - Progress should increment
   - No content repetition

4. **Complete the document**
   - Continue until all pages covered
   - Verify 100% progress
   - Check behavior after completion

## Troubleshooting

### Issue: No sequential pages available
**Solution:** System automatically falls back to RAG search

### Issue: Progress not updating
**Check:**
- Firestore permissions for `userPageProgress` collection
- User authentication status
- Module ID is correct

### Issue: Lessons repeating
**Check:**
- `lastPageCovered` is being updated properly
- Page numbers are sequential
- Document pages were saved correctly

## Configuration

No additional configuration needed. The system automatically:
- Detects document type
- Extracts pages appropriately
- Creates progress trackers on first request
- Falls back to RAG when needed

## Backwards Compatibility

✅ **Fully backwards compatible**
- Old modules without page data use RAG fallback
- No changes needed to existing data
- New uploads automatically use sequential system
- Users can continue with old and new modules seamlessly

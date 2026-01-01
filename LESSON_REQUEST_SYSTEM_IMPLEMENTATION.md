# Lesson Request System Implementation

## Overview
This document describes the implementation of the lesson request system with tier-based limits, initial lesson display restrictions, RAG integration, and certificate updates.

## Changes Made

### 1. Initial Lesson Display Limit (5 Lessons)

**File: `src/contexts/LearningContext.tsx`**

- Modified `fetchModulesFromBackend()` to limit initial lessons to 5 per module for all users
- Users now see only the first 5 lessons of each module initially
- Additional lessons are added when users request more lessons

**Implementation:**
```typescript
// Limit initial lessons to 5, then add user-requested lessons
const initialLessons = m.lessons.slice(0, 5);
const allLessons = [...initialLessons, ...userModuleLessons];
```

### 2. Request Limit Tracking by Tier

**File: `ai-backend/src/routes/ai-lessons.ts`**

Implemented tier-based request limits:
- **Free**: 1 request per module
- **Basic**: 2 requests per module
- **Standard**: 4 requests per module
- **Premium**: Unlimited requests

**Implementation:**
- Request counts are tracked in Firestore collection `lessonRequests`
- Structure: `lessonRequests/{userId}/modules/{moduleId}/requestCount`
- Backend checks limits before generating lessons
- Returns 403 error with upgrade message when limit is reached

**Upgrade Messages:**
- Free: "Upgrade to Basic or higher to request more lessons!"
- Basic: "Upgrade to Standard or Premium to request more lessons!"
- Standard: "Upgrade to Premium for unlimited lesson requests!"

### 3. Frontend Request Handling

**File: `src/components/LearningHub.tsx`**

Updated `requestMoreLessons()` function to:
- Handle 403 errors (limit reached) gracefully
- Display appropriate upgrade messages to users
- Show request count status (e.g., "2/4 requests used")
- Prevent further requests when limit is reached

### 4. RAG Integration for Lesson Generation

**File: `ai-backend/src/routes/ai-lessons.ts`**

Integrated uploaded documents into lesson generation:
- Uses vector store retriever to fetch relevant documents
- Retrieves top 5 most relevant documents based on module name and description
- Injects document context into AI prompt as "REFERENCE MATERIAL"
- AI generates lessons primarily based on uploaded legal documents
- Falls back to general knowledge if no documents are available

**Implementation:**
```typescript
const retriever = await getRetriever();
const relevantDocs = await retriever.getRelevantDocuments(
  `${moduleName} ${moduleData?.description || ''} South Sudan law legal education`
);
```

### 5. Certificate Updates

**File: `src/components/CertificateGenerator.tsx`**

Updated certificate design to include:
- **Website**: www.mobilaws.com (displayed prominently)
- **Signature**: "mobilaws" in lowercase with cursive font style
- **Logo**: Mobilaws logo image (`/mobilogo.png`) displayed above signature
- **Layout**: Two-column footer with signature section and organization info

**Visual Elements:**
- Logo: 48px height, displayed above signature
- Signature: Lowercase "mobilaws" in cursive font
- Border: 2px gray border above signature line
- Website: Blue text, semi-bold, displayed in organization section

### 6. Firestore Security Rules

**File: `firestore.rules`**

Updated security rules for lesson request tracking:
```
match /lessonRequests/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow write: if false; // Only backend (Admin SDK) can write
}
```

- Users can read their own request counts
- Only backend with Admin SDK can write/update request counts
- Admins can read all request data

## Data Structure

### Firestore Collections

#### `lessonRequests/{userId}`
```json
{
  "userId": "user123",
  "modules": {
    "module-id-1": {
      "requestCount": 2,
      "lastRequestAt": "2025-01-01T12:00:00Z"
    }
  },
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

#### `userLessons/{userId}`
```json
{
  "userId": "user123",
  "modules": {
    "module-id-1": {
      "lessons": [
        {
          "id": "lesson-6",
          "title": "Advanced Concepts",
          "content": "...",
          "xpReward": 50,
          "quiz": [...],
          "userGenerated": true,
          "createdAt": "2025-01-01T12:00:00Z"
        }
      ],
      "lastUpdated": "2025-01-01T12:00:00Z"
    }
  },
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

## User Flow

### Initial Experience (All Users)
1. User opens a module
2. Sees only 5 initial lessons
3. Can complete these lessons normally
4. At the end, sees "Request More Lessons" button

### Requesting More Lessons

#### Free User (1 request allowed)
1. Clicks "Request More Lessons" → 5 new lessons generated ✅
2. Clicks again → Error: "Upgrade to Basic or higher to request more lessons!" ❌

#### Basic User (2 requests allowed)
1. First request → 5 new lessons generated ✅
2. Second request → 5 more lessons generated ✅
3. Third request → Error: "Upgrade to Standard or Premium to request more lessons!" ❌

#### Standard User (4 requests allowed)
1. Can request 4 times → 20 additional lessons total ✅
2. Fifth request → Error: "Upgrade to Premium for unlimited lesson requests!" ❌

#### Premium User (Unlimited)
1. Can request unlimited times → Always generates 5 new lessons ✅
2. No restrictions ✅

## API Response Format

### Success Response
```json
{
  "success": true,
  "lessons": [...],
  "totalLessons": 15,
  "message": "Successfully generated 5 new lessons!",
  "requestCount": 2,
  "maxRequests": 4
}
```

### Limit Reached Response (403)
```json
{
  "error": "Request limit reached",
  "message": "You have reached your request limit. Upgrade to Standard or Premium to request more lessons!",
  "requestCount": 2,
  "maxRequests": 2
}
```

## Key Features

### ✅ Privacy & Isolation
- Each user's requested lessons are stored separately
- User A's lessons never appear for User B
- Lessons are user-specific and private

### ✅ Document-Based Learning
- All lessons are generated from uploaded legal documents
- RAG retrieval ensures accurate, authoritative content
- Falls back gracefully if no documents are available

### ✅ Fair Usage Limits
- Prevents abuse of AI generation
- Encourages upgrades for power users
- Premium users get unlimited access

### ✅ Professional Certificates
- Includes website and branding
- Lowercase signature for consistency
- Logo for authenticity

## Testing Checklist

- [ ] Free user sees only 5 initial lessons
- [ ] Free user can request once successfully
- [ ] Free user gets upgrade message on second request
- [ ] Basic user can request twice
- [ ] Standard user can request 4 times
- [ ] Premium user can request unlimited times
- [ ] Requested lessons appear only for requesting user
- [ ] Lessons are generated from uploaded documents
- [ ] Certificate displays www.mobilaws.com
- [ ] Certificate shows lowercase "mobilaws" signature
- [ ] Certificate displays logo image

## Deployment Notes

1. **Firestore Rules**: Deploy updated rules using:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Backend**: Ensure RAG vector store is initialized with documents

3. **Frontend**: Clear browser cache to see updated certificate design

4. **Testing**: Test with multiple user accounts to verify isolation

## Future Enhancements

- Add request count display in UI before requesting
- Show remaining requests in module view
- Add analytics for request patterns
- Implement request reset periods (monthly/yearly)
- Add bulk lesson generation for admins


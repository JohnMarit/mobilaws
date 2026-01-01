# Exam System & Lesson Display Fix Summary

## Overview
This document describes the fixes for lesson disappearing issues and the complete restructuring of the exam/certification system.

---

## Part 1: Lesson Display Fix

### Problem
After users requested more lessons, all lessons (including the initial 5) would disappear. This happened because the code was only showing the first 5 lessons initially, and when user-requested lessons were added, the original lessons were not included.

### Solution
**File: `src/contexts/LearningContext.tsx`**

Updated the `fetchModulesFromBackend()` function to:
- Show first 5 module lessons initially (before any requests)
- Once user requests more lessons, show ALL module lessons + user-requested lessons
- This ensures lessons never disappear

**Implementation:**
```typescript
const hasRequestedMore = userModuleLessons.length > 0;
const moduleLessonsToShow = hasRequestedMore ? m.lessons : m.lessons.slice(0, 5);
const allLessons = [...moduleLessonsToShow, ...userModuleLessons];
```

**Result:**
✅ Users see 5 lessons initially
✅ After requesting more, they see all original lessons + new ones
✅ No lessons disappear

---

## Part 2: Exam System Restructuring

### Changes Made

#### 1. Basic Exam
**File: `src/lib/examContent.ts`**

- **Question Count**: Changed from 75 to **40 questions**
- **Access**: Available to **ALL users** (including free tier)
- **Retake Policy**: **One-time only** - Once passed, cannot be retaken
- **Question Selection**: Uses beginner/easy difficulty questions only

**Configuration:**
```typescript
{
    id: 'basic-cert',
    title: 'Basic Legal Knowledge Certificate',
    description: 'Demonstrate foundational understanding of South Sudan law. Available for all users including free tier.',
    requiredTier: 'free',
    questionCount: 40,
    passMark: 70,
    badge: '🎓',
    color: '#3b82f6'
}
```

#### 2. Standard Exam
**File: `src/lib/examContent.ts`**

- **Question Count**: Changed from 200 to **100 questions**
- **Access**: Available to **Basic and Standard users** (not free)
- **Retake Policy**: **One-time only** - Once passed, cannot be retaken
- **Question Selection**: Uses intermediate/medium difficulty questions
- **No Overlap**: Questions are different from Basic exam

**Configuration:**
```typescript
{
    id: 'standard-cert',
    title: 'Standard Legal Proficiency Certificate',
    description: 'Advanced certification covering intermediate legal concepts. Available for Basic and Standard users.',
    requiredTier: 'basic', // Changed from 'standard'
    questionCount: 100,
    passMark: 70,
    badge: '⚖️',
    color: '#8b5cf6'
}
```

#### 3. Premium Exam
**File: `src/lib/examContent.ts`**

- **Question Count**: Changed from 400 to **200 questions**
- **Access**: **Premium users only**
- **Retake Policy**: **Regeneratable** - Can be taken multiple times with new questions
- **Question Selection**: Uses advanced/hard difficulty questions + mixed
- **No Overlap**: Questions are different from Basic and Standard exams

**Configuration:**
```typescript
{
    id: 'premium-cert',
    title: 'Premium Legal Expert Certificate',
    description: 'Comprehensive certification demonstrating expert-level legal knowledge. Premium users only. Can be regenerated for continuous learning.',
    requiredTier: 'premium',
    questionCount: 200,
    passMark: 70,
    badge: '👨‍⚖️',
    color: '#f59e0b'
}
```

### Question Stratification Logic

**File: `src/lib/examContent.ts` - `getExamQuestionsFromFirestore()`**

The system now stratifies questions by difficulty to ensure no overlap:

```typescript
// Basic Exam: Beginner questions only
const beginnerQuestions = allQuestions.filter(q => 
    q.difficulty === 'beginner' || q.difficulty === 'easy'
);

// Standard Exam: Intermediate questions only
const intermediateQuestions = allQuestions.filter(q => 
    q.difficulty === 'intermediate' || q.difficulty === 'medium'
);

// Premium Exam: Advanced questions + mixed
const advancedQuestions = allQuestions.filter(q => 
    q.difficulty === 'advanced' || q.difficulty === 'hard'
);
```

### Completion Tracking

**File: `src/lib/examService.ts`**

Added new function to check if user has passed an exam:

```typescript
export async function hasUserPassedExam(userId: string, examId: string): Promise<boolean> {
    const attemptsRef = collection(db, 'examAttempts');
    const q = query(
        attemptsRef,
        where('userId', '==', userId),
        where('examId', '==', examId),
        where('passed', '==', true)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}
```

### UI Updates

**File: `src/components/ExamPage.tsx`**

Updated exam cards to show:
- **Locked state** for users without proper tier
- **Completed badge** for passed exams
- **View Certificate** button for completed exams
- **Take New Exam** button for Premium exam (even after passing)
- **No retake** for Basic and Standard exams once passed

**Access Control Logic:**
```typescript
// Basic exam: Available to all
if (exam.requiredTier === 'free') {
    isLocked = false;
}

// Standard exam: Available to basic and standard users
else if (exam.requiredTier === 'basic') {
    isLocked = tier === 'free';
    lockMessage = 'Upgrade to Basic or higher';
}

// Premium exam: Available to premium users only
else if (exam.requiredTier === 'premium') {
    isLocked = tier !== 'premium';
    lockMessage = 'Upgrade to Premium';
}
```

---

## Summary Table

| Exam Level | Questions | Access | Retake Policy | Question Difficulty |
|------------|-----------|--------|---------------|---------------------|
| **Basic** | 40 | All users (including free) | ❌ One-time only | Beginner/Easy |
| **Standard** | 100 | Basic & Standard users | ❌ One-time only | Intermediate/Medium |
| **Premium** | 200 | Premium users only | ✅ Unlimited | Advanced/Hard + Mixed |

---

## User Experience Flows

### Basic Exam (All Users)
1. User opens Exam page
2. Sees Basic exam available (not locked)
3. Clicks "Start Exam"
4. Takes 40 beginner questions
5. If passed (≥70%):
   - Receives certificate
   - Exam marked as "Completed"
   - Can only view/download certificate (no retake)
6. If failed (<70%):
   - Can retake exam
   - No certificate issued

### Standard Exam (Basic+ Users)
1. Free user sees "Locked - Upgrade to Basic or higher"
2. Basic/Standard user sees exam available
3. Takes 100 intermediate questions
4. If passed:
   - Receives certificate
   - Cannot retake (one-time only)
5. If failed:
   - Can retake until passed

### Premium Exam (Premium Only)
1. Non-premium users see "Locked - Upgrade to Premium"
2. Premium user sees exam available
3. Takes 200 advanced questions
4. If passed:
   - Receives certificate
   - Can click "Take New Exam" to get fresh questions
   - Unlimited regeneration for continuous learning
5. If failed:
   - Can retake with same or different questions

---

## Technical Implementation Details

### Question Pool Management

The system fetches questions from Firestore (tutor-uploaded modules) and stratifies them by difficulty:

1. **Extraction**: Pulls all quiz questions from all published modules
2. **Filtering**: Filters by difficulty level based on exam type
3. **Shuffling**: Randomizes question order
4. **Selection**: Selects required number of questions
5. **No Overlap**: Ensures different difficulty levels for each exam

### Completion State Management

- Stored in Firestore `examAttempts` collection
- Tracked per user per exam
- Includes: score, passed status, timestamp
- Certificates stored in `certificates` collection

### Access Control

- Tier-based access enforced in UI
- Backend validation ensures proper access
- Lock messages guide users to upgrade

---

## Files Modified

1. ✅ `src/contexts/LearningContext.tsx` - Fixed lesson display
2. ✅ `src/lib/examContent.ts` - Restructured exam definitions & question selection
3. ✅ `src/lib/examService.ts` - Added completion tracking
4. ✅ `src/components/ExamPage.tsx` - Updated UI & access control

---

## Testing Checklist

### Lesson Display
- [ ] User sees 5 lessons initially
- [ ] After requesting more, all lessons visible (original + new)
- [ ] Lessons don't disappear after multiple requests
- [ ] Works for all tiers (free, basic, standard, premium)

### Basic Exam
- [ ] Available to free users
- [ ] Shows 40 questions
- [ ] Uses beginner difficulty only
- [ ] Once passed, shows "View Certificate" only
- [ ] Cannot retake after passing

### Standard Exam
- [ ] Locked for free users
- [ ] Available for basic and standard users
- [ ] Shows 100 questions
- [ ] Uses intermediate difficulty (no basic questions)
- [ ] Once passed, shows "View Certificate" only
- [ ] Cannot retake after passing

### Premium Exam
- [ ] Locked for non-premium users
- [ ] Available for premium users only
- [ ] Shows 200 questions
- [ ] Uses advanced difficulty (no basic/standard questions)
- [ ] After passing, shows both "View Certificate" and "Take New Exam"
- [ ] Can be regenerated unlimited times

---

## Benefits

### For Users
✅ Clear progression path (Basic → Standard → Premium)
✅ No lesson confusion (all lessons stay visible)
✅ Fair exam difficulty based on tier
✅ Premium users get continuous learning opportunities

### For Platform
✅ Encourages upgrades (locked exams)
✅ Prevents exam abuse (one-time for Basic/Standard)
✅ Premium value proposition (unlimited exams)
✅ Better question pool management (no overlap)

---

## Future Enhancements

1. **Question Pool Analytics**: Track which questions are most challenging
2. **Adaptive Difficulty**: Adjust question difficulty based on user performance
3. **Exam History**: Show detailed history of all attempts
4. **Time Limits**: Add optional time limits for exams
5. **Question Reporting**: Allow users to report incorrect questions
6. **Leaderboard**: Show top scorers for each exam level


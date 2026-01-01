# Lesson Expand/Collapse Fix

## Problem
After requesting more lessons:
1. Only 10 lessons were visible (5 original + 5 requested)
2. The expand button wasn't showing ALL lessons
3. Users couldn't see all their requested lessons

## Root Cause
The expand logic was trying to be "smart" by:
- Always showing user-requested lessons individually
- But this caused confusion with the expand/collapse state
- The expand button text said "Show X More" but didn't show ALL lessons

## Solution
Simplified the expand/collapse logic:

**File: `src/components/LearningHub.tsx`**

### 1. Simplified visibility logic
```typescript
// Show 5 lessons initially
// When expanded, show ALL lessons
const isExpanded = expandedLessons.has(module.id);
const shouldShow = isExpanded || lessonIndex < 5;
```

### 2. Clear button text
```typescript
{expandedLessons.has(module.id) ? (
  <>
    <ChevronUp className="h-4 w-4 mr-2" />
    Show Less
  </>
) : (
  <>
    <ChevronDown className="h-4 w-4 mr-2" />
    Show All {module.lessons.length} Lessons
  </>
)}
```

### 3. Removed auto-expand
- Removed the auto-expand logic that was causing confusion
- Users now manually click to expand when they want to see all lessons

## How It Works Now

### Initial State (Before Requesting)
```
Module: Constitutional Law (20 lessons total)
├─ Lesson 1 ✓
├─ Lesson 2 ✓
├─ Lesson 3 ✓
├─ Lesson 4 ✓
├─ Lesson 5 ✓
└─ [Show All 20 Lessons] ← Click to expand
```

### After Requesting 5 More Lessons
```
Module: Constitutional Law (25 lessons total)
├─ Lesson 1 ✓
├─ Lesson 2 ✓
├─ Lesson 3 ✓
├─ Lesson 4 ✓
├─ Lesson 5 ✓
└─ [Show All 25 Lessons] ← Click to see all 25 lessons
```

### After Clicking Expand
```
Module: Constitutional Law (25 lessons total)
├─ Lesson 1 ✓
├─ Lesson 2 ✓
├─ Lesson 3 ✓
├─ Lesson 4 ✓
├─ Lesson 5 ✓
├─ Lesson 6
├─ Lesson 7
├─ Lesson 8
├─ ... (all original lessons)
├─ Lesson 20
├─ Lesson 21 (user-requested) 🆕
├─ Lesson 22 (user-requested) 🆕
├─ Lesson 23 (user-requested) 🆕
├─ Lesson 24 (user-requested) 🆕
├─ Lesson 25 (user-requested) 🆕
└─ [Show Less] ← Click to collapse
```

## User Experience

### Step 1: Complete Initial Lessons
1. User sees 5 lessons
2. Completes all 5
3. Module unlocks all lessons
4. Button shows "Show All 20 Lessons"

### Step 2: Request More Lessons
1. User clicks "Request 5 More Lessons"
2. Success message: "Generated 5 new lessons!"
3. Page reloads
4. Button now shows "Show All 25 Lessons"

### Step 3: View All Lessons
1. User clicks "Show All 25 Lessons"
2. All lessons expand (original 20 + requested 5)
3. User can see and access all 25 lessons
4. Button changes to "Show Less"

## Benefits

✅ **Clear Communication**: Button says exactly what it does ("Show All X Lessons")

✅ **Simple Logic**: Either show 5 or show all - no complex conditions

✅ **No Auto-Expand**: Users control when to expand

✅ **Accurate Count**: Shows total lesson count including requested ones

✅ **Consistent Behavior**: Works the same way for all users and all tiers

## Testing Checklist

- [ ] Initially shows 5 lessons
- [ ] Button says "Show All X Lessons" (correct count)
- [ ] Clicking expand shows ALL lessons (not just some)
- [ ] After requesting more, total count updates
- [ ] Expand shows all original + all requested lessons
- [ ] "Show Less" collapses back to 5 lessons
- [ ] Works for free, basic, standard, and premium users

## Files Modified

- ✅ `src/components/LearningHub.tsx` - Simplified expand/collapse logic
- ✅ `src/contexts/LearningContext.tsx` - Preserved userGenerated flag

## Summary

The expand/collapse now works simply and predictably:
- **Collapsed**: Show first 5 lessons
- **Expanded**: Show ALL lessons (original + requested)
- **Button text**: Clear and accurate

No more confusion about which lessons are visible!


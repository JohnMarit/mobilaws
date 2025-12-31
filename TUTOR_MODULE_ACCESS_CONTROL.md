# Tutor Admin Module Access Control System

## 🎯 Overview

This feature allows tutor admins to view all modules created from their uploaded documents and manage granular access control for:
- **Modules** (overall access)
- **Individual Lessons** (per-lesson access)
- **Individual Quizzes** (per-quiz access)

Tutor admins can restrict content to specific subscription tiers: **Free**, **Basic**, **Standard**, or **Premium**.

---

## 🚀 Features Implemented

### 1. **Backend Infrastructure**

#### Updated Data Structures
- `GeneratedLesson` now includes optional `accessLevels` array
- `GeneratedQuiz` now includes optional `accessLevels` array
- Access levels cascade: Quiz → Lesson → Module (uses parent if not specified)

#### New API Endpoints

**Get Modules by Tutor ID**
```
GET /api/tutor-admin/modules/tutor/:tutorId
```
Returns all modules created by a specific tutor admin.

**Update Lesson Access Levels**
```
PUT /api/tutor-admin/modules/:moduleId/lessons/:lessonId/access
Body: { accessLevels: ['basic', 'standard', 'premium'] }
```

**Update Quiz Access Levels**
```
PUT /api/tutor-admin/modules/:moduleId/lessons/:lessonId/quizzes/:quizId/access
Body: { accessLevels: ['basic', 'standard', 'premium'] }
```

**Bulk Update Module Access**
```
PUT /api/tutor-admin/modules/:moduleId/access/bulk
Body: {
  moduleAccessLevels: ['free', 'basic'],
  lessonUpdates: [
    { lessonId: 'lesson-1', accessLevels: ['standard', 'premium'] }
  ],
  quizUpdates: [
    { lessonId: 'lesson-1', quizId: 'q1', accessLevels: ['premium'] }
  ]
}
```

#### New Functions in `ai-content-generator.ts`
- `getModulesByTutorId()` - Fetch modules by tutor
- `updateLessonAccessLevels()` - Update single lesson access
- `updateQuizAccessLevels()` - Update single quiz access
- `bulkUpdateModuleAccessLevels()` - Update multiple items at once

---

### 2. **Frontend Components**

#### ModuleManager Component
**Location:** `src/components/admin/ModuleManager.tsx`

**Features:**
- Displays all modules created by the tutor
- Shows module statistics (lessons, XP, duration, category)
- Visual tier badges (Free, Basic, Standard, Premium)
- "Manage Access" button for each module

**Access Control Dialog:**
- **Module-level access** - Set default access for entire module
- **Lesson-level access** - Override access for specific lessons
- **Quiz-level access** - Override access for individual quizzes
- **Bulk operations** - "Apply to All" buttons for quick setup
- **Visual hierarchy** - Accordion view showing module → lessons → quizzes
- **Color-coded badges** - Easy identification of access levels

#### TutorAdminPortal Updates
**Location:** `src/pages/TutorAdminPortal.tsx`

- Added new **"Manage Modules"** tab
- Integrated `ModuleManager` component
- Tab shows all generated modules with access control interface

---

### 3. **Frontend Access Enforcement**

#### LearningContext Updates
**Location:** `src/contexts/LearningContext.tsx`

**Access Control Logic:**
1. **Module Access Check**
   - Compares user tier with module's required tier
   - Locks entire module if user tier is insufficient

2. **Lesson Access Check**
   - Uses lesson-specific access levels if set
   - Falls back to module access levels
   - Replaces content with lock message if inaccessible

3. **Quiz Access Check**
   - Uses quiz-specific access levels if set
   - Falls back to lesson or module access levels
   - Shows lock icon and upgrade message

#### LessonRunner Updates
**Location:** `src/components/LessonRunner.tsx`

**Locked Quiz Handling:**
- Displays 🔒 badge on locked quizzes
- Shows upgrade message instead of quiz options
- "Skip Quiz" button to continue to next question
- Prevents interaction with locked content

#### QuizQuestion Interface Update
**Location:** `src/lib/learningContent.ts`

Added `locked?: boolean` property to track quiz accessibility.

---

## 📊 Access Level Hierarchy

```
Premium (highest)
    ↓
Standard
    ↓
Basic
    ↓
Free (lowest)
```

**Access Rules:**
- Premium users can access ALL content
- Standard users can access: Free + Basic + Standard
- Basic users can access: Free + Basic
- Free users can access: Free only

**Cascading Logic:**
```
Quiz Access = Quiz.accessLevels || Lesson.accessLevels || Module.accessLevels
Lesson Access = Lesson.accessLevels || Module.accessLevels
```

---

## 🎨 User Interface

### Tutor Admin View

#### Module Cards
```
┌─────────────────────────────────────────┐
│ 📚 Constitutional Law Basics            │
│ Introduction to South Sudan Constitution│
│                                         │
│ [Free] [Basic] [Published]              │
│                          [Manage Access]│
│                                         │
│ 📖 5 Lessons  🏆 250 XP  ⏱ 2.5h        │
│ Created: Dec 31, 2025                   │
└─────────────────────────────────────────┘
```

#### Access Control Dialog
```
┌──────────────────────────────────────────┐
│ ✨ Manage Access: Constitutional Law     │
│                                          │
│ 📚 Module Access                         │
│ ☑ Free  ☑ Basic  ☐ Standard  ☐ Premium  │
│                                          │
│ 🎓 Lessons (5)    [Apply Module Access] │
│ ┌─ L1: Introduction                     │
│ │  ☑ Free  ☑ Basic  ☐ Standard          │
│ │  📝 Quizzes (3)                        │
│ │  ├─ Q1: What is the Constitution?     │
│ │  │  ☑ Free  ☑ Basic                   │
│ │  ├─ Q2: Constitutional Structure       │
│ │  │  ☐ Free  ☑ Basic  ☑ Standard       │
│ └─────────────────────────────────────  │
│                                          │
│              [Cancel]  [Save Changes]    │
└──────────────────────────────────────────┘
```

### Student View

#### Locked Lesson
```
┌─────────────────────────────────────┐
│ 🔒 This lesson is locked            │
│                                     │
│ Upgrade your subscription to        │
│ access this content.                │
│                                     │
│         [View Plans]                │
└─────────────────────────────────────┘
```

#### Locked Quiz
```
┌─────────────────────────────────────┐
│ Question 2 of 5  [🔒 Locked]        │
│ 🔒 This quiz is locked. Upgrade to  │
│ access.                             │
│                                     │
│ ℹ This quiz is restricted to higher │
│   subscription tiers.               │
│                                     │
│         [Exit]      [Skip Quiz]     │
└─────────────────────────────────────┘
```

---

## 🔧 How to Use

### For Tutor Admins

#### 1. Upload Content
1. Go to **Tutor Admin Portal** (`/tutor-admin`)
2. Click **"Upload Content"** tab
3. Upload document and set initial access levels
4. Wait for AI to generate module

#### 2. Manage Module Access
1. Click **"Manage Modules"** tab
2. View all your generated modules
3. Click **"Manage Access"** on any module
4. Set access levels:
   - **Module level** - Default for all content
   - **Lesson level** - Override for specific lessons
   - **Quiz level** - Fine-tune individual quizzes

#### 3. Quick Setup Options
- **Apply to All Lessons** - Copy module access to all lessons
- **Apply to All Quizzes** - Copy module access to all quizzes
- **Individual Control** - Set each item separately

#### 4. Save Changes
- Click **"Save Changes"** to apply
- Changes take effect immediately
- Users will see updated access restrictions

### For Students

#### Viewing Content
1. Open **Learning Hub**
2. Browse available modules
3. Locked modules show 🔒 icon
4. Click module to see lessons

#### Accessing Lessons
- **Unlocked lessons** - Full content and quizzes
- **Locked lessons** - Lock message with upgrade prompt
- **Partially locked** - Some quizzes may be locked

#### Taking Quizzes
- **Unlocked quizzes** - Answer normally
- **Locked quizzes** - See lock message, click "Skip Quiz"
- **Mixed access** - Some questions accessible, others locked

---

## 🔒 Security & Validation

### Backend Validation
- ✅ Access levels must be valid tier names
- ✅ At least one access level required per module
- ✅ Only tutor who created module can modify it
- ✅ Changes logged with timestamps

### Frontend Enforcement
- ✅ User tier checked before rendering content
- ✅ Locked content replaced with upgrade prompts
- ✅ Quiz submission blocked for locked questions
- ✅ XP not awarded for skipped locked quizzes

### Data Integrity
- ✅ Cascading access levels (Quiz → Lesson → Module)
- ✅ Published status separate from access control
- ✅ Access changes don't affect user progress
- ✅ Firestore updates atomic and transactional

---

## 📈 Use Cases

### Use Case 1: Free Preview
**Scenario:** Tutor wants to offer first 2 lessons free, rest premium

**Setup:**
1. Module access: `['free', 'basic', 'standard', 'premium']`
2. Lesson 1 access: `['free', 'basic', 'standard', 'premium']`
3. Lesson 2 access: `['free', 'basic', 'standard', 'premium']`
4. Lessons 3-5 access: `['premium']`

**Result:** Free users see first 2 lessons, must upgrade for rest

### Use Case 2: Tiered Quizzes
**Scenario:** Basic quizzes for all, advanced quizzes for premium

**Setup:**
1. Module access: `['free', 'basic', 'standard', 'premium']`
2. All lessons: `['free', 'basic', 'standard', 'premium']`
3. Easy quizzes: `['free', 'basic', 'standard', 'premium']`
4. Hard quizzes: `['premium']`

**Result:** All users see content, but only premium gets advanced quizzes

### Use Case 3: Progressive Unlock
**Scenario:** Each tier unlocks more content

**Setup:**
1. Module access: `['free', 'basic', 'standard', 'premium']`
2. Lessons 1-2: `['free', 'basic', 'standard', 'premium']`
3. Lessons 3-4: `['basic', 'standard', 'premium']`
4. Lessons 5-6: `['standard', 'premium']`
5. Lessons 7-8: `['premium']`

**Result:** Users see more content as they upgrade tiers

---

## 🐛 Troubleshooting

### Module Not Showing
**Problem:** Module doesn't appear in Manage Modules tab

**Solutions:**
- Check if module is created (status: 'ready')
- Verify tutor ID matches logged-in tutor
- Check browser console for API errors
- Refresh page to reload modules

### Access Changes Not Applied
**Problem:** Users still see locked content after changes

**Solutions:**
- Verify changes saved successfully (check toast message)
- Have users refresh their browser
- Check Firestore to confirm updates
- Verify module is published

### Locked Content Still Accessible
**Problem:** Users with lower tier can access restricted content

**Solutions:**
- Check user's subscription tier in Firebase
- Verify access levels are correctly set
- Clear browser cache and localStorage
- Check LearningContext is fetching latest module data

### Bulk Update Failed
**Problem:** "Apply to All" doesn't work

**Solutions:**
- Check browser console for errors
- Verify module has lessons/quizzes
- Try updating items individually
- Check network tab for API response

---

## 📝 Technical Notes

### Performance
- Module list fetched once per tab visit
- Access control dialog loads module data on open
- Bulk updates use single API call
- Frontend caches module data

### Database Structure
```javascript
// Firestore: generatedModules collection
{
  id: "module-123",
  title: "Constitutional Law",
  accessLevels: ["free", "basic"],
  lessons: [
    {
      id: "lesson-1",
      title: "Introduction",
      accessLevels: ["free", "basic"], // Optional override
      quiz: [
        {
          id: "q1",
          question: "What is law?",
          accessLevels: ["free"] // Optional override
        }
      ]
    }
  ]
}
```

### API Response Format
```javascript
// GET /api/tutor-admin/modules/tutor/:tutorId
[
  {
    id: "module-123",
    title: "Constitutional Law",
    description: "Learn the basics",
    accessLevels: ["free", "basic"],
    published: true,
    totalLessons: 5,
    totalXp: 250,
    estimatedHours: 2.5,
    lessons: [...]
  }
]
```

---

## 🎓 Best Practices

### For Tutor Admins

1. **Start Broad, Narrow Down**
   - Set module access to all tiers initially
   - Restrict specific lessons/quizzes as needed
   - Easier to remove access than add later

2. **Use Bulk Operations**
   - Apply module access to all items first
   - Then customize exceptions
   - Saves time on large modules

3. **Test Before Publishing**
   - Create test account with different tiers
   - Verify access restrictions work
   - Check lock messages display correctly

4. **Clear Tier Progression**
   - Make tier benefits obvious
   - Don't lock too much content at once
   - Provide value at each tier

5. **Document Your Structure**
   - Note which lessons are locked to which tiers
   - Share tier benefits with students
   - Update as you add content

### For Developers

1. **Always Check Access Levels**
   - Never assume content is accessible
   - Check at module, lesson, and quiz level
   - Handle undefined access levels gracefully

2. **Cascade Properly**
   - Quiz → Lesson → Module
   - Use parent access if child undefined
   - Don't skip levels

3. **Update Both Frontend and Backend**
   - Backend enforces access (security)
   - Frontend provides UX (lock messages)
   - Keep both in sync

4. **Test Edge Cases**
   - Empty access levels array
   - Undefined access levels
   - User with no subscription
   - Module with no lessons

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Time-based access (unlock after date)
- [ ] Prerequisite lessons (unlock after completing X)
- [ ] Group-based access (specific user groups)
- [ ] Trial access (temporary premium access)
- [ ] Access analytics (who's accessing what)

### Potential Improvements
- [ ] Drag-and-drop access level assignment
- [ ] Visual access level preview
- [ ] Access level templates (save/load configurations)
- [ ] Bulk import/export access settings
- [ ] Access level scheduling (change on specific dates)

---

## 📞 Support

### For Tutor Admins
- Contact: admin@mobilaws.com
- Documentation: `/admin/help`
- Video tutorials: Coming soon

### For Developers
- API Documentation: `/api/docs`
- GitHub: [Repository Link]
- Slack: #tutor-admin-dev

---

## ✅ Summary

This system provides comprehensive access control for tutor-created content:

✅ **Granular Control** - Module, lesson, and quiz level
✅ **Easy Management** - Visual interface with bulk operations
✅ **Secure Enforcement** - Backend and frontend validation
✅ **User-Friendly** - Clear lock messages and upgrade prompts
✅ **Flexible Tiers** - Support for Free, Basic, Standard, Premium
✅ **Cascading Access** - Inherit from parent if not specified

**Result:** Tutor admins have full control over who can access their content, enabling flexible monetization and content strategies.


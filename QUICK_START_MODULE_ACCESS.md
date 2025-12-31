# Quick Start: Module Access Control

## 🚀 For Tutor Admins

### Step 1: Upload Content
1. Go to `/tutor-admin`
2. Click **"Upload Content"** tab
3. Upload your document (PDF, DOCX, TXT)
4. Fill in title and description
5. Select initial access levels (Free, Basic, Standard, Premium)
6. Click **"Upload"**
7. Wait for AI to generate module (1-2 minutes)

### Step 2: View Your Modules
1. Click **"Manage Modules"** tab
2. See all your generated modules
3. Each card shows:
   - Module title and description
   - Current access levels (colored badges)
   - Statistics (lessons, XP, duration)
   - Published status

### Step 3: Manage Access Levels
1. Click **"Manage Access"** on any module
2. Dialog opens with three sections:
   - **Module Access** - Default for all content
   - **Lessons** - Individual lesson access
   - **Quizzes** - Individual quiz access

### Step 4: Set Access Levels

#### Option A: Simple (All Same Access)
1. Set **Module Access** checkboxes
2. Click **"Apply Module Access to All"** for lessons
3. Click **"Save Changes"**

#### Option B: Granular (Custom Per Item)
1. Set **Module Access** as default
2. Expand each lesson in accordion
3. Check/uncheck access levels for that lesson
4. Expand quizzes within lesson
5. Check/uncheck access levels for each quiz
6. Click **"Save Changes"**

### Step 5: Publish Module
1. Go to **"My Content"** tab
2. Find your module (status: Ready)
3. Click **"Publish"** button
4. Module is now visible to users

---

## 🎯 Common Scenarios

### Scenario 1: Free Preview Module
**Goal:** Everyone can access all content

**Setup:**
- Module Access: ☑ Free ☑ Basic ☑ Standard ☑ Premium
- Click "Apply Module Access to All"
- Save

### Scenario 2: Premium Only Module
**Goal:** Only premium subscribers can access

**Setup:**
- Module Access: ☐ Free ☐ Basic ☐ Standard ☑ Premium
- Click "Apply Module Access to All"
- Save

### Scenario 3: First Lesson Free, Rest Premium
**Goal:** Free users see first lesson only

**Setup:**
- Module Access: ☑ Free ☑ Basic ☑ Standard ☑ Premium
- Lesson 1: Keep all checked
- Lessons 2-5: Uncheck Free and Basic, keep Standard and Premium
- Save

### Scenario 4: Basic Content, Premium Quizzes
**Goal:** Everyone sees lessons, only premium gets quizzes

**Setup:**
- Module Access: ☑ Free ☑ Basic ☑ Standard ☑ Premium
- Click "Apply Module Access to All"
- Expand each lesson
- For each quiz: Uncheck Free, Basic, Standard; keep only Premium
- Save

---

## 🎨 Visual Guide

### Access Level Colors
- 🟢 **Free** - Gray badge
- 🔵 **Basic** - Blue badge
- 🟣 **Standard** - Purple badge
- 🟡 **Premium** - Yellow badge

### Module Card Example
```
┌──────────────────────────────────────┐
│ 📚 Constitutional Law                │
│ Learn South Sudan Constitution       │
│                                      │
│ [Free] [Basic] [✓ Published]        │
│                   [Manage Access] ← Click here
│                                      │
│ 📖 8 Lessons  🏆 400 XP  ⏱ 4h       │
└──────────────────────────────────────┘
```

### Access Dialog Structure
```
Module Access (applies to all)
  ↓
Lesson 1
  ├─ Lesson Access (overrides module)
  ├─ Quiz 1 (overrides lesson)
  ├─ Quiz 2 (overrides lesson)
  └─ Quiz 3 (overrides lesson)
  
Lesson 2
  ├─ Lesson Access
  └─ Quizzes...
```

---

## ⚡ Quick Tips

### Do's ✅
- ✅ Set module access first, then customize
- ✅ Use "Apply to All" for quick setup
- ✅ Test with different tier accounts
- ✅ Provide value at each tier
- ✅ Save changes before closing dialog

### Don'ts ❌
- ❌ Don't lock all content to premium
- ❌ Don't forget to publish after setting access
- ❌ Don't change access without testing
- ❌ Don't leave module access empty
- ❌ Don't close dialog without saving

---

## 🔍 What Students See

### Free Tier User
- ✅ Modules marked "Free"
- ✅ Lessons marked "Free"
- ✅ Quizzes marked "Free"
- 🔒 Everything else shows lock icon

### Basic Tier User
- ✅ Free + Basic content
- 🔒 Standard and Premium locked

### Standard Tier User
- ✅ Free + Basic + Standard content
- 🔒 Premium locked

### Premium Tier User
- ✅ All content accessible
- 🎉 No locks anywhere

---

## 🆘 Troubleshooting

### Problem: Can't see my module
**Solution:** 
- Check "My Content" tab - is it "Ready"?
- Refresh the page
- Check browser console for errors

### Problem: Changes not saving
**Solution:**
- Make sure at least one tier is selected
- Check internet connection
- Look for error toast message
- Try again

### Problem: Students still see locked content
**Solution:**
- Verify module is published
- Have students refresh browser
- Check access levels are saved correctly
- Clear student's browser cache

### Problem: Bulk update not working
**Solution:**
- Make sure module access is set first
- Try updating items individually
- Refresh page and try again

---

## 📊 Access Level Matrix

| User Tier | Can Access |
|-----------|------------|
| Free | Free only |
| Basic | Free + Basic |
| Standard | Free + Basic + Standard |
| Premium | Free + Basic + Standard + Premium |

---

## 🎓 Best Practices

1. **Start Generous**
   - Begin with broad access
   - Restrict as needed
   - Easier to remove than add

2. **Tier Progression**
   - Free: 1-2 intro lessons
   - Basic: 3-5 core lessons
   - Standard: 6-8 advanced lessons
   - Premium: All lessons + extras

3. **Quiz Strategy**
   - Basic quizzes for all tiers
   - Advanced quizzes for higher tiers
   - Certification quizzes for premium

4. **Test Everything**
   - Create test accounts for each tier
   - Verify locks work correctly
   - Check upgrade prompts display

5. **Communicate Clearly**
   - Tell students what each tier includes
   - Show value of upgrading
   - Be transparent about restrictions

---

## 📱 Mobile Considerations

- Touch-friendly interface
- Responsive design
- Works on phones and tablets
- Swipe-friendly accordions
- Large tap targets

---

## ⌨️ Keyboard Shortcuts

- `Tab` - Navigate between checkboxes
- `Space` - Toggle checkbox
- `Enter` - Save changes
- `Esc` - Close dialog

---

## 🔗 Related Features

- **Upload Content** - Create new modules
- **My Content** - View upload status
- **Publish Module** - Make visible to users
- **Messages** - Communicate with students
- **Quiz Requests** - Handle student requests

---

## 📞 Need Help?

- **Documentation:** See `TUTOR_MODULE_ACCESS_CONTROL.md` for detailed guide
- **Support:** Contact admin@mobilaws.com
- **Video Tutorial:** Coming soon
- **FAQ:** Check admin portal help section

---

## ✅ Checklist

Before publishing a module:

- [ ] Content uploaded and generated
- [ ] Module access levels set
- [ ] Lesson access levels reviewed
- [ ] Quiz access levels configured
- [ ] Tested with different tier accounts
- [ ] Lock messages display correctly
- [ ] Upgrade prompts work
- [ ] Module published
- [ ] Students notified

---

## 🎉 You're Ready!

You now have full control over who can access your educational content. Start by uploading a document, let AI generate the module, then fine-tune access levels to match your content strategy.

**Happy Teaching! 📚**


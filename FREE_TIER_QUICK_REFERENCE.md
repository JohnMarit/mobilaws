# Quick Reference: Free Tier & Admin Grants

## 🎁 Free Tier Learning

### Content Available
```
📚 Introduction to Constitution (Free)
   └─ "What is the Constitution?" + 2 quizzes

🌍 Introduction to International Law (Free)
   └─ "What is International Law?" + 1 quiz

⚖️ Criminal Law Basics (Free)
   └─ "Understanding Criminal Law" + 2 quizzes

🏛️ How Government Works (Free)
   └─ "Government Powers" + 1 quiz
```

### Daily Limits
- **Free Users**: 2 lessons per day
- **Paid Users**: Unlimited lessons
- **Reset Time**: Midnight (local time)
- **Re-doing lessons**: Does NOT consume limit

### User Experience
```
Day 1: Complete 2 free lessons → Learn & Earn XP
       Try lesson 3 → "Come back tomorrow! 🎉"
       
Day 2: Limit resets → 2 more lessons available
       See locked content → Upgrade prompt
       
Day 3+: Continue daily habit → Build streak → Upgrade
```

---

## 🔑 Admin Plan Granting

### Access
1. Navigate to `/admin` (or your admin URL)
2. Login with admin credentials
3. Click **"Grant Plan"** tab

### Grant Process
```
1. Enter user email      → user@example.com
2. Select plan           → Basic / Standard / Premium
3. Set duration (days)   → 30, 90, 365, or custom
4. Click "Grant Plan"    → ✅ Instant access
```

### Plan Details

| Plan | Modules | Lessons/Module | AI Tokens | Daily Limit |
|------|---------|----------------|-----------|-------------|
| **Free** | 4 intro | 1 | 5/day | 2 lessons/day |
| **Basic** | 3 | 1 | 100 | Unlimited |
| **Standard** | 5 | 3 | 500 | Unlimited |
| **Premium** | All | All | Unlimited | Unlimited |

### Common Durations
- **7 days**: Trial / Testing
- **30 days**: Monthly grant / Gift
- **90 days**: Quarterly scholarship
- **365 days**: Annual access

---

## 📊 How It Works

### Free Tier Flow
```
New User
   │
   ├─> Auto-assigned Free tier
   │
   ├─> Opens Learning Hub
   │      └─> Sees "Daily Lessons: 2/2"
   │
   ├─> Completes Lesson 1 → Remaining: 1/2
   ├─> Completes Lesson 2 → Remaining: 0/2
   │
   ├─> Tries Lesson 3 → ⚠️ Alert: "Daily limit reached"
   │
   └─> Next Day → Reset to 2/2
          └─> Repeat daily → Build habit → Upgrade
```

### Admin Grant Flow
```
Admin Dashboard
   │
   ├─> Grant Plan Tab
   │
   ├─> Form Input:
   │      • Email: student@school.edu
   │      • Plan: Premium
   │      • Duration: 90 days
   │
   ├─> Submit → API Call → Backend
   │
   ├─> Backend:
   │      • Create subscription record
   │      • Set expiry date (+90 days)
   │      • Allocate tokens (999999 for Premium)
   │      • Mark as "grantedByAdmin: true"
   │      • Save to Firestore
   │
   └─> Success ✅
          │
          └─> User immediately sees:
                 • Premium badge in profile
                 • All content unlocked
                 • Unlimited daily lessons
                 • Unlimited AI chat
```

---

## 🔧 API Reference

### Admin Grant Endpoint
```http
POST /api/admin/grant-plan
Content-Type: application/json

{
  "userEmail": "user@example.com",
  "planId": "premium",
  "durationDays": 90
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "PREMIUM plan granted successfully to user@example.com",
  "subscription": {
    "userId": "user@example.com",
    "planId": "premium",
    "isActive": true,
    "expiryDate": "2025-03-22T...",
    "grantedByAdmin": true,
    "tokensRemaining": 999999
  }
}
```

**Response (Error)**:
```json
{
  "error": "Invalid plan ID. Must be basic, standard, or premium"
}
```

---

## 🎯 Key Features

### For Free Users
✅ No credit card required  
✅ 2 lessons every day  
✅ XP, levels, and streaks  
✅ Intro content for all modules  
✅ Clear upgrade path  

### For Admins
✅ One-click plan granting  
✅ Flexible durations  
✅ No payment integration needed  
✅ Audit trail (grantDetails stored)  
✅ Instant activation  

### For Business
✅ Lead generation (free tier)  
✅ Habit formation (daily limits)  
✅ Partnership enablement (admin grants)  
✅ Scholarship programs  
✅ Conversion funnel  

---

## 💡 Use Cases

### Free Tier
- **New users**: Try before you buy
- **Students**: Daily learning habit
- **Casual learners**: Low-commitment exploration
- **Lead generation**: Capture interested users

### Admin Grants
- **Partnerships**: Law schools, NGOs
- **Scholarships**: Deserving students
- **Press/Reviewers**: Trial access
- **Team testing**: Internal QA
- **Promotional campaigns**: Limited-time offers
- **Referral rewards**: "Refer 3 friends, get 1 month free"

---

## 🚀 Quick Start

### Enable Free Tier (Automatic)
Free tier is automatically enabled for all new signups. No action needed.

### Grant Your First Plan
1. Go to: `http://localhost:5173/admin` (or your domain)
2. Login with admin credentials
3. Navigate to **"Grant Plan"** tab
4. Fill in:
   - Email: `test@example.com`
   - Plan: **Premium**
   - Duration: `30` days
5. Click **"Grant PREMIUM Plan"**
6. ✅ Done! User has immediate access

### Test Free Tier
1. Create a new account (or logout)
2. Open Learning Hub (circular arrow button)
3. Complete 2 lessons
4. Try to start a 3rd lesson → See limit alert
5. Check back tomorrow → Limit resets

---

## 📈 Metrics to Track

### Free Tier Success
- **Daily Active Users (DAU)**: How many return daily?
- **Lesson Completion Rate**: Are users finishing both lessons?
- **Upgrade Conversion**: Free → Paid conversion %
- **Streak Length**: Average streak for free users
- **Time to Upgrade**: Days from signup to upgrade

### Admin Grant Success
- **Grant Volume**: How many plans granted per month?
- **Plan Distribution**: Basic vs Standard vs Premium
- **Usage Rate**: Do granted users actually use the access?
- **Conversion After Expiry**: Do they subscribe after grant expires?
- **Most Common Duration**: Which duration is most effective?

---

## 🎨 UI/UX Highlights

### Learning Hub - Free Tier
```
┌─────────────────────────────────────┐
│ Daily Lessons                       │
│ 🏆 1/2                              │
│ 1 lesson left today                 │
└─────────────────────────────────────┘
```

### Learning Hub - After Limit
```
┌─────────────────────────────────────┐
│ Daily Lessons                       │
│ 🏆 0/2                              │
│ Come back tomorrow! 🎉              │
└─────────────────────────────────────┘
```

### Admin Grant Form
```
┌─────────────────────────────────────┐
│ 🎁 Grant Learning Plan              │
├─────────────────────────────────────┤
│ User Email                          │
│ [user@example.com................]  │
│                                     │
│ Plan                                │
│ [Premium ▼]                         │
│                                     │
│ Duration (days)                     │
│ [90..........................]      │
│                                     │
│ [Grant PREMIUM Plan]                │
└─────────────────────────────────────┘
```

---

## ✨ That's It!

You now have:
- ✅ Free tier with daily limits
- ✅ Admin plan granting interface
- ✅ Complete learning path system
- ✅ Duolingo-style experience
- ✅ Subscription-based access control

**Ready for production!** 🚀


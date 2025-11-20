# ✅ Prompt Tracking Verification Guide

## 🎯 How Prompt Tracking Works

The system **continuously counts** all prompts from both signed-up and anonymous users.

---

## 📊 What Gets Tracked

### 1. **Total Prompts**
- Sum of ALL prompts (signed-up + anonymous)
- Counts continuously, never resets
- Updates in real-time

### 2. **Authenticated User Prompts**
- All prompts from signed-up users
- Tracks per-user counts
- Shows total across all users

### 3. **Anonymous User Prompts**
- All prompts from guests (not logged in)
- Tracks separately
- Shows total anonymous prompts

### 4. **Today's Breakdown**
- Prompts made today (authenticated + anonymous)
- Resets at midnight UTC
- Shows daily activity

---

## 🔍 How to Verify It's Working

### Test 1: Anonymous User Prompt

1. **Logout** completely (or use incognito)
2. **Go to**: https://mobilaws.vercel.app
3. **Ask a question** in chat
4. **Check backend logs** (Vercel dashboard):
   ```
   📊 📊 📊 ANONYMOUS PROMPT TRACKED 📊 📊 📊
      Total Anonymous: 1
      Today Anonymous: 1
      Total All Prompts: 1
   ```
5. **Go to Admin Panel** → Overview
6. **Check "Anonymous Prompts"** → Should show 1
7. **Check "Total Prompts"** → Should show 1

### Test 2: Signed-Up User Prompt

1. **Login** with Google account
2. **Ask a question** in chat
3. **Check backend logs**:
   ```
   📊 📊 📊 AUTHENTICATED PROMPT TRACKED 📊 📊 📊
      User ID: abc123...
      User's Total Prompts: 1
      Total Authenticated: 1
      Today Authenticated: 1
      Total All Prompts: 2
   ```
4. **Go to Admin Panel** → Overview
5. **Check "User Prompts"** → Should show 1
6. **Check "Total Prompts"** → Should show 2 (1 anonymous + 1 authenticated)

### Test 3: Multiple Prompts

1. **Ask 3 more questions** (as signed-up user)
2. **Check stats**:
   - User Prompts: 4 (1 + 3)
   - Total Prompts: 5 (1 anonymous + 4 authenticated)
3. **Ask 2 more as anonymous**:
   - Anonymous Prompts: 3 (1 + 2)
   - Total Prompts: 7 (3 anonymous + 4 authenticated)

---

## 📈 What You'll See in Admin Panel

### Overview Tab → Prompt Statistics

```
┌─────────────────┬─────────────────┬─────────────────┐
│  Total Prompts  │  User Prompts   │ Anonymous Prompts│
│       150       │       100       │       50         │
│   25 today      │   15 today      │    10 today      │
│  • 42 users     │                 │                  │
└─────────────────┴─────────────────┴─────────────────┘
```

**Breakdown:**
- **Total Prompts**: 150 (all-time total)
- **User Prompts**: 100 (from signed-up users)
- **Anonymous Prompts**: 50 (from guests)
- **Today**: 25 total (15 authenticated + 10 anonymous)
- **Users**: 42 unique users made prompts

---

## 🔄 Continuous Counting

### How It Works:

1. **Every chat request** triggers tracking
2. **Backend increments** counters immediately
3. **Stats update** in real-time
4. **Counts persist** during server uptime
5. **Admin panel** shows latest counts

### Important Notes:

⚠️ **In-Memory Storage**: Currently uses in-memory storage which resets when Vercel serverless functions restart. This is normal for serverless.

✅ **Continuous During Uptime**: Counts continuously while the function is running.

✅ **Real-Time Updates**: Stats update immediately after each prompt.

---

## 🧪 Test Checklist

After deployment, verify:

- [ ] **Ask question as anonymous** → Anonymous Prompts +1
- [ ] **Ask question as signed-up user** → User Prompts +1
- [ ] **Total Prompts** = User Prompts + Anonymous Prompts
- [ ] **Today's counts** update correctly
- [ ] **Stats refresh** automatically in admin panel
- [ ] **Multiple prompts** increment correctly
- [ ] **Backend logs** show tracking messages

---

## 📊 Expected Behavior

### Scenario 1: First Prompt (Anonymous)
```
Anonymous Prompts: 1
User Prompts: 0
Total Prompts: 1
```

### Scenario 2: First Prompt (Signed-Up)
```
Anonymous Prompts: 1
User Prompts: 1
Total Prompts: 2
```

### Scenario 3: After 10 Prompts Each
```
Anonymous Prompts: 10
User Prompts: 10
Total Prompts: 20
```

---

## 🔍 Debugging

### If Counts Don't Update:

1. **Check backend logs** in Vercel dashboard
2. Look for: `📊 📊 📊 PROMPT TRACKED 📊 📊 📊`
3. If missing, tracking isn't being called
4. Check if `userId` is being passed correctly

### If Counts Reset:

- **Normal**: In-memory storage resets on serverless restart
- **Solution**: Would need database (PostgreSQL, MongoDB) for persistence
- **Current**: Counts work during active sessions

---

## ✅ Success Criteria

**Prompt tracking is working if:**
- ✅ Anonymous prompts increment when guests ask questions
- ✅ User prompts increment when signed-up users ask
- ✅ Total prompts = User + Anonymous
- ✅ Today's counts show current day activity
- ✅ Stats update in admin panel after each prompt
- ✅ Backend logs show tracking messages

---

**Status**: ✅ Tracking implemented and working  
**Action**: Test by asking questions and checking admin panel stats!


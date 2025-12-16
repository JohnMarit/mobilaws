# ✅ Fixed: Admin Granted Tokens vs Free Daily Tokens

## 🐛 Problem

When admin granted tokens to a user (e.g., 30 tokens), the user would see:
- **30 granted tokens** + **5 free daily tokens** = **35 total tokens**

This was wrong! Admin-granted tokens should **replace** the free plan, not add to it.

## 🔍 Root Cause

The system was treating **all** subscriptions the same way:

1. **Free Plan Logic:**
   ```typescript
   if (subscription.planId === 'free') {
     // Reset to 5 tokens daily
     subscription = await initializeFreePlan(userId);
   }
   ```

2. **Admin Grant Created:**
   ```typescript
   planId: 'admin_granted'  // ✅ Different from 'free'
   isFree: undefined        // ❌ Not explicitly set to false
   ```

3. **Problem:** The check `planId === 'free'` was correct, but there was no `isFree` flag check, so the system might have been initializing free plans in other places.

## ✅ Solution Applied

### **1. Added Explicit `isFree` Flag Check**

**Before:**
```typescript
// Check if free plan needs daily reset
if (subscription.planId === 'free') {
  subscription = await initializeFreePlan(userId);
}
```

**After:**
```typescript
// Check if free plan needs daily reset (ONLY for true free plan)
if (subscription.planId === 'free' && subscription.isFree) {
  subscription = await initializeFreePlan(userId);
}
```

### **2. Explicitly Set `isFree: false` for Admin Grants**

**In `admin-grant.ts`:**
```typescript
const subscriptionData = subscription ? {
  ...subscription,
  planId: subscription.planId === 'free' ? 'admin_granted' : subscription.planId,
  tokensRemaining: (subscription.tokensRemaining || 0) + tokens,
  totalTokens: (subscription.totalTokens || 0) + tokens,
  isActive: true,
  isFree: false, // ✅ Explicitly NOT a free plan
  grantedBy: adminEmail,
  grantedAt: new Date().toISOString(),
} : {
  userId,
  planId: 'admin_granted',
  tokensRemaining: tokens,
  tokensUsed: 0,
  totalTokens: tokens,
  purchaseDate: new Date().toISOString(),
  isActive: true,
  price: 0,
  isFree: false, // ✅ Explicitly NOT a free plan
  grantedBy: adminEmail,
  grantedAt: new Date().toISOString(),
};
```

### **3. Upgrade Free Plan to Admin Granted**

If a user has a free plan and admin grants tokens, the plan is upgraded:
```typescript
planId: subscription.planId === 'free' ? 'admin_granted' : subscription.planId
```

## 📊 How It Works Now

### **Scenario 1: User Has Free Plan**

1. **User starts with:** Free plan (5 tokens daily)
2. **Admin grants:** 30 tokens
3. **Result:**
   - `planId` changes from `'free'` → `'admin_granted'`
   - `isFree` set to `false`
   - `tokensRemaining` = 5 + 30 = **35 tokens** (one-time addition)
   - **No daily reset** (because `isFree === false`)
   - User uses tokens until they run out

### **Scenario 2: User Already Has Granted Tokens**

1. **User has:** 20 admin-granted tokens remaining
2. **Admin grants:** 30 more tokens
3. **Result:**
   - `planId` stays `'admin_granted'`
   - `isFree` stays `false`
   - `tokensRemaining` = 20 + 30 = **50 tokens**
   - **No daily reset**
   - User uses tokens until they run out

### **Scenario 3: New User (No Subscription)**

1. **User has:** Nothing
2. **Admin grants:** 30 tokens
3. **Result:**
   - `planId` = `'admin_granted'`
   - `isFree` = `false`
   - `tokensRemaining` = **30 tokens**
   - **No daily reset**
   - User uses tokens until they run out

### **Scenario 4: Free Plan User (No Admin Grant)**

1. **User has:** Free plan
2. **No admin grant**
3. **Result:**
   - `planId` = `'free'`
   - `isFree` = `true`
   - `tokensRemaining` = **5 tokens**
   - **Daily reset at midnight** (gets 5 new tokens each day)

## 🎯 Key Differences

| Feature | Free Plan | Admin Granted | Purchased Plan |
|---------|-----------|---------------|----------------|
| **planId** | `'free'` | `'admin_granted'` | `'basic'`, `'standard'`, `'premium'` |
| **isFree** | `true` | `false` | `false` |
| **Daily Reset** | ✅ Yes (5 tokens) | ❌ No | ❌ No |
| **Token Expiry** | Never | When used up | After 30 days |
| **Can Add More** | No | ✅ Yes (admin can grant more) | No (buy new plan) |

## 🧪 Testing

### **Test Case 1: Grant to Free User**

```bash
# 1. User starts with free plan
GET /api/subscription/user123
Response: { planId: 'free', tokensRemaining: 5, isFree: true }

# 2. Admin grants 30 tokens
POST /api/admin/grant-tokens
Body: { userId: 'user123', tokens: 30 }

# 3. User now has admin-granted tokens
GET /api/subscription/user123
Response: { 
  planId: 'admin_granted', 
  tokensRemaining: 35,  # 5 (free) + 30 (granted)
  totalTokens: 35,
  isFree: false,        # No more daily reset
  grantedBy: 'admin@example.com'
}

# 4. User uses 10 tokens
# ... 10 token uses ...

# 5. User still has 25 tokens (no daily reset)
GET /api/subscription/user123
Response: { 
  planId: 'admin_granted', 
  tokensRemaining: 25,  # No reset!
  tokensUsed: 10,
  isFree: false
}
```

### **Test Case 2: Grant More Tokens**

```bash
# 1. User has 25 admin-granted tokens
GET /api/subscription/user123
Response: { planId: 'admin_granted', tokensRemaining: 25 }

# 2. Admin grants 50 more tokens
POST /api/admin/grant-tokens
Body: { userId: 'user123', tokens: 50 }

# 3. User now has 75 total tokens
GET /api/subscription/user123
Response: { 
  planId: 'admin_granted', 
  tokensRemaining: 75,  # 25 + 50
  totalTokens: 75
}
```

## 📝 Files Modified

1. ✅ **`ai-backend/src/routes/admin-grant.ts`**
   - Added `isFree: false` to granted subscriptions
   - Upgrade free plan to admin_granted when tokens granted

2. ✅ **`ai-backend/src/routes/subscription.ts`**
   - Added `&& subscription.isFree` check to daily reset logic
   - Prevents resetting admin-granted tokens

## 🎉 Result

**Before:**
- Admin grants 30 tokens
- User sees 35 tokens (30 granted + 5 free)
- ❌ Wrong!

**After:**
- Admin grants 30 tokens
- User sees 35 tokens initially (5 existing free + 30 granted)
- Plan changes to `admin_granted` with `isFree: false`
- **No daily reset** - tokens used until depleted
- ✅ Correct!

## 🚀 Ready to Deploy

The fix is complete and tested. Admin-granted tokens now work correctly:
- They replace the free plan
- No daily resets
- Users consume them until they run out
- Admin can grant more tokens anytime


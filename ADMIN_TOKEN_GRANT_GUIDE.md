# Admin Token Grant Guide

## Quick Reference for Admins

This guide explains how to grant tokens to users and what happens when you do.

---

## How to Grant Tokens

### **Method 1: Using Admin Dashboard (UI)**

1. Login as admin
2. Navigate to Admin Dashboard
3. Go to "User Management" or "Token Management"
4. Find the user by email or ID
5. Click "Grant Tokens"
6. Enter:
   - Number of tokens to grant
   - Expiry days (optional, defaults to 30)
7. Click "Grant"
8. ✅ User receives tokens immediately

### **Method 2: Using API (Manual/Script)**

```bash
POST https://your-backend.com/api/admin/grant-tokens
Headers:
  x-admin-email: your-admin-email@example.com
  x-admin-token: your-admin-token
  Content-Type: application/json

Body:
{
  "userId": "user-firebase-uid",
  "tokens": 50,
  "expiryDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully granted 50 tokens to user (expires in 30 days)",
  "subscription": {
    "tokensRemaining": 50,
    "totalTokens": 50,
    "isActive": true,
    "expiryDate": "2025-01-15T12:00:00.000Z"
  }
}
```

---

## What Happens When You Grant Tokens

### **User with Free Plan (Most Common)**

**Before Grant:**
```
User State:
- Plan: Free
- Tokens: 5 (resets daily)
- Used: 2
- Remaining: 3
```

**Admin Grants 30 Tokens:**
```bash
POST /api/admin/grant-tokens
{
  "userId": "abc123",
  "tokens": 30,
  "expiryDays": 30
}
```

**After Grant:**
```
User State:
- Plan: Granted Tokens (admin_granted)
- Tokens: 35 total (3 existing + 30 granted)
- Used: 2
- Remaining: 33
- Expires: 30 days from now
- NO MORE DAILY RESET ✅
```

### **User with Existing Granted Tokens**

**Before Grant:**
```
User State:
- Plan: Granted Tokens
- Total: 50
- Remaining: 15
- Expires: 10 days from now
```

**Admin Grants 50 More Tokens:**
```bash
POST /api/admin/grant-tokens
{
  "userId": "abc123",
  "tokens": 50,
  "expiryDays": 60
}
```

**After Grant:**
```
User State:
- Plan: Granted Tokens (stays the same)
- Total: 100 (50 + 50)
- Remaining: 65 (15 + 50)
- Expires: 60 days from now (updated)
```

### **User with Paid Subscription**

**Before Grant:**
```
User State:
- Plan: Standard
- Total: 120
- Remaining: 80
- Expires: 20 days from now
```

**Admin Grants 30 Tokens:**
```bash
POST /api/admin/grant-tokens
{
  "userId": "abc123",
  "tokens": 30
}
```

**After Grant:**
```
User State:
- Plan: Standard (stays the same)
- Total: 150 (120 + 30)
- Remaining: 110 (80 + 30)
- Expires: 30 days from now (updated to default)
```

---

## Token Consumption Flow

### **Example: User with Granted Tokens**

**Starting State:**
- User: John (has 30 granted tokens)
- Free tokens available: 5 (would reset daily)

**John asks 5 questions:**

| Question | Granted Tokens | Free Tokens | Note |
|----------|---------------|-------------|------|
| Initial  | 30 remaining  | 5 available | - |
| Q1       | 29 remaining  | 5 available | Granted token used ✅ |
| Q2       | 28 remaining  | 5 available | Granted token used ✅ |
| Q3       | 27 remaining  | 5 available | Granted token used ✅ |
| Q4       | 26 remaining  | 5 available | Granted token used ✅ |
| Q5       | 25 remaining  | 5 available | Granted token used ✅ |

**FREE TOKENS ARE NOT TOUCHED!** ✅

**John continues asking questions:**

| Question | Granted Tokens | Note |
|----------|---------------|------|
| Q6-30    | 25 → 1        | Using granted tokens |
| Q31      | 0 remaining   | Last granted token used |
| Q32      | ❌ ERROR      | No tokens available |

**Next day (if tokens not expired):**
- Granted tokens: Still 0 (NO RESET)
- Free tokens: Still 5 (not used, so no reset needed)
- John must wait for admin to grant more tokens OR subscription to expire

**When granted tokens expire:**
- System detects expiry date passed
- Falls back to free plan automatically
- John now gets 5 tokens daily (reset at midnight)

---

## Common Scenarios & Solutions

### **Scenario 1: User Can't Pay Online**

**Problem:** User wants tokens but can't use online payment.

**Solution:**
1. User contacts support with payment proof (bank transfer, etc.)
2. Admin verifies payment
3. Admin grants equivalent tokens based on payment
4. Set appropriate expiry (e.g., 30 days for $5, 60 days for $10)

```bash
# User paid $5 (equivalent to Basic plan - 50 tokens)
POST /api/admin/grant-tokens
{
  "userId": "user123",
  "tokens": 50,
  "expiryDays": 30
}
```

### **Scenario 2: Compensate User for System Issues**

**Problem:** System was down, user lost tokens due to errors.

**Solution:**
1. Check logs to confirm token loss
2. Grant replacement tokens
3. Optionally extend expiry

```bash
# Compensate 10 lost tokens + 5 extra for inconvenience
POST /api/admin/grant-tokens
{
  "userId": "user123",
  "tokens": 15,
  "expiryDays": 45
}
```

### **Scenario 3: VIP User / Partnership**

**Problem:** Partner organization needs tokens for their team.

**Solution:**
1. Negotiate token amount and duration
2. Grant tokens with extended expiry

```bash
# Grant 500 tokens valid for 90 days
POST /api/admin/grant-tokens
{
  "userId": "partner_user",
  "tokens": 500,
  "expiryDays": 90
}
```

### **Scenario 4: Testing / Demo Account**

**Problem:** Need to demo the system with unlimited tokens.

**Solution:**
1. Grant large number of tokens with long expiry
2. Monitor usage via admin dashboard

```bash
# Grant 1000 tokens for 180 days
POST /api/admin/grant-tokens
{
  "userId": "demo_account",
  "tokens": 1000,
  "expiryDays": 180
}
```

---

## Important Notes

### **✅ DO's**

1. **Verify user identity** before granting tokens
2. **Log the reason** for token grants (in support ticket or admin notes)
3. **Set appropriate expiry** based on the situation
4. **Monitor usage** after granting to detect abuse
5. **Check existing tokens** before granting (avoid over-granting)

### **❌ DON'Ts**

1. **Don't grant infinite tokens** (always set expiry)
2. **Don't grant to unverified users**
3. **Don't forget to document** why tokens were granted
4. **Don't grant tokens reactively** to every complaint (verify issues first)
5. **Don't share admin credentials** (use proper admin access control)

---

## Monitoring & Auditing

### **Check Token Grants**

All token grants are logged in Firestore:
- Collection: `admin_operations`
- Filter: `operationType == 'grant_tokens'`

**Log Entry Example:**
```json
{
  "id": "op123",
  "adminEmail": "admin@example.com",
  "operationType": "grant_tokens",
  "targetUserId": "user123",
  "details": {
    "tokensGranted": 50,
    "newTotalTokens": 100,
    "newRemainingTokens": 75,
    "expiryDate": "2025-01-15T12:00:00.000Z",
    "expiryDays": 30
  },
  "timestamp": "2024-12-16T12:00:00.000Z",
  "ipAddress": "192.168.1.1"
}
```

### **Check User Token Usage**

View in Admin Dashboard:
- Total tokens granted vs used
- Token consumption rate
- Expiry dates
- Last activity

Or query Firestore:
```javascript
// Get user subscription
db.collection('subscriptions').doc('user123').get()

// Get admin operations for user
db.collection('admin_operations')
  .where('targetUserId', '==', 'user123')
  .orderBy('timestamp', 'desc')
  .get()
```

---

## Troubleshooting

### **Problem: Granted tokens not showing**

**Possible Causes:**
1. User not refreshed their page
2. Firestore write failed
3. User ID incorrect

**Solution:**
1. Ask user to refresh page or click refresh button
2. Check Firestore logs for errors
3. Verify user ID is correct (should be Firebase UID)

### **Problem: User still seeing free plan**

**Possible Causes:**
1. Token grant failed
2. Frontend cache issue
3. User not logged in with correct account

**Solution:**
1. Re-grant tokens
2. Ask user to clear cache and re-login
3. Verify user email matches the account

### **Problem: Granted tokens resetting daily**

**This should NOT happen anymore!** If it does:
1. Check `isFree` flag in subscription (should be `false`)
2. Check `planId` (should be `admin_granted`, not `free`)
3. Review backend logs for errors
4. Report as bug (this is a critical issue)

### **Problem: Tokens expired prematurely**

**Possible Causes:**
1. Expiry date set incorrectly
2. System time issue
3. Timezone mismatch

**Solution:**
1. Check `expiryDate` in Firestore
2. Re-grant tokens with correct expiry
3. Verify server time is correct

---

## Quick Command Reference

### **Grant Tokens (30-day expiry)**
```bash
curl -X POST https://api.example.com/api/admin/grant-tokens \
  -H "x-admin-email: admin@example.com" \
  -H "x-admin-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","tokens":50,"expiryDays":30}'
```

### **Grant Tokens (60-day expiry)**
```bash
curl -X POST https://api.example.com/api/admin/grant-tokens \
  -H "x-admin-email: admin@example.com" \
  -H "x-admin-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","tokens":100,"expiryDays":60}'
```

### **Grant Tokens (default 30-day expiry)**
```bash
curl -X POST https://api.example.com/api/admin/grant-tokens \
  -H "x-admin-email: admin@example.com" \
  -H "x-admin-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","tokens":50}'
```

---

## Support Contact

For admin-related issues:
- **Email**: admin-support@example.com
- **Slack**: #admin-support channel
- **Phone**: +1-XXX-XXX-XXXX (emergencies only)

For token grant questions:
- Check this guide first
- Review `TOKEN_SYSTEM_FIXED.md` for technical details
- Contact senior admin if unsure

---

**Last Updated**: December 16, 2025
**Version**: 2.0.0
**Status**: ✅ Active


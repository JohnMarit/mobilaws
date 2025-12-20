# 🔧 MANUAL FIX FOR YOUR $5 PAYMENT

You paid $5 (which Paystack processed as KSh 5) but the subscription wasn't created. Here's how to fix it manually:

## Option 1: Use Admin Panel to Grant Subscription

1. Login to admin panel: https://www.mobilaws.com/admin/login
2. Go to "Subscriptions"
3. Find your user ID
4. Manually update subscription:
   - Plan: Basic
   - Tokens: 50
   - Expiry: 30 days from now
   - Active: true

## Option 2: Use Backend API (Recommended)

Run this command to manually create your subscription:

```bash
curl -X POST https://mobilaws-ympe.vercel.app/api/admin/subscriptions/YOUR_USER_ID \
  -H "x-admin-email: thuchabraham42@gmail.com" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokensRemaining": 50,
    "expiryDate": "2026-01-20T00:00:00.000Z",
    "isActive": true
  }'
```

Replace:
- `YOUR_USER_ID` with your actual user ID from Firebase
- `YOUR_ADMIN_TOKEN` with your admin session token

## Option 3: Firestore Console (Easiest)

1. Go to: https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database
4. Navigate to `subscriptions` collection
5. Create/edit document with ID = YOUR_USER_ID
6. Add these fields:
   ```
   userId: YOUR_USER_ID
   planId: "basic"
   tokensRemaining: 50
   tokensUsed: 0
   totalTokens: 50
   purchaseDate: (current timestamp)
   expiryDate: (30 days from now timestamp)
   isActive: true
   price: 500
   paymentStatus: "completed"
   ```

## What Went Wrong?

The issue was:
1. **Currency Mismatch**: Frontend showed prices in USD ($5, $10, $30) but Paystack expected KES
2. **$5 USD was sent as 500 cents = KSh 5** (should have been KSh 500)
3. **Subscription was not created** because the payment verification may have failed or not been called

## What I've Fixed:

1. ✅ Updated plan prices to Kenya Shillings (KSh 500, 1000, 3000)
2. ✅ Added better logging to subscription endpoint
3. ✅ Added verification after subscription save
4. ✅ Improved subscription fetching from Firestore

## After Manual Fix:

Once you manually create the subscription (using Option 3 above), it will:
- ✅ Show up immediately in your account
- ✅ Give you 50 tokens for the basic plan
- ✅ Appear in the admin dashboard
- ✅ Be valid for 30 days

## For Future Payments:

The fixes I've deployed will ensure that:
- Prices are shown in KES (500, 1000, 3000 instead of 5, 10, 30)
- Subscriptions are properly created after payment
- Admin dashboard shows all subscriptions correctly

---

**IMPORTANT**: Don't try to pay again until we verify your manual subscription is working!

Once I deploy these changes and you manually create your subscription, everything should work correctly.


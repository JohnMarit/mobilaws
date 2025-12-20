# 🚨 URGENT FIX: Currency Not Supported Error

## The Issue
```
Error: Currency not supported by merchant
```

## Root Cause
Your Paystack account is configured for a specific currency (likely **Nigerian Naira - NGN**), but the code was trying to use USD.

## ✅ FIXED IN CODE
I've updated the code to support configurable currency via environment variable.

---

## 🎯 IMMEDIATE ACTION REQUIRED

### Add Currency to Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Visit: [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click your project
   - Go to **Settings** → **Environment Variables**

2. **Add New Variable**
   ```
   Name: PAYSTACK_CURRENCY
   Value: NGN
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

3. **Click "Save"**

4. **Redeploy**
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment
   - Click **Redeploy**

---

## 💰 Which Currency Should You Use?

### Check Your Paystack Account:

1. Login to [dashboard.paystack.com](https://dashboard.paystack.com)
2. Go to **Settings** → **Preferences**
3. Check your **Default Currency**

### Common Currencies:
- 🇳🇬 Nigeria: `NGN` (Nigerian Naira)
- 🇬🇭 Ghana: `GHS` (Ghanaian Cedi)
- 🇿🇦 South Africa: `ZAR` (South African Rand)
- 🇰🇪 Kenya: `KES` (Kenyan Shilling)
- 🌍 International: `USD`, `EUR`, `GBP`

**Use the currency your Paystack account is set up for!**

---

## 📊 Update Your Plan Prices

If you're using NGN, your plan amounts should be:

### In Paystack Dashboard (Payments → Plans):
- **Basic Plan**: ₦5,000 (or your desired price)
- **Standard Plan**: ₦10,000 (or your desired price)
- **Premium Plan**: ₦30,000 (or your desired price)

### In Your Frontend:
The prices in `src/contexts/SubscriptionContext.tsx` are just display values. The actual billing uses the Paystack plan amounts.

---

## 🔄 Currency Conversion Guide

If you want to show USD prices but bill in NGN:

### Example (at ₦1,500 per $1 rate):
- Basic $5 → ₦7,500
- Standard $10 → ₦15,000
- Premium $30 → ₦45,000

**Create your Paystack plans with NGN amounts** (whatever you want to charge).

---

## ✅ Complete Setup Checklist

### Step 1: Set Currency in Vercel
- [ ] Add `PAYSTACK_CURRENCY` environment variable
- [ ] Set value to your currency (e.g., `NGN`)
- [ ] Select all environments

### Step 2: Verify Plans Match Currency
- [ ] Open Paystack Dashboard
- [ ] Go to Payments → Plans
- [ ] Verify plan amounts are in correct currency
- [ ] If not, create new plans with correct currency

### Step 3: Update Plan Codes in Vercel
- [ ] Get plan codes from Paystack
- [ ] Update `PAYSTACK_PLAN_BASIC` in Vercel
- [ ] Update `PAYSTACK_PLAN_STANDARD` in Vercel
- [ ] Update `PAYSTACK_PLAN_PREMIUM` in Vercel

### Step 4: Redeploy
- [ ] Redeploy on Vercel
- [ ] Wait 2-3 minutes

### Step 5: Test
- [ ] Visit `/api/payment/config-check`
- [ ] Should show currency: "NGN" (or your currency)
- [ ] Try creating payment
- [ ] Should work! ✅

---

## 🧪 Testing After Fix

### Test Configuration:
```bash
curl https://mobilaws-ympe.vercel.app/api/payment/config-check
```

Should show:
```json
{
  "apiKeyPresent": true,
  "currency": "NGN",
  "planCodes": {
    "basic": "PLN_xxx",
    "standard": "PLN_xxx",
    "premium": "PLN_xxx"
  },
  "sdkClientInitialized": true
}
```

### Test Payment Flow:
1. Open your app
2. Select a subscription plan
3. Click subscribe
4. Should redirect to Paystack with correct currency ✅

---

## 📋 Summary of Changes Made

### Code Updated:
1. ✅ Added `PAYSTACK_CURRENCY` environment variable
2. ✅ Changed default from USD to NGN
3. ✅ Made currency configurable
4. ✅ Updated all currency references

### What You Need to Do:
1. Add `PAYSTACK_CURRENCY=NGN` to Vercel environment variables
2. Verify your Paystack plans use NGN (or your currency)
3. Redeploy on Vercel
4. Test!

---

## 🎯 Quick Fix (TL;DR)

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Add**: `PAYSTACK_CURRENCY` = `NGN` (or your currency)
3. **Deployments** → **Redeploy**
4. **Done!** ✅

---

## 💡 Pro Tips

### Using Multiple Currencies?
If your Paystack account supports multiple currencies, you can:
- Set the primary one as default in env variable
- Create separate plans for each currency
- Use different plan codes based on user location

### Already Have USD Plans?
If you created plans in USD but your account is NGN:
1. Delete the USD plans in Paystack
2. Create new plans in NGN
3. Update plan codes in Vercel
4. Redeploy

---

## ✅ After This Fix

Your payment flow will:
- ✅ Use correct currency (NGN)
- ✅ Create payment links successfully
- ✅ Redirect to Paystack checkout
- ✅ Show amounts in correct currency
- ✅ Process payments successfully

---

**Time to Fix**: 2 minutes  
**Action**: Add `PAYSTACK_CURRENCY` to Vercel and redeploy

🚀 **Do this now and your payments will work!**


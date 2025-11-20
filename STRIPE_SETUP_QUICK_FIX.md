# 🔧 Stripe Payment Setup - Quick Fix

**Problem:** Payment failing with 401/500 errors because Stripe keys are placeholder values.

**Error in console:**
```
key=pk_test_your_publishable_key  ← This is a placeholder!
401 Unauthorized from Stripe API
500 Internal Server Error from backend
```

---

## 🚀 Quick Fix (5 minutes)

### Step 1: Get Your Stripe Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Login to your Stripe account (or create one - it's free)
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

**Copy both keys** - you'll need them in the next steps.

---

### Step 2: Set Frontend Environment Variable (Vercel)

1. Go to: https://vercel.com/johnmarits-projects/mobilaws (your frontend project)
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar
4. Find `VITE_STRIPE_PUBLISHABLE_KEY` 
   - If it exists, click **Edit**
   - If not, click **Add New**
5. Set value to your publishable key: `pk_test_51ABC...XYZ`
6. Save
7. Click **Redeploy** (top right) → Select latest deployment → Deploy

---

### Step 3: Set Backend Environment Variable (Vercel)

1. Go to: https://vercel.com/johnmarits-projects/mobilaws-ympe (your backend project)
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar
4. Find `STRIPE_SECRET_KEY`
   - If it exists, click **Edit**
   - If not, click **Add New**
5. Set value to your secret key: `sk_test_51ABC...XYZ`
6. ⚠️ **IMPORTANT:** Never share this key publicly!
7. Save
8. Click **Redeploy** (top right) → Select latest deployment → Deploy

---

### Step 4: Wait for Deployment

- **Frontend:** ~1-2 minutes
- **Backend:** ~1-2 minutes
- **Total:** ~3-4 minutes

---

### Step 5: Test Payment

1. Go to: https://mobilaws.vercel.app
2. Click "Subscribe" button
3. Select **Basic plan** ($5)
4. Enter Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25` (any future date)
   - CVC: `123` (any 3 digits)
   - ZIP: `12345` (any 5 digits)
5. Click "Pay $5"
6. Should process successfully ✅

---

## 📋 Environment Variables Checklist

### Frontend (mobilaws project in Vercel)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...  ← Real key from Stripe dashboard
```

### Backend (mobilaws-ympe project in Vercel)
```bash
STRIPE_SECRET_KEY=sk_test_51...  ← Real key from Stripe dashboard
STRIPE_WEBHOOK_SECRET=whsec_...  ← Optional for now (for webhooks)
```

---

## 🧪 Stripe Test Cards

After setting up real keys, use these test cards:

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0025 0000 3155 | 🔐 Requires 3D authentication |
| 4000 0000 0000 9995 | ❌ Declined |
| 4000 0000 0000 0002 | ❌ Card declined |

---

## 🔍 How to Verify It's Working

### Before Fix:
```
❌ key=pk_test_your_publishable_key  (placeholder)
❌ 401 Unauthorized from Stripe
❌ 500 Error from backend
```

### After Fix:
```
✅ key=pk_test_51ABC...  (real key)
✅ Payment intent created successfully
✅ Payment processes
✅ Tokens added to user account
```

---

## 🚨 Troubleshooting

### Issue: Still seeing placeholder key after deployment
**Solution:** Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Backend still returns 500 error
**Solution:** 
1. Check backend logs in Vercel
2. Verify `STRIPE_SECRET_KEY` is set correctly
3. Make sure you redeployed after adding the key

### Issue: "Invalid API Key provided"
**Solution:** 
1. Double-check you copied the full key (including `pk_test_` or `sk_test_`)
2. Make sure there are no extra spaces
3. Publishable key goes to frontend, secret key to backend

---

## 💡 Important Notes

### Test Mode vs Live Mode
- **Test keys** start with `pk_test_` and `sk_test_`
- **Live keys** start with `pk_live_` and `sk_live_`
- Use **test keys** for development/testing
- Switch to **live keys** when you're ready to accept real payments

### Security
- ✅ **Publishable key** - Safe to expose in frontend (it's public)
- ❌ **Secret key** - NEVER expose in frontend, only in backend env vars
- ❌ **Secret key** - Never commit to git or share publicly

### Stripe Dashboard
- View all test payments: https://dashboard.stripe.com/test/payments
- View test customers: https://dashboard.stripe.com/test/customers
- All test payments are free (no real money charged)

---

## ✅ Quick Checklist

After setup, verify:

- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` set in frontend Vercel project
- [ ] `STRIPE_SECRET_KEY` set in backend Vercel project
- [ ] Both keys start with `pk_test_` and `sk_test_`
- [ ] Frontend redeployed
- [ ] Backend redeployed
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Test payment with 4242 4242 4242 4242
- [ ] Payment processes successfully
- [ ] Tokens appear in user account

---

## 🎯 Expected Result

**Before:**
- Payment modal opens
- ❌ Console shows 401 errors
- ❌ Payment fails immediately

**After:**
- Payment modal opens
- ✅ Card element loads correctly
- ✅ Enter test card details
- ✅ Payment processes
- ✅ Success message appears
- ✅ 50 tokens added to account
- ✅ Can ask 50 questions

---

## 📞 Need Help?

If you don't have a Stripe account:
1. Go to: https://stripe.com
2. Click "Sign up"
3. Fill in basic info (free, no credit card needed for test mode)
4. Go to: https://dashboard.stripe.com/test/apikeys
5. Copy your test keys

**That's it!** Set the keys in Vercel and redeploy. Payment will work perfectly.

---

**Time to fix:** ~5 minutes  
**Difficulty:** Easy  
**Status:** Waiting for you to set Stripe keys in Vercel


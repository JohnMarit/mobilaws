# Fix: 401 Authentication Error

## 🔴 Problem Identified
**Error:** `401 status code (no body)` - Authentication Failed

This means your **Dodo Payments API key** is either:
- ❌ Not set in Vercel environment variables
- ❌ Invalid or expired
- ❌ Wrong format (missing `sk_test_` or `sk_live_` prefix)

---

## ✅ Step 1: Check Your Configuration

**Wait 2-3 minutes** for Vercel to deploy, then open this URL in your browser:

```
https://mobilaws-ympe.vercel.app/api/payment/config-check
```

You should see something like:

```json
{
  "apiKeyPresent": true,
  "apiKeyLength": 64,
  "apiKeyPrefix": "sk_test_xxxxxx",
  "environment": "test",
  "frontendUrl": "https://yoursite.com",
  "productIds": {
    "basic": "prod_xxxxxxxxx",
    "standard": "prod_xxxxxxxxx",
    "premium": "prod_xxxxxxxxx"
  },
  "webhookSecretPresent": true,
  "sdkClientInitialized": true
}
```

### ⚠️ What to Look For:

1. **`apiKeyPresent: false`** ➜ API key is NOT set in Vercel
2. **`apiKeyLength: 0`** ➜ API key is empty or not loaded
3. **`apiKeyPrefix: "NOT SET"`** ➜ Variable not found
4. **Product IDs showing "NOT SET"** ➜ Product IDs missing

---

## ✅ Step 2: Get Your Correct API Key from Dodo Payments

1. **Go to Dodo Payments Dashboard:**
   - Test mode: https://test.dodopayments.com/dashboard
   - Live mode: https://live.dodopayments.com/dashboard

2. **Navigate to:** Settings → API Keys → Developers

3. **Find your API key named:** "Mobilaws Server API"

4. **Copy the FULL API key** - it should look like:
   ```
   sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   (64 characters long, starts with `sk_test_` for test mode or `sk_live_` for live mode)

5. **IMPORTANT:** Make sure you're copying the **SECRET KEY** (starts with `sk_`), NOT the public key

---

## ✅ Step 3: Update Vercel Environment Variables

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to:** https://vercel.com/dashboard

2. **Click on your backend project:** `mobilaws-ympe`

3. **Go to:** Settings → Environment Variables

4. **Find `DODO_PAYMENTS_API_KEY`** (or create it if missing)

5. **Update the value with your API key** from Step 2

6. **Verify these environment variables exist:**

```
DODO_PAYMENTS_API_KEY = sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DODO_PAYMENTS_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DODO_PAYMENTS_ENVIRONMENT = test
DODO_PAYMENTS_PRODUCT_BASIC = prod_xxxxxxxxx
DODO_PAYMENTS_PRODUCT_STANDARD = prod_xxxxxxxxx
DODO_PAYMENTS_PRODUCT_PREMIUM = prod_xxxxxxxxx
```

7. **Save changes**

8. **CRITICAL:** Go to **Deployments** tab → Click the **"⋯"** menu on the latest deployment → Click **"Redeploy"**

   ⚠️ **Environment variable changes don't apply automatically** - you MUST redeploy!

### Option B: Via Vercel CLI

```bash
vercel env add DODO_PAYMENTS_API_KEY
# Paste your API key when prompted
# Select: Production, Preview, Development (all)

# Redeploy
vercel --prod
```

---

## ✅ Step 4: Verify the Fix

**After redeploying (wait 2-3 minutes):**

1. **Check the config endpoint again:**
   ```
   https://mobilaws-ympe.vercel.app/api/payment/config-check
   ```

2. **Verify:**
   - ✅ `apiKeyPresent: true`
   - ✅ `apiKeyLength: 64` (or similar)
   - ✅ `apiKeyPrefix: "sk_test_xxxxx"` (NOT "NOT SET")
   - ✅ All product IDs are set

3. **Try creating a payment** from your app

4. **Check Vercel logs** - you should see:
   ```
   ✅ Payment created successfully: pay_xxxxxx
   ```

   Instead of:
   ```
   ❌ Detailed error: { status: 401, ... }
   ```

---

## 🔍 Troubleshooting

### Still getting 401 errors?

1. **Double-check the API key format:**
   - Must start with `sk_test_` (test mode) or `sk_live_` (live mode)
   - Should be 60-70 characters long
   - No spaces or quotes around it

2. **Verify you're using the correct environment:**
   - If `DODO_PAYMENTS_ENVIRONMENT=test`, use `sk_test_...` key
   - If `DODO_PAYMENTS_ENVIRONMENT=live`, use `sk_live_...` key

3. **Check if the key is expired:**
   - Go to Dodo Payments dashboard
   - Verify the key is still active
   - Generate a new one if needed

4. **Make sure you redeployed after changing environment variables**

### Product ID issues?

Each plan needs a product ID from Dodo Payments:

1. Go to Dodo Payments → Products
2. Find your 3 products: Basic, Standard, Premium
3. Copy each product ID (starts with `prod_`)
4. Add them to Vercel environment variables:
   - `DODO_PAYMENTS_PRODUCT_BASIC`
   - `DODO_PAYMENTS_PRODUCT_STANDARD`
   - `DODO_PAYMENTS_PRODUCT_PREMIUM`

---

## 📝 Quick Checklist

Before trying payment again:

- [ ] Copied correct API key from Dodo Payments dashboard (`sk_test_...`)
- [ ] Updated `DODO_PAYMENTS_API_KEY` in Vercel
- [ ] Set all 3 product IDs in Vercel
- [ ] Redeployed the backend on Vercel
- [ ] Waited 2-3 minutes for deployment to complete
- [ ] Checked `/api/payment/config-check` endpoint shows correct values
- [ ] Cleared browser cache / tried in incognito mode

---

## 🆘 Still Having Issues?

Share the output from:
```
https://mobilaws-ympe.vercel.app/api/payment/config-check
```

And the latest Vercel logs after trying to create a payment.

---

**Last Updated:** December 18, 2024  
**Issue:** 401 Authentication Error  
**Status:** Waiting for API key verification


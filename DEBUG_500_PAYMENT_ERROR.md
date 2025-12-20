# 🔍 Debugging 500 Error: Failed to Create Payment Link

## What's Happening

**Error:** `500 Internal Server Error` when creating payment link  
**Frontend Error:** `Error: Failed to create payment link`

This means your **backend is crashing** when processing the payment request.

---

## Step 1: Check Vercel Backend Logs (MOST IMPORTANT)

This will show you the EXACT error:

1. Go to **Vercel Dashboard**
2. Select your **Backend** project
3. Click **Deployments** tab
4. Click on the latest deployment
5. Click **Functions** tab
6. Look for `/api/payment/create-link` function
7. Click **View Logs** or **Real-time Logs**

**Look for errors like:**
- ❌ `Dodo Payments API key not configured`
- ❌ `Product ID not configured for plan: basic`
- ❌ `OPENAI_API_KEY is required` (wrong - this shouldn't affect payment)
- ❌ `Cannot read property 'create' of undefined` (dodoClient is null)
- ❌ API errors from Dodo Payments

---

## Step 2: Test Backend Config Endpoint

Open browser console and run:

```javascript
fetch('https://your-backend-url.vercel.app/api/payment/config-check')
  .then(r => r.json())
  .then(data => {
    console.log('Backend Config:', data);
    
    // Check each required field
    if (!data.apiKeyPresent) {
      console.error('❌ MISSING: DODO_PAYMENTS_API_KEY');
    }
    if (!data.productIds.basic) {
      console.error('❌ MISSING: DODO_PAYMENTS_PRODUCT_BASIC');
    }
    if (!data.productIds.standard) {
      console.error('❌ MISSING: DODO_PAYMENTS_PRODUCT_STANDARD');
    }
    if (!data.productIds.premium) {
      console.error('❌ MISSING: DODO_PAYMENTS_PRODUCT_PREMIUM');
    }
    if (!data.webhookSecretPresent) {
      console.error('⚠️ MISSING: DODO_PAYMENTS_WEBHOOK_SECRET (optional but recommended)');
    }
    if (data.environment !== 'live') {
      console.warn('⚠️ Using TEST mode, not LIVE mode');
    }
  })
  .catch(err => console.error('❌ Backend not reachable:', err));
```

**Expected Response:**
```json
{
  "apiKeyPresent": true,
  "apiKeyLength": 50,
  "apiKeyPrefix": "dodo_live_...",
  "environment": "live",
  "frontendUrl": "https://mobilaws.com",
  "productIds": {
    "basic": "prod_xxxxx",
    "standard": "prod_xxxxx",
    "premium": "prod_xxxxx"
  },
  "webhookSecretPresent": true,
  "sdkClientInitialized": true
}
```

---

## Step 3: Common Causes & Fixes

### Cause 1: Missing DODO_PAYMENTS_API_KEY

**Error in logs:** `Dodo Payments API key not configured`

**Fix:**
```bash
# In Backend Vercel Project → Environment Variables
DODO_PAYMENTS_API_KEY=dodo_live_your_actual_key_here
```

Then **redeploy backend**.

---

### Cause 2: Missing Product IDs

**Error in logs:** `Product ID not configured for plan: basic`

**Fix:**
```bash
# In Backend Vercel Project → Environment Variables
DODO_PAYMENTS_PRODUCT_BASIC=prod_your_basic_id
DODO_PAYMENTS_PRODUCT_STANDARD=prod_your_standard_id
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_your_premium_id
```

**How to get Product IDs:**
1. Go to https://dashboard.dodopayments.com
2. Click **Products**
3. Find your 3 subscription products
4. Copy each Product ID (starts with `prod_`)

Then **redeploy backend**.

---

### Cause 3: Wrong API Key Format

**Error in logs:** `401 Unauthorized` or `Invalid API key`

**Check:**
- LIVE key should start with: `dodo_live_`
- TEST key should start with: `dodo_test_`

**Fix:** Make sure you're using the **LIVE** key in production:
```bash
DODO_PAYMENTS_ENVIRONMENT=live
DODO_PAYMENTS_API_KEY=dodo_live_xxxxx  # NOT dodo_test_
```

---

### Cause 4: Dodo Payments SDK Error

**Error in logs:** API errors from Dodo Payments

**Possible issues:**
- Product doesn't exist in Dodo dashboard
- Product is not a recurring subscription
- API key doesn't have permissions
- Billing country code issue

**Fix:**
1. Verify products exist in Dodo dashboard
2. Verify products are set as **recurring subscriptions**
3. Try regenerating API key in Dodo dashboard

---

### Cause 5: CORS Issue (Less likely for 500)

**Error:** CORS policy blocking request

**Fix:**
```bash
# In Backend Vercel Project → Environment Variables
CORS_ORIGINS=https://mobilaws.com,https://www.mobilaws.com
```

---

## Step 4: Test Payment Creation Manually

Use curl to test backend directly:

```bash
curl -X POST https://your-backend-url.vercel.app/api/payment/create-link \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "basic",
    "userId": "test-user-123",
    "planName": "Basic",
    "price": 5,
    "tokens": 50,
    "userEmail": "test@example.com",
    "userName": "Test User"
  }'
```

**Expected Response:**
```json
{
  "paymentLink": "https://checkout.dodopayments.com/...",
  "paymentId": "pay_xxxxx",
  "sessionId": "pay_xxxxx"
}
```

**If you get error:**
- Copy the error message
- Check Vercel backend logs
- Look for the specific issue

---

## Step 5: Verify Environment Variables in Vercel

**Backend Project → Settings → Environment Variables**

✅ **Required:**
```bash
DODO_PAYMENTS_API_KEY=dodo_live_xxxxxxxxxxxxx
DODO_PAYMENTS_ENVIRONMENT=live
DODO_PAYMENTS_PRODUCT_BASIC=prod_xxxxx
DODO_PAYMENTS_PRODUCT_STANDARD=prod_xxxxx
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_xxxxx
FRONTEND_URL=https://mobilaws.com
CORS_ORIGINS=https://mobilaws.com,https://www.mobilaws.com
OPENAI_API_KEY=sk-proj-xxxxx
```

✅ **Optional but recommended:**
```bash
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_xxxxx
```

**After adding/updating variables:**
1. Click **Save**
2. **Redeploy** backend (Deployments → ... → Redeploy)

---

## Step 6: Check Dodo Dashboard

1. Go to https://dashboard.dodopayments.com
2. Switch to **LIVE mode** (toggle at top)
3. Verify:
   - ✅ API key exists and is active
   - ✅ 3 products exist (Basic, Standard, Premium)
   - ✅ Products are **recurring subscriptions** (not one-time)
   - ✅ Products have correct prices

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Backend deployed successfully (no build errors)
- [ ] `DODO_PAYMENTS_API_KEY` set in Vercel backend
- [ ] API key is LIVE mode (starts with `dodo_live_`)
- [ ] All 3 product IDs set in Vercel backend
- [ ] Products exist in Dodo dashboard (LIVE mode)
- [ ] Products are recurring subscriptions
- [ ] `/api/payment/config-check` returns all values
- [ ] Checked Vercel backend function logs
- [ ] Backend redeployed after adding env vars

---

## Most Likely Causes (in order)

1. **Missing `DODO_PAYMENTS_API_KEY`** (90% of cases)
2. **Missing Product IDs** (5% of cases)
3. **Wrong API key** (test instead of live) (3% of cases)
4. **Products don't exist in Dodo** (2% of cases)

---

## Next Steps

1. **Check Vercel backend logs** (this will show the exact error)
2. **Run `/api/payment/config-check`** to see what's missing
3. **Add missing environment variables** in Vercel
4. **Redeploy backend**
5. **Test again**

---

## Still Getting 500 Error?

**Share these details:**
1. **Vercel backend function logs** (exact error message)
2. **Result of `/api/payment/config-check`**
3. **Screenshot of Vercel environment variables** (hide sensitive values)

This will help identify the exact issue!

---

**TL;DR:** Check Vercel backend logs → Add missing env vars → Redeploy → Test again


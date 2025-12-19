# 🔍 Troubleshooting "Failed to Load Payment" Error

## Quick Diagnostic Steps

### Step 1: Check Frontend API URL Configuration

**Problem:** Frontend doesn't know where your backend is deployed.

**Solution:** Set `VITE_API_URL` in your **frontend** Vercel project:

1. Go to Vercel Dashboard → Your **Frontend** project (not backend)
2. Settings → Environment Variables
3. Add:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app/api
   ```
   Replace `your-backend-url.vercel.app` with your actual backend Vercel URL
4. **Redeploy frontend**

**How to find your backend URL:**
- Go to Vercel Dashboard → Your **Backend** project
- Look at the latest deployment
- Copy the URL (e.g., `mobilaws-backend-abc123.vercel.app`)
- Use: `https://mobilaws-backend-abc123.vercel.app/api`

---

### Step 2: Check Backend Environment Variables

**Problem:** Backend missing Dodo Payments configuration.

**Check in Vercel Dashboard → Backend Project → Settings → Environment Variables:**

✅ **Required Variables:**
```bash
DODO_PAYMENTS_API_KEY=dodo_live_xxxxx
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_xxxxx
DODO_PAYMENTS_ENVIRONMENT=live
DODO_PAYMENTS_PRODUCT_BASIC=prod_xxxxx
DODO_PAYMENTS_PRODUCT_STANDARD=prod_xxxxx
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_xxxxx
FRONTEND_URL=https://mobilaws.com
CORS_ORIGINS=https://mobilaws.com,https://www.mobilaws.com
```

**If any are missing:**
1. Add them in Vercel
2. Select "Production" environment
3. **Redeploy backend**

---

### Step 3: Test Backend Endpoint Directly

**Open browser console and run:**

```javascript
// Test if backend is reachable
fetch('https://your-backend-url.vercel.app/api/payment/config-check')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected Response:**
```json
{
  "apiKeyPresent": true,
  "apiKeyLength": 50,
  "environment": "live",
  "productIds": {
    "basic": "prod_xxxxx",
    "standard": "prod_xxxxx",
    "premium": "prod_xxxxx"
  },
  "webhookSecretPresent": true
}
```

**If you get CORS error:**
→ Add your frontend domain to `CORS_ORIGINS` in backend environment variables

**If you get 404:**
→ Backend route not deployed correctly

**If you get 500:**
→ Check backend logs in Vercel

---

### Step 4: Check Browser Console

**Open browser DevTools (F12) → Console tab**

Look for:
- ❌ `Failed to fetch` → Backend URL wrong or CORS issue
- ❌ `404 Not Found` → API endpoint path wrong
- ❌ `500 Internal Server Error` → Backend error (check Vercel logs)
- ❌ `Network Error` → Backend not deployed or URL wrong

**Also check Network tab:**
1. Open DevTools → Network tab
2. Try to create payment
3. Look for request to `/api/payment/create-link`
4. Check:
   - **Status Code** (should be 200)
   - **Request URL** (should be correct backend URL)
   - **Response** (should have `paymentLink`)

---

### Step 5: Check Vercel Deployment Logs

**In Vercel Dashboard → Backend Project:**

1. Go to **Deployments** tab
2. Click on latest deployment
3. Check **Build Logs** for errors
4. Check **Function Logs** for runtime errors

**Look for:**
- ❌ `Dodo Payments API key not configured`
- ❌ `Product ID not configured for plan: basic`
- ❌ `ENOTFOUND` or DNS errors
- ❌ TypeScript compilation errors

---

### Step 6: Verify Dodo Payments Configuration

**In Dodo Payments Dashboard:**

1. **Check API Key:**
   - Go to Developer → API Keys
   - Verify LIVE key exists
   - Copy it to Vercel `DODO_PAYMENTS_API_KEY`

2. **Check Product IDs:**
   - Go to Products
   - Verify all 3 products exist (Basic, Standard, Premium)
   - Copy Product IDs to Vercel environment variables
   - **Important:** Products must be **recurring subscriptions** (not one-time)

3. **Check Webhook:**
   - Go to Developer → Webhooks
   - Verify webhook URL: `https://your-backend-url.vercel.app/api/payment/webhook`
   - Copy webhook secret to Vercel `DODO_PAYMENTS_WEBHOOK_SECRET`

---

## 🔧 Common Fixes

### Fix 1: Missing VITE_API_URL

**Error:** Frontend can't find backend

**Fix:**
```bash
# In Frontend Vercel Project → Environment Variables
VITE_API_URL=https://your-backend.vercel.app/api
```

### Fix 2: CORS Error

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Fix:**
```bash
# In Backend Vercel Project → Environment Variables
CORS_ORIGINS=https://mobilaws.com,https://www.mobilaws.com
```

### Fix 3: Product ID Not Configured

**Error:** `Product ID not configured for plan: basic`

**Fix:**
```bash
# In Backend Vercel Project → Environment Variables
DODO_PAYMENTS_PRODUCT_BASIC=prod_your_actual_basic_id
DODO_PAYMENTS_PRODUCT_STANDARD=prod_your_actual_standard_id
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_your_actual_premium_id
```

### Fix 4: API Key Not Set

**Error:** `Dodo Payments API key not configured`

**Fix:**
```bash
# In Backend Vercel Project → Environment Variables
DODO_PAYMENTS_API_KEY=dodo_live_your_actual_key_here
```

### Fix 5: Wrong Environment Mode

**Error:** Using test keys in production or vice versa

**Fix:**
```bash
# In Backend Vercel Project → Environment Variables
DODO_PAYMENTS_ENVIRONMENT=live  # Must be 'live' for production
```

---

## 🧪 Test Payment Creation Manually

**Use this curl command to test:**

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
  "paymentId": "checkout_session_xxxxx",
  "sessionId": "checkout_session_xxxxx"
}
```

**If you get error:**
- Check the error message
- Verify environment variables are set
- Check Vercel logs

---

## 📋 Complete Checklist

Before testing payment:

- [ ] `VITE_API_URL` set in **frontend** Vercel project
- [ ] `DODO_PAYMENTS_API_KEY` set in **backend** Vercel project (LIVE key)
- [ ] `DODO_PAYMENTS_ENVIRONMENT=live` in backend
- [ ] All 3 product IDs set in backend (`DODO_PAYMENTS_PRODUCT_BASIC/STANDARD/PREMIUM`)
- [ ] `DODO_PAYMENTS_WEBHOOK_SECRET` set in backend
- [ ] `FRONTEND_URL` set in backend (production URL)
- [ ] `CORS_ORIGINS` includes your frontend domain
- [ ] Both frontend and backend **redeployed** after adding variables
- [ ] Backend deployment successful (no build errors)
- [ ] Frontend deployment successful (no build errors)

---

## 🆘 Still Not Working?

1. **Check Vercel Function Logs:**
   - Backend Project → Deployments → Latest → Functions → View Logs
   - Look for error messages when payment is attempted

2. **Test Backend Health:**
   ```bash
   curl https://your-backend-url.vercel.app/healthz
   ```
   Should return: `{"status":"ok"}`

3. **Test Config Check:**
   ```bash
   curl https://your-backend-url.vercel.app/api/payment/config-check
   ```
   Should show all Dodo Payments config

4. **Check Browser Network Tab:**
   - See exact error response from backend
   - Copy error message and check Vercel logs

5. **Verify Dodo Dashboard:**
   - Products are set as **recurring subscriptions**
   - API key is **LIVE mode** (not test)
   - Webhook URL is correct

---

## 📞 Need More Help?

Share these details:
1. Browser console error message
2. Network tab request/response
3. Vercel backend function logs
4. Result of `/api/payment/config-check` endpoint

This will help identify the exact issue!


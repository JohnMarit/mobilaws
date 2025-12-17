# Dodo Payments 500 Error Troubleshooting Guide

## 🔍 Understanding the Error

If you're getting a 500 error when creating a payment link, here's how to diagnose and fix it:

## 📋 Common Causes

### 1. **Missing Environment Variables**

**Check if these are set in Vercel:**
- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_PRODUCT_BASIC`
- `DODO_PAYMENTS_PRODUCT_STANDARD`
- `DODO_PAYMENTS_PRODUCT_PREMIUM`
- `FRONTEND_URL`

**How to check:**
1. Go to Vercel Dashboard → Your Backend Project
2. Settings → Environment Variables
3. Verify all variables are present

### 2. **Invalid API Key**

**Symptoms:**
- 401 or 403 errors from Dodo Payments API
- "Unauthorized" in error message

**Fix:**
1. Go to Dodo Payments Dashboard → Developer → API Keys
2. Verify your API key is correct
3. Make sure you're using the right key (test vs live)
4. Update in Vercel environment variables

### 3. **Invalid Product IDs**

**Symptoms:**
- Error about product not found
- 404 errors from Dodo Payments API

**Fix:**
1. Go to Dodo Payments Dashboard → Products
2. Copy the exact Product ID for each plan
3. Verify they match in Vercel environment variables:
   - `DODO_PAYMENTS_PRODUCT_BASIC`
   - `DODO_PAYMENTS_PRODUCT_STANDARD`
   - `DODO_PAYMENTS_PRODUCT_PREMIUM`

### 4. **Wrong API Endpoint**

**Check:**
- `DODO_PAYMENTS_ENVIRONMENT` should be `test` or `live`
- Test mode uses: `https://api-sandbox.dodopayments.com`
- Live mode uses: `https://api.dodopayments.com`

### 5. **Invalid Request Format**

**Check backend logs for:**
- Request body format
- Missing required fields
- Invalid product_cart structure

## 🔧 How to Debug

### Step 1: Check Backend Logs

1. Go to Vercel Dashboard → Your Backend Project
2. Click on "Deployments" tab
3. Click on the latest deployment
4. Click "View Function Logs" or check "Runtime Logs"
5. Look for error messages starting with `❌`

### Step 2: Check Error Response

The improved error handling now returns more details. Check the browser console for:
- Error message
- Status code
- Details (in development mode)

### Step 3: Test API Key Directly

You can test your API key using curl:

```bash
curl -X POST https://api-sandbox.dodopayments.com/v1/payments \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_link": true,
    "product_cart": [{
      "product_id": "YOUR_PRODUCT_ID",
      "quantity": 1
    }],
    "success_url": "https://your-frontend.com/success",
    "cancel_url": "https://your-frontend.com/cancel"
  }'
```

Replace:
- `YOUR_API_KEY` with your actual API key
- `YOUR_PRODUCT_ID` with one of your product IDs
- URLs with your actual frontend URLs

### Step 4: Verify Product Configuration

In Dodo Payments Dashboard:
1. Go to Products
2. Click on each product (Basic, Standard, Premium)
3. Verify:
   - Product is active
   - Product ID matches what's in Vercel
   - Price matches your plan prices ($5, $10, $30)

## 🛠️ Quick Fixes

### Fix 1: Re-add Environment Variables

1. Go to Vercel → Backend Project → Settings → Environment Variables
2. Delete and re-add each Dodo Payments variable
3. Make sure to select all environments (Production, Preview, Development)
4. Redeploy backend

### Fix 2: Verify API Key Format

Your API key should look like:
- Test: `dodo_test_...` or similar
- Live: `dodo_live_...` or similar

If it doesn't match this format, get a new one from Dodo Payments dashboard.

### Fix 3: Check Product IDs

Product IDs should look like:
- `prod_abc123xyz`
- `prod_1234567890`

Make sure there are no extra spaces or characters.

### Fix 4: Update Webhook URL

1. Go to Dodo Payments Dashboard → Developer → Webhooks
2. Update webhook URL to: `https://your-backend-url.vercel.app/api/payment/webhook`
3. Make sure it uses HTTPS

## 📝 Checklist

Before reporting an issue, verify:

- [ ] All environment variables are set in Vercel
- [ ] API key is correct and active
- [ ] Product IDs match your Dodo Payments products
- [ ] `FRONTEND_URL` is set correctly
- [ ] `DODO_PAYMENTS_ENVIRONMENT` is set to `test` or `live`
- [ ] Backend has been redeployed after adding variables
- [ ] Products exist and are active in Dodo Payments
- [ ] API key has proper permissions

## 🆘 Still Not Working?

If you've checked everything above:

1. **Check the exact error message** in browser console
2. **Check backend logs** in Vercel
3. **Verify API key works** using curl (see Step 3 above)
4. **Contact Dodo Payments support** with:
   - Your API key (they can verify it)
   - The exact error message
   - Request body format

## 📞 Support

- **Dodo Payments Docs**: https://docs.dodopayments.com
- **Dodo Payments Support**: Check their dashboard for support contact


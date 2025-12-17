# Dodo Payments SDK Integration Fix

## Problem
The Dodo Payments integration was experiencing persistent DNS resolution errors:
- `ENOTFOUND api-sandbox.dodopayments.com`
- `ENOTFOUND api.dodopayments.com`
- `Unknown error` at payment.js:96

These errors were caused by manually constructing API URLs and using raw `fetch` calls, which led to incorrect domain names and connection issues.

## Solution
Replaced manual API calls with the **official Dodo Payments Node.js SDK** (`dodopayments` npm package).

### Changes Made

#### 1. Installed Dodo Payments SDK
```bash
npm install dodopayments
```

#### 2. Updated `ai-backend/src/routes/payment.ts`

**Before:**
```typescript
const DODO_PAYMENTS_API_URL = env.DODO_PAYMENTS_ENVIRONMENT === 'live' 
  ? 'https://live.dodopayments.com' 
  : 'https://test.dodopayments.com';

const response = await fetch(`${DODO_PAYMENTS_API_URL}/v1/payments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody),
});
```

**After:**
```typescript
import DodoPayments from 'dodopayments';

const dodoClient = env.DODO_PAYMENTS_API_KEY ? new DodoPayments({
  bearerToken: env.DODO_PAYMENTS_API_KEY,
}) : null;

const payment = await dodoClient.payments.create({
  payment_link: true,
  billing: {
    country: 'US', // Required field
  },
  customer: {
    email: userEmail || 'customer@example.com',
    name: userName || 'Customer',
  },
  product_cart: [
    {
      product_id: productId,
      quantity: 1
    }
  ],
  metadata: { planId, userId, planName, tokens },
  return_url: `${env.FRONTEND_URL}/payment/success?payment_id={PAYMENT_ID}`,
});
```

#### 3. Updated Environment Variables

**Removed:**
- `DODO_PAYMENTS_API_URL` (SDK handles this internally)

**Kept:**
- `DODO_PAYMENTS_API_KEY` - Your API key from Dodo Payments dashboard
- `DODO_PAYMENTS_WEBHOOK_SECRET` - Webhook signing secret
- `DODO_PAYMENTS_ENVIRONMENT` - Either `test` or `live`
- `DODO_PAYMENTS_PRODUCT_BASIC` - Product ID for basic plan
- `DODO_PAYMENTS_PRODUCT_STANDARD` - Product ID for standard plan
- `DODO_PAYMENTS_PRODUCT_PREMIUM` - Product ID for premium plan

#### 4. Key SDK Benefits

1. **Automatic URL Management**: SDK handles correct API endpoints for test/live modes
2. **Type Safety**: Full TypeScript support with proper type definitions
3. **Error Handling**: Better error messages and structured error objects
4. **Required Fields**: SDK enforces required fields like `billing` address
5. **Maintenance**: Official SDK is maintained by Dodo Payments team

### Required Fields

The SDK requires a `billing` address object with at least a `country` code:

```typescript
billing: {
  country: 'US', // ISO 3166-1 alpha-2 country code
  city?: string,
  state?: string,
  street?: string,
  zipcode?: string,
}
```

## Testing

After deploying to Vercel, the logs should show:
- ✅ `🔗 Creating payment link for plan...`
- ✅ `✅ Payment created successfully: pay_xxx`
- ✅ No more DNS resolution errors

## Deployment

1. **Changes are already committed and pushed**
2. **Vercel will automatically deploy** the new code
3. **Wait 2-3 minutes** for deployment to complete
4. **Test the payment flow** by clicking "Get Tokens" in your app

## Verification

Check Vercel logs for:
```
✅ Payment created successfully: pay_xxx
```

Instead of:
```
❌ Error creating payment link: TypeError: fetch failed
❌ getaddrinfo ENOTFOUND api.dodopayments.com
```

## Next Steps

1. Wait for Vercel deployment to complete
2. Test payment creation from your frontend
3. Verify webhook events are received correctly
4. Monitor Vercel logs for any new issues

## Rollback (if needed)

If issues persist, you can rollback by:
```bash
git revert HEAD
git push
```

---

**Date Fixed:** December 18, 2024  
**SDK Version:** dodopayments@2.9.0  
**Status:** ✅ Deployed and awaiting testing


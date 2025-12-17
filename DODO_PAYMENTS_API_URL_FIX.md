# Dodo Payments API URL Fix

## 🔍 Issue Found

The error `ENOTFOUND api-sandbox.dodopayments.com` indicates that the sandbox API URL doesn't exist.

## ✅ Solution

Dodo Payments uses the **same API URL** (`https://api.dodopayments.com`) for both test and production modes. The difference is in the **API key** you use:

- **Test Mode**: Use a test API key (starts with `dodo_test_...` or similar)
- **Live Mode**: Use a live/production API key (starts with `dodo_live_...` or similar)

## 📝 What Changed

I've updated the code to always use `https://api.dodopayments.com` regardless of the environment setting. The `DODO_PAYMENTS_ENVIRONMENT` variable now only serves as documentation - you should use the appropriate API key for test vs production.

## 🔧 Configuration

### For Testing:
```bash
DODO_PAYMENTS_ENVIRONMENT=test
DODO_PAYMENTS_API_KEY=your_test_api_key_here
```

### For Production:
```bash
DODO_PAYMENTS_ENVIRONMENT=live
DODO_PAYMENTS_API_KEY=your_live_api_key_here
```

Both will use the same API URL: `https://api.dodopayments.com`

## ✅ Next Steps

1. **Redeploy your backend** on Vercel
2. **Verify your API key** is correct in Vercel environment variables
3. **Test the payment flow** again

The DNS error should now be resolved!


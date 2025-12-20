# Quick Start: Paystack Migration Checklist

This document provides the essential steps YOU need to complete to finalize the Paystack integration.

## ✅ What Has Been Done

All code changes have been completed:
- ✅ Paystack SDK installed in backend
- ✅ Payment routes completely rewritten for Paystack
- ✅ Webhook handling updated for Paystack events
- ✅ Frontend updated to work with Paystack
- ✅ Environment configuration updated
- ✅ Dodo Payments code and documentation removed

---

## 🎯 What YOU Need to Do

### 1. Create Paystack Account
1. Go to [https://paystack.com](https://paystack.com)
2. Sign up for a merchant account
3. Complete KYC verification (required for live mode)

### 2. Get API Keys
1. Login to Paystack Dashboard
2. Go to **Settings** → **API Keys & Webhooks**
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
4. Copy your **Public Key** (starts with `pk_test_` or `pk_live_`)

### 3. Create Subscription Plans
1. In Paystack Dashboard, go to **Payments** → **Plans**
2. Click **Create Plan**
3. Create three recurring plans:

**Basic Plan:**
- Name: Basic
- Amount: $5 (or 500 in kobo/cents if using Nigerian Naira)
- Interval: Monthly
- Copy the **Plan Code** (e.g., `PLN_xxxxxxxxxxxxx`)

**Standard Plan:**
- Name: Standard
- Amount: $10
- Interval: Monthly
- Copy the **Plan Code**

**Premium Plan:**
- Name: Premium
- Amount: $30
- Interval: Monthly
- Copy the **Plan Code**

### 4. Update Backend Environment Variables

Edit `ai-backend/.env` and update/add these variables:

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here  # or sk_live_ for production
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here  # or pk_live_ for production
PAYSTACK_ENVIRONMENT=test  # Change to 'live' when ready for production

# Paystack Plan Codes (paste the codes from Step 3)
PAYSTACK_PLAN_BASIC=PLN_xxxxxxxxxxxxx
PAYSTACK_PLAN_STANDARD=PLN_xxxxxxxxxxxxx
PAYSTACK_PLAN_PREMIUM=PLN_xxxxxxxxxxxxx

# Frontend URL (update if needed)
FRONTEND_URL=http://localhost:5173  # or your production URL
```

### 5. Set Up Webhook

1. In Paystack Dashboard, go to **Settings** → **API Keys & Webhooks**
2. Scroll to **Webhook URL** section
3. Add your webhook URL:
   - **For local testing**: Use a service like [ngrok](https://ngrok.com) to expose localhost
   - **For production**: `https://your-backend-domain.com/api/payment/webhook`
4. Click **Save**

### 6. Rebuild and Test

```bash
# Terminal 1: Backend
cd ai-backend
npm install  # Installs the new paystack package
npm run dev

# Terminal 2: Frontend
npm run dev
```

### 7. Test Payment Flow

1. Open your app in the browser
2. Login with a test user
3. Select a subscription plan
4. You should be redirected to Paystack checkout
5. Use a [Paystack test card](https://paystack.com/docs/payments/test-payments):
   - Card: `4084084084084081`
   - Expiry: Any future date
   - CVV: Any 3 digits
6. Complete payment
7. Verify you're redirected back to success page
8. Check that tokens are credited to your account

### 8. Verify Configuration

Test the configuration endpoint:
```bash
curl http://localhost:8000/api/payment/config-check
```

Should return:
```json
{
  "apiKeyPresent": true,
  "publicKeyPresent": true,
  "environment": "test",
  "planCodes": {
    "basic": "PLN_xxx",
    "standard": "PLN_xxx",
    "premium": "PLN_xxx"
  },
  "sdkClientInitialized": true
}
```

---

## 🚀 Going to Production

When ready to accept real payments:

1. **Get Live API Keys**
   - Switch to live mode in Paystack dashboard
   - Copy your live keys (starting with `sk_live_` and `pk_live_`)

2. **Create Live Plans**
   - Create the same three plans in live mode
   - Copy the new live plan codes

3. **Update Environment Variables**
   ```bash
   PAYSTACK_SECRET_KEY=sk_live_your_live_key
   PAYSTACK_PUBLIC_KEY=pk_live_your_live_key
   PAYSTACK_ENVIRONMENT=live
   PAYSTACK_PLAN_BASIC=PLN_live_code
   PAYSTACK_PLAN_STANDARD=PLN_live_code
   PAYSTACK_PLAN_PREMIUM=PLN_live_code
   FRONTEND_URL=https://your-production-domain.com
   ```

4. **Update Webhook URL**
   - Set to your production backend URL

5. **Deploy and Test**
   - Deploy to your hosting platform
   - Test with real payment (small amount first)
   - Verify webhook delivery
   - Monitor logs for any issues

---

## 📋 Environment Variables Reference

Here's a complete list of environment variables you need to set:

### Backend (.env in ai-backend folder)
```bash
# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_ENVIRONMENT=test  # or 'live'
PAYSTACK_PLAN_BASIC=PLN_xxx
PAYSTACK_PLAN_STANDARD=PLN_xxx
PAYSTACK_PLAN_PREMIUM=PLN_xxx

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Other existing variables (keep these)
OPENAI_API_KEY=...
PORT=8000
# ... etc
```

---

## 🐛 Common Issues

### Issue: "Paystack API key not configured"
**Solution**: Make sure you've set `PAYSTACK_SECRET_KEY` in your `.env` file and restarted the backend server.

### Issue: "Plan code not configured"
**Solution**: Set the plan codes in your `.env` file: `PAYSTACK_PLAN_BASIC`, `PAYSTACK_PLAN_STANDARD`, `PAYSTACK_PLAN_PREMIUM`

### Issue: Webhook not receiving events
**Solution**: 
- For local testing, use ngrok to expose your localhost
- For production, make sure your webhook URL is accessible from the internet
- Check Paystack webhook logs in dashboard

### Issue: Payment successful but subscription not created
**Solution**: Check your backend logs for errors. The webhook might be failing. Verify webhook signature is being validated correctly.

---

## 📞 Support

- **Paystack Support**: [support@paystack.com](mailto:support@paystack.com)
- **Paystack Documentation**: [https://paystack.com/docs](https://paystack.com/docs)
- **Paystack Community**: [https://paystack.com/community](https://paystack.com/community)

---

## ✅ Final Checklist

- [ ] Created Paystack account
- [ ] Got API keys (secret and public)
- [ ] Created 3 subscription plans in Paystack
- [ ] Updated `.env` with all Paystack variables
- [ ] Set up webhook URL in Paystack dashboard
- [ ] Installed dependencies (`npm install` in ai-backend)
- [ ] Restarted backend server
- [ ] Tested payment flow with test card
- [ ] Verified tokens were credited
- [ ] Checked webhook is receiving events

Once all checkboxes are complete, your Paystack integration is ready! 🎉


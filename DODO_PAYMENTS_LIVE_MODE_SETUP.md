# Dodo Payments Live Mode Production Setup

This guide will help you configure Dodo Payments for **LIVE production mode** with monthly recurring subscriptions.

## 🎯 Overview

Your Dodo Payments account is already configured with:
- ✅ **3 Monthly Subscription Products** (Basic, Standard, Premium)
- ✅ **Webhook Endpoint** configured at `https://mobilaws.com/api/webhooks/payments`
- ✅ **Webhook Events** subscribed (payment.succeeded, subscription.active, subscription.renewed, etc.)

## ⚠️ CRITICAL: Premium Product Configuration

**Your Premium product currently has:**
- `subscription_period_count: 10`
- `subscription_period_interval: Month`

**This means it's a 10-month subscription term!**

If you want Premium to be a **month-to-month** subscription (like Basic and Standard), you need to update it in your Dodo Payments dashboard:

1. Go to **Products** in Dodo Payments
2. Edit your **Premium** product
3. Change `subscription_period_count` to **1**
4. Save changes

## 📋 Step-by-Step Production Configuration

### Step 1: Get Your Dodo Payments Credentials

1. **Log in to Dodo Payments Dashboard** at https://dashboard.dodopayments.com

2. **Get Your LIVE API Key**
   - Navigate to **Developer** → **API Keys**
   - Find or create your **LIVE** API key (should start with `dodo_live_...`)
   - Copy the key (you won't see it again!)

3. **Get Your Product IDs**
   - Navigate to **Products**
   - Find your three subscription products:
     - **Mobilaws – Basic**: $5.00/month (500 USD), 50 tokens/month
     - **Mobilaws – Standard**: $10.00/month (1000 USD), 150 tokens/month
     - **Mobilaws – Premium**: $30.00/month (3000 USD), 500 tokens/month
   - Copy each Product ID (looks like `prod_xxxxxxxxxxxxx`)

4. **Get Your Webhook Secret**
   - Navigate to **Developer** → **Webhooks**
   - Find your webhook endpoint: `https://mobilaws.com/api/webhooks/payments`
   - Copy the **Webhook Secret** (looks like `whsec_xxxxxxxxxxxxx`)

### Step 2: Configure Backend Environment Variables

In your **backend** environment (Vercel, Railway, or wherever you host), set these environment variables:

```bash
# Dodo Payments Live Mode Configuration
DODO_PAYMENTS_API_KEY=dodo_live_your_actual_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_your_actual_secret_here
DODO_PAYMENTS_ENVIRONMENT=live

# Product IDs (from your Dodo Payments dashboard)
DODO_PAYMENTS_PRODUCT_BASIC=prod_basic_id_here
DODO_PAYMENTS_PRODUCT_STANDARD=prod_standard_id_here
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_premium_id_here

# Frontend URL (your production domain)
FRONTEND_URL=https://mobilaws.com

# Node Environment
NODE_ENV=production
```

#### 🚀 If Using Vercel:

1. Go to your backend project on Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable above
4. Select **Production**, **Preview**, and **Development** environments
5. **Redeploy** your backend

#### 🚂 If Using Railway:

1. Go to your backend project on Railway
2. Click **Variables** tab
3. Add each variable above
4. Railway will automatically redeploy

### Step 3: Verify Webhook Configuration

1. **In Dodo Payments Dashboard:**
   - Go to **Developer** → **Webhooks**
   - Verify webhook URL: `https://mobilaws.com/api/webhooks/payments`
   
2. **Verify Events Are Subscribed:**
   - ✅ `payment.succeeded` - Initial payment successful
   - ✅ `payment.failed` - Payment failed
   - ✅ `subscription.active` - New subscription activated
   - ✅ `subscription.renewed` - Monthly renewal (grant new tokens)
   - ✅ `subscription.on_hold` - Payment failed, subscription paused
   - ✅ `subscription.cancelled` - User cancelled subscription
   - ✅ `subscription.expired` - Subscription expired

3. **Test Webhook Delivery:**
   - Use the "Send Test Webhook" button in Dodo dashboard
   - Check your backend logs to confirm receipt

### Step 4: Update Frontend (Optional)

The frontend is already configured to work with the backend. No changes needed unless you want to explicitly show "Live Mode" indicators.

## 🧪 Testing Before Going Live

### Option 1: Test Mode First (Recommended)

1. **Use Test Mode** temporarily:
   ```bash
   DODO_PAYMENTS_ENVIRONMENT=test
   DODO_PAYMENTS_API_KEY=dodo_test_your_test_key
   ```

2. **Create test subscription products** in Dodo dashboard
3. **Run full payment flow** with test cards
4. **Verify webhooks** are received and processed
5. **Confirm tokens are granted** correctly

### Option 2: Small Live Test

1. **Set to Live Mode** with real credentials
2. **Use smallest amount** (Basic plan $5)
3. **Test with real payment method**
4. **Verify full flow:**
   - ✅ Checkout session created
   - ✅ Payment successful
   - ✅ Webhook received
   - ✅ Subscription activated in DB
   - ✅ Tokens granted
   - ✅ User can use tokens

## 📊 How Monthly Subscriptions Work

### Initial Purchase Flow

1. **User clicks "Subscribe"** on frontend
2. **Backend creates checkout session** (not a one-time payment):
   ```typescript
   dodoClient.checkouts.create({
     product_cart: [{ product_id: 'prod_basic_id', quantity: 1 }],
     customer: { email, name },
     metadata: { userId, planId, monthlyTokens: 50 },
     return_url: 'https://mobilaws.com/payment/success?session_id={CHECKOUT_SESSION_ID}'
   })
   ```
3. **User redirected to Dodo checkout page**
4. **User completes payment**
5. **Dodo sends webhook:** `subscription.active`
6. **Backend grants tokens** (50, 150, or 500 depending on plan)
7. **Subscription stored** with `subscriptionId`, `customerId`, `nextRenewalDate`

### Monthly Renewal Flow (Automatic)

1. **Dodo auto-charges** customer on renewal date (30 days later)
2. **Dodo sends webhook:** `subscription.renewed` or `payment.succeeded` (linked to subscription)
3. **Backend grants new tokens:**
   ```typescript
   handleSubscriptionRenewal(subscriptionId, userId, monthlyTokens)
   ```
4. **Tokens reset** to monthly allocation (50, 150, or 500)
5. **Next renewal date** updated (+30 days)

### Failed Payment Flow

1. **Dodo attempts to charge** but payment fails
2. **Dodo sends webhook:** `subscription.on_hold` or `payment.failed`
3. **Backend pauses subscription:**
   ```typescript
   subscription.subscriptionStatus = 'on_hold'
   subscription.isActive = false
   ```
4. **User cannot use tokens** until payment resolved
5. **User notified** to update payment method

### Cancellation Flow

1. **User cancels** subscription (or you cancel via Dodo dashboard)
2. **Dodo sends webhook:** `subscription.cancelled`
3. **Backend marks subscription inactive:**
   ```typescript
   subscription.subscriptionStatus = 'cancelled'
   subscription.isActive = false
   ```
4. **User keeps remaining tokens** until current period ends
5. **No future renewals** or charges

## 🔍 Monitoring & Troubleshooting

### Check Backend Logs

Look for these log messages:

```
✅ Subscription checkout session created for plan basic...
📨 Webhook received: subscription.active
✅ Subscription created for user: Basic - $5/month - 50 tokens/month
📋 Subscription ID: sub_xxx, Customer ID: cus_xxx
🔄 Subscription renewed for user: 50 tokens granted
⚠️ Subscription on hold for user due to payment failure
```

### Common Issues

#### ❌ "Product ID not configured"
- **Solution:** Set `DODO_PAYMENTS_PRODUCT_BASIC/STANDARD/PREMIUM` env vars

#### ❌ "Webhook signature verification failed"
- **Solution:** Verify `DODO_PAYMENTS_WEBHOOK_SECRET` matches dashboard

#### ❌ "Checkout session not created"
- **Solution:** Check `DODO_PAYMENTS_API_KEY` is correct for LIVE mode

#### ❌ "Tokens not granted on renewal"
- **Solution:** Verify `subscription.renewed` webhook is subscribed

#### ❌ "Premium charges every 10 months instead of monthly"
- **Solution:** Update Premium product `subscription_period_count` to 1

### Verify Subscription in Dodo Dashboard

1. Go to **Subscriptions** in Dodo dashboard
2. Find user's subscription
3. Verify:
   - Status: Active
   - Interval: Monthly
   - Next charge date: 30 days from activation

### Check Firestore Data

Look at `subscriptions` collection for a user:

```json
{
  "userId": "user123",
  "planId": "basic",
  "tokensRemaining": 50,
  "totalTokens": 50,
  "monthlyTokens": 50,
  "subscriptionId": "sub_xxxxx",
  "customerId": "cus_xxxxx",
  "subscriptionStatus": "active",
  "nextRenewalDate": "2024-01-15T00:00:00Z",
  "isActive": true
}
```

## 🎉 Production Checklist

Before announcing to users:

- [ ] Set `DODO_PAYMENTS_ENVIRONMENT=live`
- [ ] Configured production API key
- [ ] Set correct product IDs for all 3 plans
- [ ] Verified Premium is monthly (not 10-month)
- [ ] Configured webhook URL in Dodo dashboard
- [ ] Set webhook secret in environment
- [ ] Subscribed to all required webhook events
- [ ] Updated `FRONTEND_URL` to production domain
- [ ] Tested full payment flow end-to-end
- [ ] Verified webhook receives events
- [ ] Confirmed tokens are granted on activation
- [ ] Confirmed tokens are renewed monthly
- [ ] Tested failed payment handling
- [ ] Tested cancellation handling
- [ ] Set up monitoring/logging
- [ ] Reviewed Firestore security rules
- [ ] Documented customer support process

## 📚 Key Differences: One-Time Payment vs. Subscription

| Feature | One-Time Payment (OLD) | Monthly Subscription (NEW) |
|---------|----------------------|---------------------------|
| API Call | `payments.create()` | `checkouts.create()` |
| Product Type | One-time | Recurring (monthly) |
| Token Grant | Once | Every month (renewal) |
| Webhook Events | `payment.succeeded` | `subscription.active`, `subscription.renewed` |
| Tracking | Payment ID only | Subscription ID + Customer ID |
| Renewal | Manual re-purchase | Automatic monthly |
| Expiry | 30 days (no renewal) | Continues until cancelled |

## 🆘 Support

If you encounter issues:

1. **Check backend logs** for errors
2. **Verify Dodo dashboard** for subscription status
3. **Test webhook delivery** using Dodo's test feature
4. **Review Firestore data** for subscription records
5. **Contact Dodo Payments support** for payment/subscription issues

---

**Last Updated:** December 2024  
**Version:** 2.0 (Subscription-based billing)


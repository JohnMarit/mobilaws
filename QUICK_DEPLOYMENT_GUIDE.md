# 🚀 Quick Deployment Guide - Dodo Payments Live Mode

## ⚡ 5-Minute Production Setup

### Step 1: Get Your Credentials (2 minutes)

Login to **https://dashboard.dodopayments.com** and grab:

1. **API Key** (Developer → API Keys)
   ```
   Copy: dodo_live_xxxxxxxxxxxxxxxxxxxxx
   ```

2. **Product IDs** (Products section)
   ```
   Basic:    prod_xxxxx
   Standard: prod_xxxxx
   Premium:  prod_xxxxx
   ```

3. **Webhook Secret** (Developer → Webhooks)
   ```
   Copy: whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

### Step 2: Set Environment Variables (2 minutes)

In your backend hosting platform (Vercel/Railway), add:

```bash
DODO_PAYMENTS_API_KEY=dodo_live_xxxxxxxxxxxxxxxxxxxxx
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
DODO_PAYMENTS_ENVIRONMENT=live
DODO_PAYMENTS_PRODUCT_BASIC=prod_xxxxx
DODO_PAYMENTS_PRODUCT_STANDARD=prod_xxxxx
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_xxxxx
FRONTEND_URL=https://mobilaws.com
NODE_ENV=production
```

### Step 3: Fix Premium Product (1 minute)

⚠️ **CRITICAL:** Your Premium product charges every 10 months (not monthly!)

**Fix it:**
1. Go to **Products** in Dodo dashboard
2. Edit **Mobilaws – Premium**
3. Change `subscription_period_count` from `10` to `1`
4. Save

### Step 4: Verify Webhook Events

Go to **Developer → Webhooks** and confirm these are checked:

- ✅ payment.succeeded
- ✅ payment.failed
- ✅ subscription.active
- ✅ **subscription.renewed** ← Most important!
- ✅ subscription.on_hold
- ✅ subscription.cancelled
- ✅ subscription.expired

### Step 5: Test Live Payment

1. **Buy Basic plan** ($5) with real payment method
2. **Check backend logs** for:
   ```
   ✅ Checkout session created
   📨 Webhook received: subscription.active
   ✅ Subscription created with 50 tokens/month
   ```
3. **Verify Firestore** has subscription with `subscriptionId`
4. **Check Dodo dashboard** shows active monthly subscription

---

## ✅ What Changed

### OLD (One-Time Payments)
- User pays → Gets tokens → Expires in 30 days
- No automatic renewal
- User must manually re-purchase

### NEW (Monthly Subscriptions)
- User subscribes → Gets tokens → Auto-renews monthly
- Dodo charges automatically every 30 days
- Tokens refresh each month
- Continues until cancelled

---

## 🔍 Quick Verification

After deployment, test this flow:

```
1. Click "Subscribe to Basic" on frontend
2. Complete payment on Dodo checkout
3. Redirected to /payment/success
4. See "Processing..." (polling for webhook)
5. Within 5 seconds, see "Subscription Activated!"
6. Go to chat → Verify 50 tokens available
```

**If successful:**
- ✅ Firestore has subscription with `subscriptionId`
- ✅ Dodo dashboard shows active subscription
- ✅ Backend logs show webhook received

---

## 📊 Monthly Renewal (What Happens Next)

**30 days later:**

```
1. Dodo auto-charges customer $5
2. Dodo sends webhook: subscription.renewed
3. Backend resets tokens to 50
4. User gets fresh 50 tokens
5. Repeats every month until cancelled
```

**No manual intervention required!**

---

## 🆘 Troubleshooting

### "Product ID not configured"
→ Set `DODO_PAYMENTS_PRODUCT_BASIC/STANDARD/PREMIUM` env vars

### "Webhook not received"
→ Check webhook URL is `https://mobilaws.com/api/webhooks/payments`
→ Verify webhook secret matches dashboard

### "Checkout session fails"
→ Verify API key is LIVE mode (starts with `dodo_live_`)
→ Check product IDs exist in Dodo dashboard

### "Tokens not renewed"
→ Verify `subscription.renewed` webhook is subscribed
→ Check backend logs for webhook processing

### "Premium renews every 10 months"
→ Update Premium product: `subscription_period_count = 1`

---

## 📞 Support

**Full Documentation:**
- `PAYMENT_IMPLEMENTATION_COMPLETE.md` - Complete implementation details
- `DODO_PAYMENTS_LIVE_MODE_SETUP.md` - Comprehensive setup guide

**Backend Logs:**
Look for these in your hosting platform:
```
✅ Subscription checkout session created
📨 Webhook received: subscription.active
✅ Subscription created for user: Basic - $5/month - 50 tokens/month
📋 Subscription ID: sub_xxxxx, Customer ID: cus_xxxxx
```

**Dodo Dashboard:**
- Check **Subscriptions** section for user subscriptions
- Verify status is "Active" and interval is "Monthly"

---

**Ready to deploy? Let's go! 🚀**


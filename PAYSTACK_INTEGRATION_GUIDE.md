# Paystack Payment Integration Guide

Complete guide for setting up Paystack payments in the Mobilaws application.

## ✅ What Has Been Implemented

### Backend Changes
- ✅ Integrated Paystack Node.js SDK
- ✅ Created payment transaction initialization
- ✅ Implemented payment verification
- ✅ Added webhook handling for payment events
- ✅ Subscription lifecycle management
- ✅ Secure webhook signature verification
- ✅ Idempotency protection for duplicate payments

### Frontend Changes
- ✅ Updated `SubscriptionContext` to work with Paystack
- ✅ Modified `PaymentModal` to redirect to Paystack checkout
- ✅ Updated `PaymentSuccess` page to handle Paystack callbacks
- ✅ Proper error handling and user feedback

---

## 🚀 Setup Instructions

### Step 1: Get Paystack Credentials

1. **Sign up for Paystack**
   - Go to [Paystack](https://paystack.com) and create a merchant account
   - Complete the verification process (KYC)

2. **Get API Keys**
   - Navigate to **Settings** → **API Keys & Webhooks** in your Paystack dashboard
   - Copy your **Secret Key** (starts with `sk_`)
   - Copy your **Public Key** (starts with `pk_`)
   - Note: Use test keys (`sk_test_` and `pk_test_`) for testing

3. **Create Subscription Plans**
   - Go to **Payments** → **Plans** in your dashboard
   - Create three recurring plans:
     - **Basic Plan**: $5/month, 50 tokens
     - **Standard Plan**: $10/month, 120 tokens
     - **Premium Plan**: $30/month, 500 tokens
   - Copy the **Plan Code** for each plan (e.g., `PLN_xxxxx`)

---

### Step 2: Configure Backend Environment Variables

Add the following to your backend `.env` file (in `ai-backend/.env`):

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
PAYSTACK_ENVIRONMENT=live  # Use 'live' for production, 'test' for testing

# Paystack Plan Codes (from your Paystack dashboard)
PAYSTACK_PLAN_BASIC=PLN_xxxxxxxxxxxxx
PAYSTACK_PLAN_STANDARD=PLN_xxxxxxxxxxxxx
PAYSTACK_PLAN_PREMIUM=PLN_xxxxxxxxxxxxx

# Frontend URL (for payment redirects)
FRONTEND_URL=https://your-production-domain.com

# Node Environment
NODE_ENV=production
```

**For Testing:**
```bash
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key
PAYSTACK_ENVIRONMENT=test
```

---

### Step 3: Configure Webhooks

Webhooks allow Paystack to notify your backend when payments succeed, fail, or subscriptions are updated.

1. **In Paystack Dashboard**
   - Go to **Settings** → **API Keys & Webhooks**
   - Scroll to **Webhook URL** section
   - Click **Add Webhook URL**

2. **Webhook Configuration**
   - **URL**: `https://your-backend-domain.com/api/payment/webhook`
   - The webhook will receive all events by default
   - Click **Save**

3. **Important Events**
   Paystack will send webhooks for these events:
   - `charge.success` - Payment successful
   - `charge.failed` - Payment failed
   - `subscription.create` - New subscription created
   - `subscription.not_renew` - Subscription cancelled
   - `subscription.disable` - Subscription disabled (payment failures)
   - `subscription.enable` - Subscription re-enabled
   - `invoice.create` - Recurring invoice created
   - `invoice.payment_failed` - Subscription renewal failed

4. **Test Webhook**
   - Use the "Test" button in Paystack dashboard
   - Check your backend logs to verify receipt

---

### Step 4: Firestore Collections

The implementation uses these Firestore collections (auto-created):

- **`payment_sessions`** - Stores payment session data
- **`purchases`** - Purchase transaction history
- **`subscriptions`** - User subscription data

**Optional: Add Firestore Indexes**

If you query payment sessions by user or status, add these indexes in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "payment_sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 📊 API Endpoints

### Create Payment Link
```http
POST /api/payment/create-link

Body:
{
  "planId": "basic",
  "userId": "user-123",
  "planName": "Basic",
  "price": 5,
  "tokens": 50,
  "userEmail": "user@example.com",
  "userName": "John Doe"
}

Response:
{
  "paymentLink": "https://checkout.paystack.com/...",
  "paymentId": "mobilaws_user123_1234567890",
  "reference": "mobilaws_user123_1234567890",
  "accessCode": "xxx"
}
```

### Verify Payment
```http
POST /api/payment/verify

Body:
{
  "reference": "mobilaws_user123_1234567890"
}

Response:
{
  "success": true,
  "subscription": {
    "userId": "user-123",
    "planId": "basic",
    "tokensRemaining": 50,
    "totalTokens": 50,
    "isActive": true,
    ...
  }
}
```

### Get Payment Status
```http
GET /api/payment/status/:reference

Response:
{
  "status": "success",
  "amount": 5,
  "currency": "USD",
  "metadata": {...},
  "sessionStatus": "completed",
  "isProcessed": true
}
```

### Configuration Check
```http
GET /api/payment/config-check

Response:
{
  "apiKeyPresent": true,
  "environment": "live",
  "planCodes": {
    "basic": "PLN_xxx",
    "standard": "PLN_xxx",
    "premium": "PLN_xxx"
  },
  "sdkClientInitialized": true
}
```

---

## 🔒 Security Features

### 1. Webhook Signature Verification
- Uses HMAC SHA-512 to verify webhook authenticity
- Prevents fraudulent payment notifications
- Timing-safe comparison to prevent timing attacks

### 2. Idempotency Protection
- Prevents duplicate subscription creation
- Checks both payment sessions and purchase records
- Returns existing subscription if already processed

### 3. Secure Payment Flow
- Payment data never stored on frontend
- All sensitive operations on backend
- Paystack handles all payment card data (PCI compliant)

---

## 🔄 Payment Flow

### User Initiates Payment
1. User selects a plan in the frontend
2. Frontend calls `/api/payment/create-link`
3. Backend creates Paystack transaction with plan code
4. Backend returns authorization URL
5. User is redirected to Paystack checkout page

### User Completes Payment
6. User enters payment details on Paystack
7. Paystack processes payment
8. User is redirected back to `/payment/success?reference=xxx`

### Backend Processes Payment
9. Paystack sends webhook to `/api/payment/webhook`
10. Backend verifies webhook signature
11. Backend creates subscription in Firestore
12. Backend grants tokens to user

### Frontend Verifies Payment
13. Frontend calls `/api/payment/verify` with reference
14. Backend confirms payment and returns subscription
15. User sees success message with tokens

---

## 🧪 Testing

### Test Mode
Use Paystack test keys for development:
- **Test Secret Key**: `sk_test_...`
- **Test Public Key**: `pk_test_...`

### Test Cards
Paystack provides test cards:
- **Success**: `4084084084084081`
- **Declined**: `5060666666666666666`
- **Insufficient Funds**: `5060666666666666666`

Use any future expiry date and any CVV.

### Testing Flow
1. Set test keys in `.env`
2. Create test plans in Paystack dashboard
3. Test payment flow end-to-end
4. Verify webhook delivery
5. Check subscription creation in Firestore

---

## 🚨 Troubleshooting

### Payment Link Not Created
- Check API keys are set correctly
- Verify plan codes are configured
- Check backend logs for errors
- Ensure Paystack API is accessible

### Payment Verification Fails
- Check transaction status in Paystack dashboard
- Verify payment session exists in Firestore
- Check metadata is present in transaction
- Review logs for specific error

### Webhook Not Received
- Verify webhook URL is correct in dashboard
- Check webhook URL is accessible from internet
- Verify signature verification logic
- Check backend is not blocking Paystack IPs
- Review firewall/security group settings

### Duplicate Subscriptions
- Check idempotency logic is working
- Verify `isPaymentProcessed` function
- Review webhook retry handling
- Check for race conditions

---

## 📝 Key Differences from Dodo Payments

| Feature | Dodo Payments | Paystack |
|---------|--------------|----------|
| **SDK Package** | `dodopayments` | `paystack` |
| **API Key Prefix** | Custom bearer token | `sk_live_` or `sk_test_` |
| **Transaction ID** | `payment_id` | `reference` |
| **Webhook Header** | `dodo-signature` | `x-paystack-signature` |
| **Hash Algorithm** | HMAC SHA-256 | HMAC SHA-512 |
| **Callback URL** | `return_url` | `callback_url` |
| **Success Event** | `payment.succeeded` | `charge.success` |
| **Plans** | Product IDs | Plan Codes |
| **Amount Format** | Dollars | Kobo (cents × 100) |

---

## 🌍 Supported Countries

Paystack primarily supports:
- 🇳🇬 Nigeria (NGN)
- 🇬🇭 Ghana (GHS)
- 🇿🇦 South Africa (ZAR)
- 🇰🇪 Kenya (KES)
- 🌍 International payments (USD, EUR, GBP)

**Note**: Check Paystack's current coverage on their website for the latest information.

---

## 💰 Pricing & Fees

Paystack charges a transaction fee:
- **Nigeria**: 1.5% + ₦100 (capped at ₦2,000)
- **Ghana**: 1.95%
- **South Africa**: 2.9%
- **International**: 3.9% + $0.10

Check the [Paystack Pricing](https://paystack.com/pricing) page for current rates.

---

## 📚 Additional Resources

- [Paystack Documentation](https://paystack.com/docs)
- [Paystack API Reference](https://paystack.com/docs/api)
- [Paystack Node.js SDK](https://github.com/PaystackHQ/paystack-node)
- [Paystack Dashboard](https://dashboard.paystack.com)
- [Webhook Events Reference](https://paystack.com/docs/payments/webhooks)

---

## ✅ Deployment Checklist

Before going to production:

- [ ] Set `PAYSTACK_ENVIRONMENT=live`
- [ ] Configure production secret and public keys
- [ ] Set production plan codes
- [ ] Configure webhook URL in Paystack dashboard
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Test payment flow end-to-end
- [ ] Verify webhook receives events
- [ ] Set up monitoring and alerts
- [ ] Review Firestore security rules
- [ ] Test idempotency (duplicate payment handling)
- [ ] Verify error handling and logging
- [ ] Test subscription renewal (wait for first cycle or simulate)
- [ ] Verify subscription cancellation works
- [ ] Test failed payment scenarios

---

**Last Updated**: December 2025
**Version**: 1.0.0 (Paystack Integration)


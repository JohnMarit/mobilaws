# Dodo Payments Production Implementation Guide

This guide covers the production-ready implementation of Dodo Payments in the Mobilaws project.

## ✅ What's Been Implemented

### 1. **Persistent Payment Session Storage**
- ✅ Replaced in-memory `Map` with Firestore-based storage
- ✅ Payment sessions stored in `payment_sessions` collection
- ✅ Automatic expiry after 24 hours
- ✅ Survives server restarts and deployments

### 2. **Idempotency Protection**
- ✅ Prevents duplicate subscription creation
- ✅ Checks both payment sessions and purchase records
- ✅ Returns existing subscription if payment already processed
- ✅ Handles webhook retries gracefully

### 3. **Enhanced Webhook Verification**
- ✅ Proper HMAC SHA256 signature verification
- ✅ Timing-safe comparison to prevent timing attacks
- ✅ Supports multiple signature header formats
- ✅ Comprehensive error logging

### 4. **Improved Error Handling**
- ✅ Retry logic with exponential backoff for API calls
- ✅ Detailed error messages for debugging
- ✅ Graceful fallback to metadata when session missing
- ✅ Comprehensive logging at each step

### 5. **Production-Ready Features**
- ✅ Comprehensive logging with timestamps
- ✅ Performance monitoring (webhook processing time)
- ✅ Multiple webhook event type support
- ✅ Proper status tracking (pending → completed/failed/cancelled)

## 🔧 Production Configuration

### Environment Variables

Add these to your production environment (`.env` or hosting platform):

```bash
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_production_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret_here
DODO_PAYMENTS_ENVIRONMENT=live  # Use 'live' for production, 'test' for testing

# Product IDs (from Dodo Payments dashboard)
DODO_PAYMENTS_PRODUCT_BASIC=prod_basic_plan_id
DODO_PAYMENTS_PRODUCT_STANDARD=prod_standard_plan_id
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_premium_plan_id

# Frontend URL (for payment redirects)
FRONTEND_URL=https://your-production-domain.com

# Node Environment
NODE_ENV=production
```

### Step 1: Get Production API Credentials

1. **Log in to Dodo Payments Dashboard**
   - Go to your Dodo Payments merchant account
   - Navigate to **Settings** → **API Keys**

2. **Generate Production API Key**
   - Create a new API key for production
   - Copy the key (you won't see it again!)
   - Set `DODO_PAYMENTS_API_KEY` in your environment

3. **Get Product IDs**
   - Go to **Products** in your dashboard
   - Create products for each plan (Basic, Standard, Premium)
   - Copy the Product IDs
   - Set them in environment variables:
     - `DODO_PAYMENTS_PRODUCT_BASIC`
     - `DODO_PAYMENTS_PRODUCT_STANDARD`
     - `DODO_PAYMENTS_PRODUCT_PREMIUM`

### Step 2: Configure Webhooks

1. **In Dodo Payments Dashboard**
   - Go to **Developer** → **Webhooks**
   - Click **Add Webhook**

2. **Webhook Configuration**
   - **URL**: `https://your-backend-domain.com/api/payment/webhook`
   - **Events to Subscribe**:
     - `payment.succeeded` or `payment.completed`
     - `payment.failed`
     - `payment.cancelled`
   - **Secret**: Copy the webhook secret
   - Set `DODO_PAYMENTS_WEBHOOK_SECRET` in your environment

3. **Test Webhook**
   - Use the test button in Dodo Payments dashboard
   - Check your backend logs to verify receipt

### Step 3: Firestore Setup

The implementation uses these Firestore collections:

- `payment_sessions` - Stores payment session data
- `purchases` - Purchase transaction history
- `subscriptions` - User subscription data

**No manual setup required** - collections are created automatically on first use.

**Optional: Add Firestore Indexes**

If you need to query payment sessions by user or status, add these indexes in `firestore.indexes.json`:

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

### Step 4: Express Raw Body Configuration

For proper webhook signature verification, you may need to configure Express to capture raw request body.

**If using Express 4.x:**

```typescript
// In your server.ts or app.ts
import express from 'express';

const app = express();

// For webhook routes, use raw body
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json()); // For other routes
```

**If using Express 5.x:**

The implementation uses `JSON.stringify(req.body)` which should work, but for more accurate signature verification, consider using raw body middleware.

## 📊 Monitoring & Logging

### Key Log Messages

The implementation logs important events:

- `🔗 Creating payment link` - Payment link creation started
- `✅ Payment created successfully` - Payment link created
- `✅ Payment link created` - Payment session saved
- `✅ Payment verified` - Payment verification successful
- `✅ Subscription created` - Subscription created successfully
- `📨 Webhook received` - Webhook event received
- `✅ Webhook processed` - Webhook processed successfully
- `❌ Error` - Any errors with full context

### Monitoring Checklist

- [ ] Monitor webhook processing time (logged in webhook handler)
- [ ] Set up alerts for failed payments
- [ ] Monitor payment session expiry
- [ ] Track subscription creation success rate
- [ ] Monitor API retry attempts

## 🔒 Security Best Practices

### 1. **API Key Security**
- ✅ Never commit API keys to version control
- ✅ Use environment variables or secret management
- ✅ Rotate keys periodically
- ✅ Use different keys for test/production

### 2. **Webhook Security**
- ✅ Always verify webhook signatures
- ✅ Use HTTPS for webhook endpoints
- ✅ Validate webhook payload structure
- ✅ Implement rate limiting on webhook endpoint

### 3. **Data Protection**
- ✅ Store payment sessions with expiry
- ✅ Don't log sensitive payment data
- ✅ Use Firestore security rules
- ✅ Implement proper access controls

### 4. **Error Handling**
- ✅ Don't expose internal errors to clients
- ✅ Log errors with context for debugging
- ✅ Implement proper error responses

## 🧪 Testing

### Test Payment Flow

1. **Create Payment Link**
   ```bash
   POST /api/payment/create-link
   {
     "planId": "basic",
     "userId": "test-user-123",
     "planName": "Basic",
     "price": 5,
     "tokens": 50,
     "userEmail": "test@example.com",
     "userName": "Test User"
   }
   ```

2. **Verify Payment**
   ```bash
   POST /api/payment/verify
   {
     "paymentId": "pay_123456"
   }
   ```

3. **Check Payment Status**
   ```bash
   GET /api/payment/status/pay_123456
   ```

### Test Webhook

Use Dodo Payments test webhook feature or send a test request:

```bash
curl -X POST https://your-backend.com/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "dodo-signature: your_signature" \
  -d '{
    "type": "payment.succeeded",
    "data": {
      "payment_id": "pay_123456",
      "status": "completed",
      "amount": 500,
      "metadata": {
        "planId": "basic",
        "userId": "test-user-123",
        "planName": "Basic",
        "tokens": "50"
      }
    }
  }'
```

## 🚀 Deployment Checklist

Before going to production:

- [ ] Set `DODO_PAYMENTS_ENVIRONMENT=live`
- [ ] Configure production API key
- [ ] Set production product IDs
- [ ] Configure webhook URL in Dodo Payments dashboard
- [ ] Set webhook secret
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Test payment flow end-to-end
- [ ] Verify webhook receives events
- [ ] Set up monitoring and alerts
- [ ] Review Firestore security rules
- [ ] Test idempotency (duplicate payment handling)
- [ ] Verify error handling and logging

## 📝 API Endpoints

### Create Payment Link
```
POST /api/payment/create-link
```

### Verify Payment
```
POST /api/payment/verify
```

### Get Payment Status
```
GET /api/payment/status/:paymentId
```

### Webhook Endpoint
```
POST /api/payment/webhook
```

### Configuration Check
```
GET /api/payment/config-check
```

## 🔄 Migration from Development

If you're migrating from a development setup:

1. **Backup Data**
   - Export existing subscriptions from Firestore
   - Note any pending payments

2. **Update Environment**
   - Switch to production API keys
   - Update product IDs
   - Set production frontend URL

3. **Test Thoroughly**
   - Test with small amounts first
   - Verify webhook delivery
   - Check subscription creation

4. **Monitor Closely**
   - Watch logs for first few days
   - Monitor error rates
   - Check payment success rates

## 🆘 Troubleshooting

### Payment Link Not Created
- Check API key is set correctly
- Verify product IDs are configured
- Check backend logs for errors
- Verify Dodo Payments API is accessible

### Payment Verification Fails
- Check payment status in Dodo Payments dashboard
- Verify payment session exists in Firestore
- Check metadata is present in payment
- Review logs for specific error

### Webhook Not Received
- Verify webhook URL is correct in dashboard
- Check webhook secret matches
- Verify signature verification logic
- Check backend is accessible from internet
- Review firewall/security group settings

### Duplicate Subscriptions
- Check idempotency logic is working
- Verify `isPaymentProcessed` function
- Review webhook retry handling
- Check for race conditions

## 📚 Additional Resources

- [Dodo Payments API Documentation](https://docs.dodopayments.com)
- [Dodo Payments Dashboard](https://dashboard.dodopayments.com)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)

---

**Last Updated**: Production implementation complete
**Version**: 1.0.0


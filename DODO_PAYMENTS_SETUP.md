# Dodo Payments Integration Setup Guide

This guide will help you set up Dodo Payments for token subscriptions in your Mobilaws application.

## ✅ What Has Been Implemented

### Backend Changes
- ✅ Replaced Stripe with Dodo Payments in `ai-backend/src/routes/payment.ts`
- ✅ Updated environment configuration in `ai-backend/src/env.ts`
- ✅ Removed Stripe dependencies from backend
- ✅ Added Dodo Payments API integration for:
  - Creating payment links
  - Verifying payments
  - Webhook handling
  - Payment status checking

### Frontend Changes
- ✅ Updated `src/contexts/SubscriptionContext.tsx` to work with Dodo Payments
- ✅ Updated `src/components/PaymentModal.tsx` to redirect to Dodo Payments checkout
- ✅ Created payment success page (`src/pages/PaymentSuccess.tsx`)
- ✅ Created payment cancel page (`src/pages/PaymentCancel.tsx`)
- ✅ Removed Stripe dependencies from frontend
- ✅ Added payment routes to `src/App.tsx`

## 🔧 Setup Instructions

### Step 1: Get Dodo Payments Credentials

1. **Sign up for Dodo Payments**
   - Go to [Dodo Payments](https://dodopayments.com) and create a merchant account
   - Complete the verification process

2. **Get API Credentials**
   - Navigate to **Developer > API Keys** in your Dodo Payments dashboard
   - Generate your API key (keep this secret!)
   - Copy your API key for use in the backend

3. **Set Up Webhooks** (Recommended)
   - Go to **Developer > Webhooks** in your dashboard
   - Create a webhook endpoint pointing to: `https://your-backend-url.com/api/payment/webhook`
   - Copy the webhook secret for verification

### Step 2: Configure Backend Environment Variables

Add the following to your backend `.env` file (in `ai-backend/.env`):

```bash
# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret_here
DODO_PAYMENTS_ENVIRONMENT=test  # Use 'test' for testing, 'live' for production

# Frontend URL (for payment redirects)
FRONTEND_URL=https://your-frontend-url.com
```

**Important Security Notes:**
- ✅ API keys are stored in backend only (never in frontend)
- ✅ Never commit `.env` files to version control
- ✅ Use test mode during development
- ✅ Switch to live mode only when ready for production

### Step 3: Update Frontend Environment

Make sure your frontend `.env` has the correct backend URL:

```bash
VITE_BACKEND_URL=https://your-backend-url.com
```

### Step 4: Install Dependencies

The integration uses native `fetch` API, so no additional packages are needed. However, make sure to:

1. **Remove old Stripe packages** (if not already done):
   ```bash
   cd ai-backend
   npm uninstall stripe
   ```

2. **Install backend dependencies**:
   ```bash
   cd ai-backend
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   npm install
   ```

### Step 5: Test the Integration

1. **Start the backend server**:
   ```bash
   cd ai-backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

3. **Test Payment Flow**:
   - Log in to your application
   - Navigate to subscription plans
   - Click "Purchase" on any plan
   - You should be redirected to Dodo Payments checkout
   - Complete a test payment
   - You should be redirected back to the success page

## 🔄 Payment Flow

1. **User clicks "Purchase"** → Frontend calls `/api/payment/create-link`
2. **Backend creates payment link** → Returns Dodo Payments checkout URL
3. **User redirected to Dodo Payments** → Completes payment
4. **Dodo Payments redirects back** → To `/payment/success?payment_id=xxx`
5. **Frontend verifies payment** → Calls `/api/payment/verify`
6. **Backend verifies with Dodo Payments** → Creates subscription
7. **User sees success message** → Tokens are now available

## 🔐 Webhook Setup (Recommended)

Webhooks provide real-time payment notifications. To set up:

1. **In Dodo Payments Dashboard**:
   - Go to Developer > Webhooks
   - Add webhook URL: `https://your-backend-url.com/api/payment/webhook`
   - Select events: `payment.succeeded`, `payment.failed`
   - Copy the webhook secret

2. **Add to Backend `.env`**:
   ```bash
   DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Webhook Events Handled**:
   - `payment.succeeded` - Automatically creates subscription
   - `payment.failed` - Logs failed payment

## 📝 API Endpoints

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payment/create-link` | POST | Creates a payment link for a subscription plan |
| `/api/payment/verify` | POST | Verifies a payment and creates subscription |
| `/api/payment/status/:paymentId` | GET | Gets payment status |
| `/api/payment/webhook` | POST | Webhook endpoint for Dodo Payments events |

### Request/Response Examples

**Create Payment Link:**
```json
POST /api/payment/create-link
{
  "planId": "basic",
  "userId": "user123",
  "planName": "Basic",
  "price": 5,
  "tokens": 50,
  "userEmail": "user@example.com",
  "userName": "John Doe"
}

Response:
{
  "paymentLink": "https://checkout.dodopayments.com/...",
  "paymentId": "pay_123456"
}
```

**Verify Payment:**
```json
POST /api/payment/verify
{
  "paymentId": "pay_123456"
}

Response:
{
  "success": true,
  "subscription": { ... },
  "message": "Payment verified and subscription created successfully"
}
```

## 🚨 Troubleshooting

### Payment Link Not Created
- ✅ Check that `DODO_PAYMENTS_API_KEY` is set in backend `.env`
- ✅ Verify API key is valid in Dodo Payments dashboard
- ✅ Check backend logs for error messages
- ✅ Ensure `FRONTEND_URL` is correctly set

### Payment Verification Fails
- ✅ Check payment status in Dodo Payments dashboard
- ✅ Verify payment ID is correct
- ✅ Check backend logs for API errors
- ✅ Ensure webhook secret matches (if using webhooks)

### Redirect Issues
- ✅ Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- ✅ Check that success/cancel routes are added to `App.tsx`
- ✅ Ensure payment success page exists at `/payment/success`

### Webhook Not Working
- ✅ Verify webhook URL is accessible from internet
- ✅ Check webhook secret matches in `.env`
- ✅ Review webhook logs in Dodo Payments dashboard
- ✅ Check backend logs for webhook errors

## 🔒 Security Best Practices

1. **Never expose API keys**:
   - ✅ API keys only in backend `.env`
   - ✅ Never in frontend code
   - ✅ Never in version control

2. **Use HTTPS**:
   - ✅ All payment communications over HTTPS
   - ✅ Webhook URLs must use HTTPS

3. **Verify Webhook Signatures**:
   - ✅ Always verify webhook signatures
   - ✅ Use webhook secret from Dodo Payments

4. **Test Mode First**:
   - ✅ Use `DODO_PAYMENTS_ENVIRONMENT=test` during development
   - ✅ Switch to `live` only when ready

## 📚 Additional Resources

- [Dodo Payments Documentation](https://docs.dodopayments.com)
- [Dodo Payments API Reference](https://dodopayments.mintlify.app/api-reference)
- [Integration Guide](https://docs.dodopayments.com/api-reference/integration-guide)

## ✅ Checklist

Before going live:

- [ ] Dodo Payments account created and verified
- [ ] API key obtained and added to backend `.env`
- [ ] Webhook configured (optional but recommended)
- [ ] Webhook secret added to backend `.env`
- [ ] Test payments completed successfully
- [ ] Payment success/cancel pages working
- [ ] Frontend redirect URLs configured correctly
- [ ] Environment set to `live` mode
- [ ] All credentials secured (not in version control)
- [ ] HTTPS enabled for all endpoints

## 🎉 You're All Set!

Your Dodo Payments integration is now complete. Users can purchase token subscriptions securely through Dodo Payments, and all credentials are safely stored in the backend.


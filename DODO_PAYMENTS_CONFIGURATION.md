# Dodo Payments Configuration Guide

## ✅ What You've Done

1. ✅ Created three products on Dodo Payments (basic, standard, premium)
2. ✅ Set up webhooks
3. ✅ Created API key: "Mobilaws Server API"

## 🔧 Next Steps: Configure Your Backend

### Step 1: Get Your Product IDs

1. Go to your **Dodo Payments Dashboard**
2. Navigate to **Products** section
3. Find each of your three products (basic, standard, premium)
4. Copy the **Product ID** for each one
   - It will look something like: `prod_abc123xyz` or `prod_1234567890`

### Step 2: Get Your API Key

1. Go to **Developer > API Keys** in Dodo Payments dashboard
2. Find your "Mobilaws Server API" key
3. Copy the **API Key** (it will look like: `dodo_live_...` or `dodo_test_...`)

### Step 3: Get Your Webhook Secret

1. Go to **Developer > Webhooks** in Dodo Payments dashboard
2. Find your webhook endpoint
3. Copy the **Webhook Secret** (it will look like: `whsec_...`)

### Step 4: Configure Backend Environment Variables

Open your backend `.env` file (located at `ai-backend/.env`) and add:

```bash
# Dodo Payments API Configuration
DODO_PAYMENTS_API_KEY=your_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret_here
DODO_PAYMENTS_ENVIRONMENT=test  # Use 'test' for testing, 'live' for production

# Dodo Payments Product IDs (from your dashboard)
DODO_PAYMENTS_PRODUCT_BASIC=prod_your_basic_product_id
DODO_PAYMENTS_PRODUCT_STANDARD=prod_your_standard_product_id
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_your_premium_product_id

# Frontend URL (for payment redirects)
FRONTEND_URL=http://localhost:5173  # For development
# FRONTEND_URL=https://your-production-domain.com  # For production
```

### Step 5: Configure Webhook URL

In your Dodo Payments dashboard:

1. Go to **Developer > Webhooks**
2. Edit your webhook endpoint
3. Set the webhook URL to:
   - **Development**: `http://localhost:8000/api/payment/webhook` (if using ngrok or similar)
   - **Production**: `https://your-backend-url.com/api/payment/webhook`
4. Select these events:
   - ✅ `payment.succeeded`
   - ✅ `payment.completed`
   - ✅ `payment.failed`
5. Save the webhook

### Step 6: Verify Your Product Configuration

Make sure your products in Dodo Payments match these prices:

| Plan | Price | Product ID Variable |
|------|-------|---------------------|
| Basic | $5 | `DODO_PAYMENTS_PRODUCT_BASIC` |
| Standard | $10 | `DODO_PAYMENTS_PRODUCT_STANDARD` |
| Premium | $30 | `DODO_PAYMENTS_PRODUCT_PREMIUM` |

**Note**: The prices in your Dodo Payments products should match the prices in your code ($5, $10, $30).

## 🧪 Testing the Integration

### 1. Start Your Backend

```bash
cd ai-backend
npm run dev
```

### 2. Start Your Frontend

```bash
npm run dev
```

### 3. Test Payment Flow

1. Log in to your application
2. Navigate to subscription plans
3. Click "Purchase" on any plan (Basic, Standard, or Premium)
4. You should be redirected to Dodo Payments checkout
5. Complete a test payment
6. You should be redirected back to `/payment/success`
7. Your subscription should be activated with tokens

## 🔍 Troubleshooting

### Issue: "Product ID not configured" error

**Solution**: Make sure you've added all three product ID environment variables:
- `DODO_PAYMENTS_PRODUCT_BASIC`
- `DODO_PAYMENTS_PRODUCT_STANDARD`
- `DODO_PAYMENTS_PRODUCT_PREMIUM`

### Issue: Payment link not created

**Check**:
- ✅ API key is correct in `.env`
- ✅ API key has proper permissions
- ✅ Product IDs are correct
- ✅ Backend server is running
- ✅ Check backend logs for error messages

### Issue: Webhook not working

**Check**:
- ✅ Webhook URL is accessible from internet (use ngrok for local testing)
- ✅ Webhook secret matches in `.env`
- ✅ Webhook events are selected in Dodo Payments dashboard
- ✅ Check webhook logs in Dodo Payments dashboard

### Issue: Payment verification fails

**Check**:
- ✅ Payment was actually completed in Dodo Payments
- ✅ Payment ID is correct
- ✅ Check backend logs for API errors
- ✅ Verify product IDs match your Dodo Payments products

## 📋 Quick Checklist

Before going live:

- [ ] All three product IDs added to `.env`
- [ ] API key added to `.env`
- [ ] Webhook secret added to `.env`
- [ ] Webhook URL configured in Dodo Payments
- [ ] Webhook events selected (payment.succeeded, payment.failed)
- [ ] Test payment completed successfully
- [ ] Payment success page works
- [ ] Payment cancel page works
- [ ] Environment set to `live` (when ready for production)
- [ ] Frontend URL set correctly for production

## 🚀 Production Deployment

When ready for production:

1. **Switch to Live Mode**:
   ```bash
   DODO_PAYMENTS_ENVIRONMENT=live
   ```

2. **Update Frontend URL**:
   ```bash
   FRONTEND_URL=https://your-production-domain.com
   ```

3. **Use Live API Key**:
   - Get your live API key from Dodo Payments dashboard
   - Update `DODO_PAYMENTS_API_KEY` in production environment

4. **Update Webhook URL**:
   - Set webhook URL to your production backend URL
   - Ensure it uses HTTPS

5. **Test Everything**:
   - Complete a real payment
   - Verify subscription is created
   - Check webhook is received
   - Verify tokens are added

## 📞 Support

If you encounter issues:
1. Check backend logs for error messages
2. Check Dodo Payments dashboard for payment status
3. Verify all environment variables are set correctly
4. Test with Dodo Payments test mode first

## ✅ You're Ready!

Once you've added all the environment variables and configured the webhook, your Dodo Payments integration will be fully functional!


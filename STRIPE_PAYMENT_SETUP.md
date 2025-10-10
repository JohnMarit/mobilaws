# Stripe Payment Gateway Setup Guide

This guide will help you set up Stripe payment processing for the Mobilaws subscription system.

## Prerequisites

1. A Stripe account (create one at [stripe.com](https://stripe.com))
2. Node.js and npm installed
3. The Mobilaws project set up

## Step 1: Get Your Stripe Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** > **API Keys**
3. Copy your **Publishable key** and **Secret key**
   - Use test keys for development (they start with `pk_test_` and `sk_test_`)
   - Use live keys for production (they start with `pk_live_` and `sk_live_`)

## Step 2: Configure Environment Variables

### Frontend Configuration

Create a `.env` file in the root directory:

```bash
# Frontend Environment Variables
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### Backend Configuration

Create a `.env` file in the `ai-backend` directory:

```bash
# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Other existing environment variables...
OPENAI_API_KEY=your_openai_api_key_here
PORT=8000
NODE_ENV=development
# ... etc
```

## Step 3: Set Up Webhooks (Optional but Recommended)

1. In your Stripe Dashboard, go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/payment/webhook`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add it to your backend `.env` file

## Step 4: Test the Integration

1. Start the backend server:
   ```bash
   cd ai-backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Test the payment flow:
   - Log in to the application
   - Go to subscription management
   - Select a plan and click "Purchase"
   - Use Stripe's test card numbers:
     - **Success**: `4242 4242 4242 4242`
     - **Decline**: `4000 0000 0000 0002`
     - **Requires authentication**: `4000 0025 0000 3155`

## Test Card Numbers

Use these test card numbers for testing:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Visa - Success |
| `4000 0000 0000 0002` | Visa - Declined |
| `4000 0025 0000 3155` | Visa - Requires authentication |
| `5555 5555 5555 4444` | Mastercard - Success |
| `2223 0031 2200 3222` | Mastercard - Success |

**Expiry**: Any future date (e.g., `12/25`)  
**CVC**: Any 3 digits (e.g., `123`)  
**ZIP**: Any 5 digits (e.g., `12345`)

## Production Deployment

### 1. Switch to Live Keys

Replace test keys with live keys in your environment variables:

```bash
# Production keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
```

### 2. Update Webhook URL

Update your webhook endpoint to your production domain:

```
https://yourdomain.com/api/payment/webhook
```

### 3. Security Considerations

- Never commit your secret keys to version control
- Use environment variables for all sensitive data
- Enable HTTPS in production
- Set up proper CORS origins
- Monitor your Stripe dashboard for any issues

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check that your Stripe keys are correct
   - Ensure you're using the right keys for your environment (test vs live)

2. **Payment fails silently**
   - Check browser console for errors
   - Verify webhook endpoint is accessible
   - Check Stripe dashboard for failed payments

3. **CORS errors**
   - Ensure your frontend domain is in the CORS_ORIGINS list
   - Check that the backend is running on the correct port

4. **Webhook signature verification fails**
   - Verify the webhook secret is correct
   - Ensure the webhook endpoint is receiving raw request body

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will show detailed error messages in the console.

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe Discord Community](https://discord.gg/stripe)

## Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Use HTTPS** in production
3. **Validate webhook signatures** to ensure requests are from Stripe
4. **Store sensitive data** in environment variables
5. **Monitor your Stripe dashboard** regularly for suspicious activity
6. **Use test mode** during development
7. **Implement proper error handling** for failed payments

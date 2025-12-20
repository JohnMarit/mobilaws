# 🎯 YOUR ACTION ITEMS - Paystack Setup

## Quick Reference: What You Need to Do Now

This is your step-by-step checklist to complete the Paystack integration. Follow these steps in order.

---

## Step 1: Create Paystack Account (15 minutes)

1. Go to [https://paystack.com/signup](https://paystack.com/signup)
2. Enter your business details
3. Verify your email
4. Complete KYC (Know Your Customer) verification
   - Upload required documents
   - Wait for approval (usually 24-48 hours for full verification)
5. Login to dashboard at [https://dashboard.paystack.com](https://dashboard.paystack.com)

**Note**: You can use test mode immediately without full verification for testing.

---

## Step 2: Get Your API Keys (5 minutes)

1. Login to Paystack Dashboard
2. Click **Settings** in the sidebar
3. Click **API Keys & Webhooks**
4. You'll see two sets of keys:

   **Test Keys** (for development):
   - Test Secret Key: `sk_test_xxxxxxxxxxxxxxxxxx`
   - Test Public Key: `pk_test_xxxxxxxxxxxxxxxxxx`
   
   **Live Keys** (for production - available after KYC):
   - Live Secret Key: `sk_live_xxxxxxxxxxxxxxxxxx`
   - Live Public Key: `pk_live_xxxxxxxxxxxxxxxxxx`

5. Copy both test keys for now
6. **Important**: Keep these keys secure! Never commit them to git.

---

## Step 3: Create Subscription Plans (10 minutes)

1. In Paystack Dashboard, click **Payments** → **Plans**
2. Click **Create Plan** button
3. Create three plans with these details:

### Plan 1: Basic
- **Plan Name**: Basic
- **Amount**: 500 (if USD, or adjust for your currency)
  - For USD: Enter 500 (represents $5.00)
  - For NGN: Enter 5000 (represents ₦5,000)
- **Interval**: Monthly
- **Send invoices**: Yes (optional)
- Click **Create Plan**
- **COPY THE PLAN CODE** (looks like `PLN_xxxxxxxxxx`)

### Plan 2: Standard
- **Plan Name**: Standard
- **Amount**: 1000 (USD) or 10000 (NGN)
- **Interval**: Monthly
- Click **Create Plan**
- **COPY THE PLAN CODE**

### Plan 3: Premium
- **Plan Name**: Premium
- **Amount**: 3000 (USD) or 30000 (NGN)
- **Interval**: Monthly
- Click **Create Plan**
- **COPY THE PLAN CODE**

**Important**: Save all three plan codes! You'll need them in the next step.

---

## Step 4: Update Environment Variables (5 minutes)

1. Open your project in VS Code (or your editor)
2. Navigate to `ai-backend/.env` file
3. Find or add these lines:

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_paste_your_test_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_paste_your_test_public_key_here
PAYSTACK_ENVIRONMENT=test

# Paystack Plan Codes (paste the codes from Step 3)
PAYSTACK_PLAN_BASIC=PLN_paste_basic_plan_code_here
PAYSTACK_PLAN_STANDARD=PLN_paste_standard_plan_code_here
PAYSTACK_PLAN_PREMIUM=PLN_paste_premium_plan_code_here

# Frontend URL (keep this as is for local testing)
FRONTEND_URL=http://localhost:5173
```

4. Replace the placeholder values with your actual keys and plan codes
5. Save the file

**Example of what it should look like**:
```bash
PAYSTACK_SECRET_KEY=sk_test_abc123def456ghi789jkl012mno345
PAYSTACK_PUBLIC_KEY=pk_test_xyz987wvu654tsr321qpo098nml765
PAYSTACK_ENVIRONMENT=test
PAYSTACK_PLAN_BASIC=PLN_abc123xyz789
PAYSTACK_PLAN_STANDARD=PLN_def456uvw890
PAYSTACK_PLAN_PREMIUM=PLN_ghi789rst012
FRONTEND_URL=http://localhost:5173
```

---

## Step 5: Set Up Webhook (Optional for local testing)

### For Local Testing (using ngrok)

1. Install ngrok: [https://ngrok.com/download](https://ngrok.com/download)
2. Start your backend server:
   ```bash
   cd ai-backend
   npm run dev
   ```
3. In another terminal, run ngrok:
   ```bash
   ngrok http 8000
   ```
4. Copy the HTTPS URL (looks like `https://abc123.ngrok.io`)
5. In Paystack Dashboard:
   - Go to **Settings** → **API Keys & Webhooks**
   - Scroll to **Webhook URL**
   - Enter: `https://abc123.ngrok.io/api/payment/webhook`
   - Click **Save**

### For Production

Simply enter your production backend URL:
```
https://your-backend-domain.com/api/payment/webhook
```

---

## Step 6: Install Dependencies & Start Server (5 minutes)

Open two terminals:

### Terminal 1 - Backend
```bash
cd ai-backend
npm install
npm run build  # Verify TypeScript build works
npm run dev
```

You should see:
```
Server running on port 8000
✅ Firebase Admin initialized successfully
```

**Note**: The build includes custom TypeScript types for Paystack (in `src/types/paystack.d.ts`)

### Terminal 2 - Frontend
```bash
npm run dev
```

You should see:
```
VITE ready in Xms
Local: http://localhost:5173
```

---

## Step 7: Test the Integration (10 minutes)

1. **Open your browser** to `http://localhost:5173`

2. **Login** with a test user

3. **Check Configuration**:
   - Open: `http://localhost:8000/api/payment/config-check`
   - Verify all values show correctly:
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

4. **Test Payment Flow**:
   - Navigate to subscription/pricing page
   - Click on a plan (e.g., Basic)
   - Click "Purchase" or "Subscribe"
   - You should be redirected to Paystack checkout page

5. **Complete Test Payment**:
   Use these Paystack test card details:
   - **Card Number**: `4084084084084081`
   - **Expiry Date**: Any future date (e.g., 12/25)
   - **CVV**: Any 3 digits (e.g., 123)
   - **PIN**: `1234` (if prompted)
   - **OTP**: `123456` (if prompted)

6. **Verify Success**:
   - You should be redirected to success page
   - Check that tokens are credited to your account
   - Check backend logs for confirmation

---

## Step 8: Verify Everything Works

Run through this checklist:

- [ ] Backend server starts without errors
- [ ] Frontend loads successfully
- [ ] Configuration check shows all correct values
- [ ] Can view subscription plans
- [ ] Clicking "Subscribe" redirects to Paystack
- [ ] Test payment completes successfully
- [ ] Redirected back to success page
- [ ] Tokens credited to user account
- [ ] Subscription shows in user dashboard
- [ ] Backend logs show payment processed
- [ ] Webhook received (if configured)

---

## 🚨 Troubleshooting

### "Paystack API key not configured"
- Check `.env` file has `PAYSTACK_SECRET_KEY`
- Restart backend server after changing `.env`
- Verify key starts with `sk_test_` or `sk_live_`

### "Plan code not configured"
- Check `.env` has all three plan codes
- Verify plan codes start with `PLN_`
- Restart backend server

### Payment link not opening
- Check browser console for errors
- Verify API keys are correct
- Check backend logs for error details

### Webhook not receiving events
- For local: Make sure ngrok is running
- For production: Verify URL is accessible
- Check Paystack webhook logs in dashboard

### Tokens not credited
- Check backend logs for errors
- Verify webhook was received
- Manually call verify endpoint if needed

---

## 📞 Need Help?

1. **Check Documentation**:
   - `PAYSTACK_INTEGRATION_GUIDE.md` - Full technical guide
   - `PAYSTACK_MIGRATION_SUMMARY.md` - What was changed

2. **Paystack Support**:
   - Email: support@paystack.com
   - Docs: https://paystack.com/docs
   - Community: https://paystack.com/community

3. **Test Cards**: https://paystack.com/docs/payments/test-payments

---

## ✅ Completion Checklist

- [ ] Paystack account created
- [ ] Test API keys obtained
- [ ] Three subscription plans created
- [ ] Plan codes copied
- [ ] `.env` file updated with all values
- [ ] Dependencies installed (`npm install`)
- [ ] Backend server running
- [ ] Frontend running
- [ ] Configuration check passed
- [ ] Test payment successful
- [ ] Tokens credited
- [ ] Webhook configured (optional for testing)

---

## 🚀 Going Live (When Ready)

1. Complete full KYC verification with Paystack
2. Get live API keys
3. Create live subscription plans
4. Update `.env` with live keys and plan codes
5. Set `PAYSTACK_ENVIRONMENT=live`
6. Update webhook URL to production
7. Test with small real payment first
8. Monitor closely for first few transactions

---

**Next**: Follow these steps in order. Once complete, your Paystack integration will be fully functional! 🎉

**Estimated Total Time**: 45-60 minutes


# 🚨 Vercel Deployment Fix - Paystack Environment Variables

## Issue
Getting 500 Internal Server Error when trying to create payment link:
```
POST https://mobilaws-ympe.vercel.app/api/payment/create-link 500 (Internal Server Error)
```

## Root Cause
The Paystack environment variables are **not set in Vercel**. The backend is deployed but missing the required configuration.

---

## ✅ **FIX: Add Environment Variables to Vercel**

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click on your `mobilaws` project

2. **Navigate to Settings**
   - Click **Settings** tab
   - Click **Environment Variables** in the sidebar

3. **Add These Variables** (one by one):

   Click **Add New** for each:

   ```bash
   # Paystack Configuration
   Name: PAYSTACK_SECRET_KEY
   Value: sk_test_your_secret_key_here
   Environment: Production, Preview, Development (select all)
   
   Name: PAYSTACK_PUBLIC_KEY
   Value: pk_test_your_public_key_here
   Environment: Production, Preview, Development (select all)
   
   Name: PAYSTACK_ENVIRONMENT
   Value: test
   Environment: Production, Preview, Development (select all)
   
   Name: PAYSTACK_PLAN_BASIC
   Value: PLN_your_basic_plan_code
   Environment: Production, Preview, Development (select all)
   
   Name: PAYSTACK_PLAN_STANDARD
   Value: PLN_your_standard_plan_code
   Environment: Production, Preview, Development (select all)
   
   Name: PAYSTACK_PLAN_PREMIUM
   Value: PLN_your_premium_plan_code
   Environment: Production, Preview, Development (select all)
   ```

4. **Redeploy**
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**
   - Check **Use existing Build Cache** ✅
   - Click **Redeploy**

---

### Method 2: Via Vercel CLI

If you have Vercel CLI installed:

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add PAYSTACK_SECRET_KEY production
# Paste your secret key when prompted

vercel env add PAYSTACK_PUBLIC_KEY production
# Paste your public key when prompted

vercel env add PAYSTACK_ENVIRONMENT production
# Enter: test

vercel env add PAYSTACK_PLAN_BASIC production
# Paste your plan code

vercel env add PAYSTACK_PLAN_STANDARD production
# Paste your plan code

vercel env add PAYSTACK_PLAN_PREMIUM production
# Paste your plan code

# Redeploy
vercel --prod
```

---

## 🔍 **How to Get Your Paystack Credentials**

### If You Haven't Set Up Paystack Yet:

1. **Create Paystack Account**
   - Go to [paystack.com/signup](https://paystack.com/signup)
   - Complete registration

2. **Get Test Keys**
   - Login to [dashboard.paystack.com](https://dashboard.paystack.com)
   - Go to **Settings** → **API Keys & Webhooks**
   - Copy your **Test Secret Key** (starts with `sk_test_`)
   - Copy your **Test Public Key** (starts with `pk_test_`)

3. **Create Subscription Plans**
   - Go to **Payments** → **Plans**
   - Click **Create Plan**
   - Create three plans:
     - **Basic**: Amount 500 (or 5 USD), Interval: Monthly
     - **Standard**: Amount 1000 (or 10 USD), Interval: Monthly
     - **Premium**: Amount 3000 (or 30 USD), Interval: Monthly
   - Copy each **Plan Code** (starts with `PLN_`)

---

## 🧪 **Testing After Fix**

1. **Wait for Deployment** (2-3 minutes)

2. **Verify Configuration**
   ```
   https://mobilaws-ympe.vercel.app/api/payment/config-check
   ```
   
   Should show:
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

3. **Test Payment Flow**
   - Go to your app
   - Try to subscribe to a plan
   - Should redirect to Paystack checkout

---

## 📋 **Complete Environment Variables Checklist**

Make sure ALL of these are set in Vercel:

- [ ] `PAYSTACK_SECRET_KEY` - Your Paystack secret key
- [ ] `PAYSTACK_PUBLIC_KEY` - Your Paystack public key
- [ ] `PAYSTACK_ENVIRONMENT` - Set to `test` or `live`
- [ ] `PAYSTACK_PLAN_BASIC` - Plan code for Basic plan
- [ ] `PAYSTACK_PLAN_STANDARD` - Plan code for Standard plan
- [ ] `PAYSTACK_PLAN_PREMIUM` - Plan code for Premium plan
- [ ] `OPENAI_API_KEY` - Your OpenAI key (should already be set)
- [ ] `FRONTEND_URL` - Your frontend URL (probably already set)
- [ ] All other existing environment variables

---

## 🚨 **Common Mistakes**

❌ **Wrong Environment Selection**
- Make sure to select **Production** environment when adding variables
- Also select Preview and Development for testing

❌ **Forgot to Redeploy**
- Variables are only applied after redeployment
- Go to Deployments → Redeploy

❌ **Typo in Variable Names**
- Variable names are case-sensitive
- Must match exactly: `PAYSTACK_SECRET_KEY` not `PAYSTACK_SECRET`

❌ **Using Wrong Keys**
- Make sure you're using the **Secret Key** not the Public Key
- Secret key starts with `sk_test_` or `sk_live_`

---

## 🔧 **Quick Fix Summary**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all 6 Paystack variables listed above
3. Go to Deployments → Redeploy latest deployment
4. Wait 2-3 minutes
5. Test at `/api/payment/config-check`
6. Try payment flow again

---

## 📞 **Still Having Issues?**

### Check Vercel Logs

1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Click **Functions** tab
4. Look for error messages in the logs

### Check Backend Response

Open browser console and check the full error:
```javascript
// In browser console
fetch('https://mobilaws-ympe.vercel.app/api/payment/create-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planId: 'basic',
    userId: 'test-user',
    planName: 'Basic',
    price: 5,
    tokens: 50,
    userEmail: 'test@example.com'
  })
}).then(r => r.json()).then(console.log)
```

This will show the actual error message.

---

## ✅ **After Setting Variables**

Your deployment will work and you'll be able to:
- ✅ Create payment links
- ✅ Redirect to Paystack checkout
- ✅ Process payments
- ✅ Credit tokens to users

---

**Next**: Follow the steps above to add environment variables to Vercel, then redeploy! 🚀


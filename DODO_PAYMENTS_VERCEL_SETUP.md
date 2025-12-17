# Dodo Payments - Vercel Environment Variables Setup

## 📍 Where to Add the Keys

### ✅ Option 1: Local Development (`.env` file)

**File:** `ai-backend/.env`

Add these for local testing:

```bash
# Dodo Payments API Configuration
DODO_PAYMENTS_API_KEY=your_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret_here
DODO_PAYMENTS_ENVIRONMENT=test  # Use 'test' for testing

# Dodo Payments Product IDs
DODO_PAYMENTS_PRODUCT_BASIC=prod_your_basic_product_id
DODO_PAYMENTS_PRODUCT_STANDARD=prod_your_standard_product_id
DODO_PAYMENTS_PRODUCT_PREMIUM=prod_your_premium_product_id

# Frontend URL (for local development)
FRONTEND_URL=http://localhost:5173
```

### ✅ Option 2: Vercel Production (Environment Variables)

**Add to your BACKEND project on Vercel** (not the frontend)

## 🚀 Step-by-Step: Add to Vercel

### Step 1: Go to Your Backend Project

1. Visit: https://vercel.com/dashboard
2. Find and click on your **backend project** (usually named something like `mobilaws-backend` or `mobilaws-ympe`)
   - ⚠️ **Important:** This is your BACKEND project, not the frontend!

### Step 2: Open Environment Variables

1. Click **"Settings"** tab (top menu)
2. Click **"Environment Variables"** in the left sidebar

### Step 3: Add Each Variable

Click **"Add New"** for each of these:

#### Variable 1: DODO_PAYMENTS_API_KEY
- **Key:** `DODO_PAYMENTS_API_KEY`
- **Value:** Your API key from Dodo Payments dashboard
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

#### Variable 2: DODO_PAYMENTS_WEBHOOK_SECRET
- **Key:** `DODO_PAYMENTS_WEBHOOK_SECRET`
- **Value:** Your webhook secret from Dodo Payments dashboard
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

#### Variable 3: DODO_PAYMENTS_ENVIRONMENT
- **Key:** `DODO_PAYMENTS_ENVIRONMENT`
- **Value:** `live` (for production) or `test` (for testing)
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

#### Variable 4: DODO_PAYMENTS_PRODUCT_BASIC
- **Key:** `DODO_PAYMENTS_PRODUCT_BASIC`
- **Value:** Your Basic product ID from Dodo Payments (e.g., `prod_abc123`)
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

#### Variable 5: DODO_PAYMENTS_PRODUCT_STANDARD
- **Key:** `DODO_PAYMENTS_PRODUCT_STANDARD`
- **Value:** Your Standard product ID from Dodo Payments
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

#### Variable 6: DODO_PAYMENTS_PRODUCT_PREMIUM
- **Key:** `DODO_PAYMENTS_PRODUCT_PREMIUM`
- **Value:** Your Premium product ID from Dodo Payments
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

#### Variable 7: FRONTEND_URL (if not already set)
- **Key:** `FRONTEND_URL`
- **Value:** Your frontend URL (e.g., `https://mobilaws.vercel.app`)
- **Environments:** ✓ Production ✓ Preview ✓ Development
- Click **"Save"**

### Step 4: Redeploy Your Backend

After adding all variables:

1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click **"⋯"** (three dots) → **"Redeploy"**
4. Or push a new commit to trigger auto-deploy

**Important:** Environment variables are only loaded on new deployments!

## 📋 Quick Checklist

- [ ] Added `DODO_PAYMENTS_API_KEY` to Vercel
- [ ] Added `DODO_PAYMENTS_WEBHOOK_SECRET` to Vercel
- [ ] Added `DODO_PAYMENTS_ENVIRONMENT` to Vercel (set to `live` for production)
- [ ] Added `DODO_PAYMENTS_PRODUCT_BASIC` to Vercel
- [ ] Added `DODO_PAYMENTS_PRODUCT_STANDARD` to Vercel
- [ ] Added `DODO_PAYMENTS_PRODUCT_PREMIUM` to Vercel
- [ ] Added `FRONTEND_URL` to Vercel (if not already there)
- [ ] Redeployed backend after adding variables
- [ ] Updated webhook URL in Dodo Payments to point to your Vercel backend URL

## 🔍 How to Find Your Backend URL on Vercel

1. Go to your backend project on Vercel
2. Look at the **"Deployments"** tab
3. Your backend URL will be something like:
   - `https://mobilaws-backend.vercel.app`
   - `https://mobilaws-ympe.vercel.app`
   - Or your custom domain

4. Your webhook URL should be:
   - `https://your-backend-url.vercel.app/api/payment/webhook`

## ⚠️ Important Notes

1. **Backend vs Frontend:**
   - ✅ Add to **BACKEND** project on Vercel
   - ❌ Do NOT add to frontend project (frontend doesn't need these)

2. **Redeploy Required:**
   - After adding environment variables, you MUST redeploy
   - Variables are only loaded when the app starts

3. **Environment Selection:**
   - Select all three: Production, Preview, Development
   - This ensures variables work in all environments

4. **Webhook URL:**
   - Update your webhook in Dodo Payments dashboard
   - Point it to: `https://your-backend-url.vercel.app/api/payment/webhook`
   - Make sure it uses HTTPS (required by Dodo Payments)

## 🧪 Testing

After adding variables and redeploying:

1. Test payment flow on your production site
2. Check backend logs in Vercel dashboard
3. Verify webhook is received (check Dodo Payments webhook logs)

## ✅ You're Done!

Once you've added all variables to Vercel and redeployed, your Dodo Payments integration will work in production!


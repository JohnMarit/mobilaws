# 🇰🇪 Kenya Shillings (KES) - Quick Setup Guide

## ✅ Currency Configuration DONE

The code is now configured for **Kenya Shillings (KES)** by default.

---

## 🚀 **What You Need to Do**

### Step 1: Commit & Push Changes
```bash
git add -A
git commit -m "Configure Paystack for Kenya Shillings (KES)"
git push origin main
```

### Step 2: Add Currency to Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project → **Settings** → **Environment Variables**
3. Add:
   ```
   Name: PAYSTACK_CURRENCY
   Value: KES
   Environments: ✅ Production ✅ Preview ✅ Development
   ```
4. **Save**

### Step 3: Wait for Auto-Deploy
- Vercel will detect your git push
- Auto-deploy in 2-3 minutes
- No manual redeploy needed!

---

## 💰 **Recommended Pricing in KES**

For your Paystack subscription plans:

### Option 1: Direct Conversion (approx $1 = KSh 130)
- **Basic Plan**: KSh 650/month (≈ $5)
- **Standard Plan**: KSh 1,300/month (≈ $10)
- **Premium Plan**: KSh 3,900/month (≈ $30)

### Option 2: Rounded Kenyan Pricing
- **Basic Plan**: KSh 500/month
- **Standard Plan**: KSh 1,000/month
- **Premium Plan**: KSh 3,000/month

### Option 3: Market-Adjusted Pricing
- **Basic Plan**: KSh 700/month
- **Standard Plan**: KSh 1,500/month
- **Premium Plan**: KSh 4,000/month

**Choose what works best for your market!**

---

## 📋 **Create Paystack Plans (KES)**

1. **Login to Paystack Dashboard**
   - Go to [dashboard.paystack.com](https://dashboard.paystack.com)

2. **Navigate to Plans**
   - Click **Payments** → **Plans**

3. **Create Plan 1: Basic**
   - Click **Create Plan**
   - Plan Name: `Basic`
   - Amount: `50000` (for KSh 500) or your chosen amount
   - Currency: **KES** (should be default)
   - Interval: **Monthly**
   - Click **Create**
   - **COPY THE PLAN CODE** (PLN_xxxxxxxx)

4. **Create Plan 2: Standard**
   - Amount: `100000` (for KSh 1,000) or your chosen amount
   - Currency: **KES**
   - Interval: **Monthly**
   - **COPY THE PLAN CODE**

5. **Create Plan 3: Premium**
   - Amount: `300000` (for KSh 3,000) or your chosen amount
   - Currency: **KES**
   - Interval: **Monthly**
   - **COPY THE PLAN CODE**

---

## 🔢 **Understanding Amount Format**

Paystack uses **cents** for KES:
- KSh 1 = 100 cents
- KSh 500 = 50,000 cents
- KSh 1,000 = 100,000 cents
- KSh 3,000 = 300,000 cents

**When creating plans, enter the amount in cents!**

---

## ⚙️ **Complete Vercel Environment Variables**

Make sure ALL of these are set:

```bash
# Required
PAYSTACK_SECRET_KEY=sk_live_your_key_here (or sk_test_ for testing)
PAYSTACK_PUBLIC_KEY=pk_live_your_key_here (or pk_test_ for testing)
PAYSTACK_ENVIRONMENT=live (or test)
PAYSTACK_CURRENCY=KES  ← ADD THIS NOW

# Plan Codes (from Paystack Dashboard)
PAYSTACK_PLAN_BASIC=PLN_your_basic_plan_code
PAYSTACK_PLAN_STANDARD=PLN_your_standard_plan_code
PAYSTACK_PLAN_PREMIUM=PLN_your_premium_plan_code

# Other Required
FRONTEND_URL=https://your-app.vercel.app
OPENAI_API_KEY=your_openai_key
# ... other existing variables
```

---

## 🧪 **Testing**

### Test Configuration:
```bash
curl https://mobilaws-ympe.vercel.app/api/payment/config-check
```

Should show:
```json
{
  "apiKeyPresent": true,
  "publicKeyPresent": true,
  "environment": "live",
  "currency": "KES",
  "planCodes": {
    "basic": "PLN_xxx",
    "standard": "PLN_xxx",
    "premium": "PLN_xxx"
  },
  "sdkClientInitialized": true
}
```

### Test Payment:
1. Open your app
2. Select a subscription plan
3. Should redirect to Paystack checkout
4. Payment amount should show in **KSh** ✅

### Test Card (for testing):
- Card: `4084084084084081`
- Expiry: Any future date
- CVV: Any 3 digits

---

## 📱 **Kenyan Payment Methods Supported**

Paystack in Kenya supports:
- ✅ **Cards**: Visa, Mastercard
- ✅ **Mobile Money**: M-PESA
- ✅ **Bank transfers**

Your customers can choose their preferred payment method!

---

## 📊 **Displaying Prices in Your App**

The frontend currently shows USD prices. You can update them to KES:

### In `src/contexts/SubscriptionContext.tsx`:

```typescript
const plans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 500,  // Display as KSh 500
    tokens: 50,
    description: 'Perfect for occasional legal queries',
    features: [
      '50 AI tokens',
      'Basic legal document search',
      'Email support',
      'Valid for 30 days'
    ]
  },
  // ... update other plans similarly
];
```

---

## ✅ **Complete Setup Checklist**

- [ ] Code updated to KES (✅ already done)
- [ ] Committed and pushed to git
- [ ] Added `PAYSTACK_CURRENCY=KES` to Vercel
- [ ] Created 3 plans in Paystack (with KES amounts)
- [ ] Copied plan codes
- [ ] Updated plan codes in Vercel environment variables
- [ ] Verified all environment variables are set
- [ ] Waited for auto-deploy
- [ ] Tested `/api/payment/config-check`
- [ ] Tested payment flow
- [ ] Verified amounts show in KSh

---

## 🎯 **Quick Actions (Right Now)**

### Action 1: Push to Git (30 seconds)
```bash
git add -A
git commit -m "Configure for Kenya Shillings (KES)"
git push origin main
```

### Action 2: Add to Vercel (1 minute)
- Dashboard → Environment Variables
- Add: `PAYSTACK_CURRENCY` = `KES`
- Save

### Action 3: Wait & Test (3 minutes)
- Wait for auto-deploy
- Test config endpoint
- Try payment flow

---

## 💡 **Pro Tips for Kenya**

### M-PESA Integration
Paystack in Kenya supports M-PESA! Your customers can pay directly from their phones.

### Pricing Strategy
- Consider local purchasing power
- Round to nice numbers (500, 1000, 2000, etc.)
- M-PESA has limits, so keep plans under KSh 70,000

### Tax Compliance
- Include VAT if required (16% in Kenya)
- Plan amounts should be inclusive of tax

---

## ✅ **Expected Result**

After setup:
- ✅ Payments processed in **Kenya Shillings**
- ✅ Customers see prices in **KSh**
- ✅ Can pay with **M-PESA, Cards, or Bank**
- ✅ Subscriptions renew monthly automatically
- ✅ Tokens credited to users

---

**Time to Complete**: 10 minutes  
**Next Step**: Run the git commands above! 🚀

🇰🇪 **Your Kenya Shillings payment system is ready!**


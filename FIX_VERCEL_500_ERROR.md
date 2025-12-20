# ⚡ URGENT: Fix Vercel Deployment Error

## 🚨 Current Issue
```
POST /api/payment/create-link 500 (Internal Server Error)
```

## ✅ The Fix (5 minutes)

Your code is deployed correctly, but **Paystack environment variables are missing** from Vercel.

---

## 📝 **Step-by-Step Fix**

### Step 1: Open Vercel Dashboard
👉 Go to: [https://vercel.com/dashboard](https://vercel.com/dashboard)

### Step 2: Select Your Project
- Click on **mobilaws** (or your project name)

### Step 3: Go to Environment Variables
- Click **Settings** (top navigation)
- Click **Environment Variables** (left sidebar)

### Step 4: Add Variables

Click **"Add New"** button and add these **6 variables**:

#### Variable 1:
```
Name: PAYSTACK_SECRET_KEY
Value: [Your Paystack secret key - starts with sk_test_ or sk_live_]
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 2:
```
Name: PAYSTACK_PUBLIC_KEY
Value: [Your Paystack public key - starts with pk_test_ or pk_live_]
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 3:
```
Name: PAYSTACK_ENVIRONMENT
Value: test
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 4:
```
Name: PAYSTACK_PLAN_BASIC
Value: [Your Basic plan code - starts with PLN_]
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 5:
```
Name: PAYSTACK_PLAN_STANDARD
Value: [Your Standard plan code - starts with PLN_]
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 6:
```
Name: PAYSTACK_PLAN_PREMIUM
Value: [Your Premium plan code - starts with PLN_]
Environments: ✅ Production ✅ Preview ✅ Development
```

### Step 5: Redeploy
- Click **Deployments** tab
- Find the latest deployment
- Click the **⋯** (three dots) menu
- Click **Redeploy**
- Click **Redeploy** again to confirm

### Step 6: Wait & Test (2-3 minutes)
- Wait for deployment to complete
- Visit: `https://your-app.vercel.app/api/payment/config-check`
- Should show all config values as correct

---

## 🔑 **Where to Get Your Values**

### Don't Have Paystack Set Up Yet?

#### Quick Setup (15 minutes):

1. **Sign up**: [https://paystack.com/signup](https://paystack.com/signup)

2. **Get Keys**:
   - Login to [https://dashboard.paystack.com](https://dashboard.paystack.com)
   - Go to: Settings → API Keys & Webhooks
   - Copy: **Test Secret Key** and **Test Public Key**

3. **Create Plans**:
   - Go to: Payments → Plans
   - Click: **Create Plan**
   - Create 3 plans:
     - Basic: $5/month (500 cents)
     - Standard: $10/month (1000 cents)
     - Premium: $30/month (3000 cents)
   - Copy each **Plan Code**

4. **Add to Vercel** (steps above)

---

## 🧪 **Quick Test After Fix**

### Test Configuration:
```bash
curl https://mobilaws-ympe.vercel.app/api/payment/config-check
```

Should return:
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

### Test Payment:
1. Open your app
2. Try to subscribe to a plan
3. Should redirect to Paystack ✅

---

## 📋 **Checklist**

- [ ] Added PAYSTACK_SECRET_KEY to Vercel
- [ ] Added PAYSTACK_PUBLIC_KEY to Vercel
- [ ] Added PAYSTACK_ENVIRONMENT to Vercel
- [ ] Added PAYSTACK_PLAN_BASIC to Vercel
- [ ] Added PAYSTACK_PLAN_STANDARD to Vercel
- [ ] Added PAYSTACK_PLAN_PREMIUM to Vercel
- [ ] Selected all 3 environments (Production, Preview, Development)
- [ ] Clicked "Redeploy" on latest deployment
- [ ] Waited for deployment to complete
- [ ] Tested /api/payment/config-check endpoint
- [ ] Tested payment flow in app

---

## 🎯 **Expected Result**

After following these steps:
- ✅ No more 500 errors
- ✅ Payment links create successfully
- ✅ Redirects to Paystack checkout
- ✅ Can complete test payments

---

## 🆘 **Still Not Working?**

### Check Vercel Function Logs:
1. Vercel Dashboard → Deployments
2. Click latest deployment
3. Click **Functions** tab
4. Look for error messages

### Common Issues:

**"apiKeyPresent: false"**
→ Variable name typo or not saved correctly

**"sdkClientInitialized: false"**
→ Secret key is invalid or not set

**"planCodes shows 'NOT SET'"**
→ Plan codes not added or typo in variable names

---

## 📞 Support

If you need help:
1. Check `VERCEL_ENVIRONMENT_SETUP.md` for detailed guide
2. Check Vercel function logs for specific errors
3. Verify all variable names are spelled exactly as shown

---

**Time to Fix**: 5 minutes (if you have Paystack credentials)  
**Time to Fix**: 20 minutes (if you need to set up Paystack first)

👉 **Start now**: [https://vercel.com/dashboard](https://vercel.com/dashboard)


# How to Find Your Correct Dodo Payments API Key

## 🔴 Current Problem

Your API key starts with: `Vi9jBu1aPFS2zkw` ❌

**This is NOT the correct format!** Dodo Payments API keys MUST start with:
- `sk_test_` for test mode
- `sk_live_` for live mode

---

## ✅ Step-by-Step: Finding Your API Key

### Step 1: Login to Dodo Payments Dashboard

**For LIVE mode (your current setting):**
- Go to: https://live.dodopayments.com/dashboard
- Login with your credentials

**OR for TEST mode (recommended to start):**
- Go to: https://test.dodopayments.com/dashboard
- Login with your credentials

---

### Step 2: Navigate to API Keys

**Look for one of these paths:**

**Option A:**
1. Click **"Settings"** (gear icon) in the top right
2. Click **"API Keys"** or **"Developer"** or **"Developers"**
3. Look for **"API Keys"** or **"Developer Keys"** section

**Option B:**
1. Click **"Developer"** in the left sidebar
2. Click **"API Keys"** or **"Keys"**

**Option C:**
1. Click your **profile/account** icon
2. Go to **"Settings"** → **"API Keys"**

---

### Step 3: Find the SECRET KEY

You should see **TWO types of keys**:

```
┌─────────────────────────────────────────────────────────┐
│ 🔑 Secret Key (Backend)                                 │
│ sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   │
│ [Reveal] [Copy]                                         │
│                                                         │
│ ⚠️ Keep this secret! Never expose in frontend code     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📢 Publishable Key (Frontend - Optional)               │
│ pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   │
│ [Reveal] [Copy]                                         │
│                                                         │
│ Safe to use in frontend code                            │
└─────────────────────────────────────────────────────────┘
```

**YOU NEED THE FIRST ONE (Secret Key starting with `sk_`):**

1. Click **"Reveal"** on the **Secret Key**
2. **Copy the ENTIRE key** (it should be 60-70 characters long)
3. It MUST start with `sk_live_` or `sk_test_`

---

### Step 4: Verify the Key Format

**Before copying, verify:**

✅ **CORRECT format:**
```
sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
OR
```
sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

❌ **WRONG formats (DO NOT USE):**
```
Vi9jBu1aPFS2zkw...          ← What you currently have
pk_live_...                 ← Publishable key (wrong type)
NEjldji43pYHf80...          ← Not a valid format
```

---

### Step 5: Update in Vercel

1. **Go to:** https://vercel.com/dashboard
2. **Click:** Your backend project (`mobilaws-ympe`)
3. **Go to:** Settings → Environment Variables
4. **Find:** `DODO_PAYMENTS_API_KEY`
5. **Replace** the current value with your new key (starting with `sk_`)
6. **Save**

---

### Step 6: Match Environment

**If you're using LIVE mode:**
- Use a key starting with `sk_live_...`
- Keep `DODO_PAYMENTS_ENVIRONMENT=live`

**If you're using TEST mode (recommended for testing):**
- Use a key starting with `sk_test_...`
- Set `DODO_PAYMENTS_ENVIRONMENT=test`

---

### Step 7: Redeploy

**CRITICAL:** After updating the environment variable:

1. Go to **Deployments** tab
2. Click **"⋯"** (three dots) on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

---

### Step 8: Verify

After redeployment, check:
```
https://mobilaws-ympe.vercel.app/api/payment/config-check
```

You should now see:
```json
{
  "apiKeyPrefix": "sk_live_xxxxx"  ✅ CORRECT!
}
```

---

## 🆘 If You Can't Find a Key Starting with `sk_`

**Possible reasons:**

1. **You're looking at the wrong section**
   - Make sure you're in **"API Keys"** or **"Developer Keys"**, not "Webhooks" or "Products"

2. **You need to create a new API key**
   - Look for a **"Create API Key"** or **"Generate Key"** button
   - Create a new key and copy it immediately (you can only see it once!)

3. **You're using a different payment provider**
   - Verify you're actually using Dodo Payments, not another provider

4. **Contact Dodo Payments Support**
   - Email: support@dodopayments.com
   - Ask: "I need my API secret key (starts with sk_) for server-side integration"

---

## 📸 What to Look For

**In the Dodo Payments dashboard, you should see something like:**

```
Developer API Keys
─────────────────────────────────────────────────────
Secret Key (Use in your backend)
sk_live_51AbC123XyZ789... [Reveal] [Copy] [Delete]

Publishable Key (Use in frontend)
pk_live_51AbC123XyZ789... [Reveal] [Copy] [Delete]
─────────────────────────────────────────────────────
```

**Copy the Secret Key (first one)!**

---

## ✅ Quick Checklist

Before trying payment again:

- [ ] Found Secret Key starting with `sk_live_` or `sk_test_`
- [ ] Copied the ENTIRE key (60-70 characters)
- [ ] Updated `DODO_PAYMENTS_API_KEY` in Vercel
- [ ] Matched environment (live/test) with key type
- [ ] Redeployed backend on Vercel
- [ ] Waited 2-3 minutes for deployment
- [ ] Checked `/api/payment/config-check` shows correct prefix
- [ ] Tried creating a payment

---

**Once your API key starts with `sk_`, the 401 error will be fixed!** 🎉


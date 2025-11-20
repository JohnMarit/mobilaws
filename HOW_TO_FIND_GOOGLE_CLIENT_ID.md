# 🔍 How to Find Your Google Client ID

## 📍 **Where to Find It**

### **Option 1: If You Already Have One**

1. **Go to Google Cloud Console:**
   - Visit: [console.cloud.google.com](https://console.cloud.google.com)

2. **Select Your Project:**
   - Click the project dropdown at the top
   - Select your project (or create a new one)

3. **Navigate to Credentials:**
   - Click **"APIs & Services"** in the left menu
   - Click **"Credentials"**

4. **Find Your OAuth 2.0 Client ID:**
   - Look for **"OAuth 2.0 Client IDs"** section
   - You'll see a list of client IDs
   - Click on the one you want to use
   - The **Client ID** will be displayed (looks like: `123456789-abc.apps.googleusercontent.com`)

---

## 🆕 **Option 2: Create a New One (If You Don't Have One)**

### **Step 1: Go to Google Cloud Console**

1. Visit: [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account

### **Step 2: Create or Select a Project**

1. Click the project dropdown at the top
2. Click **"New Project"** (or select existing project)
3. Enter project name: **"Mobilaws"** (or any name)
4. Click **"Create"**

### **Step 3: Enable Google+ API (if needed)**

1. Click **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity Services"**
3. Click on it and click **"Enable"**

### **Step 4: Configure OAuth Consent Screen**

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name:** Mobilaws (or your app name)
   - **User support email:** thuchabraham42@gmail.com
   - **Developer contact:** thuchabraham42@gmail.com
5. Click **"Save and Continue"**
6. On **"Scopes"** page, click **"Save and Continue"**
7. On **"Test users"** page, add: `thuchabraham42@gmail.com`
8. Click **"Save and Continue"**
9. Review and click **"Back to Dashboard"**

### **Step 5: Create OAuth 2.0 Client ID**

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

4. **Configure the OAuth client:**
   - **Application type:** Web application
   - **Name:** Mobilaws Web Client (or any name)

5. **Authorized JavaScript origins:**
   Add these URLs:
   ```
   https://www.mobilaws.com
   https://mobilaws.com
   https://mobilaws.vercel.app
   http://localhost:5173
   http://localhost:3000
   ```

6. **Authorized redirect URIs:**
   Add these URLs:
   ```
   https://www.mobilaws.com
   https://mobilaws.com
   https://mobilaws.vercel.app
   http://localhost:5173
   http://localhost:3000
   ```

7. Click **"Create"**

8. **Copy Your Client ID:**
   - A popup will show your **Client ID** and **Client Secret**
   - **Copy the Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - ⚠️ **Important:** You only need the Client ID for frontend, NOT the secret!

---

## 📋 **What Your Client ID Looks Like**

Your Google Client ID will look like this:
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

It has:
- Numbers at the start
- A hyphen `-`
- Random characters
- Ends with `.apps.googleusercontent.com`

---

## ✅ **Where to Use It**

### **Frontend (Vercel - www.mobilaws.com project)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **frontend project** (www.mobilaws.com)
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Enter:
   ```
   Name:  VITE_GOOGLE_CLIENT_ID
   Value: 123456789-abc.apps.googleusercontent.com
   ```
   (Replace with your actual Client ID)
6. Select: **Production**, **Preview**, **Development** (all 3)
7. Click **"Save"**
8. **Redeploy** your frontend

### **Backend (Vercel - mobilaws-ympe project)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **backend project** (mobilaws-ympe)
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Enter:
   ```
   Name:  GOOGLE_CLIENT_ID
   Value: 123456789-abc.apps.googleusercontent.com
   ```
   (Same Client ID as frontend)
6. Select: **Production**, **Preview**, **Development** (all 3)
7. Click **"Save"**
8. **Redeploy** your backend

---

## 🔍 **Quick Check: Do You Already Have One?**

### **Check Your Existing Projects:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Check the project dropdown - do you see any projects?
3. If yes, select each project and check **"APIs & Services"** → **"Credentials"**
4. Look for **"OAuth 2.0 Client IDs"**

### **Check Your Code/Config Files:**

Search your project for:
```bash
grep -r "apps.googleusercontent.com" .
```

Or check if you have:
- `.env` file with `VITE_GOOGLE_CLIENT_ID`
- Vercel environment variables already set
- Any documentation files mentioning Google Client ID

---

## 🚨 **Common Issues**

### **"Invalid Client ID" Error**
- Make sure you copied the **entire** Client ID
- Check for extra spaces before/after
- Verify it ends with `.apps.googleusercontent.com`

### **"Redirect URI Mismatch" Error**
- Go back to Google Cloud Console
- **APIs & Services** → **Credentials**
- Click on your OAuth Client ID
- Add your domain to **Authorized redirect URIs**:
  ```
  https://www.mobilaws.com
  https://mobilaws.com
  ```

### **"OAuth consent screen not configured"**
- Complete the OAuth consent screen setup (Step 4 above)
- Make sure you added test users if app is in testing mode

---

## 📝 **Summary**

1. **Find existing:** Google Cloud Console → APIs & Services → Credentials
2. **Create new:** Google Cloud Console → Create Project → OAuth Client ID
3. **Use in frontend:** Vercel → Environment Variables → `VITE_GOOGLE_CLIENT_ID`
4. **Use in backend:** Vercel → Environment Variables → `GOOGLE_CLIENT_ID`
5. **Redeploy** both after setting variables

---

## 🔗 **Direct Links**

- **Google Cloud Console:** [console.cloud.google.com](https://console.cloud.google.com)
- **Credentials Page:** [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
- **OAuth Consent Screen:** [console.cloud.google.com/apis/credentials/consent](https://console.cloud.google.com/apis/credentials/consent)

---

**Need Help?** If you can't find it, create a new one following Option 2 above. It only takes 5 minutes!


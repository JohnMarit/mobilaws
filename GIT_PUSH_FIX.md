# Git Push Error Fix

## Problem
The error `failed to push some refs` is caused by **authentication failure**. GitHub no longer accepts password authentication for HTTPS pushes.

## Solutions

### Option 1: Use Personal Access Token (Recommended)

1. **Create a Personal Access Token:**
   - Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a name (e.g., "Mobilaws Repo")
   - Select scopes: `repo` (full control of private repositories)
   - Click "Generate token"
   - **COPY THE TOKEN** (you won't see it again!)

2. **Use the token when pushing:**
   - When prompted for password, paste the **Personal Access Token** instead
   - Or update the remote URL to include the token:
     ```
     git remote set-url origin https://YOUR_TOKEN@github.com/JohnMarit/mobilaws.git
     ```

3. **Or configure Git Credential Manager:**
   ```
   git config --global credential.helper manager-core
   ```
   Then on next push, use your username and the token as password.

### Option 2: Switch to SSH (Alternative)

1. **Generate SSH key (if you don't have one):**
   ```
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Add SSH key to GitHub:**
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste the key

3. **Update remote URL:**
   ```
   git remote set-url origin git@github.com:JohnMarit/mobilaws.git
   ```

### Option 3: Quick Fix - Clear cached credentials

If you have wrong credentials cached:

**Windows (PowerShell):**
```
git credential-manager-core erase
# Then enter: https://github.com

# Or use Windows Credential Manager:
# Control Panel → Credential Manager → Windows Credentials
# Find github.com entry and remove it
```

## Verify the Fix

After fixing authentication, try:
```
git push origin main
```

You should see:
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
...
To https://github.com/JohnMarit/mobilaws.git
   abc1234..def5678  main -> main
```

## Prevention

To avoid this in the future:
- Use Personal Access Tokens instead of passwords
- Store credentials securely with Git Credential Manager
- Or use SSH keys for authentication

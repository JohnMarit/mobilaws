# Sequential Learning System - Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

**What it does:** Updates Firestore security rules to include the new collections (`documentPages` and `userPageProgress`)

### 2. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

**What it does:** Creates indexes for fast querying of document pages and user progress

### 3. Deploy Backend

#### If using Vercel:

```bash
cd ai-backend
vercel --prod
```

#### If using Railway/other:

```bash
# Deploy according to your platform's instructions
# Ensure new code is deployed to backend
```

**What it does:** Deploys the updated backend with sequential learning logic

### 4. Verify Deployment

Test the system with these steps:

#### A. Test Document Upload
1. Log in as tutor admin
2. Upload a multi-page PDF or DOCX
3. Check Firestore: Look for entry in `documentPages` collection
4. Verify pages array has correct number of pages

#### B. Test Lesson Generation
1. Log in as a regular user
2. Navigate to the uploaded module
3. Request new lessons
4. Check Firestore: Look for entry in `userPageProgress` collection
5. Verify response includes `documentProgress` field

#### C. Test Sequential Progress
1. Request more lessons
2. Check that `lastPageCovered` incremented
3. Verify no content repetition
4. Check progress percentage increases

---

## 📋 Detailed Deployment Checklist

### Pre-Deployment

- [x] Code implemented and tested locally
- [x] Documentation created
- [x] Security rules updated
- [x] Indexes configured
- [ ] Backend tests passing (if applicable)
- [ ] Code reviewed (if applicable)

### Deployment Steps

#### Step 1: Backup Current State
```bash
# Export current Firestore data (optional but recommended)
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)
```

#### Step 2: Deploy Security Rules
```bash
# From project root
firebase deploy --only firestore:rules

# Expected output:
# ✔ firestore: released rules firestore.rules to cloud.firestore
```

**Verify:**
- No errors in deployment
- Rules deployed successfully

#### Step 3: Deploy Indexes
```bash
# From project root
firebase deploy --only firestore:indexes

# Expected output:
# ✔ firestore: deployed indexes in firestore.indexes.json successfully
```

**Verify:**
- No errors in deployment
- Indexes created (check Firebase Console → Firestore → Indexes)

**Note:** Index creation may take several minutes. You'll see them in "Building" state initially.

#### Step 4: Deploy Backend Code

**For Vercel:**
```bash
cd ai-backend

# Install dependencies if needed
npm install

# Deploy to production
vercel --prod

# Expected output:
# ✔ Production: https://your-backend.vercel.app [deployed]
```

**For Railway:**
```bash
# Push to main branch (if connected to Git)
git push origin main

# Or deploy via Railway CLI
railway up
```

**Verify:**
- Backend deployed successfully
- New environment variables set (if any)
- Health check passes

#### Step 5: Smoke Test

**Test 1: New Document Upload**
```bash
# As tutor admin:
# 1. Upload a test PDF (10+ pages)
# 2. Wait for processing
# 3. Check Firestore Console:
#    - documentPages collection
#    - Should have 1 new document
#    - pages array should have ~10 entries
```

**Test 2: Lesson Generation**
```bash
# As regular user:
# 1. Navigate to new module
# 2. Request 5 lessons
# 3. Check response for documentProgress
# 4. Check Firestore Console:
#    - userPageProgress collection
#    - Should have entry {userId}_{moduleId}
#    - lastPageCovered should be 5
```

**Test 3: Progress Tracking**
```bash
# As same user:
# 1. Request 5 more lessons
# 2. Verify no repetition in content
# 3. Check userPageProgress updated
# 4. lastPageCovered should be 10
```

### Post-Deployment

- [ ] All smoke tests passed
- [ ] No errors in logs
- [ ] Users can upload documents
- [ ] Users can generate lessons
- [ ] Progress tracking working
- [ ] Old modules still work (RAG fallback)

---

## 🔍 Verification Commands

### Check Firestore Rules
```bash
firebase firestore:rules:get
```

### Check Firestore Indexes Status
```bash
# In Firebase Console:
# Firestore → Indexes → Check for:
# - documentPages (moduleId)
# - documentPages (contentId)
# - documentPages (tutorId)
```

### Check Backend Health
```bash
# Test backend is running
curl https://your-backend.vercel.app/health

# Should return: {"status":"ok"}
```

### Monitor Backend Logs
```bash
# For Vercel
vercel logs --production

# For Railway
railway logs
```

---

## 🐛 Troubleshooting

### Issue: Security Rules Deployment Failed

**Symptoms:**
```
Error: HTTP Error: 400, Invalid rule
```

**Solution:**
1. Check firestore.rules syntax
2. Verify all match blocks are closed
3. Test rules in Firebase Console → Rules Playground

### Issue: Index Creation Slow

**Symptoms:**
- Indexes show "Building" state for >10 minutes

**Solution:**
- This is normal for large databases
- Wait up to 1 hour
- Check Firebase Console for status
- Can continue with deployment

### Issue: Backend Deployment Failed

**Symptoms:**
```
Error: Build failed
```

**Solution:**
1. Check build logs for errors
2. Verify all dependencies installed
3. Ensure TypeScript compiles: `npm run build`
4. Check environment variables are set

### Issue: Document Pages Not Saving

**Symptoms:**
- Document uploads succeed
- No entry in `documentPages` collection

**Solution:**
1. Check backend logs for errors
2. Verify Firestore permissions
3. Check document extraction logic
4. Test with smaller document

### Issue: Progress Not Updating

**Symptoms:**
- Lessons generate successfully
- `userPageProgress` not updating

**Solution:**
1. Check backend logs for Firestore errors
2. Verify user authentication
3. Check collection permissions
4. Test with admin account

### Issue: Old Modules Broken

**Symptoms:**
- Modules uploaded before update don't work

**Solution:**
- This shouldn't happen (RAG fallback)
- Check backend logs for errors
- Verify RAG retrieval code intact
- Test specific module ID

---

## 📊 Monitoring

### Key Metrics to Watch

1. **Document Upload Success Rate**
   - Should be ~100%
   - Monitor: Backend logs, Firestore collection

2. **Page Extraction Accuracy**
   - PDF: Pages should match document
   - DOCX: Reasonable page count
   - Monitor: `documentPages` entries

3. **Lesson Generation Success Rate**
   - Should be ~100% for new modules
   - Monitor: API response success

4. **Progress Tracking Accuracy**
   - `lastPageCovered` should increment
   - Never decrease
   - Monitor: `userPageProgress` collection

5. **User Complaints**
   - Should see reduction in "repetition" complaints
   - Should see positive feedback on progress tracking

### Monitoring Queries

**Count document pages:**
```javascript
// In Firebase Console > Firestore
// Collection: documentPages
// Check: number of documents
```

**Check user progress:**
```javascript
// Collection: userPageProgress
// Filter: userId == {specific_user}
// View: all modules and progress
```

**Backend errors:**
```bash
# Vercel
vercel logs --filter="error" --limit=100

# Railway
railway logs | grep "ERROR"
```

---

## 🔄 Rollback Plan

If something goes wrong:

### 1. Rollback Backend
```bash
# Vercel
vercel rollback https://your-backend.vercel.app

# Railway
railway rollback
```

### 2. Rollback Security Rules
```bash
# From backup
firebase deploy --only firestore:rules --project your-project --force
```

### 3. What Stays
- Document pages remain in Firestore (harmless)
- User progress remains (harmless)
- Old modules continue working

### 4. What to Fix
- Review logs for errors
- Fix issues in code
- Redeploy when ready

---

## 📱 User Communication

### Announcement Template

**Subject:** New Feature: Progress Tracking & Sequential Learning

**Body:**
```
Hi everyone,

We've launched a new feature that improves your learning experience!

What's New:
✅ Learn documents sequentially from start to finish
✅ No more repetitive content
✅ Track your progress through each module (%)
✅ Clear indication of what you've covered

What's Changed:
- When you request new lessons, you'll see a progress indicator
- Each lesson will cover new material (no repetition)
- You'll systematically learn everything in the document

How to Use:
- Nothing changes! Just request lessons as usual
- You'll automatically see the new progress tracking

Benefits:
- Complete coverage of all material
- No confusion from repeated content
- Clear sense of achievement as you progress

Questions? Contact support@mobilaws.com

Happy learning!
The Mobilaws Team
```

---

## 🎯 Success Criteria

Deployment is successful when:

- [x] Security rules deployed without errors
- [x] Indexes created (may be "Building")
- [x] Backend deployed successfully
- [x] New documents extract pages correctly
- [x] Lessons generate with progress info
- [x] Progress tracking updates correctly
- [x] Old modules still work (RAG fallback)
- [x] No errors in logs
- [x] Users can access all features

---

## 📞 Support Contacts

**Technical Issues:**
- Backend errors: Check Vercel/Railway dashboard
- Firestore issues: Check Firebase Console
- Code issues: Review GitHub repository

**Need Help?**
- Review documentation: `SEQUENTIAL_LESSON_PROGRESSION_SYSTEM.md`
- Check troubleshooting: This guide
- Contact: system administrator

---

## 🎉 Deployment Complete!

Once all steps are done:
1. ✅ Verify all tests pass
2. ✅ Monitor for 24 hours
3. ✅ Gather user feedback
4. ✅ Iterate based on feedback

**Status:** Ready for production deployment! 🚀

---

*Deployment Guide v1.0.0*  
*Last Updated: January 12, 2026*

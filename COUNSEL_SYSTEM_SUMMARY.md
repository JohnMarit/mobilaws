# Counsel Booking System - Complete Summary

## ✅ What's Been Implemented

### 1. **Firebase Storage** ✓
All counsel data is stored in **Firebase Firestore** with the following collections:

#### Collections:
- **`counselors`** - Counselor profiles and application status
  - Fields: userId, name, email, phone, nationalIdNumber, applicationStatus (pending/approved/rejected), state, etc.
  
- **`counselRequests`** - User requests for counsel
  - Fields: userId, userName, note, legalCategory, state, status, broadcastedTo, etc.
  
- **`appointments`** - Scheduled appointments
  - Fields: userId, counselorId, scheduledDate, scheduledTime, status, etc.

### 2. **Counselor Application Flow** ✓

#### User Side:
1. User clicks **Profile Menu → Counselor Dashboard**
2. If not applied: Shows "Apply Now" button
3. User fills form:
   - Full Name
   - Phone Number
   - National ID Number
   - State
4. Application is saved to Firestore with `applicationStatus: 'pending'`
5. User sees "Application Pending" status

#### Admin Side:
1. Admin goes to **https://www.mobilaws.com/admin/dashboard**
2. Clicks **"Counselors"** tab
3. Sees 3 sub-tabs:
   - **Pending**: Applications waiting for approval
   - **Approved**: All approved counselors
   - **Rejected**: Rejected applications
4. Admin can:
   - ✅ **Approve** - Counselor can immediately access dashboard
   - ❌ **Reject** - Provide reason, counselor can reapply

### 3. **Counselor Dashboard** ✓
Once approved, counselors can:
- Go online/offline
- Set their state and phone number
- View pending requests
- Accept requests
- View scheduled appointments

### 4. **Book Counsel Feature** ✓
Users can:
- Select state and legal category
- Write a note describing their issue
- Enter phone number
- Request counsel (broadcasts to all online counselors in that state)
- If no one accepts: Schedule an appointment

## 🔍 Debugging Tools

### Test Page: `test-counselor-data.html`
Open this file in a browser to:
- Check all counselors in Firestore
- View pending applications
- See data by status
- Verify data is being saved

### Backend Logs
The system now includes detailed logging:
- Application submissions
- Pending application queries
- Approval/rejection actions

### Check Logs:
```bash
# Backend logs (Vercel)
vercel logs mobilaws-backend --prod

# Or check in Vercel dashboard
```

## 📊 Data Verification Checklist

### To verify data is in Firebase:

1. **Open Firebase Console**:
   - Go to: https://console.firebase.google.com/project/mobilaws-46056/firestore
   - Navigate to **Firestore Database**

2. **Check Collections**:
   - ✓ `counselors` collection exists
   - ✓ Documents have `applicationStatus` field
   - ✓ Pending applications show `applicationStatus: "pending"`

3. **Check Indexes**:
   - Go to **Firestore → Indexes**
   - Should see index for: `counselors` collection with `applicationStatus` + `appliedAt`

## 🐛 Troubleshooting

### If pending application doesn't show in admin dashboard:

1. **Check Firestore directly**:
   - Open Firebase Console
   - Go to Firestore Database
   - Open `counselors` collection
   - Look for the user's document
   - Verify `applicationStatus` is exactly `"pending"` (lowercase)

2. **Check browser console**:
   - Open admin dashboard
   - Press F12 → Console tab
   - Click Counselors tab
   - Look for logs showing:
     ```
     📥 Loading counselor applications...
     📊 Counselor data loaded: { pending: X, all: Y }
     ```

3. **Check backend logs**:
   ```bash
   vercel logs mobilaws-backend --prod
   ```
   - Look for: "📥 Admin requesting pending counselor applications..."
   - Should show: "✅ Found X pending applications"

4. **Verify API is working**:
   ```bash
   curl https://mobilaws-ympe.vercel.app/api/counsel/admin/applications/pending
   ```
   - Should return JSON with applications array

5. **Check Firestore indexes**:
   - If you see "The query requires an index" error
   - Run: `firebase deploy --only firestore:indexes`

## 🔐 Security Rules

Firestore rules ensure:
- Only authenticated users can apply
- Only the user can see their own application
- Admins can see all applications (via backend API)
- Applications cannot be deleted by users

## 📝 Next Steps

If the application still doesn't appear:

1. **Use the test page** (`test-counselor-data.html`) to verify data exists
2. **Check the exact document structure** in Firebase Console
3. **Verify the user's ID** matches between application and Firestore
4. **Check if there are any Firestore security rule blocks**

## 🎯 Key Files

### Backend:
- `ai-backend/src/lib/counsel-storage.ts` - Firestore operations
- `ai-backend/src/routes/counsel.ts` - API endpoints

### Frontend:
- `src/components/CounselorApplication.tsx` - Application form
- `src/components/AdminCounselorApprovals.tsx` - Admin approval interface
- `src/pages/AdminDashboard.tsx` - Admin dashboard with Counselors tab

### Database:
- `firestore.rules` - Security rules
- `firestore.indexes.json` - Query indexes

## 📞 Support

If issues persist:
1. Open `test-counselor-data.html` in browser
2. Click "Check All Counselors"
3. Take a screenshot
4. Check browser console for errors
5. Check Vercel logs for backend errors


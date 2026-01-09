# Troubleshooting Guide: Messages Not Showing for Counselors

## Quick Diagnosis Steps

### Step 1: Open Browser Console (F12)

**For Counselor:**
1. Open the counselor dashboard
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for these logs (they should appear every 3 seconds):

```
🔄 [DASHBOARD] Initial load chats for counselor {counselorId} (online=true)
📡 [DASHBOARD] Fetching chats for counselor: {counselorId}
🌐 [CHAT-SERVICE] getCounselorChats called for counselorId: {counselorId}
   - API URL: {url}
   - Response status: 200 OK
✅ [CHAT-SERVICE] Received data: {data}
   - Chats count: X
📋 [DASHBOARD] API returned X chats for counselor {counselorId}
```

**If you see "Chats count: 0":**
- The issue is in the backend query or data doesn't exist
- Continue to Step 2

**If you don't see these logs at all:**
- Counselor is not online
- Polling is not running
- Check if dashboard is actually open

### Step 2: Check Backend Server Logs

**In your backend terminal**, you should see:

```
📥 [API] GET /chat/counselor/{counselorId} - Request received
📡 Querying counselChats collection for counselorId: {counselorId}
📊 Query result: X chat(s) found for counselor {counselorId}
📤 [API] Returning X chats for counselor {counselorId}
```

**If backend shows 0 chats but you know chats exist:**
- There's a data mismatch (wrong counselorId)
- Continue to Step 3

### Step 3: Verify Counselor ID Match

**In counselor dashboard console, run:**

```javascript
console.log('=== COUNSELOR ID CHECK ===');
console.log('Logged in as:', user.id);
console.log('Email:', user.email);
console.log('Name:', user.name);
```

**Then check Firestore:**
1. Open Firebase Console
2. Go to Firestore Database
3. Navigate to `counselChats` collection
4. Look at any chat document
5. Check the `counselorId` field
6. **COMPARE**: Does the `counselorId` in Firestore match the logged-in `user.id`?

**If they DON'T match:**
- ❌ This is your problem!
- The chat was created with a different counselorId
- See "Solution A" below

**If they DO match:**
- Continue to Step 4

### Step 4: Check Firestore Data

Open Firebase Console → Firestore → `counselChats` collection

**For each chat document, verify:**
- ✅ `counselorId`: Should match counselor's user ID
- ✅ `userId`: Should match the user who started the chat
- ✅ `userName`: User's name
- ✅ `counselorName`: Counselor's name
- ✅ `status`: Should be 'active'
- ✅ `paymentPaid`: Should be `true`
- ✅ `unreadCountCounselor`: Should be > 0 if user sent messages
- ✅ `lastMessage`: Should show the latest message text
- ✅ `lastMessageAt`: Should be a recent timestamp

**Check the messages subcollection:**
1. Expand the chat document
2. Go to `messages` subcollection
3. Verify messages exist
4. Check message fields:
   - `senderId`: Should match the user's ID
   - `senderRole`: Should be 'user'
   - `message`: The message text
   - `read`: false (if unread)

**If messages exist but unreadCountCounselor is 0:**
- See "Solution B" below

### Step 5: Check Counselor Online Status

**In counselor dashboard:**
1. Look at the left sidebar
2. Check the status indicator
3. Should show "🟢 Online"

**If showing "🔴 Offline":**
- Click "Go Online" button
- Wait 3 seconds
- Check if chats appear

### Step 6: Check Polling

**In console, you should see logs every 3 seconds:**

```
📡 [DASHBOARD] Fetching chats for counselor: {counselorId}
```

**If logs appear less frequently or not at all:**
- Dashboard might not be focused
- JavaScript error might be blocking execution
- Check console for errors

---

## Solutions

### Solution A: Counselor ID Mismatch

**Problem**: Chat `counselorId` doesn't match logged-in counselor's `user.id`

**Root Cause**: 
- Counselor signed up with one account but chat was created with different ID
- Multiple counselor accounts exist
- Bug in chat creation logic

**Fix**:
1. Identify the correct counselor ID
2. Option 1: Update Firestore chats to use correct `counselorId`
3. Option 2: Have counselor log in with the account that matches the chats
4. Option 3: Delete and recreate chats with correct counselor ID

**Firestore Update (if needed):**
```javascript
// Run in Firebase Console → Firestore → counselChats
// For each chat that needs updating:
// counselorId: "old_id" → "correct_id"
```

### Solution B: Unread Count Not Incrementing

**Problem**: Messages exist but `unreadCountCounselor` is 0

**Root Cause**: 
- Bug in message sending logic
- Messages not properly updating chat document

**Fix**:
1. Check backend function `sendChatMessage()`
2. Verify this line executes:
```typescript
updateData.unreadCountCounselor = admin.firestore.FieldValue.increment(1);
```
3. Check backend logs for "✅ Message sent in chat {chatId}"
4. Manually update Firestore if needed

### Solution C: Messages Not Saving

**Problem**: User sends message but nothing appears in Firestore

**Fix**:
1. Check user's browser console for errors
2. Look for "📤 Sending message" log
3. Check if "✅ Message sent successfully" appears
4. If not, check backend logs for errors
5. Verify backend is running and accessible

### Solution D: Dashboard Not Updating

**Problem**: Messages in Firestore but dashboard doesn't show them

**Fix**:
1. Check if polling is active (logs every 3s)
2. Force refresh with the "Refresh" button
3. Check for JavaScript errors in console
4. Try hard refresh (Ctrl+Shift+R)
5. Try in incognito mode

### Solution E: Notification Issues

**Problem**: Dashboard eventually shows messages but no notifications

**This is separate from the main issue**. Check:
1. Browser notification permissions granted
2. Service worker registered
3. Push tokens exist in Firestore
4. Backend logs show "✅ Sent message notification"

---

## Testing Procedure

### Test 1: Send a Test Message

**As User:**
1. Open chat with counselor
2. Send message: "Test message 1"
3. Check console for:
   ```
   📤 Sending message in chat {chatId} as user: Test message 1
   ✅ Message sent successfully in chat {chatId}
   ```

**Check Backend:**
- Should see: "✅ Message sent in chat {chatId}"

**Check Firestore:**
1. Go to `counselChats/{chatId}`
2. Verify:
   - `lastMessage`: "Test message 1"
   - `unreadCountCounselor`: 1 (or incremented by 1)
   - `lastMessageAt`: Recent timestamp
3. Go to `counselChats/{chatId}/messages`
4. Verify new message document exists

### Test 2: Check Counselor Dashboard

**As Counselor (in different browser/incognito):**
1. Open dashboard
2. Click "Go Online"
3. Wait 3 seconds
4. Check console logs
5. Look for chat in grid

**Expected:**
- Chat appears in grid
- Shows "1 new" badge (or number of unread messages)
- Clicking chat opens interface
- Messages visible in chat

### Test 3: Verify Real-time Updates

**Keep both windows open:**

**As User:**
1. Send message: "Test message 2"

**As Counselor:**
1. Wait max 3 seconds (polling interval)
2. Unread count should increment
3. Last message should update

---

## Common Pitfalls

1. **Counselor not online**: Must be online to see chats
2. **Wrong browser**: Testing in same browser might share session
3. **Cache issues**: Try incognito or hard refresh
4. **ID mismatch**: Most common issue - IDs don't match
5. **Backend not running**: Ensure backend server is active
6. **Firestore permissions**: Ensure read/write permissions are correct
7. **Network issues**: Check if API calls are reaching backend

---

## Emergency Diagnostic Script

Run this in counselor dashboard console:

```javascript
console.clear();
console.log('🔍 EMERGENCY DIAGNOSTIC START');
console.log('================================');

// 1. Check user
console.log('1. USER INFO:');
if (typeof user !== 'undefined') {
  console.log('   ✅ User object exists');
  console.log('   ID:', user.id);
  console.log('   Email:', user.email);
  console.log('   Name:', user.name);
} else {
  console.log('   ❌ User object not found!');
}

// 2. Check online status
console.log('\n2. ONLINE STATUS:');
console.log('   Is Online:', isOnline);

// 3. Check polling
console.log('\n3. POLLING STATUS:');
console.log('   Polling Active:', pollingRef.current !== null);

// 4. Check current chats
console.log('\n4. CURRENT CHATS:');
console.log('   Count:', counselorChats.length);
if (counselorChats.length > 0) {
  counselorChats.forEach((chat, i) => {
    console.log(`   ${i + 1}. ${chat.userName}:`, {
      id: chat.id,
      counselorId: chat.counselorId,
      status: chat.status,
      unread: chat.unreadCountCounselor,
      paid: chat.paymentPaid
    });
  });
}

// 5. Test API call
console.log('\n5. TESTING API CALL:');
const testCounselorId = user?.id || 'unknown';
const apiUrl = `${window.location.origin}/api/counsel/chat/counselor/${testCounselorId}`;
console.log('   URL:', apiUrl);
fetch(apiUrl)
  .then(r => {
    console.log('   Response Status:', r.status, r.statusText);
    return r.json();
  })
  .then(data => {
    console.log('   Response Data:', data);
    console.log('   Chats in response:', data.chats?.length || 0);
    if (data.chats?.length > 0) {
      console.log('   ✅ API returned chats - data exists!');
      console.log('   ⚠️ If dashboard shows 0 chats, issue is in React state update');
    } else {
      console.log('   ⚠️ API returned 0 chats');
      console.log('   💡 Check Firestore for chats with counselorId:', testCounselorId);
    }
  })
  .catch(err => {
    console.log('   ❌ API call failed:', err);
  });

console.log('\n================================');
console.log('🔍 DIAGNOSTIC COMPLETE');
console.log('Check output above for issues');
```

---

## Need More Help?

If none of the above solutions work:

1. ✅ Copy all console logs (frontend and backend)
2. ✅ Take screenshots of Firestore data
3. ✅ Note the exact counselorId and chatId
4. ✅ Describe the exact steps you're taking
5. ✅ Share any error messages

The issue is likely one of:
- ID mismatch (90% of cases)
- Data doesn't exist yet (5% of cases)
- Backend/network issue (5% of cases)

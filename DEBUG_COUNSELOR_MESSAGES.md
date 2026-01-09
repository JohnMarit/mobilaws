# Debug Guide: Counselor Not Receiving Messages

## Problem
Users are sending messages but counselors are not seeing them in their dashboard.

## Debugging Steps

### Step 1: Check if Messages Are Being Saved

Open browser console (F12) and look for these logs when user sends a message:

```
📤 Sending message in chat {chatId} as user: {message}
✅ Message sent successfully in chat {chatId}
```

If you see these, messages are being sent. If not, there's an issue on the user side.

### Step 2: Check Backend Logs

Look at your backend server logs (terminal where backend is running) when a message is sent:

```
✅ Message sent in chat {chatId}
📥 Incrementing unreadCountCounselor
✅ Sent message notification to counselor {counselorId}
```

If you don't see these logs, the backend isn't receiving or processing messages correctly.

### Step 3: Check Counselor Dashboard Logs

When counselor opens dashboard, check console for:

```
🔄 [DASHBOARD] Initial load chats for counselor {counselorId} (online=true)
📡 [DASHBOARD] Fetching chats for counselor: {counselorId}
📋 [DASHBOARD] Loaded X chats for counselor {counselorId}
```

If it says "Loaded 0 chats" but you know chats exist, there's a query problem.

### Step 4: Verify Chat Creation

Check if chat was created correctly with the counselorId. Look for these logs when chat is created:

```
📝 createChatSession called with:
  counselorId: {counselorId}
  userId: {userId}
✅ Chat session created successfully: {chatId}
```

### Step 5: Check Firestore Directly

1. Open Firebase Console → Firestore Database
2. Go to `counselChats` collection
3. Find the chat document
4. Verify these fields exist:
   - `counselorId`: Should match the counselor's user ID
   - `userId`: Should match the user's ID
   - `unreadCountCounselor`: Should increment with each user message
   - `lastMessage`: Should show the latest message text
   - `lastMessageAt`: Should update with each message

### Step 6: Check User ID Match

The most common issue is when the counselor's logged-in user ID doesn't match the counselorId in the chat.

In counselor dashboard console, run:
```javascript
// Check logged in user ID
console.log('Logged in counselor ID:', user.id);

// Check counselor ID in chat
fetch('YOUR_API_URL/counsel/chat/counselor/' + user.id)
  .then(r => r.json())
  .then(data => console.log('Counselor chats:', data));
```

## Common Issues & Solutions

### Issue 1: Counselor Not Online
**Symptom**: Dashboard shows "Go online to see chats"
**Solution**: Counselor must toggle status to "Online" in dashboard

### Issue 2: Wrong Counselor ID
**Symptom**: Backend logs show chat creation with one ID, but counselor logged in with different ID
**Solution**: 
- Check how counselor is logging in
- Verify counselor profile has correct ID
- Check if multiple counselor accounts exist

### Issue 3: Polling Not Running
**Symptom**: No "📡 [DASHBOARD] Fetching chats" logs appearing every 3 seconds
**Solution**: 
- Ensure dashboard is open
- Check if counselor is set to online
- Look for JavaScript errors in console

### Issue 4: Messages Saved But Not Showing
**Symptom**: Firestore shows messages, but dashboard shows 0 chats
**Solution**: 
- Check query in backend `getCounselorChats()`
- Verify `counselorId` field matches exactly (no extra spaces, correct case)
- Check Firestore indexes are created

### Issue 5: Real-time Updates Not Working
**Symptom**: Messages appear after manual refresh but not automatically
**Solution**: 
- Check if polling interval is running (look for logs every 3 seconds)
- Verify no JavaScript errors blocking the update loop
- Check network tab for failed API calls

## Manual Testing Script

Run this in counselor dashboard console:

```javascript
// Test 1: Check polling is running
console.log('Test 1: Checking polling...');
let pollCount = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/counsel/chat/counselor/')) {
    console.log(`Poll ${++pollCount}: Fetching counselor chats...`);
  }
  return originalFetch.apply(this, args);
};
// Wait 10 seconds and check if pollCount increases

// Test 2: Manually fetch chats
console.log('Test 2: Manually fetching chats...');
const counselorId = 'YOUR_COUNSELOR_ID_HERE'; // Replace with actual ID
fetch(`YOUR_API_URL/counsel/chat/counselor/${counselorId}`)
  .then(r => r.json())
  .then(data => {
    console.log('Chats found:', data.chats.length);
    data.chats.forEach(chat => {
      console.log(`- ${chat.userName}: ${chat.unreadCountCounselor} unread`);
    });
  });

// Test 3: Check if counselor is online
console.log('Test 3: Checking counselor status...');
fetch(`YOUR_API_URL/counsel/counselor/${counselorId}`)
  .then(r => r.json())
  .then(data => console.log('Counselor status:', data));
```

## Quick Fix Checklist

1. ✅ Is counselor set to **Online** in dashboard?
2. ✅ Does counselor dashboard show polling logs every 3 seconds?
3. ✅ Are messages being saved to Firestore? (Check Firebase Console)
4. ✅ Does `counselorId` in chat match logged-in counselor's user ID?
5. ✅ Are there any JavaScript errors in console?
6. ✅ Is backend server running and accessible?
7. ✅ Are Firestore indexes created? (Check Firebase Console → Indexes)

## Contact Points for Debugging

**Frontend (Counselor Dashboard)**:
- File: `src/components/CounselorDashboard.tsx`
- Function: `loadChats()` - Line 220
- Polling interval: 3000ms when online

**Backend (Chat Retrieval)**:
- File: `ai-backend/src/lib/counsel-chat-storage.ts`
- Function: `getCounselorChats()` - Line 597
- Query: `where('counselorId', '==', counselorId)`

**Backend (Message Sending)**:
- File: `ai-backend/src/lib/counsel-chat-storage.ts`
- Function: `sendChatMessage()` - Line 146
- Notification: `sendMessageNotificationToCounselor()` - Line 319

## Expected Behavior

1. User sends message → Backend saves message → unreadCountCounselor++
2. Counselor dashboard polls every 3s → Fetches all chats
3. Chat with unreadCountCounselor > 0 shows red badge
4. Counselor clicks chat → Opens chat interface → Messages displayed
5. Messages marked as read → unreadCountCounselor = 0

## Still Not Working?

If you've tried everything above and it's still not working, check:

1. **Network connectivity**: Can frontend reach backend?
2. **CORS issues**: Check browser console for CORS errors
3. **Authentication**: Is counselor properly authenticated?
4. **Database permissions**: Does counselor have read access to counselChats?
5. **Caching**: Try hard refresh (Ctrl+Shift+R) or incognito mode

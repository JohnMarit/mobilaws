# Debug Guide: Counselor Not Receiving Messages

## Enhanced Logging Added ✅

I've added comprehensive logging throughout the message system. Open your browser console and you'll see detailed logs like:

### When Counselor Opens Dashboard:
```
📡 [DASHBOARD] Fetching chats for counselor: abc123
📋 [DASHBOARD] Loaded 1 chats for counselor abc123
   📊 [DASHBOARD] Chat details:
      1. John Marit (active) {id: "xyz", lastMessage: "hi", unreadCount: 1}
```

### When Counselor Opens Chat:
```
📡 [COUNSELOR] Setting up message subscription for chat: xyz
   - Chat details: {id: "xyz", userName: "John Marit", status: "active"}
📥 [COUNSELOR] Loading initial messages for chat xyz...
📡 [API] Fetching messages for chat xyz (limit: 50)
   - URL: http://localhost:3001/api/counsel/chat/xyz/messages?limit=50
   - Response status: 200 OK
✅ [API] Received 2 messages from API
   - First message: {id: "msg1", sender: "System", role: "user", message: "Chat session started..."}
✅ [COUNSELOR] Loaded 2 initial messages
```

### When Real-Time Subscription Starts:
```
📡 [SUBSCRIPTION] Setting up real-time listener for chat: xyz
   - Firebase path: counselChats/xyz/messages
📨 [SNAPSHOT INITIAL] Received 2 messages for chat xyz
   📄 Message msg1: {sender: "System", role: "user", type: "system"}
   📄 Message msg2: {sender: "John Marit", role: "user", type: "text", text: "hi"}
✅ [CALLBACK] Calling callback with 2 messages
✅ [SUBSCRIPTION] Listener set up successfully for chat xyz
```

### When User Sends New Message:
```
📨 [SNAPSHOT UPDATE] Received 3 messages for chat xyz
✅ [CALLBACK] Calling callback with 3 messages
📨 [COUNSELOR] Real-time update received: 3 messages in chat xyz
   - Messages: [
       {id: "msg1", sender: "System", role: "user", message: "Chat session started..."},
       {id: "msg2", sender: "John Marit", role: "user", message: "hi"},
       {id: "msg3", sender: "John Marit", role: "user", message: "hello counselor"}
     ]
```

## Troubleshooting Steps

### 1. Check Firebase Initialization
Look for this in console on page load:
```
✅ Firestore initialized: {projectId: "your-project", hasDb: true, type: "firestore"}
```

If you see:
```
⚠️ Firebase initialization failed
```
Then Firebase env variables are missing or incorrect.

### 2. Check Chat Loading
When counselor goes online, you should see:
```
📡 [DASHBOARD] Fetching chats for counselor: [counselor-id]
📋 [DASHBOARD] Loaded X chats
```

If you see `Loaded 0 chats` but user has sent messages:
- Check that `counselorId` in chat matches the logged-in counselor's ID
- Check backend logs for `getCounselorChats` query

### 3. Check Message Subscription
When counselor opens a chat, you should see:
```
📡 [SUBSCRIPTION] Setting up real-time listener for chat: [chat-id]
📨 [SNAPSHOT INITIAL] Received X messages
```

If you see `Received 0 messages`:
- Messages might not be saved to Firestore
- Check backend logs when user sends message
- Verify Firestore path: `counselChats/[chatId]/messages`

### 4. Check Real-Time Updates
After user sends a message, counselor should see:
```
📨 [SNAPSHOT UPDATE] Received X messages
```

If this doesn't appear:
- Firestore real-time listeners might not be working
- Check browser console for Firebase errors
- Check Firestore security rules

## Common Issues & Solutions

### Issue 1: "No chats found for counselor"
**Cause**: Chat document doesn't have correct `counselorId`

**Check**:
1. Open Firebase Console → Firestore
2. Go to `counselChats` collection
3. Find the chat document
4. Verify `counselorId` field matches your counselor's user ID

**Fix**: Backend should set this when creating chat. Check `createChatSession()` logs.

### Issue 2: "Received 0 messages"
**Cause**: Messages not saved to Firestore subcollection

**Check**:
1. Firebase Console → Firestore → `counselChats/[chatId]/messages`
2. Should see message documents there

**Fix**: Check backend `sendChatMessage()` function logs when user sends message.

### Issue 3: Real-time updates not working
**Cause**: Firestore listeners not set up or Firebase not initialized

**Check Console For**:
```
❌ Firebase not initialized
```
or
```
❌ [SUBSCRIPTION ERROR] Error in message subscription
```

**Fix**: 
1. Verify `.env` file has all Firebase config
2. Restart dev server
3. Clear browser cache

### Issue 4: "Index missing" error
**Cause**: Firestore needs composite index

**Check For**:
```
⚠️ Index missing, trying without orderBy...
```

**Fix**: 
1. Click the link in error message to create index
2. Or use fallback query (already implemented)

## Manual Testing Steps

1. **User Side**:
   - Book a counselor
   - Pay
   - Send message "Test message 1"
   - Check console for: `✅ Message sent successfully`

2. **Counselor Side**:
   - Go online
   - Check console for chat list logs
   - Click on user's chat
   - Check console for subscription logs
   - Should see "Test message 1"

3. **Send Another Message**:
   - User sends "Test message 2"
   - Counselor should see real-time update in console
   - Message should appear without refresh

## Refresh Button Added

I've added a "Refresh" button next to "Chats" in the counselor dashboard. Click it to manually reload chats if they don't appear automatically.

## Next Steps

1. Open counselor dashboard
2. Open browser console (F12)
3. Go online
4. Look for the detailed logs
5. Share any error messages you see

The logs will tell us exactly where the issue is!

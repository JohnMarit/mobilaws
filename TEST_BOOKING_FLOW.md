# Test Booking Flow

## Test the Complete User → Counselor Flow

### Step 1: Create Test User

1. Open the app in **incognito/private window**
2. Sign up with a test email (e.g., `testuser@test.com`)
3. **Important:** Make this user Premium OR have payment ready

**To make user Premium (quick test):**
- Go to Firebase Console → Firestore → `subscriptions` collection
- Find or create subscription for test user
- Set:
  ```
  planId: "premium"
  isActive: true
  isFree: false
  ```

### Step 2: Book the Counselor

1. As the test user, go to "Book a Counsel"
2. You should see counselor "John Marit" in the list
3. **Click on the counselor**

**If Premium user:**
- Chat should create immediately
- Should see "Chat Ready!" message
- Chat interface should open

**If not Premium:**
- Payment dialog should appear
- Complete payment
- Chat creates after successful payment

### Step 3: Send Test Message

1. In the chat interface, send: "Test message from user"
2. Check browser console for:
   ```
   📤 Sending message in chat {chatId} as user
   ✅ Message sent successfully
   ```

### Step 4: Check Counselor Dashboard

1. Open counselor dashboard (as John Marit)
2. Make sure status is "Online"
3. Wait 3 seconds
4. **You should now see the chat!**

### Step 5: Verify Firestore

After completing the flow:

1. Go to Firebase Console → Firestore
2. Check `counselChats` collection
3. You should see a new document
4. Verify it has:
   - `counselorId`: "ua3OGiZ7bwW7wmP84CCuLNP97L63"
   - `userId`: (test user's ID)
   - `userName`: "Test User" or similar
   - `status`: "active"
   - `paymentPaid`: true
   - `unreadCountCounselor`: 1 (if you sent a message)

## Common Issues During Testing

### Issue: "No counselors available"
- Counselor must be approved by admin
- Counselor must have gone "Online" at least once
- Check Firestore → `counselors` collection → document ID should be `ua3OGiZ7bwW7wmP84CCuLNP97L63`
- Check `applicationStatus`: should be "approved"
- Check `isAvailable`: should be true

### Issue: Payment fails
- Use test payment credentials
- Or make test user Premium (see Step 1)

### Issue: Chat doesn't create
- Check browser console for errors
- Check backend logs for chat creation
- Look for "✅ Chat session created successfully"

### Issue: Counselor dashboard still shows 0 chats
- Refresh the page
- Check backend logs show the correct counselorId in query
- Verify Firestore has the chat with matching counselorId

## Expected Console Logs

### User Side (when sending message):
```
📤 Sending message in chat {chatId} as user: Test message from user
✅ Message sent successfully in chat {chatId}
```

### Backend (when message sent):
```
✅ Message sent in chat {chatId}
✅ Sent message notification to counselor ua3OGiZ7bwW7wmP84CCuLNP97L63
```

### Counselor Side (3 seconds later):
```
📡 [DASHBOARD] Fetching chats for counselor: ua3OGiZ7bwW7wmP84CCuLNP97L63
📋 [DASHBOARD] API returned 1 chats for counselor ua3OGiZ7bwW7wmP84CCuLNP97L63
   1. Test User (active) { id: '...', unreadCount: 1, ... }
```

## Debugging Script

If chat still doesn't show, run this in counselor dashboard console:

```javascript
// Check Firestore directly
const counselorId = 'ua3OGiZ7bwW7wmP84CCuLNP97L63';

// This will show if chats exist in Firestore
db.collection('counselChats')
  .where('counselorId', '==', counselorId)
  .get()
  .then(snapshot => {
    console.log('Chats in Firestore:', snapshot.size);
    snapshot.forEach(doc => {
      console.log('Chat:', doc.id, doc.data());
    });
  });
```

Note: This requires Firestore to be accessible from client. If it doesn't work, check Firebase Console directly.

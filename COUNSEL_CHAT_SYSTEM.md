# Counsel Chat System - Implementation Summary

## ✅ What's Been Implemented

### 1. **Request Expiration & Filtering** ✓
- ❌ **Expired requests no longer show** to counselors
- Only `broadcasting` and `pending` requests appear (not `scheduled` or `expired`)
- Requests have `expiresAt` timestamp - expired ones are filtered out
- Users who don't get accepted must schedule an appointment

### 2. **Real-Time Chat System** ✓

#### Firebase Collections:
- **`counselChats`** - Chat sessions between users and counselors
  - Created automatically when counselor accepts request
  - Tracks: userId, counselorId, status, unread counts, last message
  
- **`counselChats/{chatId}/messages`** - Chat messages subcollection
  - Supports: text messages, voice messages, system messages
  - Tracks: sender, message, timestamp, read status

#### Features:
- ✅ **Text Chat** - Send and receive text messages
- ✅ **Voice Messages** - Send voice recordings (URL + duration)
- ✅ **Read Receipts** - Track unread message counts
- ✅ **Message History** - Retrieve past messages
- ✅ **System Messages** - Automatic notifications (session start/end)

### 3. **Chat Creation Flow** ✓

#### When Counselor Accepts Request:
1. Counselor clicks "Accept" on pending request
2. Backend creates chat session in Firebase
3. System message: "Chat session started between [User] and [Counselor]"
4. Both user and counselor can now chat
5. Request status changes to `accepted`

#### When Counselor Accepts Scheduled Appointment:
1. Counselor accepts queued appointment
2. Backend creates chat session
3. User and counselor can start chatting
4. Appointment status changes to `accepted`

### 4. **API Endpoints** ✓

#### Chat Messages:
- `POST /api/counsel/chat/:chatId/message` - Send message
- `GET /api/counsel/chat/:chatId/messages` - Get messages
- `POST /api/counsel/chat/:chatId/read` - Mark as read
- `POST /api/counsel/chat/:chatId/end` - End session

#### Chat Sessions:
- `GET /api/counsel/chat/by-request/:requestId` - Get chat by request
- `GET /api/counsel/chat/by-appointment/:appointmentId` - Get chat by appointment
- `GET /api/counsel/chat/user/:userId` - Get user's chats
- `GET /api/counsel/chat/counselor/:counselorId` - Get counselor's chats

### 5. **Security Rules** ✓

Firestore rules ensure:
- ✅ Only participants can read/write messages
- ✅ Only backend can create chat sessions
- ✅ Users can't delete messages
- ✅ Messages are validated for size

### 6. **Database Indexes** ✓

Optimized queries for:
- Filtering expired requests
- Sorting by creation date
- Retrieving messages by chat

## 📊 Data Structure

### CounselChatSession
```typescript
{
  id: string;
  requestId?: string;           // Link to original request
  appointmentId?: string;        // Link to appointment
  userId: string;
  userName: string;
  counselorId: string;
  counselorName: string;
  status: 'active' | 'ended' | 'scheduled';
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  unreadCountUser: number;
  unreadCountCounselor: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### ChatMessage
```typescript
{
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'counselor';
  message: string;
  messageType: 'text' | 'voice' | 'system';
  voiceUrl?: string;             // For voice messages
  voiceDuration?: number;        // Duration in seconds
  read: boolean;
  createdAt: Timestamp;
}
```

## 🔄 Complete User Flow

### Scenario 1: Instant Match
1. User requests counsel → broadcasts to online counselors
2. Counselor accepts → chat session created automatically
3. Both can chat (text/voice)
4. Either can end session

### Scenario 2: No Immediate Match
1. User requests counsel → no one online
2. User schedules appointment (date + time + note)
3. Counselor comes online → sees scheduled appointment
4. Counselor accepts → chat session created
5. Both can chat (text/voice)

### Scenario 3: Request Expires
1. User requests counsel → broadcasts
2. 2 minutes pass, no acceptance
3. Request expires (status: 'expired')
4. ❌ Request no longer shows to counselors
5. User must schedule appointment instead

## 🎯 Next Steps (Frontend Implementation Needed)

### 1. Chat UI Component
Create `CounselChatInterface.tsx`:
- Message list (scrollable)
- Text input field
- Send button
- Voice recording button
- Read receipts
- Typing indicators (optional)

### 2. Chat List Component
Create `CounselChatList.tsx`:
- Show all active chats
- Display last message
- Show unread count badge
- Click to open chat

### 3. Integration Points

#### In BookCounsel Component:
```typescript
// After request is accepted
const chat = await getChatByRequestId(requestId);
if (chat) {
  // Open chat interface
  openChat(chat.id);
}
```

#### In CounselorDashboard:
```typescript
// After accepting request
const result = await acceptCounselRequest(...);
if (result.chatId) {
  // Open chat interface
  openChat(result.chatId);
}
```

### 4. Real-Time Updates
Use Firebase Firestore real-time listeners:
```typescript
// Listen for new messages
db.collection('counselChats')
  .doc(chatId)
  .collection('messages')
  .orderBy('createdAt', 'desc')
  .limit(50)
  .onSnapshot(snapshot => {
    // Update UI with new messages
  });
```

## 📝 Example API Usage

### Send Text Message:
```javascript
POST /api/counsel/chat/{chatId}/message
{
  "senderId": "user123",
  "senderName": "John Doe",
  "senderRole": "user",
  "message": "Hello, I need help with...",
  "messageType": "text"
}
```

### Send Voice Message:
```javascript
POST /api/counsel/chat/{chatId}/message
{
  "senderId": "counselor456",
  "senderName": "Jane Smith",
  "senderRole": "counselor",
  "message": "Voice message",
  "messageType": "voice",
  "voiceUrl": "https://storage.../voice.mp3",
  "voiceDuration": 45
}
```

### Get Messages:
```javascript
GET /api/counsel/chat/{chatId}/messages?limit=50
```

### Mark as Read:
```javascript
POST /api/counsel/chat/{chatId}/read
{
  "userId": "user123",
  "userRole": "user"
}
```

## 🔐 Security

All chat data is:
- ✅ Stored in Firebase Firestore
- ✅ Protected by security rules
- ✅ Only accessible to participants
- ✅ Encrypted in transit and at rest
- ✅ Backed up automatically

## 📞 Voice Call Integration (Future)

For direct voice calls, you can integrate:
- **Twilio Voice** - For phone calls
- **Agora** - For WebRTC video/voice
- **WebRTC** - Native browser calls

The chat system is ready to store call metadata and provide fallback text chat.

## 🎉 Summary

✅ **Backend Complete** - All APIs and storage ready
✅ **Firebase Configured** - Collections, rules, indexes deployed
✅ **Request Filtering** - Expired requests hidden
✅ **Chat Sessions** - Auto-created on acceptance
✅ **Message Storage** - Text, voice, system messages supported

**Next**: Build the frontend chat UI components!


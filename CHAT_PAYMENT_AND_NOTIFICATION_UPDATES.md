# Chat Payment and Notification System Updates

## Overview
This document outlines the updates made to the counselor booking and chat system to implement payment requirements based on subscription tiers and real-time notifications for counselors.

## Changes Implemented

### 1. Payment Logic Based on Subscription Tiers ✅

**Location**: `src/components/BookCounsel.tsx`

**Implementation**:
- Only **Premium** plan users can chat with counselors without paying
- Users on **Free**, **Basic**, and **Standard** plans must pay the booking fee to chat
- Payment check happens when user selects a counselor

**Logic**:
```typescript
const hasPremiumPlan =
  userSubscription &&
  userSubscription.isActive &&
  !userSubscription.isFree &&
  userSubscription.planId === 'premium';

if (hasPremiumPlan) {
  // Create chat directly without payment
} else {
  // Show payment dialog
}
```

**User Experience**:
- Premium users: Instant chat creation, no payment required
- Other users: Payment dialog appears → Pay → Chat created
- Fee display shows "Free for you" badge for Premium users

---

### 2. Real-Time Notification System for Counselors ✅

**Locations**: 
- `ai-backend/src/lib/counsel-chat-storage.ts`
- `src/components/CounselorAlertListener.tsx`
- `public/firebase-messaging-sw.js`

**Implementation**:

#### Backend Notification Function
Added `sendMessageNotificationToCounselor()` function that:
- Triggers when a user sends a message
- Sends push notification to counselor's registered devices
- Includes message preview (first 100 characters)
- Groups notifications by chat ID
- Plays sound alert on counselor's device

#### Notification Flow
1. User sends message in chat
2. Backend saves message to Firestore
3. Backend increments unread count for counselor
4. Backend sends push notification to counselor
5. Counselor receives notification with:
   - Title: User's name
   - Body: Message text preview
   - Sound alert
   - Badge count

#### Frontend Alert Listener
Updated `CounselorAlertListener.tsx` to handle three notification types:
- `new_chat`: New chat session started
- `new_message`: New message from user
- `NEW_COUNSEL_REQUEST`: New counsel request (existing)

**Features**:
- Plays pleasant notification sound
- Shows toast notification with user name and message
- Auto-focuses counselor dashboard when clicked
- Groups notifications by chat to avoid spam

#### Service Worker Updates
Updated `firebase-messaging-sw.js` to:
- Group notifications by chat ID using `tag` property
- Re-notify for new messages (`renotify: true`)
- Open counselor dashboard on notification click
- Handle background and foreground notifications

---

### 3. Counselor Dashboard Redesign ✅

**Location**: `src/components/CounselorDashboard.tsx`

**Old Layout**:
```
┌──────────────┬──────────────────────────────────┐
│              │                                   │
│  Left Panel  │      Right Panel                  │
│  (384px)     │      (Flexible)                   │
│              │                                   │
│  • Status    │  • Earnings Card                  │
│  • Chat List │  • Profile Settings               │
│              │  • Contact Info                   │
└──────────────┴──────────────────────────────────┘
```

**New Layout**:
```
┌──────────────┬──────────────────────────────────┐
│              │                                   │
│  Left Panel  │      Right Panel                  │
│  (320px)     │      (Flexible - Bigger)          │
│              │                                   │
│  • Status    │  • Chat History (Grid View)       │
│  • Earnings  │  • All Chats Displayed            │
│  • Profile   │  • Card-based Layout              │
│  • Contact   │  • Click to Open Chat             │
│              │                                   │
│  (Small)     │      (Big - Main Focus)           │
└──────────────┴──────────────────────────────────┘
```

**Changes**:
1. **Left Sidebar (Small - 320px)**:
   - Online/Offline status toggle
   - Earnings summary card (compact)
   - Pending changes notice
   - Profile settings (compact form)
   - Contact information
   - All personal info consolidated here

2. **Right Panel (Big - Main Area)**:
   - Large header: "Chat History (X)"
   - Grid layout for chats (1-3 columns responsive)
   - Card-based chat display with:
     - User avatar (larger)
     - User name
     - Last message timestamp
     - Status badge (Active/Ended/Dismissed)
     - Unread count badge
     - Last message preview (2 lines)
   - Empty states with helpful messages
   - Click any chat card to open chat interface

**Benefits**:
- More space for viewing chat history
- Better visual hierarchy
- Easier to scan multiple chats at once
- Personal info accessible but not dominating
- Grid layout scales well on different screen sizes

---

## Technical Details

### Database Schema
No changes to Firestore schema. Uses existing:
- `counselChats` collection
- `counselChats/{chatId}/messages` subcollection
- `unreadCountCounselor` field for tracking unread messages

### Push Notification Data Structure
```javascript
{
  type: 'new_message',
  chatId: 'chat_id_here',
  userName: 'John Doe',
  counselorName: 'Jane Smith',
  message: 'Full message text',
  click_action: '/counselor'
}
```

### Subscription Plan Mapping
```
Free Plan       → Must pay booking fee
Basic Plan      → Must pay booking fee
Standard Plan   → Must pay booking fee
Premium Plan    → Free chat access (no payment)
```

---

## User Flows

### Premium User Flow
1. User selects counselor from list
2. System checks: Premium plan detected
3. Chat created immediately
4. User can send messages right away
5. Counselor receives notification
6. Counselor sees chat in dashboard

### Non-Premium User Flow
1. User selects counselor from list
2. System checks: Not Premium plan
3. Payment dialog appears
4. User pays booking fee
5. Chat created after successful payment
6. User can send messages
7. Counselor receives notification
8. Counselor sees chat in dashboard

### Counselor Notification Flow
1. User sends message in chat
2. Backend increments unread count
3. Backend sends push notification
4. Counselor's device receives notification
5. Notification plays sound
6. Toast appears with message preview
7. Counselor clicks notification
8. Dashboard opens/focuses
9. Counselor sees unread badge on chat
10. Counselor clicks chat to read message

---

## Testing Checklist

### Payment Logic
- [ ] Premium user can chat without paying
- [ ] Free user sees payment dialog
- [ ] Basic user sees payment dialog
- [ ] Standard user sees payment dialog
- [ ] Payment success creates chat
- [ ] Payment failure shows error

### Notifications
- [ ] User sends message → Counselor gets notification
- [ ] Notification shows user name
- [ ] Notification shows message preview
- [ ] Notification plays sound
- [ ] Clicking notification opens dashboard
- [ ] Multiple messages group by chat
- [ ] Unread count shows correctly

### Dashboard Layout
- [ ] Left sidebar shows personal info
- [ ] Right panel shows chat grid
- [ ] Chats display correctly
- [ ] Click chat opens chat interface
- [ ] Status badges show correctly
- [ ] Unread counts display
- [ ] Empty states work
- [ ] Responsive layout works

---

## Files Modified

### Backend
1. `ai-backend/src/lib/counsel-chat-storage.ts`
   - Added `sendMessageNotificationToCounselor()` function
   - Updated `sendChatMessage()` to trigger notifications

### Frontend
1. `src/components/BookCounsel.tsx`
   - Already had Premium check logic (no changes needed)

2. `src/components/CounselorDashboard.tsx`
   - Redesigned layout: small left column, big right column
   - Changed from list view to grid view for chats
   - Consolidated personal info in left sidebar
   - Made chat history the main focus

3. `src/components/CounselorAlertListener.tsx`
   - Added handling for `new_message` notification type
   - Shows toast with user name and message

4. `public/firebase-messaging-sw.js`
   - Added notification grouping by chat ID
   - Added `renotify` for new messages
   - Updated click handler for new message type

---

## Known Limitations

1. **Notification Permissions**: Users must grant notification permissions for push notifications to work
2. **Browser Support**: Push notifications work best in Chrome, Firefox, and Edge (not Safari iOS)
3. **Background Notifications**: Service worker handles background notifications; foreground uses toast
4. **Network Dependency**: Real-time notifications require active internet connection

---

## Future Enhancements

1. **Message Delivery Status**: Add "sent", "delivered", "read" indicators
2. **Typing Indicators**: Show when user is typing
3. **Voice Messages**: Add voice message support in notifications
4. **Rich Notifications**: Add action buttons (Reply, Dismiss) to notifications
5. **Notification Settings**: Let counselors customize notification preferences
6. **Desktop Notifications**: Improve desktop notification appearance
7. **Sound Customization**: Let counselors choose notification sounds

---

## Conclusion

All requested features have been successfully implemented:
✅ Payment logic based on subscription tiers
✅ Real-time notifications when users send messages
✅ Counselor dashboard redesigned with better layout

The system now provides a seamless experience for both users and counselors, with clear payment requirements and instant communication through notifications.

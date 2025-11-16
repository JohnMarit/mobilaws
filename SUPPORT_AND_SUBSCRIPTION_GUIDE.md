# Support and Subscription System - Complete Guide

## 🎯 Overview

The Mobilaws application now has a fully functional admin panel with:
1. ✅ **Subscription Management** - View and manage user subscriptions
2. ✅ **User Support System** - Users can submit inquiries, admins can respond

## 📋 Features Implemented

### User-Facing Features

#### 1. Contact Support
- **Location**: User profile dropdown menu → "Contact Support"
- **Features**:
  - Category selection (General, Technical, Billing, etc.)
  - Priority levels (Low, Medium, High, Urgent)
  - Subject and detailed message
  - Real-time submission with loading states

#### 2. My Tickets
- **Location**: User profile dropdown menu → "My Tickets"
- **Features**:
  - View all submitted support tickets
  - See ticket status (Open, In Progress, Resolved, Closed)
  - Read admin responses
  - Auto-refresh capability

### Admin Features

#### 1. Subscription Management
- **Location**: Admin Dashboard → Subscriptions tab
- **Capabilities**:
  - View all user subscriptions
  - Filter by plan (Free, Basic, Standard, Premium)
  - Filter by status (Active/Inactive)
  - Edit subscription details:
    - Adjust token balance
    - Modify expiry dates
    - Activate/deactivate subscriptions
  - View revenue statistics

#### 2. Support Ticket Management
- **Location**: Admin Dashboard → Support tab
- **Capabilities**:
  - View all support tickets
  - Filter by status
  - View full ticket details with history
  - Respond to tickets
  - Update ticket status
  - Priority indicators

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd ai-backend
npm run dev
```
Server runs on: http://localhost:8000

### 2. Start Frontend
```bash
# From project root
npm run dev
```
Frontend runs on: http://localhost:5173

## 📝 User Flow

### For Regular Users

1. **Sign in** to the application
2. Access user menu (top right corner)
3. **Submit Support Request**:
   - Click "Contact Support"
   - Select category and priority
   - Enter subject and message
   - Click "Submit Request"
4. **View Tickets**:
   - Click "My Tickets"
   - See all submitted tickets
   - View admin responses
   - Check ticket status

### For Admins

1. **Access Admin Panel**:
   - Go to `/admin/login`
   - Use email: `thuchabraham42@gmail.com`
   - Login via magic link (check console)

2. **Manage Subscriptions**:
   - Go to "Subscriptions" tab
   - Filter by plan or status
   - Click edit to modify:
     - Token balance
     - Expiry date
     - Active status

3. **Handle Support Tickets**:
   - Go to "Support" tab
   - View all tickets
   - Click "View" on any ticket
   - Read user's message
   - Send response
   - Update status (In Progress, Resolved, Closed)

## 🔌 API Endpoints

### Support System

#### Create Support Ticket (User)
```http
POST /api/support/tickets
Content-Type: application/json

{
  "userId": "user_id_here",
  "subject": "Issue subject",
  "message": "Detailed message",
  "priority": "medium",
  "category": "general"
}
```

#### Get User's Tickets
```http
GET /api/support/tickets/user/:userId
```

#### Update Ticket (Admin)
```http
PUT /api/admin/support/tickets/:ticketId
Content-Type: application/json

{
  "status": "in_progress",
  "response": "Admin response message"
}
```

#### Get All Tickets (Admin)
```http
GET /api/admin/support/tickets?page=1&status=open
Headers:
  X-Admin-Email: admin@example.com
  X-Admin-Token: admin_token
```

### Subscription System

#### Get Subscription
```http
GET /api/subscription/:userId
```

#### Create/Update Subscription
```http
POST /api/subscription/:userId
Content-Type: application/json

{
  "planId": "basic",
  "tokens": 50,
  "price": 5
}
```

#### Use Token
```http
POST /api/subscription/:userId/use-token
```

#### Get All Subscriptions (Admin)
```http
GET /api/admin/subscriptions?page=1&planId=basic&status=active
Headers:
  X-Admin-Email: admin@example.com
  X-Admin-Token: admin_token
```

#### Update Subscription (Admin)
```http
PUT /api/admin/subscriptions/:userId
Content-Type: application/json
Headers:
  X-Admin-Email: admin@example.com
  X-Admin-Token: admin_token

{
  "tokensRemaining": 100,
  "expiryDate": "2024-12-31T00:00:00.000Z",
  "isActive": true
}
```

## 🎨 UI Components

### New Components Created

1. **SupportDialog.tsx**
   - User-facing support request form
   - Category and priority selection
   - Form validation

2. **MyTickets.tsx**
   - Display user's tickets
   - View ticket details
   - See admin responses
   - Status indicators

3. **Updated: UserProfileNav.tsx**
   - Added "Contact Support" menu item
   - Added "My Tickets" menu item
   - Integrated dialog components

### Existing Admin Components

1. **SubscriptionManagement.tsx**
   - Already fully functional
   - Displays subscription data
   - Edit capabilities

2. **SupportManagement.tsx**
   - Already fully functional
   - View and respond to tickets
   - Status management

## 💡 Testing Guide

### Test User Support Flow

1. **As a User**:
   ```
   ✅ Sign in to the app
   ✅ Click profile dropdown
   ✅ Click "Contact Support"
   ✅ Fill out the form:
      - Category: "Technical Issue"
      - Priority: "High"
      - Subject: "Cannot see my subscription"
      - Message: "I purchased a plan but it's not showing"
   ✅ Submit
   ✅ Check "My Tickets" to verify it appears
   ```

2. **As an Admin**:
   ```
   ✅ Go to /admin/login
   ✅ Login with magic link
   ✅ Go to "Support" tab
   ✅ See the new ticket
   ✅ Click "View"
   ✅ Read the message
   ✅ Type a response: "We're looking into this. Can you provide your email?"
   ✅ Click "Send Response"
   ✅ Update status to "In Progress"
   ```

3. **Back as User**:
   ```
   ✅ Click "My Tickets"
   ✅ See status changed to "In Progress"
   ✅ Click "View Details"
   ✅ See admin's response
   ```

### Test Subscription Management

1. **View Subscriptions**:
   ```
   ✅ Go to admin dashboard
   ✅ Click "Subscriptions" tab
   ✅ See all user subscriptions
   ✅ Filter by plan (Basic, Standard, Premium)
   ✅ Filter by status (Active/Inactive)
   ```

2. **Edit Subscription**:
   ```
   ✅ Click edit on any subscription
   ✅ Change token balance
   ✅ Update expiry date
   ✅ Toggle active status
   ✅ Save changes
   ✅ Verify changes appear in list
   ```

## 🔐 Security Notes

- Support tickets are user-specific (userId-based)
- Admin endpoints require authentication headers
- All API calls use CORS protection
- Input validation on both frontend and backend

## 📊 Data Storage

Currently using **in-memory storage** for demo purposes:
- Data persists while server is running
- Data is lost on server restart
- Ideal for development and testing

For production, integrate with:
- PostgreSQL/MongoDB for persistent storage
- Redis for caching
- File storage for attachments

## 🎯 Next Steps (Optional Enhancements)

1. **Email Notifications**
   - Notify users when admin responds
   - Notify admins of new tickets

2. **File Attachments**
   - Allow users to upload screenshots
   - Store in cloud storage

3. **Real-time Updates**
   - WebSocket integration
   - Live ticket status updates

4. **Ticket Search**
   - Search by subject/content
   - Advanced filtering

5. **Analytics Dashboard**
   - Response time metrics
   - Ticket resolution rates
   - User satisfaction ratings

## 🐛 Troubleshooting

### Backend Issues
```bash
# Backend not starting?
cd ai-backend
npm install
npm run dev

# Check if running:
curl http://localhost:8000/healthz
```

### Frontend Issues
```bash
# Frontend errors?
npm install
npm run dev

# Check browser console for errors
```

### CORS Errors
- Ensure backend CORS_ORIGINS includes frontend URL
- Check `.env` file in ai-backend
- Restart backend after changes

### Tickets Not Showing
- Verify user is authenticated
- Check userId matches
- Check browser network tab for API errors

## 📞 Support Categories

- **General Inquiry**: General questions
- **Technical Issue**: Bugs or errors
- **Billing & Subscriptions**: Payment and plan questions
- **Feature Request**: Suggestions for new features
- **Bug Report**: Report software bugs
- **Account Help**: Account-related assistance

## 🎨 UI/UX Features

- **Loading States**: All operations show loading indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Success/error feedback
- **Responsive Design**: Works on mobile and desktop
- **Badge System**: Visual status indicators
- **Pagination**: Handles large datasets
- **Real-time Refresh**: Manual refresh capability

---

**Status**: ✅ Fully Implemented and Ready to Use

Last Updated: November 16, 2025


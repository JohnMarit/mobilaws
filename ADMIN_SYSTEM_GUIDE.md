# Admin System Guide

A comprehensive admin dashboard for managing users, subscriptions, and providing support for the Mobilaws application.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [Admin Login](#admin-login)
5. [Dashboard Overview](#dashboard-overview)
6. [User Management](#user-management)
7. [Subscription Management](#subscription-management)
8. [Support System](#support-system)
9. [API Endpoints](#api-endpoints)
10. [Security](#security)
11. [Production Deployment](#production-deployment)

## Overview

The Mobilaws Admin System provides a complete administrative interface for managing all aspects of the application including user accounts, subscriptions, and customer support tickets.

### Key Features

- **Dashboard Analytics**: Real-time statistics and metrics
- **User Management**: View, search, and manage user accounts
- **Subscription Control**: Monitor and modify user subscriptions
- **Support Tickets**: Handle customer support requests
- **Role-Based Access**: Secure admin authentication
- **Responsive Design**: Works on desktop, tablet, and mobile

## Features

### 1. Dashboard Overview

- **Real-time Statistics**
  - Total users and active users
  - Active subscriptions count
  - Total and monthly revenue
  - Open support tickets

- **Quick Actions**
  - Direct access to management interfaces
  - One-click navigation to key features

- **Data Visualization**
  - User statistics breakdown
  - Subscription plan distribution
  - Revenue tracking

### 2. User Management

- **User Search**: Find users by name, email, or ID
- **User Status Control**:
  - Active: Full access to the platform
  - Suspended: Temporary access restriction
  - Banned: Permanent access denial
- **User Details**: View complete user information
- **Pagination**: Efficient handling of large user bases

### 3. Subscription Management

- **Subscription Overview**:
  - View all active and expired subscriptions
  - Filter by plan type (Basic, Standard, Premium)
  - Filter by status (Active/Inactive)

- **Subscription Editing**:
  - Adjust token balance
  - Modify expiry dates
  - Activate/deactivate subscriptions

- **Revenue Tracking**:
  - Total revenue across all subscriptions
  - Monthly revenue statistics
  - Plan-wise breakdown

### 4. Support System

- **Ticket Management**:
  - View all support tickets
  - Filter by status (Open, In Progress, Resolved, Closed)
  - Priority indicators (Low, Medium, High, Urgent)

- **Ticket Actions**:
  - View full ticket details
  - Send responses to users
  - Update ticket status
  - Track response history

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Backend server running on port 8000
- Frontend running on port 5173 (or your configured port)

### Installation

The admin system is already integrated into the application. No additional installation needed.

### First Time Setup

1. Start the backend server:
   ```bash
   cd ai-backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Access the admin login page:
   ```
   http://localhost:5173/admin/login
   ```

## Admin Login

### Default Credentials (Demo)

```
Email: admin@mobilaws.com
Password: admin123
```

> **⚠️ IMPORTANT**: Change these credentials in production!

### Login Process

1. Navigate to `/admin/login`
2. Enter admin email and password
3. Click "Sign In"
4. You'll be redirected to the admin dashboard

### Session Management

- Admin sessions are stored in localStorage
- Sessions persist across browser refreshes
- Click "Logout" to end the session

## Dashboard Overview

### Navigation

The dashboard uses a tabbed interface with four main sections:

1. **Overview**: Statistics and quick actions
2. **Users**: User management interface
3. **Subscriptions**: Subscription management
4. **Support**: Support ticket system

### Statistics Cards

- **Total Users**: Shows all registered users
- **Active Subscriptions**: Currently active paid plans
- **Total Revenue**: All-time revenue
- **Open Tickets**: Pending support requests

## User Management

### Searching Users

1. Enter search term in the search box
2. Search by name, email, or user ID
3. Results update automatically

### Managing User Status

1. Find the user in the list
2. Click the status dropdown
3. Select new status:
   - **Active**: User has full access
   - **Suspended**: Temporary restriction
   - **Banned**: Permanent restriction

### User Status Effects

- **Active**: Normal access to all features
- **Suspended**: Cannot use AI features, can view content
- **Banned**: Complete access denial

## Subscription Management

### Viewing Subscriptions

1. Navigate to "Subscriptions" tab
2. Use filters to narrow results:
   - Filter by plan type
   - Filter by active/inactive status
3. View subscription details in the table

### Editing Subscriptions

1. Click the edit button (pencil icon)
2. Modify:
   - **Tokens Remaining**: Adjust user's token balance
   - **Expiry Date**: Change subscription end date
   - **Active Status**: Enable/disable subscription
3. Click "Save Changes"

### Common Use Cases

**Add Bonus Tokens**:
1. Edit user's subscription
2. Increase "Tokens Remaining"
3. Save changes

**Extend Subscription**:
1. Edit user's subscription
2. Set new "Expiry Date"
3. Save changes

**Disable Subscription**:
1. Edit user's subscription
2. Uncheck "Active Subscription"
3. Save changes

## Support System

### Viewing Tickets

1. Navigate to "Support" tab
2. Filter by status if needed
3. Click "View" to see ticket details

### Managing Tickets

**Update Status**:
- Click status buttons to change ticket state
- Options: In Progress, Resolved, Closed

**Respond to Tickets**:
1. View ticket details
2. Type response in the text area
3. Click "Send Response"
4. User will see your response in their ticket

### Ticket Priorities

- **Urgent**: Requires immediate attention
- **High**: Important, address soon
- **Medium**: Normal priority
- **Low**: Can wait

### Best Practices

1. **Respond Promptly**: Aim for 24-hour response time
2. **Mark In Progress**: When you start working on a ticket
3. **Provide Details**: Give clear, helpful responses
4. **Resolve Properly**: Only mark resolved when issue is fixed
5. **Close Old Tickets**: Archive resolved tickets after confirmation

## API Endpoints

### Admin Authentication

```
POST /api/admin/login
Body: { email, password }
Response: { success, admin, token }
```

### User Management

```
GET /api/admin/users?page=1&search=query
Headers: x-admin-email, x-admin-token

GET /api/admin/users/:userId
Headers: x-admin-email, x-admin-token

PUT /api/admin/users/:userId/status
Body: { status }
Headers: x-admin-email, x-admin-token
```

### Subscription Management

```
GET /api/admin/subscriptions?page=1&planId=&status=
Headers: x-admin-email, x-admin-token

PUT /api/admin/subscriptions/:userId
Body: { tokensRemaining, expiryDate, isActive }
Headers: x-admin-email, x-admin-token
```

### Support Tickets

```
GET /api/admin/support/tickets?page=1&status=
Headers: x-admin-email, x-admin-token

PUT /api/admin/support/tickets/:ticketId
Body: { status, response, assignedTo }
Headers: x-admin-email, x-admin-token
```

### Statistics

```
GET /api/admin/stats
Headers: x-admin-email, x-admin-token
Response: { stats: { users, subscriptions, revenue, support } }
```

## Security

### Authentication

- Admin authentication required for all admin routes
- Token-based authentication
- Session management via localStorage

### Current Implementation (Demo)

- Simple password check
- Basic token generation
- Suitable for development only

### Production Security Requirements

1. **Password Hashing**:
   ```typescript
   import bcrypt from 'bcrypt';
   const hashedPassword = await bcrypt.hash(password, 10);
   const isValid = await bcrypt.compare(password, hashedPassword);
   ```

2. **JWT Tokens**:
   ```typescript
   import jwt from 'jsonwebtoken';
   const token = jwt.sign({ adminId }, process.env.JWT_SECRET, { expiresIn: '24h' });
   ```

3. **Rate Limiting**:
   ```typescript
   import rateLimit from 'express-rate-limit';
   const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
   app.use('/api/admin/', limiter);
   ```

4. **HTTPS Only**: Ensure all admin traffic uses HTTPS

5. **CORS Configuration**: Restrict admin routes to trusted origins

### Best Practices

- ✅ Use strong passwords (min 12 characters)
- ✅ Enable 2FA for admin accounts
- ✅ Regularly rotate admin credentials
- ✅ Log all admin actions
- ✅ Monitor for suspicious activity
- ✅ Use environment variables for secrets
- ✅ Implement session timeouts

## Production Deployment

### Environment Variables

Add to `ai-backend/.env`:

```bash
# Admin Configuration
ADMIN_JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_SESSION_TIMEOUT=86400
```

### Database Integration

Replace in-memory storage with database:

```typescript
// Example: PostgreSQL
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Users
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

// Subscriptions
const result = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);

// Tickets
const result = await pool.query('SELECT * FROM support_tickets WHERE id = $1', [ticketId]);
```

### Admin User Setup

1. **Create Admin Table**:
   ```sql
   CREATE TABLE admin_users (
     id UUID PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     name VARCHAR(255) NOT NULL,
     role VARCHAR(50) NOT NULL,
     permissions JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     last_login TIMESTAMP
   );
   ```

2. **Create First Admin**:
   ```bash
   npm run admin:create
   ```

### Monitoring

1. **Enable Logging**:
   - Log all admin actions
   - Track user changes
   - Monitor subscription modifications

2. **Error Tracking**:
   - Use Sentry or similar service
   - Alert on critical errors
   - Track admin session issues

3. **Analytics**:
   - Track admin dashboard usage
   - Monitor response times
   - Measure support ticket resolution time

### Scaling Considerations

- Implement caching for statistics
- Use database indexes for large datasets
- Consider pagination limits
- Implement data archiving for old records

## Troubleshooting

### Can't Log In

- Verify credentials
- Check backend server is running
- Check browser console for errors
- Clear localStorage and try again

### Data Not Loading

- Check backend server status
- Verify API endpoints are accessible
- Check browser network tab for failed requests
- Ensure proper CORS configuration

### Permissions Errors

- Verify admin token is valid
- Check admin session hasn't expired
- Re-login to refresh token

## Future Enhancements

### Planned Features

- [ ] Multi-factor authentication
- [ ] Advanced analytics and reports
- [ ] Email notifications for tickets
- [ ] Bulk user operations
- [ ] Export data to CSV/Excel
- [ ] Advanced search filters
- [ ] Audit log viewer
- [ ] Custom admin roles
- [ ] Automated ticket responses
- [ ] Integration with external CRM

### Contribution Guidelines

To contribute to the admin system:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:

- Check this documentation first
- Review the codebase comments
- Check the main README.md
- Contact the development team

## License

Part of the Mobilaws project. See main LICENSE file for details.

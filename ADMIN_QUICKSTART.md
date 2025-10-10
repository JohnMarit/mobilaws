# Admin System Quick Start Guide

Get started with the Mobilaws Admin Dashboard in 5 minutes!

## 🚀 Quick Start

### Step 1: Start the Servers

```bash
# Terminal 1 - Start Backend
cd ai-backend
npm run dev

# Terminal 2 - Start Frontend
npm run dev
```

### Step 2: Access Admin Login

Open your browser and navigate to:
```
http://localhost:5173/admin/login
```

### Step 3: Login

Use these demo credentials:
```
Email: admin@mobilaws.com
Password: admin123
```

### Step 4: Explore the Dashboard

You now have access to:
- 📊 **Overview**: Statistics and analytics
- 👥 **Users**: Manage user accounts
- 💳 **Subscriptions**: Control user subscriptions
- 🎫 **Support**: Handle support tickets

## 🎯 Common Tasks

### Manage a User

1. Go to **Users** tab
2. Search for the user by email or ID
3. Change their status using the dropdown
4. Done!

### Edit a Subscription

1. Go to **Subscriptions** tab
2. Find the user's subscription
3. Click the edit button (pencil icon)
4. Modify tokens or expiry date
5. Save changes

### Respond to Support Ticket

1. Go to **Support** tab
2. Click "View" on any ticket
3. Type your response
4. Click "Send Response"
5. Update ticket status as needed

## 🔑 Admin Credentials

### Default Admin Account

- **Email**: `admin@mobilaws.com`
- **Password**: `admin123`
- **Role**: Admin
- **Permissions**: Full access

> ⚠️ **Security Note**: Change these credentials in production!

## 📊 Dashboard Metrics

The overview tab shows:
- **Total Users**: All registered users
- **Active Subscriptions**: Paid plans currently active
- **Total Revenue**: All-time earnings
- **Open Tickets**: Pending support requests

## 🛠️ Troubleshooting

### Can't login?
- Make sure backend server is running on port 8000
- Clear your browser cache
- Check browser console for errors

### Data not showing?
- Verify backend server is running
- Check that users/subscriptions exist in the system
- Try refreshing the page

### API errors?
- Ensure CORS is configured properly
- Check backend logs for errors
- Verify admin token is valid

## 📚 Full Documentation

For complete documentation, see [ADMIN_SYSTEM_GUIDE.md](./ADMIN_SYSTEM_GUIDE.md)

## 🔒 Production Setup

Before going live:

1. **Change admin credentials**
2. **Implement proper password hashing**
3. **Use JWT tokens**
4. **Enable HTTPS**
5. **Set up database storage**
6. **Configure rate limiting**
7. **Enable audit logging**

See the full guide for detailed production setup instructions.

## 📞 Support

Need help? Check:
- `ADMIN_SYSTEM_GUIDE.md` - Complete documentation
- `README.md` - Main project documentation
- Backend logs for error details

---

**Happy Managing! 🎉**

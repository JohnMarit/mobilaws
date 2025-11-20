import { Router, Request, Response } from 'express';
import { env } from '../env';

const router = Router();

// In-memory storage for demo purposes
// In production, this would be stored in a database
const users = new Map<string, any>();
const subscriptions = new Map<string, any>();
const supportTickets = new Map<string, any>();

// Prompt tracking for admin stats
const promptStats = {
  totalAuthenticatedPrompts: 0,
  totalAnonymousPrompts: 0,
  userPrompts: new Map<string, number>(), // userId -> prompt count
  dailyPrompts: new Map<string, { authenticated: number; anonymous: number }>(), // date -> counts
};

// Track a prompt
function trackPrompt(userId: string, isAnonymous: boolean): void {
  const today = new Date().toISOString().split('T')[0];
  
  if (isAnonymous) {
    promptStats.totalAnonymousPrompts++;
    const dailyData = promptStats.dailyPrompts.get(today) || { authenticated: 0, anonymous: 0 };
    dailyData.anonymous++;
    promptStats.dailyPrompts.set(today, dailyData);
  } else {
    promptStats.totalAuthenticatedPrompts++;
    const userCount = promptStats.userPrompts.get(userId) || 0;
    promptStats.userPrompts.set(userId, userCount + 1);
    
    const dailyData = promptStats.dailyPrompts.get(today) || { authenticated: 0, anonymous: 0 };
    dailyData.authenticated++;
    promptStats.dailyPrompts.set(today, dailyData);
  }
  
  console.log(`📊 Prompt tracked: ${isAnonymous ? 'Anonymous' : `User ${userId}`} | Total Auth: ${promptStats.totalAuthenticatedPrompts}, Total Anon: ${promptStats.totalAnonymousPrompts}`);
}

// Middleware to verify admin access with email whitelist
const verifyAdmin = (req: Request, res: Response, next: Function): void => {
  const adminEmail = req.headers['x-admin-email'] as string;
  const adminToken = req.headers['x-admin-token'] as string;

  if (!adminEmail || !adminToken) {
    res.status(401).json({ error: 'Admin authentication required' });
    return;
  }

  // Check if email is in admin whitelist
  if (!env.adminEmails.includes(adminEmail.toLowerCase())) {
    console.log(`❌ Unauthorized admin access attempt from: ${adminEmail}`);
    res.status(403).json({ error: 'Admin access denied. Email not authorized.' });
    return;
  }

  // In production, verify token with JWT
  console.log(`✅ Admin access granted: ${adminEmail}`);
  req.body.adminUser = {
    email: adminEmail,
    role: 'admin'
  };
  next();
};

/**
 * Admin login (Legacy - Deprecated)
 * POST /api/admin/login
 * 
 * Note: This endpoint is deprecated. Use Google OAuth instead.
 * See /api/auth/admin/google for the current authentication method.
 */
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    res.status(410).json({ 
      error: 'Password-based admin login is deprecated. Please use Google OAuth authentication.',
      redirectTo: '/admin/login'
    });
  } catch (error) {
    console.error('❌ Error during admin login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Get all users
 * GET /api/admin/users
 */
router.get('/admin/users', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';

    // Get all users (in production, fetch from database)
    const allUsers = Array.from(users.values());
    
    // Filter by search term
    let filteredUsers = allUsers;
    if (search) {
      filteredUsers = allUsers.filter(u => 
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.id?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(start, start + limit);

    res.json({
      users: paginatedUsers,
      pagination: {
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Get user details
 * GET /api/admin/users/:userId
 */
router.get('/admin/users/:userId', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's subscription
    const subscription = subscriptions.get(userId);

    res.json({
      user,
      subscription: subscription || null
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * Update user status
 * PUT /api/admin/users/:userId/status
 */
router.put('/admin/users/:userId/status', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.status = status;
    user.updatedAt = new Date().toISOString();
    users.set(userId, user);

    console.log(`✅ User status updated: ${userId} -> ${status}`);

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * Get all subscriptions
 * GET /api/admin/subscriptions
 */
router.get('/admin/subscriptions', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const planId = req.query.planId as string;
    const status = req.query.status as string;

    // Get all subscriptions
    let allSubscriptions = Array.from(subscriptions.entries()).map(([userId, sub]) => ({
      userId,
      ...sub
    }));

    // Filter by plan
    if (planId) {
      allSubscriptions = allSubscriptions.filter(s => s.planId === planId);
    }

    // Filter by status
    if (status) {
      const isActive = status === 'active';
      allSubscriptions = allSubscriptions.filter(s => s.isActive === isActive);
    }

    // Paginate
    const start = (page - 1) * limit;
    const paginatedSubscriptions = allSubscriptions.slice(start, start + limit);

    // Calculate statistics
    const stats = {
      total: allSubscriptions.length,
      active: allSubscriptions.filter(s => s.isActive).length,
      expired: allSubscriptions.filter(s => !s.isActive).length,
      revenue: allSubscriptions.reduce((sum, s) => sum + (s.price || 0), 0)
    };

    res.json({
      subscriptions: paginatedSubscriptions,
      pagination: {
        total: allSubscriptions.length,
        page,
        limit,
        totalPages: Math.ceil(allSubscriptions.length / limit)
      },
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

/**
 * Update subscription
 * PUT /api/admin/subscriptions/:userId
 */
router.put('/admin/subscriptions/:userId', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { tokensRemaining, expiryDate, isActive } = req.body;

    const subscription = subscriptions.get(userId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Update subscription fields
    if (tokensRemaining !== undefined) {
      subscription.tokensRemaining = tokensRemaining;
    }
    if (expiryDate !== undefined) {
      subscription.expiryDate = expiryDate;
    }
    if (isActive !== undefined) {
      subscription.isActive = isActive;
    }

    subscription.updatedAt = new Date().toISOString();
    subscriptions.set(userId, subscription);

    console.log(`✅ Subscription updated for user: ${userId}`);

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
router.get('/admin/stats', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const allUsers = Array.from(users.values());
    const allSubscriptions = Array.from(subscriptions.values());
    const allTickets = Array.from(supportTickets.values());

    // Calculate today's prompts
    const today = new Date().toISOString().split('T')[0];
    const todayPrompts = promptStats.dailyPrompts.get(today) || { authenticated: 0, anonymous: 0 };

    // Calculate statistics
    const stats = {
      users: {
        total: allUsers.length,
        active: allUsers.filter(u => u.status === 'active').length,
        suspended: allUsers.filter(u => u.status === 'suspended').length,
        new30Days: allUsers.filter(u => {
          const createdAt = new Date(u.createdAt);
          const now = new Date();
          const diff = now.getTime() - createdAt.getTime();
          return diff < 30 * 24 * 60 * 60 * 1000;
        }).length
      },
      subscriptions: {
        total: allSubscriptions.length,
        active: allSubscriptions.filter(s => s.isActive).length,
        expired: allSubscriptions.filter(s => !s.isActive).length,
        basic: allSubscriptions.filter(s => s.planId === 'basic').length,
        standard: allSubscriptions.filter(s => s.planId === 'standard').length,
        premium: allSubscriptions.filter(s => s.planId === 'premium').length
      },
      revenue: {
        total: allSubscriptions.reduce((sum, s) => sum + (s.price || 0), 0),
        monthly: allSubscriptions
          .filter(s => {
            const purchaseDate = new Date(s.purchaseDate);
            const now = new Date();
            return purchaseDate.getMonth() === now.getMonth() && 
                   purchaseDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, s) => sum + (s.price || 0), 0)
      },
      support: {
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length
      },
      prompts: {
        total: promptStats.totalAuthenticatedPrompts + promptStats.totalAnonymousPrompts,
        authenticated: promptStats.totalAuthenticatedPrompts,
        anonymous: promptStats.totalAnonymousPrompts,
        today: todayPrompts.authenticated + todayPrompts.anonymous,
        todayAuthenticated: todayPrompts.authenticated,
        todayAnonymous: todayPrompts.anonymous
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * Get all support tickets
 * GET /api/admin/support/tickets
 */
router.get('/admin/support/tickets', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    let allTickets = Array.from(supportTickets.values());

    // Filter by status
    if (status) {
      allTickets = allTickets.filter(t => t.status === status);
    }

    // Sort by creation date (newest first)
    allTickets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Paginate
    const start = (page - 1) * limit;
    const paginatedTickets = allTickets.slice(start, start + limit);

    // Calculate statistics
    const stats = {
      total: allTickets.length,
      open: allTickets.filter(t => t.status === 'open').length,
      inProgress: allTickets.filter(t => t.status === 'in_progress').length,
      resolved: allTickets.filter(t => t.status === 'resolved').length,
      closed: allTickets.filter(t => t.status === 'closed').length
    };

    res.json({
      tickets: paginatedTickets,
      pagination: {
        total: allTickets.length,
        page,
        limit,
        totalPages: Math.ceil(allTickets.length / limit)
      },
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

/**
 * Update ticket status
 * PUT /api/admin/support/tickets/:ticketId
 */
router.put('/admin/support/tickets/:ticketId', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { status, response, assignedTo } = req.body;

    const ticket = supportTickets.get(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update ticket fields
    if (status) {
      ticket.status = status;
    }
    if (response) {
      ticket.responses = ticket.responses || [];
      ticket.responses.push({
        message: response,
        from: 'admin',
        createdAt: new Date().toISOString()
      });
    }
    if (assignedTo) {
      ticket.assignedTo = assignedTo;
    }

    ticket.updatedAt = new Date().toISOString();
    supportTickets.set(ticketId, ticket);

    console.log(`✅ Ticket updated: ${ticketId} -> ${status}`);

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('❌ Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

/**
 * Create support ticket (user-facing)
 * POST /api/support/tickets
 */
router.post('/support/tickets', async (req: Request, res: Response) => {
  try {
    const { userId, subject, message, priority, category } = req.body;

    if (!userId || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticketId = `ticket_${Date.now()}_${userId}`;
    const ticket = {
      id: ticketId,
      userId,
      subject,
      message,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: []
    };

    supportTickets.set(ticketId, ticket);

    console.log(`✅ Support ticket created: ${ticketId} - ${subject}`);

    res.json({ success: true, ticket });
  } catch (error) {
    console.error('❌ Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

/**
 * Get user tickets
 * GET /api/support/tickets/user/:userId
 */
router.get('/support/tickets/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userTickets = Array.from(supportTickets.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    res.json({ tickets: userTickets });
  } catch (error) {
    console.error('❌ Error fetching user tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Export storage for other routes to access
export const adminStorage = {
  users,
  subscriptions,
  supportTickets,
  trackPrompt,
  promptStats
};

export default router;

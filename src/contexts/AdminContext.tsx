import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { getApiUrl } from '../lib/api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
  permissions: string[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Subscription {
  userId: string;
  planId: string;
  tokensRemaining: number;
  tokensUsed: number;
  totalTokens: number;
  purchaseDate: string;
  expiryDate?: string;
  isActive: boolean;
  price: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  responses?: Array<{
    message: string;
    from: string;
    createdAt: string;
  }>;
  assignedTo?: string;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    banned: number;
    new30Days: number;
  };
  subscriptions: {
    total: number;
    active: number;
    expired: number;
    basic: number;
    standard: number;
    premium: number;
    free: number;
  };
  revenue: {
    total: number;
    monthly: number;
  };
  support: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  prompts: {
    total: number;
    authenticated: number;
    anonymous: number;
    today: number;
    todayAuthenticated: number;
    todayAnonymous: number;
    totalUsers?: number;
    averagePerUser?: number;
  };
}

interface AdminContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  setAdminFromToken: (token: string, admin: AdminUser) => void;
  logout: () => void;
  getUsers: (page?: number, search?: string) => Promise<any>;
  getUserDetails: (userId: string) => Promise<any>;
  updateUserStatus: (userId: string, status: string) => Promise<boolean>;
  getSubscriptions: (page?: number, filters?: any) => Promise<any>;
  updateSubscription: (userId: string, updates: any) => Promise<boolean>;
  grantTokens: (userId: string, tokens: number) => Promise<boolean>;
  getTickets: (page?: number, status?: string) => Promise<any>;
  updateTicket: (ticketId: string, updates: any) => Promise<boolean>;
  getStats: () => Promise<AdminStats | null>;
  syncAllUsersFromFirestore: () => Promise<{ success: boolean; count: number; errors: number }>;
  exportUsers: (format: 'excel' | 'pdf') => Promise<Blob | null>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Load admin from localStorage on mount
  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin_user');
    const savedToken = localStorage.getItem('admin_token');
    
    if (savedAdmin && savedToken) {
      try {
        const adminData = JSON.parse(savedAdmin);
        setAdmin(adminData);
        setAdminToken(savedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error loading admin data:', error);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
      }
    }
  }, []);

  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'x-admin-email': admin?.email || '',
      'x-admin-token': adminToken || ''
    };
  }, [admin, adminToken]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(getApiUrl('admin/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const result = await response.json();
      
      if (result.success && result.admin && result.token) {
        setAdmin(result.admin);
        setAdminToken(result.token);
        setIsAuthenticated(true);
        
        localStorage.setItem('admin_user', JSON.stringify(result.admin));
        localStorage.setItem('admin_token', result.token);
        
        console.log('✅ Admin login successful');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setAdminFromToken = useCallback((token: string, adminData: AdminUser) => {
    setAdmin(adminData);
    setAdminToken(token);
    setIsAuthenticated(true);
    
    localStorage.setItem('admin_user', JSON.stringify(adminData));
    localStorage.setItem('admin_token', token);
    
    console.log('✅ Admin authenticated via Google OAuth');
  }, []);

  const logout = useCallback(() => {
    setAdmin(null);
    setAdminToken(null);
    setIsAuthenticated(false);
    
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    
    console.log('✅ Admin logged out');
  }, []);

  const getUsers = useCallback(async (page = 1, search = '') => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: '20' 
      });
      
      if (search) {
        params.append('search', search);
      }

      console.log('📡 Fetching users from:', getApiUrl(`admin/users?${params}`));
      const response = await fetch(getApiUrl(`admin/users?${params}`), {
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch users:', response.status, errorText);
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Users fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      return { users: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } };
    }
  }, [getHeaders]);

  const getUserDetails = useCallback(async (userId: string) => {
    try {
      const response = await fetch(getApiUrl(`admin/users/${userId}`), {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }, [getHeaders]);

  const updateUserStatus = useCallback(async (userId: string, status: string): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl(`admin/users/${userId}/status`), {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  }, [getHeaders]);

  const getSubscriptions = useCallback(async (page = 1, filters = {}) => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: '20',
        ...filters
      });

      console.log('📡 Fetching subscriptions from:', getApiUrl(`admin/subscriptions?${params}`));
      const response = await fetch(getApiUrl(`admin/subscriptions?${params}`), {
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch subscriptions:', response.status, errorText);
        throw new Error(`Failed to fetch subscriptions: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Subscriptions fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return { subscriptions: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 }, stats: { total: 0, active: 0, expired: 0, revenue: 0 } };
    }
  }, [getHeaders]);

  const updateSubscription = useCallback(async (userId: string, updates: any): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl(`admin/subscriptions/${userId}`), {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return false;
    }
  }, [getHeaders]);

  const grantTokens = useCallback(async (userId: string, tokens: number): Promise<boolean> => {
    try {
      console.log(`📤 Admin granting ${tokens} tokens to user ${userId}`);
      const response = await fetch(getApiUrl(`admin/grant-tokens`), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, tokens })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to grant tokens:', errorText);
        throw new Error('Failed to grant tokens');
      }

      const result = await response.json();
      console.log('✅ Tokens granted successfully:', result);
      return result.success;
    } catch (error) {
      console.error('Error granting tokens:', error);
      return false;
    }
  }, [getHeaders]);

  const getTickets = useCallback(async (page = 1, status = '') => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: '20' 
      });
      
      if (status) {
        params.append('status', status);
      }

      console.log('📡 Fetching tickets from:', getApiUrl(`admin/support/tickets?${params}`));
      const response = await fetch(getApiUrl(`admin/support/tickets?${params}`), {
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch tickets:', response.status, errorText);
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Tickets fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching tickets:', error);
      return { tickets: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 }, stats: { total: 0, open: 0, inProgress: 0, resolved: 0 } };
    }
  }, [getHeaders]);

  const updateTicket = useCallback(async (ticketId: string, updates: any): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl(`admin/support/tickets/${ticketId}`), {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error updating ticket:', error);
      return false;
    }
  }, [getHeaders]);

  const getStats = useCallback(async (): Promise<AdminStats | null> => {
    try {
      const response = await fetch(getApiUrl('admin/stats'), {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      return result.stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  }, [getHeaders]);

  const syncAllUsersFromFirestore = useCallback(
    async (): Promise<{ success: boolean; count: number; errors: number }> => {
      try {
        console.log('🔄 Starting bulk user sync from Firestore...');

        // Import the function dynamically
        const { getAllUsersFromFirestore } = await import('../lib/userService');

        // Fetch all users from Firestore
        const users = await getAllUsersFromFirestore();

        if (users.length === 0) {
          console.log('ℹ️ No users found in Firestore');
          return { success: true, count: 0, errors: 0 };
        }

        console.log(`📊 Found ${users.length} users in Firestore. Syncing to backend...`);

        // Sync each user to backend
        let successCount = 0;
        let errorCount = 0;

        for (const user of users) {
          try {
            const response = await fetch(getApiUrl('users/sync'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                picture: user.picture,
              }),
            });

            if (response.ok) {
              successCount++;
              console.log(`✅ Synced user: ${user.email}`);
            } else {
              errorCount++;
              console.error(`❌ Failed to sync user: ${user.email}`);
            }
          } catch (error) {
            errorCount++;
            console.error(`❌ Error syncing user ${user.email}:`, error);
          }
        }

        console.log(`✅ Bulk sync complete: ${successCount} successful, ${errorCount} errors`);

        return {
          success: errorCount === 0,
          count: successCount,
          errors: errorCount,
        };
      } catch (error) {
        console.error('❌ Error during bulk sync:', error);
        return { success: false, count: 0, errors: 1 };
      }
    },
    []
  );

  const exportUsers = useCallback(
    async (format: 'excel' | 'pdf'): Promise<Blob | null> => {
      try {
        const params = new URLSearchParams({ format });
        const response = await fetch(getApiUrl(`admin/users/export?${params}`), {
          headers: getHeaders(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to export users:', response.status, errorText);
          throw new Error(`Failed to export users: ${response.status}`);
        }

        return await response.blob();
      } catch (error) {
        console.error('❌ Error exporting users:', error);
        return null;
      }
    },
    [getHeaders]
  );

  const value: AdminContextType = {
    admin,
    isAuthenticated,
    isLoading,
    login,
    setAdminFromToken,
    logout,
    getUsers,
    getUserDetails,
    updateUserStatus,
    getSubscriptions,
    updateSubscription,
    grantTokens,
    getTickets,
    updateTicket,
    getStats,
    syncAllUsersFromFirestore,
    exportUsers,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

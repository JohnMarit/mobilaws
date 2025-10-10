import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
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
    new30Days: number;
  };
  subscriptions: {
    total: number;
    active: number;
    expired: number;
    basic: number;
    standard: number;
    premium: number;
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
}

interface AdminContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  setAdminFromToken: (admin: AdminUser, token: string) => void;
  logout: () => void;
  getUsers: (page?: number, search?: string) => Promise<any>;
  getUserDetails: (userId: string) => Promise<any>;
  updateUserStatus: (userId: string, status: string) => Promise<boolean>;
  getSubscriptions: (page?: number, filters?: any) => Promise<any>;
  updateSubscription: (userId: string, updates: any) => Promise<boolean>;
  getTickets: (page?: number, status?: string) => Promise<any>;
  updateTicket: (ticketId: string, updates: any) => Promise<boolean>;
  getStats: () => Promise<AdminStats | null>;
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

const API_BASE_URL = 'http://localhost:8000/api';

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
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
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

  const setAdminFromToken = useCallback((adminData: AdminUser, token: string) => {
    setAdmin(adminData);
    setAdminToken(token);
    setIsAuthenticated(true);
    
    localStorage.setItem('admin_user', JSON.stringify(adminData));
    localStorage.setItem('admin_token', token);
    
    console.log('✅ Admin authenticated via magic link');
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

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return null;
    }
  }, [getHeaders]);

  const getUserDetails = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
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
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
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

      const response = await fetch(`${API_BASE_URL}/admin/subscriptions?${params}`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return null;
    }
  }, [getHeaders]);

  const updateSubscription = useCallback(async (userId: string, updates: any): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/subscriptions/${userId}`, {
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

  const getTickets = useCallback(async (page = 1, status = '') => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: '20' 
      });
      
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`${API_BASE_URL}/admin/support/tickets?${params}`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return null;
    }
  }, [getHeaders]);

  const updateTicket = useCallback(async (ticketId: string, updates: any): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/support/tickets/${ticketId}`, {
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
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
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
    getTickets,
    updateTicket,
    getStats,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin, AdminStats } from '../contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Users,
  CreditCard,
  LifeBuoy,
  TrendingUp,
  LogOut,
  Shield,
  DollarSign,
  Activity,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import UserManagement from '../components/admin/UserManagement';
import SubscriptionManagement from '../components/admin/SubscriptionManagement';
import SupportManagement from '../components/admin/SupportManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { admin, isAuthenticated, logout, getStats } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }

    loadStats();
  }, [isAuthenticated, navigate]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getStats();
      console.log('📊 Admin stats loaded:', data);
      setStats(data);
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh stats when switching to overview tab
  useEffect(() => {
    if (activeTab === 'overview' && isAuthenticated) {
      loadStats();
    }
  }, [activeTab, isAuthenticated]);

  // Listen for user sync events to refresh stats
  useEffect(() => {
    const handleUsersSynced = () => {
      console.log('🔄 Users synced, refreshing stats...');
      loadStats();
    };

    window.addEventListener('users-synced', handleUsersSynced);
    return () => window.removeEventListener('users-synced', handleUsersSynced);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Mobilaws Management Console</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
                <p className="text-xs text-gray-600">{admin?.email}</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto mb-8">
            <TabsTrigger value="overview">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="support">
              <LifeBuoy className="h-4 w-4 mr-2" />
              Support
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.users.active || 0} active
                  </p>
                </CardContent>
              </Card>

              {/* Active Subscriptions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Active Subscriptions
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.subscriptions.active || 0}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.subscriptions.total || 0} total
                  </p>
                </CardContent>
              </Card>

              {/* Total Revenue */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${stats?.revenue.total.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    ${stats?.revenue.monthly.toFixed(2) || '0.00'} this month
                  </p>
                </CardContent>
              </Card>

              {/* Support Tickets */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Open Tickets
                  </CardTitle>
                  <LifeBuoy className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.support.open || 0}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.support.total || 0} total tickets
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Prompt Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Prompts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Prompts
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats?.prompts.total || 0}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.prompts.today || 0} today
                  </p>
                </CardContent>
              </Card>

              {/* Authenticated User Prompts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    User Prompts
                  </CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats?.prompts.authenticated || 0}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.prompts.todayAuthenticated || 0} today
                  </p>
                </CardContent>
              </Card>

              {/* Anonymous User Prompts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Anonymous Prompts
                  </CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats?.prompts.anonymous || 0}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.prompts.todayAnonymous || 0} today
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                  <CardDescription>User base breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="font-semibold">{stats?.users.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="font-semibold text-green-600">{stats?.users.active || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Suspended Users</span>
                    <span className="font-semibold text-yellow-600">{stats?.users.suspended || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Banned Users</span>
                    <span className="font-semibold text-red-600">{stats?.users.banned || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New (Last 30 Days)</span>
                    <span className="font-semibold text-blue-600">{stats?.users.new30Days || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Plans</CardTitle>
                  <CardDescription>Plan distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Basic Plan</span>
                    <span className="font-semibold">{stats?.subscriptions.basic || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Standard Plan</span>
                    <span className="font-semibold">{stats?.subscriptions.standard || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Premium Plan</span>
                    <span className="font-semibold">{stats?.subscriptions.premium || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Free Plan</span>
                    <span className="font-semibold text-gray-600">{stats?.subscriptions.free || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Expired</span>
                    <span className="font-semibold text-red-600">{stats?.subscriptions.expired || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={loadStats}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('users')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('subscriptions')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  View Subscriptions
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('support')}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Check Support Tickets
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <SubscriptionManagement />
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <SupportManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

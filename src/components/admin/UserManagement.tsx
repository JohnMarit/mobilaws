import React, { useState, useEffect } from 'react';
import { useAdmin, User } from '../../contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Search, RefreshCw, UserCheck, UserX, Ban, Download, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagement() {
  const { getUsers, updateUserStatus, syncAllUsersFromFirestore } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, getUsers]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading users...', { currentPage, searchTerm });
      const result = await getUsers(currentPage, searchTerm);
      console.log('✅ Users loaded:', result);
      
      if (result) {
        setUsers(result.users || []);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        console.warn('⚠️ No result from getUsers');
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    const success = await updateUserStatus(userId, newStatus);
    if (success) {
      toast.success('User status updated successfully');
      loadUsers();
    } else {
      toast.error('Failed to update user status');
    }
  };

  const handleBulkSync = async () => {
    setIsSyncing(true);
    try {
      toast.info('Starting bulk user sync from Firestore...');
      const result = await syncAllUsersFromFirestore();
      
      if (result.success) {
        toast.success(`Successfully synced ${result.count} users from Firestore!`);
      } else {
        toast.warning(`Synced ${result.count} users with ${result.errors} errors`);
      }
      
      // Reload users to show the newly synced ones
      await loadUsers();
    } catch (error) {
      console.error('Error during bulk sync:', error);
      toast.error('Failed to sync users from Firestore');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFirebaseAuthSync = async () => {
    setIsSyncing(true);
    try {
      toast.info('🔥 Syncing all users from Firebase Authentication...');
      
      const response = await fetch('https://mobilaws-ympe.vercel.app/api/firebase-sync/users', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`🎉 Successfully synced ${result.synced} users from Firebase Auth!`);
        await loadUsers(); // Reload the user list
        
        // Trigger stats refresh in parent component
        // The parent AdminDashboard will auto-refresh when switching tabs
        window.dispatchEvent(new CustomEvent('users-synced'));
      } else {
        toast.error(result.message || 'Failed to sync users');
      }
    } catch (error) {
      console.error('Error syncing from Firebase Auth:', error);
      toast.error('Failed to sync users from Firebase Authentication');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500">Suspended</Badge>;
      case 'banned':
        return <Badge className="bg-red-500">Banned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          <Button
            variant="default"
            onClick={handleFirebaseAuthSync}
            disabled={isSyncing || isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Zap className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync from Firebase Auth'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleBulkSync}
            disabled={isSyncing || isLoading}
          >
            <Download className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-bounce' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync from Firestore'}
          </Button>
            <Button 
              variant="outline" 
              onClick={loadUsers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-sm">
                          {user.id.substring(0, 12)}...
                        </TableCell>
                        <TableCell>{user.name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.status}
                            onValueChange={(value) => handleStatusChange(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                  Active
                                </div>
                              </SelectItem>
                              <SelectItem value="suspended">
                                <div className="flex items-center gap-2">
                                  <UserX className="h-4 w-4 text-yellow-600" />
                                  Suspended
                                </div>
                              </SelectItem>
                              <SelectItem value="banned">
                                <div className="flex items-center gap-2">
                                  <Ban className="h-4 w-4 text-red-600" />
                                  Banned
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

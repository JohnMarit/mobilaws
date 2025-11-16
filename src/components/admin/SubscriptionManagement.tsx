import React, { useState, useEffect } from 'react';
import { useAdmin, Subscription } from '../../contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
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
import { RefreshCw, CreditCard, Edit, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function SubscriptionManagement() {
  const { getSubscriptions, updateSubscription } = useAdmin();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    console.log('🔍 SubscriptionManagement mounted, loading subscriptions...');
    loadSubscriptions();
  }, [currentPage, filterPlan, filterStatus]);

  const loadSubscriptions = async () => {
    console.log('🔄 loadSubscriptions called');
    setIsLoading(true);
    try {
      const filters: any = {};
      if (filterPlan) filters.planId = filterPlan;
      if (filterStatus) filters.status = filterStatus;

      console.log('🔄 Loading subscriptions...', { currentPage, filters });
      const result = await getSubscriptions(currentPage, filters);
      console.log('✅ Subscriptions result:', result);
      
      if (result) {
        setSubscriptions(result.subscriptions || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setStats(result.stats || null);
        console.log('✅ Subscriptions state updated:', result.subscriptions?.length || 0, 'subscriptions');
      } else {
        console.warn('⚠️ No result from getSubscriptions');
        setSubscriptions([]);
      }
    } catch (error) {
      console.error('❌ Error loading subscriptions:', error);
      toast.error('Failed to load subscriptions');
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
      console.log('✅ loadSubscriptions complete, isLoading set to false');
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setEditDialogOpen(true);
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubscription) return;

    const success = await updateSubscription(editingSubscription.userId, {
      tokensRemaining: editingSubscription.tokensRemaining,
      expiryDate: editingSubscription.expiryDate,
      isActive: editingSubscription.isActive
    });

    if (success) {
      toast.success('Subscription updated successfully');
      setEditDialogOpen(false);
      loadSubscriptions();
    } else {
      toast.error('Failed to update subscription');
    }
  };

  const getPlanBadge = (planId: string) => {
    switch (planId) {
      case 'basic':
        return <Badge className="bg-blue-500">Basic</Badge>;
      case 'standard':
        return <Badge className="bg-purple-500">Standard</Badge>;
      case 'premium':
        return <Badge className="bg-yellow-500">Premium</Badge>;
      case 'free':
        return <Badge variant="outline">Free</Badge>;
      default:
        return <Badge>{planId}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500">Active</Badge>
    ) : (
      <Badge className="bg-red-500">Inactive</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                ${stats.revenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Expired
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.expired}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            View and manage user subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={filterPlan || "all_plans"} onValueChange={(value) => {
              setFilterPlan(value === "all_plans" ? "" : value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_plans">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus || "all_status"} onValueChange={(value) => {
              setFilterStatus(value === "all_status" ? "" : value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_status">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={loadSubscriptions}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Subscriptions Table */}
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading subscriptions...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No subscriptions found</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.userId}>
                        <TableCell className="font-mono text-sm">
                          {subscription.userId.substring(0, 12)}...
                        </TableCell>
                        <TableCell>{getPlanBadge(subscription.planId)}</TableCell>
                        <TableCell>{getStatusBadge(subscription.isActive)}</TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {subscription.tokensRemaining}
                          </span>
                          <span className="text-gray-600 text-sm">
                            /{subscription.totalTokens}
                          </span>
                        </TableCell>
                        <TableCell>${subscription.price}</TableCell>
                        <TableCell>
                          {new Date(subscription.purchaseDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {subscription.expiryDate 
                            ? new Date(subscription.expiryDate).toLocaleDateString()
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSubscription(subscription)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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

      {/* Edit Subscription Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update subscription details for user
            </DialogDescription>
          </DialogHeader>
          {editingSubscription && (
            <form onSubmit={handleSaveSubscription} className="space-y-4">
              <div className="space-y-2">
                <Label>Tokens Remaining</Label>
                <Input
                  type="number"
                  value={editingSubscription.tokensRemaining}
                  onChange={(e) => setEditingSubscription({
                    ...editingSubscription,
                    tokensRemaining: parseInt(e.target.value)
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={editingSubscription.expiryDate 
                    ? new Date(editingSubscription.expiryDate).toISOString().split('T')[0]
                    : ''
                  }
                  onChange={(e) => setEditingSubscription({
                    ...editingSubscription,
                    expiryDate: new Date(e.target.value).toISOString()
                  })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingSubscription.isActive}
                  onChange={(e) => setEditingSubscription({
                    ...editingSubscription,
                    isActive: e.target.checked
                  })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Active Subscription</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

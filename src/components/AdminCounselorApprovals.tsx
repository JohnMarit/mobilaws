/**
 * Admin Counselor Approvals
 * Interface for admins to approve or reject counselor applications
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  Scale, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  CreditCard,
  Shield,
  RefreshCcw,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getPendingCounselorApplications,
  getAllCounselors,
  approveCounselorApplication,
  rejectCounselorApplication,
  getCounselorsWithPendingChanges,
  approveCounselorChanges,
  rejectCounselorChanges,
  getCounselConfig,
  type Counselor,
  type SouthSudanState,
} from '@/lib/counsel-service';

interface AdminCounselorApprovalsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminCounselorApprovals({ open, onOpenChange }: AdminCounselorApprovalsProps) {
  const [pendingApplications, setPendingApplications] = useState<Counselor[]>([]);
  const [allCounselors, setAllCounselors] = useState<Counselor[]>([]);
  const [counselorsWithPendingChanges, setCounselorsWithPendingChanges] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [isApprovingChanges, setIsApprovingChanges] = useState(false);
  const [isRejectingChanges, setIsRejectingChanges] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [states, setStates] = useState<SouthSudanState[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
      getCounselConfig().then(config => setStates(config.states));
    }
  }, [open]);

  const loadData = async () => {
    setIsLoading(true);
    console.log('📥 Loading counselor applications...');
    try {
      const [pending, all, pendingChanges] = await Promise.all([
        getPendingCounselorApplications(),
        getAllCounselors(),
        getCounselorsWithPendingChanges(),
      ]);
      console.log('📊 Counselor data loaded:', {
        pending: pending.length,
        all: all.length,
        pendingChanges: pendingChanges.length,
        pendingDetails: pending
      });
      setPendingApplications(pending);
      setAllCounselors(all);
      setCounselorsWithPendingChanges(pendingChanges);
      
      if (pending.length > 0) {
        toast({
          title: `${pending.length} Pending Application${pending.length > 1 ? 's' : ''}`,
          description: 'Waiting for your review',
        });
      }
      if (pendingChanges.length > 0) {
        toast({
          title: `${pendingChanges.length} Pending Change${pendingChanges.length > 1 ? 's' : ''}`,
          description: 'Counselor profile changes awaiting approval',
        });
      }
    } catch (error) {
      console.error('❌ Error loading applications:', error);
      toast({
        title: 'Error Loading Applications',
        description: 'Failed to fetch counselor applications. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveChanges = async (counselor: Counselor) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User ID not found',
        variant: 'destructive',
      });
      return;
    }

    setIsApprovingChanges(true);
    try {
      const result = await approveCounselorChanges(counselor.id, user.id);
      if (result.success) {
        toast({
          title: 'Changes Approved',
          description: result.message || 'Counselor changes have been approved.',
        });
        await loadData();
      } else {
        toast({
          title: 'Approval Failed',
          description: result.error || 'Failed to approve changes.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve changes.',
        variant: 'destructive',
      });
    } finally {
      setIsApprovingChanges(false);
    }
  };

  const handleRejectChanges = async (counselor: Counselor, reason?: string) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User ID not found',
        variant: 'destructive',
      });
      return;
    }

    setIsRejectingChanges(true);
    try {
      const result = await rejectCounselorChanges(counselor.id, user.id, reason);
      if (result.success) {
        toast({
          title: 'Changes Rejected',
          description: result.message || 'Counselor changes have been rejected.',
        });
        await loadData();
        setShowRejectDialog(false);
      } else {
        toast({
          title: 'Rejection Failed',
          description: result.error || 'Failed to reject changes.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject changes.',
        variant: 'destructive',
      });
    } finally {
      setIsRejectingChanges(false);
    }
  };

  const handleApprove = async (counselor: Counselor) => {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'You must be signed in as admin.',
        variant: 'destructive',
      });
      return;
    }

    setIsApproving(true);
    setSelectedCounselor(counselor);

    try {
      const result = await approveCounselorApplication(counselor.id, user.email);

      if (result.success) {
        toast({
          title: '✅ Counselor Approved',
          description: `${counselor.name} has been approved.`,
        });
        loadData();
      } else {
        toast({
          title: 'Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve counselor.',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
      setSelectedCounselor(null);
    }
  };

  const handleRejectClick = (counselor: Counselor) => {
    setSelectedCounselor(counselor);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!user?.email || !selectedCounselor) {
      return;
    }

    if (!rejectionReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    setIsRejecting(true);

    try {
      const result = await rejectCounselorApplication(
        selectedCounselor.id,
        user.email,
        rejectionReason.trim()
      );

      if (result.success) {
        toast({
          title: 'Application Rejected',
          description: `${selectedCounselor.name}'s application has been rejected.`,
        });
        setShowRejectDialog(false);
        loadData();
      } else {
        toast({
          title: 'Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject application.',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
      setSelectedCounselor(null);
    }
  };

  const getStateName = (code: string) => {
    return states.find(s => s.code === code)?.name || code;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const approvedCounselors = allCounselors.filter(c => c.applicationStatus === 'approved');
  const rejectedCounselors = allCounselors.filter(c => c.applicationStatus === 'rejected');

  // If open is false, don't render anything (for when used as dialog)
  // If open is true and onOpenChange is a no-op, render inline (for admin dashboard)
  const isInline = open && onOpenChange.toString().includes('{}');

  const content = (
    <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                {pendingApplications.length} pending
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {approvedCounselors.length} approved
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="pending" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full">
              <TabsTrigger value="pending" className="flex-1">
                Pending ({pendingApplications.length})
              </TabsTrigger>
              <TabsTrigger value="changes" className="flex-1">
                Changes ({counselorsWithPendingChanges.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex-1">
                Approved ({approvedCounselors.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex-1">
                Rejected ({rejectedCounselors.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Applications */}
            <TabsContent value="pending" className="flex-1 mt-2 min-h-0">
              <ScrollArea className="h-[400px] border rounded-lg">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : pendingApplications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending applications</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {pendingApplications.map((counselor) => (
                      <div
                        key={counselor.id}
                        className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5 text-gray-500" />
                              <span className="font-semibold text-lg">{counselor.name}</span>
                              {getStatusBadge(counselor.applicationStatus)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-4 w-4" />
                                {counselor.phone || 'No phone'}
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="h-4 w-4" />
                                {getStateName(counselor.state)}
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <CreditCard className="h-4 w-4" />
                                ID: {counselor.nationalIdNumber || 'Not provided'}
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="h-4 w-4" />
                                Applied: {formatDate(counselor.appliedAt)}
                              </div>
                              {typeof counselor.bookingFee === 'number' && (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <DollarSign className="h-4 w-4" />
                                  Fee: ${counselor.bookingFee.toFixed(2)}/booking
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-green-600 font-semibold">
                                <DollarSign className="h-4 w-4" />
                                Gross Earnings: ${(counselor.totalEarnings || 0).toFixed(2)}
                              </div>
                            </div>

                            <div className="text-xs text-gray-500">
                              Email: {counselor.email}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleApprove(counselor)}
                              disabled={isApproving && selectedCounselor?.id === counselor.id}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              {isApproving && selectedCounselor?.id === counselor.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleRejectClick(counselor)}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Pending Changes */}
            <TabsContent value="changes" className="flex-1 mt-2 min-h-0">
              <ScrollArea className="h-[400px] border rounded-lg">
                {counselorsWithPendingChanges.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending changes</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {counselorsWithPendingChanges.map((counselor) => (
                      <div
                        key={counselor.id}
                        className="p-4 border rounded-lg bg-yellow-50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5 text-gray-500" />
                              <span className="font-semibold text-lg">{counselor.name}</span>
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                            
                            {counselor.pendingChanges && (
                              <div className="space-y-2 text-sm">
                                <div className="bg-white rounded p-3 space-y-2">
                                  <p className="font-semibold text-gray-700">Requested Changes:</p>
                                  {counselor.pendingChanges.bookingFee !== undefined && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600">Booking Fee:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-400 line-through">
                                          ${(counselor.bookingFee || 10).toFixed(2)}
                                        </span>
                                        <span className="font-semibold text-green-600">
                                          → ${counselor.pendingChanges.bookingFee.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {counselor.pendingChanges.specializations && (
                                    <div>
                                      <span className="text-gray-600">Specializations:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {counselor.pendingChanges.specializations.map((spec) => (
                                          <Badge key={spec} variant="secondary" className="text-xs">
                                            {spec}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleApproveChanges(counselor)}
                              disabled={isApprovingChanges}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              {isApprovingChanges ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedCounselor(counselor);
                                setShowRejectDialog(true);
                              }}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Approved Counselors */}
            <TabsContent value="approved" className="flex-1 mt-2 min-h-0">
              <ScrollArea className="h-[400px] border rounded-lg">
                {approvedCounselors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No approved counselors yet</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {approvedCounselors.map((counselor) => (
                      <div
                        key={counselor.id}
                        className="p-4 border rounded-lg bg-green-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{counselor.name}</span>
                              {counselor.isOnline && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                              <span>{counselor.phone}</span>
                              <span>{getStateName(counselor.state)}</span>
                              <span>{counselor.totalCases} cases</span>
                              {typeof counselor.bookingFee === 'number' && (
                                <span className="text-blue-600">
                                  Fee: ${counselor.bookingFee.toFixed(2)}
                                </span>
                              )}
                              <span className="text-green-600 font-semibold">
                                <DollarSign className="h-3 w-3 inline" />
                                Gross: ${(counselor.totalEarnings || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(counselor.applicationStatus)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Rejected Applications */}
            <TabsContent value="rejected" className="flex-1 mt-2 min-h-0">
              <ScrollArea className="h-[400px] border rounded-lg">
                {rejectedCounselors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No rejected applications</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {rejectedCounselors.map((counselor) => (
                      <div
                        key={counselor.id}
                        className="p-4 border rounded-lg bg-red-50"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{counselor.name}</span>
                            {getStatusBadge(counselor.applicationStatus)}
                          </div>
                          {counselor.rejectionReason && (
                            <p className="text-sm text-red-600 bg-red-100 p-2 rounded">
                              Reason: {counselor.rejectionReason}
                            </p>
                          )}
                          <div className="text-xs text-gray-500">
                            {counselor.phone} • {getStateName(counselor.state)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
    </>
  );

  if (isInline) {
    return (
      <>
        {content}
        {/* Rejection Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedCounselor?.name}'s application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Reject Application'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
    );
  }

  // Render as dialog
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Counselor Approvals (Admin)
            </DialogTitle>
            <DialogDescription>
              Review and approve counselor applications
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedCounselor?.name}'s application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Reject Application'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


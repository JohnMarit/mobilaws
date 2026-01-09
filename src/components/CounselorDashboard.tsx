/**
 * Counselor Dashboard
 * Interface for counselors to go online, view and accept requests
 * Only accessible to admin-approved counselors
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Scale, CheckCircle2, Clock, User, Circle, MapPin, Phone, Calendar, Bell, XCircle, FileText, DollarSign, Edit, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  setCounselorOnlineStatus,
  getCounselorProfile,
  getCounselConfig,
  getCounselorApplicationStatus,
  requestCounselorChanges,
  type Counselor,
  type SouthSudanState,
  type LegalCategory,
} from '@/lib/counsel-service';
import { getCounselorChats, type CounselChatSession } from '@/lib/counsel-chat-service';
import { CounselorApplication } from './CounselorApplication';
import { CounselChatInterface } from './CounselChatInterface';

interface CounselorDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CounselorDashboard({ open, onOpenChange }: CounselorDashboardProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [counselorProfile, setCounselorProfile] = useState<Counselor | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [phone, setPhone] = useState('');
  const [states, setStates] = useState<SouthSudanState[]>([]);
  const [categories, setCategories] = useState<LegalCategory[]>([]);
  
  const [chatSession, setChatSession] = useState<CounselChatSession | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [counselorChats, setCounselorChats] = useState<CounselChatSession[]>([]);
  
  // Approval status
  const [isCheckingApproval, setIsCheckingApproval] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  // Edit profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBookingFee, setEditBookingFee] = useState('');
  const [editSpecializations, setEditSpecializations] = useState<string[]>([]);
  const [isSubmittingChanges, setIsSubmittingChanges] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Check approval status first
  useEffect(() => {
    if (open && user) {
      checkApprovalStatus();
    }
  }, [open, user]);

  const checkApprovalStatus = async () => {
    if (!user) return;
    
    setIsCheckingApproval(true);
    try {
      const status = await getCounselorApplicationStatus(user.id);
      
      if (status?.exists && status.status) {
        setApprovalStatus(status.status);
        if (status.rejectionReason) {
          setRejectionReason(status.rejectionReason);
        }
        
        // If approved, load the full profile
        if (status.status === 'approved') {
          loadConfigAndProfile();
        }
      } else {
        setApprovalStatus('none');
      }
    } catch (error) {
      console.error('Error checking approval:', error);
    } finally {
      setIsCheckingApproval(false);
    }
  };

  // Load config and profile (only for approved counselors)
  const loadConfigAndProfile = async () => {
    const config = await getCounselConfig();
    setStates(config.states);
    setCategories(config.categories);
    
    if (user) {
      const profile = await getCounselorProfile(user.id);
      if (profile) {
        setCounselorProfile(profile);
        setIsOnline(profile.isOnline);
        setSelectedState(profile.state);
        setPhone(profile.phone || '');
        setEditBookingFee((profile.bookingFee || 10).toString());
        setEditSpecializations(profile.specializations || []);
      }
    }
  };

  const handleStartEdit = () => {
    if (counselorProfile) {
      setEditBookingFee((counselorProfile.bookingFee || 10).toString());
      setEditSpecializations([...counselorProfile.specializations]);
      setIsEditingProfile(true);
    }
  };

  const handleCancelEdit = () => {
    if (counselorProfile) {
      setEditBookingFee((counselorProfile.bookingFee || 10).toString());
      setEditSpecializations([...counselorProfile.specializations]);
    }
    setIsEditingProfile(false);
  };

  const handleSubmitChanges = async () => {
    if (!user || !counselorProfile) return;

    const fee = parseFloat(editBookingFee);
    if (isNaN(fee) || fee <= 0) {
      toast({
        title: 'Invalid Fee',
        description: 'Booking fee must be a positive number.',
        variant: 'destructive',
      });
      return;
    }

    if (editSpecializations.length === 0) {
      toast({
        title: 'Specializations Required',
        description: 'Please select at least one specialization.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingChanges(true);
    try {
      const result = await requestCounselorChanges(counselorProfile.id, {
        bookingFee: fee,
        specializations: editSpecializations,
      });

      if (result.success) {
        toast({
          title: 'Change Request Submitted',
          description: result.message || 'Your changes are pending admin approval.',
        });
        setIsEditingProfile(false);
        // Reload profile to show pending changes
        await loadConfigAndProfile();
      } else {
        toast({
          title: 'Request Failed',
          description: result.error || 'Failed to submit change request.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit change request.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingChanges(false);
    }
  };

  const toggleSpecialization = (categoryId: string) => {
    if (editSpecializations.includes(categoryId)) {
      setEditSpecializations(editSpecializations.filter(id => id !== categoryId));
    } else {
      setEditSpecializations([...editSpecializations, categoryId]);
    }
  };

  // Load chats when online
  useEffect(() => {
    if (open && isOnline) {
      loadChats();
      pollingRef.current = setInterval(() => {
        loadChats();
      }, 5000);
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [open, isOnline]);

  const loadChats = async () => {
    if (!user) return;
    try {
      const chats = await getCounselorChats(user.id);
      setCounselorChats(chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  // Removed loadRequests - no longer needed since chats are created automatically after payment
  // Removed handleTestSound - notification sounds no longer needed

  const handleToggleOnline = async () => {
    if (!user) {
      toast({
        title: 'Please Sign In',
        description: 'You need to sign in to use counselor features.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedState) {
      toast({
        title: 'Select Your State',
        description: 'Please select your state to go online.',
        variant: 'destructive',
      });
      return;
    }

    setIsTogglingStatus(true);
    const newStatus = !isOnline;

    try {
      const result = await setCounselorOnlineStatus(
        user.id,
        user.displayName || 'Counselor',
        user.email || '',
        newStatus,
        phone,
        selectedState
      );

      if (result.success) {
        setIsOnline(newStatus);
        toast({
          title: newStatus ? '🟢 You are now online' : '⚫ You are now offline',
          description: result.message,
        });

        if (newStatus) {
          loadRequests();
        }
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Removed handleAcceptRequest and handleAcceptAppointment - chats are created automatically after payment

  // Removed getCategoryInfo and getStateName - no longer needed

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  // Show application form if needed
  if (showApplicationForm) {
    return (
      <CounselorApplication
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowApplicationForm(false);
            checkApprovalStatus();
          }
          onOpenChange(isOpen);
        }}
        onApproved={() => {
          setApprovalStatus('approved');
          setShowApplicationForm(false);
          loadConfigAndProfile();
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Counselor Dashboard
          </DialogTitle>
          <DialogDescription>
            {approvalStatus === 'approved' 
              ? 'Go online to chat with your clients'
              : 'Apply to become an approved counselor'}
          </DialogDescription>
        </DialogHeader>

        {/* Checking approval status */}
        {isCheckingApproval ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : approvalStatus === 'none' ? (
          // Not applied yet
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">Become a Counselor</p>
              <p className="text-sm text-muted-foreground mt-2">
                Apply to join Mobilaws as a legal counsel.
              </p>
              <p className="text-sm text-muted-foreground">
                Admin approval is required.
              </p>
            </div>
            <Button onClick={() => setShowApplicationForm(true)} className="w-full max-w-xs">
              Apply Now
            </Button>
          </div>
        ) : approvalStatus === 'pending' ? (
          // Pending approval
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-yellow-700">Application Pending</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your application is being reviewed by our admin team.
              </p>
              <p className="text-sm text-muted-foreground">
                You'll be able to access the dashboard once approved.
              </p>
            </div>
          </div>
        ) : approvalStatus === 'rejected' ? (
          // Rejected
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-red-700">Application Rejected</p>
              {rejectionReason && (
                <p className="text-sm text-red-600 mt-2 bg-red-50 p-3 rounded-lg max-w-sm mx-auto">
                  Reason: {rejectionReason}
                </p>
              )}
            </div>
            <Button onClick={() => setShowApplicationForm(true)} className="w-full max-w-xs">
              Apply Again
            </Button>
          </div>
        ) : (
          // Approved - show full dashboard
          <div className="flex-1 flex flex-col space-y-4 min-h-0">
            {/* Earnings Display */}
            {counselorProfile && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gross Earnings</p>
                      <p className="text-2xl font-bold text-green-700">
                        ${(counselorProfile.totalEarnings || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Total before deductions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Booking Fee</p>
                    <p className="text-sm font-semibold text-gray-700">
                      ${(counselorProfile.bookingFee || 10).toFixed(2)} per booking
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Changes Notice */}
            {counselorProfile?.pendingChanges && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-800">Pending Changes Awaiting Approval</p>
                    <div className="mt-2 space-y-1 text-sm text-yellow-700">
                      {counselorProfile.pendingChanges.bookingFee !== undefined && (
                        <p>• Booking Fee: ${counselorProfile.pendingChanges.bookingFee.toFixed(2)}</p>
                      )}
                      {counselorProfile.pendingChanges.specializations && (
                        <p>• Specializations: {counselorProfile.pendingChanges.specializations.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Profile Section */}
            {counselorProfile && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Profile Settings
                  </h3>
                  {!isEditingProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEdit}
                      disabled={!!counselorProfile.pendingChanges}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Booking Fee (USD)
                      </Label>
                      <Input
                        type="number"
                        value={editBookingFee}
                        onChange={(e) => setEditBookingFee(e.target.value)}
                        min="1"
                        step="0.01"
                        placeholder="10.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Scale className="h-4 w-4" />
                        Specializations
                      </Label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {categories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                              editSpecializations.includes(cat.id)
                                ? 'bg-primary/10 border-primary'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleSpecialization(cat.id)}
                          >
                            <input
                              type="checkbox"
                              checked={editSpecializations.includes(cat.id)}
                              onChange={() => toggleSpecialization(cat.id)}
                              className="rounded"
                            />
                            <span className="text-sm">{cat.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex-1"
                        disabled={isSubmittingChanges}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitChanges}
                        className="flex-1"
                        disabled={isSubmittingChanges}
                      >
                        {isSubmittingChanges ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Submit for Approval
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Booking Fee:</span>
                      <span className="font-semibold">${(counselorProfile.bookingFee || 10).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Specializations:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {counselorProfile.specializations?.map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Setup Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Your State
                </Label>
                <Select value={selectedState} onValueChange={setSelectedState} disabled={isOnline}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  placeholder="+211 9XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isOnline}
                />
              </div>
            </div>

            {/* Online Status Toggle */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-3">
                <div className={`h-4 w-4 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <p className="font-medium">{isOnline ? 'Online - Available for Chats' : 'Offline'}</p>
                  {counselorProfile && (
                    <p className="text-xs text-muted-foreground">
                      {counselorProfile.totalCases} total cases • {counselorProfile.completedCases} completed
                      <span className="ml-2 text-green-600 font-semibold">
                        • Gross: ${(counselorProfile.totalEarnings || 0).toFixed(2)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleToggleOnline}
                disabled={isTogglingStatus || !selectedState}
                variant={isOnline ? 'destructive' : 'default'}
                className="min-w-[120px]"
              >
                {isTogglingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Circle className="h-4 w-4 mr-2" />
                    {isOnline ? 'Go Offline' : 'Go Online'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Chats Section - Chats are created automatically after payment */}
          {isOnline && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  My Chats ({counselorChats.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Chat sessions are created automatically when clients pay. Click to open a chat.
                </p>
              </div>
              <ScrollArea className="h-[400px] border rounded-lg">
                {counselorChats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active chats</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your chat sessions will appear here once clients make payments
                    </p>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {counselorChats.map((chat) => {
                      const isDismissed = chat.status === 'dismissed' || !chat.paymentPaid;
                      return (
                        <div
                          key={chat.id}
                          className={`p-4 border rounded-lg ${
                            isDismissed
                              ? 'bg-gray-50 border-gray-200 opacity-60'
                              : 'bg-white hover:shadow-md transition-shadow cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!isDismissed) {
                              setChatSession(chat);
                              setShowChat(true);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{chat.userName}</span>
                                {isDismissed ? (
                                  <Badge variant="destructive" className="text-xs">
                                    Dismissed
                                  </Badge>
                                ) : chat.status === 'active' ? (
                                  <Badge variant="default" className="text-xs bg-green-500">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Ended
                                  </Badge>
                                )}
                              </div>
                              {chat.lastMessage && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {chat.lastMessage}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {chat.updatedAt?.toDate?.().toLocaleDateString() || 'Recently'}
                                {chat.unreadCountCounselor > 0 && (
                                  <Badge variant="default" className="ml-auto text-xs">
                                    {chat.unreadCountCounselor} new
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

            {/* Offline Message */}
            {!isOnline && (
              <div className="flex-1 flex items-center justify-center p-8 text-center border rounded-lg bg-gray-50">
                <div>
                  <Circle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600">You are offline</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Go online to start receiving chat requests from clients
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
      {chatSession && (
        <CounselChatInterface
          open={showChat}
          onOpenChange={setShowChat}
          chatSession={chatSession}
          userRole="counselor"
        />
      )}
    </Dialog>
  );
}

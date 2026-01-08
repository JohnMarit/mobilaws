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
import { Loader2, Scale, CheckCircle2, Clock, User, Circle, MapPin, Phone, Calendar, Bell, XCircle, FileText, Volume2, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getPendingCounselRequests,
  getQueuedAppointments,
  acceptCounselRequest,
  acceptQueuedAppointment,
  setCounselorOnlineStatus,
  getCounselorProfile,
  getCounselConfig,
  getCounselorApplicationStatus,
  type CounselRequest,
  type Appointment,
  type Counselor,
  type SouthSudanState,
  type LegalCategory,
} from '@/lib/counsel-service';
import { getChatByRequestId, getChatByAppointmentId, type CounselChatSession } from '@/lib/counsel-chat-service';
import { CounselorApplication } from './CounselorApplication';
import { CounselChatInterface } from './CounselChatInterface';
import { notificationSound } from '@/lib/notification-sound';

interface CounselorDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CounselorDashboard({ open, onOpenChange }: CounselorDashboardProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [counselorProfile, setCounselorProfile] = useState<Counselor | null>(null);
  const [pendingRequests, setPendingRequests] = useState<CounselRequest[]>([]);
  const [queuedAppointments, setQueuedAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [phone, setPhone] = useState('');
  const [states, setStates] = useState<SouthSudanState[]>([]);
  const [categories, setCategories] = useState<LegalCategory[]>([]);
  
  const [chatSession, setChatSession] = useState<CounselChatSession | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  // Approval status
  const [isCheckingApproval, setIsCheckingApproval] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
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
      }
    }
  };

  // Poll for requests when online
  useEffect(() => {
    if (open && isOnline) {
      loadRequests();
      pollingRef.current = setInterval(loadRequests, 5000);
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [open, isOnline]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const [requests, appointments] = await Promise.all([
        getPendingCounselRequests(),
        getQueuedAppointments(selectedState),
      ]);
      
      // Play notification sound if there are new requests (including first one)
      if (requests.length > pendingRequests.length) {
        const newCount = requests.length - pendingRequests.length;
        console.log(`🔔 ${newCount} NEW REQUEST(S) in dashboard! Playing sound...`);
        
        notificationSound.playRequestNotification();
        if (navigator?.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]); // short vibration pattern
        }
        
        toast({
          title: '🔔 Incoming Counsel Request!',
          description: `${newCount} new request(s) need attention.`,
          duration: 10000,
        });
      }
      
      // Stop ringing if no more pending requests
      if (requests.length === 0 && pendingRequests.length > 0) {
        console.log('🔕 No more pending requests, stopping sound');
        notificationSound.stopRinging();
      }
      
      setPendingRequests(requests);
      setQueuedAppointments(appointments);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSound = async () => {
    toast({
      title: '🔊 Testing Sound',
      description: 'Playing test notification...',
    });
    
    const success = await notificationSound.testSound();
    
    if (success) {
      toast({
        title: '✅ Sound Working!',
        description: 'Audio notifications are enabled. You will hear incoming requests.',
      });
    } else {
      toast({
        title: '❌ Sound Failed',
        description: 'Could not play sound. Please check browser permissions.',
        variant: 'destructive',
      });
    }
  };

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

  const handleAcceptRequest = async (request: CounselRequest) => {
    if (!user) return;

    // Stop the ringing sound
    notificationSound.stopRinging();

    try {
      const result = await acceptCounselRequest(
        request.id,
        user.id,
        user.displayName || 'Counselor',
        phone
      );

      console.log('✅ Accept result:', result);

      if (result.success) {
        toast({
          title: '✅ Request Accepted',
          description: `You accepted ${request.userName}'s request. Opening chat...`,
        });
        
        // Wait a moment for chat to be created, then fetch it
        setTimeout(async () => {
          const chat = await getChatByRequestId(request.id);
          console.log('💬 Chat fetched:', chat);
          if (chat) {
            setChatSession(chat);
            setShowChat(true);
            toast({
              title: '💬 Chat Ready',
              description: `You can now chat with ${request.userName}.`,
            });
          } else {
            console.error('❌ Chat not found for request:', request.id);
          }
        }, 1000);
        
        loadRequests();
      } else {
        toast({
          title: 'Failed',
          description: result.error || 'Request may have been accepted by someone else.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error accepting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept request.',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptAppointment = async (appointment: Appointment) => {
    if (!user) return;

    // Stop the ringing sound
    notificationSound.stopRinging();

    try {
      const result = await acceptQueuedAppointment(
        appointment.id,
        user.id,
        user.displayName || 'Counselor',
        phone
      );

      console.log('✅ Accept appointment result:', result);

      if (result.success) {
        toast({
          title: '✅ Appointment Accepted',
          description: `You accepted ${appointment.userName}'s scheduled appointment. Opening chat...`,
        });
        
        // Wait a moment for chat to be created, then fetch it
        setTimeout(async () => {
          const chat = await getChatByAppointmentId(appointment.id);
          console.log('💬 Chat fetched:', chat);
          if (chat) {
            setChatSession(chat);
            setShowChat(true);
            toast({
              title: '💬 Chat Ready',
              description: `You can now chat with ${appointment.userName}.`,
            });
          } else {
            console.error('❌ Chat not found for appointment:', appointment.id);
          }
        }, 1000);
        
        loadRequests();
      } else {
        toast({
          title: 'Failed',
          description: result.error || 'Appointment may have been accepted by someone else.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error accepting appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept appointment.',
        variant: 'destructive',
      });
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || { name: categoryId, icon: '⚖️' };
  };

  const getStateName = (stateCode: string) => {
    return states.find(s => s.code === stateCode)?.name || stateCode;
  };

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
              ? 'Go online to receive and accept counsel requests'
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
            {counselorProfile && typeof counselorProfile.totalEarnings === 'number' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-green-700">
                        ${counselorProfile.totalEarnings.toFixed(2)}
                      </p>
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
                  <p className="font-medium">{isOnline ? 'Online - Receiving Requests' : 'Offline'}</p>
                  {counselorProfile && (
                    <p className="text-xs text-muted-foreground">
                      {counselorProfile.totalCases} total cases • {counselorProfile.completedCases} completed
                      {typeof counselorProfile.totalEarnings === 'number' && (
                        <span className="ml-2 text-green-600 font-semibold">
                          • ${counselorProfile.totalEarnings.toFixed(2)} earned
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleTestSound}
                  variant="outline"
                  size="sm"
                  className="min-w-[100px]"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Test Sound
                </Button>
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
          </div>

          {/* Requests Tabs */}
          {isOnline && (
            <Tabs defaultValue="live" className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-full">
                <TabsTrigger value="live" className="flex-1">
                  <Bell className="h-4 w-4 mr-2" />
                  Live Requests ({pendingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Scheduled ({queuedAppointments.length})
                </TabsTrigger>
              </TabsList>

              {/* Live Requests */}
              <TabsContent value="live" className="flex-1 mt-2 min-h-0">
                <ScrollArea className="h-[300px] border rounded-lg">
                  {isLoading && pendingRequests.length === 0 ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No live requests</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Requests will appear here when users need help
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-3">
                      {pendingRequests.map((request) => {
                        const catInfo = getCategoryInfo(request.legalCategory);
                        return (
                          <div
                            key={request.id}
                            className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{request.userName}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {catInfo.icon} {catInfo.name}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {getStateName(request.state)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 line-clamp-2">{request.note}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(request.createdAt)}
                                  </span>
                                  {request.userPhone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {request.userPhone}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={() => handleAcceptRequest(request)}
                                size="sm"
                                className="flex-shrink-0 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Scheduled Appointments */}
              <TabsContent value="scheduled" className="flex-1 mt-2 min-h-0">
                <ScrollArea className="h-[300px] border rounded-lg">
                  {queuedAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No scheduled appointments</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Appointments from users who scheduled will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-3">
                      {queuedAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{appointment.userName}</span>
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {getStateName(appointment.state)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-2">{appointment.note}</p>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-blue-600">
                                  {appointment.scheduledDate} at {appointment.scheduledTime}
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAcceptAppointment(appointment)}
                              size="sm"
                              variant="outline"
                              className="flex-shrink-0"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}

            {/* Offline Message */}
            {!isOnline && (
              <div className="flex-1 flex items-center justify-center p-8 text-center border rounded-lg bg-gray-50">
                <div>
                  <Circle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-600">You are offline</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Go online to start receiving counsel requests
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

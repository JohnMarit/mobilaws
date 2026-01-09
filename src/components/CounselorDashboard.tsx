/**
 * Counselor Dashboard
 * WhatsApp-style interface for counselors to manage chats
 * Only accessible to admin-approved counselors
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Scale, CheckCircle2, Clock, Circle, MapPin, Phone, XCircle, FileText, DollarSign, Edit, Save, X, MessageSquare, Users } from 'lucide-react';
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
import { getGravatarUrl } from '@/lib/gravatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    if (open && isOnline && user) {
      console.log(`🔄 Starting to load chats for counselor ${user.id}`);
      loadChats();
      pollingRef.current = setInterval(() => {
        loadChats();
      }, 3000); // Poll more frequently
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [open, isOnline, user]);

  const loadChats = async () => {
    if (!user) return;
    try {
      console.log(`📡 [DASHBOARD] Fetching chats for counselor: ${user.id}`);
      const chats = await getCounselorChats(user.id);
      console.log(`📋 [DASHBOARD] Loaded ${chats.length} chats for counselor ${user.id}`);
      
      if (chats.length > 0) {
        console.log(`   📊 [DASHBOARD] Chat details:`);
        chats.forEach((chat, index) => {
          console.log(`      ${index + 1}. ${chat.userName} (${chat.status})`, {
            id: chat.id,
            lastMessage: chat.lastMessage?.substring(0, 30),
            unreadCount: chat.unreadCountCounselor,
            updatedAt: chat.updatedAt
          });
        });
      } else {
        console.warn(`   ⚠️ [DASHBOARD] No chats found for counselor ${user.id}`);
      }
      
      setCounselorChats(chats);
    } catch (error) {
      console.error('❌ [DASHBOARD] Error loading chats:', error);
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
          loadChats();
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

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Scale className="h-6 w-6" />
            Counselor Dashboard
          </DialogTitle>
          <DialogDescription>
            {approvalStatus === 'approved' 
              ? 'Manage your profile and chat with clients'
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
          <div className="py-8 px-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">Become a Counselor</p>
              <p className="text-sm text-muted-foreground mt-2">
                Apply to join Mobilaws as a legal counsel.
              </p>
            </div>
            <Button onClick={() => setShowApplicationForm(true)} className="w-full max-w-xs">
              Apply Now
            </Button>
          </div>
        ) : approvalStatus === 'pending' ? (
          // Pending approval
          <div className="py-8 px-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-yellow-700">Application Pending</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your application is being reviewed by our admin team.
              </p>
            </div>
          </div>
        ) : approvalStatus === 'rejected' ? (
          // Rejected
          <div className="py-8 px-6 text-center space-y-4">
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
          // Approved - WhatsApp-style layout
          <div className="flex-1 flex min-h-0">
            {/* Left Sidebar - Profile & Chat List */}
            <div className="w-96 border-r flex flex-col bg-gray-50">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Online Status Card */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span className="font-semibold text-sm">
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      {counselorProfile && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {counselorChats.filter(c => c.status === 'active').length} active
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="text-xs text-gray-600">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {states.find(s => s.code === selectedState)?.name || 'Select state'}
                      </div>
                      {counselorProfile && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            <DollarSign className="h-3 w-3 inline mr-1" />
                            ${(counselorProfile.bookingFee || 10).toFixed(2)}/booking
                          </span>
                          <span className="text-green-600 font-semibold">
                            ${(counselorProfile.totalEarnings || 0).toFixed(2)} earned
                          </span>
                        </div>
                      )}
                    </div>

                    {!isOnline && (
                      <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger className="h-9 text-sm mb-2">
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
                    )}
                    
                    <Button
                      onClick={handleToggleOnline}
                      disabled={isTogglingStatus || !selectedState}
                      variant={isOnline ? 'destructive' : 'default'}
                      size="sm"
                      className="w-full"
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

                  {/* Chat List */}
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          Chats ({counselorChats.length})
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadChats}
                          className="h-7 px-2 text-xs"
                        >
                          <Loader2 className="h-3 w-3 mr-1" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                    
                    {!isOnline ? (
                      <div className="p-8 text-center">
                        <Circle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Go online to see chats</p>
                      </div>
                    ) : counselorChats.length === 0 ? (
                      <div className="p-8 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No chats yet</p>
                        <p className="text-xs text-gray-400 mt-1">Waiting for clients...</p>
                      </div>
                    ) : (
                      <div className="divide-y max-h-[400px] overflow-y-auto">
                        {counselorChats.map((chat) => {
                          const isDismissed = chat.status === 'dismissed' || !chat.paymentPaid;
                          const isEnded = chat.status === 'ended';
                          const isActive = chat.status === 'active' && chat.paymentPaid;
                          const avatarUrl = getGravatarUrl(chat.userName, 40);
                          const initials = getInitials(chat.userName);
                          
                          return (
                            <div
                              key={chat.id}
                              className={`p-3 cursor-pointer transition-all hover:bg-gray-50 ${
                                chatSession?.id === chat.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                              }`}
                              onClick={() => {
                                if (!isDismissed) {
                                  setChatSession(chat);
                                  setShowChat(true);
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12 flex-shrink-0">
                                  <AvatarImage src={avatarUrl} alt={chat.userName} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold text-sm truncate">{chat.userName}</p>
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                      {formatTime(chat.updatedAt)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-1">
                                    {isDismissed ? (
                                      <Badge variant="destructive" className="text-xs h-5">
                                        Dismissed
                                      </Badge>
                                    ) : isEnded ? (
                                      <Badge variant="secondary" className="text-xs h-5">
                                        Ended
                                      </Badge>
                                    ) : (
                                      <Badge className="text-xs h-5 bg-green-500">
                                        Active
                                      </Badge>
                                    )}
                                    {chat.unreadCountCounselor > 0 && (
                                      <Badge className="text-xs h-5 bg-red-500">
                                        {chat.unreadCountCounselor}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {chat.lastMessage && (
                                    <p className="text-xs text-gray-600 truncate mt-1">
                                      {chat.lastMessage}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Profile Details */}
            <div className="flex-1 flex flex-col min-w-0">
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Earnings Card */}
                  {counselorProfile && (
                    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                            <DollarSign className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gross Earnings</p>
                            <p className="text-3xl font-bold text-green-700 mt-1">
                              ${(counselorProfile.totalEarnings || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {counselorProfile.totalCases} total • {counselorProfile.completedCases} completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-green-100">
                          <p className="text-xs text-gray-500 font-medium">Booking Fee</p>
                          <p className="text-lg font-bold text-gray-800 mt-0.5">
                            ${(counselorProfile.bookingFee || 10).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pending Changes Notice */}
                  {counselorProfile?.pendingChanges && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-yellow-800">Pending Changes Awaiting Approval</p>
                          <div className="mt-2 space-y-1 text-sm text-yellow-700">
                            {counselorProfile.pendingChanges.bookingFee !== undefined && (
                              <p>• Booking Fee: ${counselorProfile.pendingChanges.bookingFee.toFixed(2)}</p>
                            )}
                            {counselorProfile.pendingChanges.specializations && (
                              <p>• Specializations updated</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Settings */}
                  {counselorProfile && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Edit className="h-5 w-5 text-gray-600" />
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
                            <Label>Booking Fee (USD)</Label>
                            <Input
                              type="number"
                              value={editBookingFee}
                              onChange={(e) => setEditBookingFee(e.target.value)}
                              min="1"
                              step="0.01"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Specializations</Label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                              {categories.map((cat) => (
                                <label
                                  key={cat.id}
                                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                    editSpecializations.includes(cat.id)
                                      ? 'bg-primary/10 border border-primary'
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={editSpecializations.includes(cat.id)}
                                    onChange={() => toggleSpecialization(cat.id)}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{cat.name}</span>
                                </label>
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
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-gray-600">Booking Fee:</span>
                            <span className="font-semibold">${(counselorProfile.bookingFee || 10).toFixed(2)}</span>
                          </div>
                          <div className="py-2">
                            <span className="text-sm text-gray-600 block mb-2">Specializations:</span>
                            <div className="flex flex-wrap gap-2">
                              {counselorProfile.specializations?.map((spec) => (
                                <Badge key={spec} variant="secondary">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-gray-600" />
                      Location & Contact
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">State:</span>
                        <span className="font-semibold">
                          {states.find(s => s.code === selectedState)?.name || 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="font-semibold">{phone || 'Not set'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    
    {chatSession && (
      <CounselChatInterface
        open={showChat}
        onOpenChange={setShowChat}
        chatSession={chatSession}
        userRole="counselor"
      />
    )}
    </>
  );
}

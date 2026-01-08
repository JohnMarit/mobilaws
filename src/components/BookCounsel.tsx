/**
 * Book Counsel - Uber-like counsel booking interface
 * Broadcasts to all registered counselors in the user's state
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Phone, MapPin, Scale, Calendar, Clock, CheckCircle2, XCircle, Users, ShieldCheck, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getCounselConfig,
  createCounselRequest,
  scheduleBooking,
  getCounselRequest,
  cancelCounselRequest,
  getAvailableCounselors,
  type SouthSudanState,
  type LegalCategory,
  type CounselRequest,
  type Counselor,
} from '@/lib/counsel-service';
import { getApiUrl } from '@/lib/api';
import { getChatByRequestId, getChatById, type CounselChatSession } from '@/lib/counsel-chat-service';
import { CounselChatInterface } from './CounselChatInterface';
import { getGravatarUrl } from '@/lib/gravatar';

interface BookCounselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoOpenRequestId?: string; // Optional request ID to automatically open chat
}

type BookingStep = 'form' | 'broadcasting' | 'waiting' | 'schedule' | 'accepted' | 'scheduled';

export function BookCounsel({ open, onOpenChange, autoOpenRequestId }: BookCounselProps) {
  // Form state
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [category, setCategory] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  
  // UI state
  const [step, setStep] = useState<BookingStep>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [request, setRequest] = useState<CounselRequest | null>(null);
  const [availableCount, setAvailableCount] = useState(0);
  const [availableCounselors, setAvailableCounselors] = useState<Counselor[]>([]);
  const [isLoadingCounselors, setIsLoadingCounselors] = useState(false);
  const [broadcastCount, setBroadcastCount] = useState(0);
  const [countdown, setCountdown] = useState(300); // 5 minutes default
  const [chatSession, setChatSession] = useState<CounselChatSession | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  // Config
  const [states, setStates] = useState<SouthSudanState[]>([]);
  const [categories, setCategories] = useState<LegalCategory[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { userSubscription, initiatePayment } = useSubscription();
  const [selectedCounselorForPayment, setSelectedCounselorForPayment] = useState<Counselor | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load config and counselors on mount
  useEffect(() => {
    getCounselConfig().then(config => {
      setStates(config.states);
      setCategories(config.categories);
    });
  }, []);

  // Load all online counselors when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
      loadAllCounselors();
    } else {
      stopPolling();
    }
  }, [open]);

  // Auto-open chat if requestId or chatId is provided (from payment success)
  useEffect(() => {
    if (open && autoOpenRequestId) {
      const loadChat = async () => {
        try {
          // First try to get chat by ID (if it's a chatId)
          let chat = await getChatById(autoOpenRequestId);
          
          // If not found, try as requestId
          if (!chat) {
            chat = await getChatByRequestId(autoOpenRequestId);
          }
          
          if (chat) {
            setChatSession(chat);
            setShowChat(true);
            setStep('accepted');
            setRequestId(chat.requestId || autoOpenRequestId);
            
            // Load request details if we have requestId
            if (chat.requestId) {
              const req = await getCounselRequest(chat.requestId);
              if (req) {
                setRequest(req);
              }
            }
          } else {
            // Chat not created yet, wait for counselor to accept
            setRequestId(autoOpenRequestId);
            setStep('waiting');
            setCountdown(180);
            
            // Start polling for chat
            if (!pollingRef.current) {
              pollingRef.current = setInterval(async () => {
                if (!autoOpenRequestId) return;
                
                const req = await getCounselRequest(autoOpenRequestId);
                if (req) {
                  setRequest(req);
                  
                  if (req.status === 'accepted') {
                    console.log('🎉 Request accepted! Counselor:', req.counselorName);
                    setStep('accepted');
                    
                    // Load chat session
                    const chatSession = await getChatByRequestId(autoOpenRequestId);
                    if (chatSession) {
                      setChatSession(chatSession);
                      setShowChat(true);
                    }
                    
                    stopPolling();
                  }
                }
              }, 2000);
            }
          }
        } catch (error) {
          console.error('Error loading chat:', error);
        }
      };
      loadChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoOpenRequestId]);

  // Function to load all online counselors
  const loadAllCounselors = async () => {
    setIsLoadingCounselors(true);
    try {
      // Try to get all online counselors directly from API
      const apiUrl = getApiUrl('counsel/counselors/online');
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.counselors && Array.isArray(data.counselors)) {
          setAvailableCounselors(data.counselors);
          setAvailableCount(data.counselors.length);
          setIsLoadingCounselors(false);
          return;
        }
      }
      
      // Fallback: Get counselors from all states if API doesn't work
      const allCounselors: Counselor[] = [];
      if (states.length > 0) {
        for (const stateObj of states) {
          const counselors = await getAvailableCounselors(stateObj.code);
          allCounselors.push(...counselors);
        }
      }
      setAvailableCounselors(allCounselors);
      setAvailableCount(allCounselors.length);
    } catch (error) {
      console.error('Error loading counselors:', error);
    } finally {
      setIsLoadingCounselors(false);
    }
  };

  // Poll for request status when waiting
  useEffect(() => {
    if (step === 'waiting' && requestId) {
      startPolling();
      startCountdown();
    } else {
      stopPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [step, requestId]);

  const resetForm = () => {
    setNote('');
    setPhone('');
    setState('');
    setCategory('');
    setPreferredDate('');
    setPreferredTime('');
    setStep('form');
    setRequestId(null);
    setRequest(null);
    setCountdown(300);
    setBroadcastCount(0);
    setChatSession(null);
    setShowChat(false);
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    
    pollingRef.current = setInterval(async () => {
      if (!requestId) return;
      
      const req = await getCounselRequest(requestId);
      if (req) {
        setRequest(req);
        
        if (req.status === 'accepted') {
          console.log('🎉 Request accepted! Counselor:', req.counselorName);
          setStep('accepted');
          stopPolling();
          
          toast({
            title: '🎉 Counsel Found!',
            description: `${req.counselorName} has accepted your request. Opening chat...`,
          });
          
          // Fetch chat with retry logic
          let attempts = 0;
          const maxAttempts = 5;
          const fetchChat = async () => {
            attempts++;
            const chat = await getChatByRequestId(requestId);
            console.log(`💬 Chat fetch attempt ${attempts}:`, chat);
            
            if (chat) {
              setChatSession(chat);
              setShowChat(true);
              toast({
                title: '💬 Chat Ready',
                description: `You can now chat with ${req.counselorName}.`,
              });
            } else if (attempts < maxAttempts) {
              console.log(`⏳ Chat not ready yet, retrying in 1 second...`);
              setTimeout(fetchChat, 1000);
            } else {
              console.error('❌ Failed to fetch chat after', maxAttempts, 'attempts');
            }
          };
          
          // Start fetching chat after a brief delay
          setTimeout(fetchChat, 500);
          
        } else if (req.status === 'expired' || req.status === 'cancelled') {
          stopPolling();
        }
      }
    }, 3000); // Poll every 3 seconds
  };

  const startCountdown = () => {
    if (countdownRef.current) return;
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          stopPolling();
          setStep('schedule');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  // Check available counselors when state changes
  useEffect(() => {
    if (state) {
      setIsLoadingCounselors(true);
      getAvailableCounselors(state).then(counselors => {
        setAvailableCount(counselors.length);
        setAvailableCounselors(counselors);
        setIsLoadingCounselors(false);
      }).catch(() => {
        setIsLoadingCounselors(false);
      });
    } else {
      setAvailableCounselors([]);
      setAvailableCount(0);
    }
  }, [state]);

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get fee display for a counselor
  const getFeeDisplay = (counselor: Counselor): string => {
    const fee = counselor.bookingFee || 10; // Default $10
    if (userSubscription && userSubscription.isActive && !userSubscription.isFree) {
      return `$${fee.toFixed(2)} (Included in ${userSubscription.planId === 'basic' ? 'Basic' : userSubscription.planId === 'standard' ? 'Standard' : 'Premium'} Plan)`;
    }
    return `$${fee.toFixed(2)} per booking`;
  };

  const handleSelectCounselor = async (counselor: Counselor) => {
    if (!user) {
      toast({
        title: 'Please Sign In',
        description: 'You need to sign in to book a counsel.',
        variant: 'destructive',
      });
      return;
    }

    const hasActivePaidPlan =
      userSubscription &&
      userSubscription.isActive &&
      !userSubscription.isFree &&
      userSubscription.planId !== 'free';

    const bookingFee = counselor.bookingFee || 10;

    // If free tier, require payment for booking
    if (!hasActivePaidPlan) {
      setSelectedCounselorForPayment(counselor);
      setShowPaymentDialog(true);
      return;
    }

    // Use counselor's state or default to first state
    const counselorState = counselor.state || (states.length > 0 ? states[0].code : 'CES');
    const finalCategory = category || (categories.length > 0 ? categories[0].id : 'general');
    const defaultNote = `I would like to consult with ${counselor.name} about a legal matter.`;

    setIsSubmitting(true);
    setStep('broadcasting');
    setState(counselorState);
    setNote(defaultNote);

    try {
      const result = await createCounselRequest(
        user.id,
        user.name || 'User',
        user.email || '',
        phone || user.email || '',
        defaultNote,
        finalCategory,
        counselorState
      );

      if (!result.success) {
        toast({
          title: 'Request Failed',
          description: result.error || 'Failed to create request.',
          variant: 'destructive',
        });
        setStep('form');
        return;
      }

      setRequestId(result.requestId || null);
      setBroadcastCount(result.broadcastCount || 0);

      setStep('waiting');
      setCountdown(180);
      toast({
        title: result.broadcastCount > 0 ? '📡 Broadcasting Request' : 'Searching for Counselors',
        description: result.broadcastCount > 0
          ? `Your request is being sent to ${result.broadcastCount} counselor(s).`
          : 'No counselors are online yet. We will keep searching for 3 minutes before scheduling.',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    if (!preferredDate || !preferredTime) {
      toast({
        title: 'Select Date & Time',
        description: 'Please choose when you would like to meet.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    // Default category in case none selected
    const finalCategory = category || (categories.length > 0 ? categories[0].id : 'general');
    const finalPhone = phone || user.email || '';

    try {
      const result = await scheduleBooking(
        user.id,
        user.name || 'User',
        user.email || '',
        finalPhone,
        note.trim(),
        finalCategory,
        state,
        preferredDate,
        preferredTime
      );

      if (result.success) {
        setStep('scheduled');
        toast({
          title: '📅 Booking Scheduled',
          description: result.message,
        });
      } else {
        toast({
          title: 'Scheduling Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (requestId) {
      await cancelCounselRequest(requestId);
    }
    stopPolling();
    setStep('form');
    toast({
      title: 'Request Cancelled',
      description: 'Your booking request has been cancelled.',
    });
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const selectedCategory = categories.find(c => c.id === category);
  const selectedState = states.find(s => s.code === state);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Book a Counsel
          </DialogTitle>
          <DialogDescription>
            Get connected with a legal counsel in South Sudan
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Show Counselors List Directly */}
        {step === 'form' && (
          <div className="space-y-4">
            {/* Available Counselors List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <ShieldCheck className="h-4 w-4" />
                  Available Counselors
                </div>
                {availableCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {availableCount} {availableCount === 1 ? 'counselor' : 'counselors'} available
                  </Badge>
              )}
            </div>

              {isLoadingCounselors ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : availableCounselors.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {availableCounselors.map((counselor) => {
                    const primarySpecialization = counselor.specializations?.[0] || 'General Practice';
                    const statusLabel = counselor.isOnline ? 'Online' : 'Offline';
                    const initials = getInitials(counselor.name);
                    const avatarUrl = getGravatarUrl(counselor.email, 128);

                    return (
                      <Card key={counselor.id} className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleSelectCounselor(counselor)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <Avatar className="h-16 w-16 border-2 border-gray-200">
                              <AvatarImage src={avatarUrl} alt={counselor.name} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-semibold text-lg">
                                {initials}
                              </AvatarFallback>
                            </Avatar>

                            {/* Counselor Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-base text-gray-900">{counselor.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant={counselor.isOnline ? "default" : "secondary"}
                                      className={counselor.isOnline ? "bg-green-500 hover:bg-green-600" : ""}
                                    >
                                      <span className={`h-2 w-2 rounded-full mr-1.5 ${counselor.isOnline ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                                      {statusLabel}
                                    </Badge>
                                    {typeof counselor.rating === 'number' && counselor.rating > 0 ? (
                                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                        ⭐ {counselor.rating.toFixed(1)} ({counselor.completedCases || 0} reviews)
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs text-gray-500">
                                        No ratings yet
                                      </Badge>
                                    )}
                                  </div>
                                </div>
            </div>

                              <div className="space-y-1.5 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Scale className="h-4 w-4 text-primary" />
                                  <span className="font-medium">Type of Law:</span>
                                  <span>{primarySpecialization}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">Fee:</span>
                                  <span className="text-green-700 font-semibold">{getFeeDisplay(counselor)}</span>
                                </div>
                                {counselor.state && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">Location:</span>
                                    <span>{states.find(s => s.code === counselor.state)?.name || counselor.state}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <p className="text-sm font-medium text-gray-600 mb-4">
                      There are no counselors available yet
                    </p>
                  </div>
                  {/* Placeholder Cards */}
                  {[1, 2, 3].map((idx) => (
                    <Card key={`placeholder-${idx}`} className="border-2 border-dashed border-gray-300 opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Placeholder Avatar */}
                          <Avatar className="h-16 w-16 border-2 border-gray-300 bg-gray-100">
                            <AvatarFallback className="bg-gray-200 text-gray-400 font-semibold text-lg">
                              ?
                            </AvatarFallback>
                          </Avatar>

                          {/* Placeholder Info */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="bg-gray-200 text-gray-500">
                                    <span className="h-2 w-2 rounded-full mr-1.5 bg-gray-400" />
                                    Offline
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-sm">
                              <div className="flex items-center gap-2 text-gray-400">
                                <Scale className="h-4 w-4" />
                                <span className="font-medium">Type of Law:</span>
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                              </div>
                              <div className="flex items-center gap-2 text-gray-400">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-medium">Fee:</span>
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Broadcasting */}
        {step === 'broadcasting' && (
          <div className="py-12 text-center space-y-6">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-25" />
              <div className="absolute inset-2 rounded-full border-4 border-primary animate-ping opacity-25 animation-delay-200" />
              <div className="absolute inset-4 rounded-full border-4 border-primary animate-ping opacity-25 animation-delay-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Scale className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-lg font-medium">Broadcasting Request...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Notifying counselors in {selectedState?.name}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Waiting for Acceptance */}
        {step === 'waiting' && (
          <div className="py-8 text-center space-y-6">
            {/* Animated Rings */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-25" />
              <div className="absolute inset-3 rounded-full border-4 border-green-400 animate-ping opacity-25" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-6 rounded-full border-4 border-green-300 animate-ping opacity-25" style={{ animationDelay: '1s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-green-100 rounded-full p-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xl font-semibold text-green-700">Ringing Counselors...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Sent to <span className="font-bold">{broadcastCount}</span> counsel(s) in {selectedState?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedCategory?.icon} {selectedCategory?.name}
              </p>
            </div>

            {/* Countdown */}
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">Time remaining</p>
              <p className="text-3xl font-mono font-bold text-primary">{formatCountdown(countdown)}</p>
              <p className="text-xs text-gray-500 mt-1">
                You can schedule an appointment if no one accepts
              </p>
            </div>

            <Button onClick={handleCancel} variant="outline" className="w-full">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Request
            </Button>
          </div>
        )}

        {/* Step 4: Schedule Appointment */}
        {step === 'schedule' && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="font-medium text-orange-800">No Counselors Accepted</p>
              <p className="text-sm text-orange-600 mt-1">
                Schedule an appointment and a counsel will accept when available
              </p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
              <p><span className="font-medium">Location:</span> {selectedState?.name}</p>
              <p><span className="font-medium">Matter:</span> {selectedCategory?.icon} {selectedCategory?.name}</p>
              <p><span className="font-medium">Note:</span> {note.substring(0, 50)}...</p>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Preferred Date
                </Label>
                <Input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={getMinDate()}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Preferred Time
                </Label>
                <Input
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSchedule} 
                disabled={isSubmitting || !preferredDate || !preferredTime}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Schedule Appointment
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Accepted */}
        {step === 'accepted' && request && (
          <div className="py-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-semibold text-green-700">Counsel Found!</p>
              <p className="text-lg mt-2">{request.counselorName}</p>
              {request.counselorPhone && (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1">
                  <Phone className="h-4 w-4" />
                  {request.counselorPhone}
                </p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm"><span className="font-medium">Matter:</span> {selectedCategory?.name}</p>
              <p className="text-sm"><span className="font-medium">Location:</span> {selectedState?.name}</p>
              <p className="text-sm"><span className="font-medium">Your Note:</span> {note.substring(0, 100)}...</p>
            </div>

            <p className="text-sm text-muted-foreground">
              The counsel will contact you soon. Keep your phone available.
            </p>

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        )}

        {/* Step 6: Scheduled */}
        {step === 'scheduled' && (
          <div className="py-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-12 w-12 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-semibold text-blue-700">Appointment Scheduled!</p>
              <p className="text-lg mt-2">
                {preferredDate} at {preferredTime}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p>Your request has been added to the queue.</p>
              <p className="mt-2">A counsel will accept your booking and contact you.</p>
            </div>

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
      {chatSession && (
        <CounselChatInterface
          open={showChat}
          onOpenChange={setShowChat}
          chatSession={chatSession}
          userRole="user"
        />
      )}

      {/* Payment Dialog for Free Tier Users */}
      {showPaymentDialog && selectedCounselorForPayment && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Pay Booking Fee
              </DialogTitle>
              <DialogDescription>
                Pay the booking fee to consult with {selectedCounselorForPayment.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Booking Fee:</span>
                  <span className="text-lg font-bold text-green-700">
                    ${(selectedCounselorForPayment.bookingFee || 10).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This is a one-time payment for this consultation booking.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setSelectedCounselorForPayment(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const fee = selectedCounselorForPayment.bookingFee || 10;
                    
                    // Store booking details in sessionStorage for after payment
                    const bookingDetails = {
                      counselorId: selectedCounselorForPayment.id,
                      counselorName: selectedCounselorForPayment.name,
                      counselorState: selectedCounselorForPayment.state || (states.length > 0 ? states[0].code : 'CES'),
                      category: category || (categories.length > 0 ? categories[0].id : 'general'),
                      note: note || `I would like to consult with ${selectedCounselorForPayment.name} about a legal matter.`,
                      phone: phone || user?.email || '',
                      userId: user?.id || '',
                      userName: user?.name || 'User',
                      userEmail: user?.email || '',
                    };
                    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
                    
                    // Create payment link for booking fee
                    try {
                      const response = await fetch(getApiUrl('payment/create-link'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'booking',
                          amount: fee,
                          userId: user?.id,
                          counselorId: selectedCounselorForPayment.id,
                          counselorName: selectedCounselorForPayment.name,
                          userEmail: user?.email,
                          userName: user?.name,
                        }),
                      });
                      const data = await response.json();
                      if (data.paymentLink) {
                        window.location.href = data.paymentLink;
                      } else {
                        sessionStorage.removeItem('pendingBooking');
                        toast({
                          title: 'Payment Error',
                          description: data.error || 'Failed to create payment link',
                          variant: 'destructive',
                        });
                      }
                    } catch (error) {
                      sessionStorage.removeItem('pendingBooking');
                      toast({
                        title: 'Payment Error',
                        description: 'Failed to process payment. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Pay ${(selectedCounselorForPayment.bookingFee || 10).toFixed(2)}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}


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
import { Loader2, Phone, MapPin, Scale, Calendar, Clock, CheckCircle2, XCircle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
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
} from '@/lib/counsel-service';
import { getChatByRequestId, type CounselChatSession } from '@/lib/counsel-chat-service';
import { CounselChatInterface } from './CounselChatInterface';

interface BookCounselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BookingStep = 'form' | 'broadcasting' | 'waiting' | 'schedule' | 'accepted' | 'scheduled';

export function BookCounsel({ open, onOpenChange }: BookCounselProps) {
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
  const [broadcastCount, setBroadcastCount] = useState(0);
  const [countdown, setCountdown] = useState(300); // 5 minutes default
  const [chatSession, setChatSession] = useState<CounselChatSession | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  // Config
  const [states, setStates] = useState<SouthSudanState[]>([]);
  const [categories, setCategories] = useState<LegalCategory[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load config on mount
  useEffect(() => {
    getCounselConfig().then(config => {
      setStates(config.states);
      setCategories(config.categories);
    });
  }, []);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      resetForm();
    } else {
      stopPolling();
    }
  }, [open]);

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
      getAvailableCounselors(state).then(counselors => {
        setAvailableCount(counselors.length);
      });
    }
  }, [state]);

  const handleSubmit = async () => {
    if (!note.trim() || !state) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your location and describe your problem.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Please Sign In',
        description: 'You need to sign in to book a counsel.',
        variant: 'destructive',
      });
      return;
    }

    // Auto-set category to first available if not selected
    const finalCategory = category || (categories.length > 0 ? categories[0].id : 'general');

    setIsSubmitting(true);
    setStep('broadcasting');

    try {
      const result = await createCounselRequest(
        user.id,
        user.displayName || 'User',
        user.email || '',
        phone || user.email || '', // Use email if no phone
        note.trim(),
        finalCategory,
        state
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

      // Always wait/search for 3 minutes before scheduling, even if none online
      setStep('waiting');
      setCountdown(180); // 3 minutes
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
        user.displayName || 'User',
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

        {/* Step 1: Form */}
        {step === 'form' && (
          <div className="space-y-4">
            {/* State Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Your State <span className="text-red-500">*</span>
              </Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name} ({s.capital})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {availableCount > 0 
                    ? `${availableCount} counsel(s) available in ${selectedState?.name}`
                    : `No counsels online in ${selectedState?.name}`
                  }
                </p>
              )}
            </div>

            {/* Description - Simplified */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Describe Your Problem <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Please describe your legal problem or question in detail..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={8}
                className="resize-none text-base"
              />
              <p className="text-xs text-muted-foreground">
                Provide as much detail as possible to help the counsel understand your situation
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !note.trim() || !state}
              className="w-full h-12 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Finding Counsel...
                </>
              ) : (
                <>
                  <Scale className="h-5 w-5 mr-2" />
                  Find a Counsel Now
                </>
              )}
            </Button>
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
    </Dialog>
  );
}


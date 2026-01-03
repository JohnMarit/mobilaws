/**
 * Counselor Application Component
 * Allows users to apply to become a counselor
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Scale, MapPin, Phone, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getCounselConfig,
  applyCounselor,
  getCounselorApplicationStatus,
  type SouthSudanState,
} from '@/lib/counsel-service';

interface CounselorApplicationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved?: () => void;
}

export function CounselorApplication({ open, onOpenChange, onApproved }: CounselorApplicationProps) {
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [state, setState] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  
  // Config
  const [states, setStates] = useState<SouthSudanState[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load config and check existing application
  useEffect(() => {
    if (open && user) {
      loadConfig();
      checkApplicationStatus();
    }
  }, [open, user]);

  const loadConfig = async () => {
    const config = await getCounselConfig();
    setStates(config.states);
  };

  const checkApplicationStatus = async () => {
    if (!user) return;
    
    setIsChecking(true);
    try {
      const status = await getCounselorApplicationStatus(user.uid);
      
      if (status?.exists && status.status) {
        setApplicationStatus(status.status);
        if (status.rejectionReason) {
          setRejectionReason(status.rejectionReason);
        }
        if (status.status === 'approved' && onApproved) {
          onApproved();
        }
      } else {
        setApplicationStatus('none');
        // Pre-fill from user profile
        if (user.displayName) setName(user.displayName);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Please Sign In',
        description: 'You need to sign in to apply.',
        variant: 'destructive',
      });
      return;
    }

    if (!user.email) {
      toast({
        title: 'Email Required',
        description: 'Your account must have an email address to apply.',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim() || !phone.trim() || !nationalIdNumber.trim() || !state) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Submitting application:', {
      userId: user.uid,
      name: name.trim(),
      email: user.email,
      phone: phone.trim(),
      nationalIdNumber: nationalIdNumber.trim(),
      state: state,
    });

    setIsSubmitting(true);

    try {
      const result = await applyCounselor(
        user.uid,
        name.trim(),
        user.email,
        phone.trim(),
        nationalIdNumber.trim(),
        '', // ID document URL (can be added later with file upload)
        state
      );

      if (result.success) {
        setApplicationStatus('pending');
        toast({
          title: '✅ Application Submitted',
          description: result.message,
        });
      } else {
        toast({
          title: 'Application Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReapply = () => {
    setApplicationStatus('none');
    setRejectionReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Become a Counselor
          </DialogTitle>
          <DialogDescription>
            Apply to join Mobilaws as a legal counsel
          </DialogDescription>
        </DialogHeader>

        {isChecking ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : applicationStatus === 'approved' ? (
          // Already Approved
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-green-700">You're Approved!</p>
              <p className="text-sm text-muted-foreground mt-2">
                You can now access the Counselor Dashboard
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        ) : applicationStatus === 'pending' ? (
          // Pending Review
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
                We'll notify you once it's approved.
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
              Close
            </Button>
          </div>
        ) : applicationStatus === 'rejected' ? (
          // Rejected
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-red-700">Application Rejected</p>
              {rejectionReason && (
                <p className="text-sm text-red-600 mt-2 bg-red-50 p-3 rounded-lg">
                  Reason: {rejectionReason}
                </p>
              )}
            </div>
            <Button onClick={handleReapply} className="w-full">
              Apply Again
            </Button>
          </div>
        ) : (
          // Application Form
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              <p className="font-medium">Requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Valid National ID</li>
                <li>Active phone number</li>
                <li>Admin approval required</li>
              </ul>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Your full legal name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                placeholder="+211 9XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* National ID */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                National ID Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Your National ID number"
                value={nationalIdNumber}
                onChange={(e) => setNationalIdNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This will be verified by our admin team
              </p>
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
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
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !name || !phone || !nationalIdNumber || !state}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


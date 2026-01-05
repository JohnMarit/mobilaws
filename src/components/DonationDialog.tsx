/**
 * Donation Dialog - Allow users to donate any amount
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Heart, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/api';

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DonationStep = 'form' | 'processing' | 'success' | 'error';

export function DonationDialog({ open, onOpenChange }: DonationDialogProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<DonationStep>('form');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { user } = useAuth();
  const { toast } = useToast();

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setAmount(cleaned);
  };

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid donation amount.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Please Sign In',
        description: 'You need to sign in to make a donation.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setErrorMessage('');

    try {
      const response = await fetch(getApiUrl('payment/create-donation'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          userId: user.id,
          userEmail: user.email || '',
          userName: user.displayName || 'Anonymous',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create donation payment');
      }

      if (result.paymentLink) {
        setPaymentLink(result.paymentLink);
        // Redirect to payment page
        window.location.href = result.paymentLink;
      } else {
        throw new Error('No payment link received');
      }
    } catch (error) {
      console.error('Error creating donation:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process donation');
      setStep('error');
      toast({
        title: 'Donation Failed',
        description: error instanceof Error ? error.message : 'Failed to process donation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (step !== 'processing') {
      setAmount('');
      setStep('form');
      setPaymentLink(null);
      setErrorMessage('');
      onOpenChange(false);
    }
  };

  // Quick amount buttons
  const quickAmounts = [5, 10, 25, 50, 100];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Make a Donation
          </DialogTitle>
          <DialogDescription>
            Support Mobilaws by making a donation. Any amount is appreciated!
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Form */}
        {step === 'form' && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold">
                Donation Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-8 text-lg h-12"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter any amount you'd like to donate
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick Amounts</Label>
              <div className="grid grid-cols-5 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    className={amount === quickAmount.toString() ? 'bg-primary text-primary-foreground' : ''}
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Your donation helps us:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Maintain and improve our services</li>
                <li>Support legal education initiatives</li>
                <li>Keep the platform accessible to everyone</li>
              </ul>
            </div>

            <Button
              onClick={handleDonate}
              disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
              className="w-full h-12 text-lg"
            >
              <Heart className="h-5 w-5 mr-2" />
              Donate ${amount || '0.00'}
            </Button>
          </div>
        )}

        {/* Step 2: Processing */}
        {step === 'processing' && (
          <div className="py-12 text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div>
              <p className="text-lg font-medium">Processing Your Donation...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to secure payment page...
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Error */}
        {step === 'error' && (
          <div className="py-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-red-700">Donation Failed</p>
              <p className="text-sm text-muted-foreground mt-2">
                {errorMessage || 'An error occurred. Please try again.'}
              </p>
            </div>
            <Button onClick={() => setStep('form')} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


import React, { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
}

interface PaymentFormProps {
  planId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ planId, onSuccess, onError }: PaymentFormProps) {
  const { plans, initiatePayment, isLoading } = useSubscription();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const plan = plans.find(p => p.id === planId);

  useEffect(() => {
    if (plan) {
      // Create payment link when component mounts
      initiatePayment(planId).then(result => {
        if (result.success && result.paymentLink) {
          setPaymentLink(result.paymentLink);
          setPaymentId(result.paymentId || null);
        } else {
          onError(result.error || 'Failed to initialize payment');
        }
      });
    }
  }, [plan, planId, initiatePayment, onError]);

  const handleRedirectToPayment = () => {
    if (paymentLink) {
      // Redirect to Dodo Payments checkout
      window.location.href = paymentLink;
    } else {
      onError('Payment link not available. Please try again.');
    }
  };

  if (!plan) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Plan not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">{plan.name} Plan</span>
              <span className="text-lg font-bold">${plan.price}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>{plan.tokens} AI Tokens</span>
              <span>Valid for 30 days</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center font-medium">
                <span>Total</span>
                <span className="text-lg">${plan.price}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            You will be redirected to Dodo Payments to complete your purchase securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50 text-center">
              <CreditCard className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-700 font-medium">Secure Payment</p>
              <p className="text-xs text-gray-600 mt-1">Powered by Dodo Payments</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500" />
              <span>Secure payment processing</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500" />
              <span>Multiple payment methods supported</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleRedirectToPayment}
          disabled={isLoading || !paymentLink || isProcessing}
          className="flex-1"
        >
          {isLoading || !paymentLink ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Preparing Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Continue to Payment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function PaymentModal({ isOpen, onClose, planId }: PaymentModalProps) {
  const { plans, verifyPayment } = useSubscription();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plan = plans.find(p => p.id === planId);

  const handleSuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      onClose();
      setPaymentSuccess(false);
      setPaymentError(null);
    }, 2000);
  };

  const handleError = (error: string) => {
    setPaymentError(error);
    toast.error(error);
  };

  const handleClose = () => {
    if (!paymentSuccess) {
      onClose();
      setPaymentError(null);
    }
  };

  // Check for payment success in URL parameters (when redirected back from Dodo Payments)
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentId = urlParams.get('payment_id');
      const status = urlParams.get('status');
      
      if (paymentId && status === 'success') {
        // Verify payment and show success
        verifyPayment(paymentId).then(success => {
          if (success) {
            handleSuccess();
          } else {
            handleError('Payment verification failed. Please contact support.');
          }
        });
      } else if (status === 'cancel') {
        handleError('Payment was cancelled.');
      }
    }
  }, [isOpen, verifyPayment]);

  if (!plan) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Your Purchase
          </DialogTitle>
          <DialogDescription>
            You're about to purchase the {plan.name} plan for ${plan.price}
          </DialogDescription>
        </DialogHeader>

        {paymentSuccess ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Successful!</h3>
            <p className="text-green-600">
              Your {plan.name} plan has been activated. You now have {plan.tokens} tokens available.
            </p>
          </div>
        ) : (
          <>
            {paymentError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Payment Error</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{paymentError}</p>
              </div>
            )}

            <PaymentForm
              planId={planId}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from 'react';
// STRIPE COMMENTED OUT - Disabled for now
// import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
// import {
//   Elements,
//   CardElement,
//   useStripe,
//   useElements
// } from '@stripe/react-stripe-js';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// STRIPE COMMENTED OUT - Disabled for now
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key');

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
  // STRIPE COMMENTED OUT - Disabled for now
  // const stripe = useStripe();
  // const elements = useElements();
  const { plans, initiatePayment, verifyPayment, isLoading } = useSubscription();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const plan = plans.find(p => p.id === planId);

  // STRIPE COMMENTED OUT - Disabled for now
  // useEffect(() => {
  //   if (plan && stripe && elements) {
  //     // Create payment intent when component mounts
  //     initiatePayment(planId).then(result => {
  //       if (result.success && result.clientSecret) {
  //         setClientSecret(result.clientSecret);
  //       } else {
  //         onError(result.error || 'Failed to initialize payment');
  //       }
  //     });
  //   }
  // }, [plan, stripe, elements, planId, initiatePayment, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    onError('Payment processing is currently disabled. Please contact support.');
    // STRIPE COMMENTED OUT - Disabled for now
    // if (!stripe || !elements || !clientSecret) {
    //   return;
    // }
    // ... rest of Stripe payment code commented out
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
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Enter your card details to complete the purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* STRIPE COMMENTED OUT - Disabled for now */}
            <div className="p-4 border rounded-lg bg-gray-50 text-center">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Payment processing is currently disabled.</p>
              <p className="text-xs text-gray-500 mt-1">Please contact support for subscription options.</p>
            </div>
            {/* <div className="p-4 border rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500" />
              <span>Secure payment powered by Stripe</span>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={true}
          className="flex-1"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Payment Disabled
        </Button>
      </div>
    </form>
  );
}

export default function PaymentModal({ isOpen, onClose, planId }: PaymentModalProps) {
  const { plans } = useSubscription();
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

  if (!plan) {
    return null;
  }

  // STRIPE COMMENTED OUT - Disabled for now
  // const options: StripeElementsOptions = {
  //   mode: 'payment',
  //   amount: plan.price * 100, // Convert to cents
  //   currency: 'usd',
  // };

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

            {/* STRIPE COMMENTED OUT - Disabled for now */}
            {/* <Elements stripe={stripePromise} options={options}> */}
              <PaymentForm
                planId={planId}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            {/* </Elements> */}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

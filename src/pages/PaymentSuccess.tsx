import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment, refreshSubscription } = useSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const maxPolls = 30; // 30 attempts = 60 seconds
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get payment reference from URL (Paystack uses 'reference' parameter)
    const reference = searchParams.get('reference') || searchParams.get('payment_id') || searchParams.get('session_id');
    
    if (!reference) {
      setVerificationError('No payment reference found in URL');
      setIsVerifying(false);
      return;
    }

    console.log(`🔍 Processing payment success for reference: ${reference}`);

    // Polling function to check if webhook has processed the payment
    const pollForSubscription = async () => {
      try {
        setPollingCount(prev => prev + 1);
        
        // Refresh subscription data from backend
        await refreshSubscription();
        
        // Try to verify payment (this will check if webhook already processed it)
        const success = await verifyPayment(reference);
        
        if (success) {
          console.log('✅ Subscription activated successfully');
          setIsVerified(true);
          setIsVerifying(false);
          
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Polling error:', error);
        return false;
      }
    };

    // Start immediate check
    pollForSubscription().then(verified => {
      if (verified) return;
      
      // If not verified immediately, start polling every 2 seconds
      pollingIntervalRef.current = setInterval(async () => {
        if (pollingCount >= maxPolls) {
          // Timeout after 60 seconds
          setVerificationError(
            'Payment processing is taking longer than expected. Your subscription may still be activating. Please check back in a few minutes or contact support if you were charged.'
          );
          setIsVerifying(false);
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return;
        }
        
        const verified = await pollForSubscription();
        if (verified && pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }, 2000); // Poll every 2 seconds
    });

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [searchParams, verifyPayment, refreshSubscription]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isVerifying ? (
            <>
              <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <CardTitle>Processing Your Subscription...</CardTitle>
              <CardDescription>
                Please wait while we activate your subscription. This usually takes a few seconds.
              </CardDescription>
              {pollingCount > 5 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Still processing... ({pollingCount}/{maxPolls})</span>
                </div>
              )}
            </>
          ) : isVerified ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Subscription Activated!</CardTitle>
              <CardDescription>
                Your monthly subscription has been successfully activated. Your tokens are ready to use!
              </CardDescription>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-red-800">Processing Delayed</CardTitle>
              <CardDescription>
                {verificationError || 'Unable to verify payment'}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isVerified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Your tokens have been added to your account. You can now use the AI legal assistant.
              </p>
            </div>
          )}
          
          {verificationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                {verificationError}
              </p>
              <p className="text-xs text-red-600 mt-2">
                If you were charged, please contact support with your payment ID.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/')}
              className="flex-1"
              variant={isVerified ? "default" : "outline"}
            >
              {isVerified ? 'Start Using Tokens' : 'Go Home'}
            </Button>
            {!isVerified && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


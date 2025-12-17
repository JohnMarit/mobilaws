import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment, refreshSubscription } = useSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    
    if (!paymentId) {
      setVerificationError('No payment ID found in URL');
      setIsVerifying(false);
      return;
    }

    // Verify payment with backend
    verifyPayment(paymentId)
      .then(success => {
        if (success) {
          setIsVerified(true);
          // Refresh subscription to get updated token count
          refreshSubscription();
        } else {
          setVerificationError('Payment verification failed. Please contact support if you were charged.');
        }
      })
      .catch(error => {
        console.error('Payment verification error:', error);
        setVerificationError('An error occurred during verification. Please contact support.');
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [searchParams, verifyPayment, refreshSubscription]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isVerifying ? (
            <>
              <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <CardTitle>Verifying Payment...</CardTitle>
              <CardDescription>
                Please wait while we verify your payment
              </CardDescription>
            </>
          ) : isVerified ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Payment Successful!</CardTitle>
              <CardDescription>
                Your subscription has been activated successfully
              </CardDescription>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-red-800">Verification Failed</CardTitle>
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


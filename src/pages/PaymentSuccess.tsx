import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import { createCounselRequest } from '@/lib/counsel-service';
import { getChatByRequestId } from '@/lib/counsel-chat-service';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment, refreshSubscription } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const maxPolls = 30; // 30 attempts = 60 seconds
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get payment reference from URL (Paystack uses 'reference' parameter)
    const reference = searchParams.get('reference') || searchParams.get('payment_id') || searchParams.get('session_id');
    const paymentType = searchParams.get('type'); // 'booking' or subscription
    
    if (!reference) {
      setVerificationError('No payment reference found in URL');
      setIsVerifying(false);
      return;
    }

    console.log(`🔍 Processing payment success for reference: ${reference}, type: ${paymentType || 'subscription'}`);

    // Polling function to check if webhook has processed the payment
    const pollForSubscription = async () => {
      try {
        setPollingCount(prev => prev + 1);
        
        // Refresh subscription data from backend
        await refreshSubscription();
        
        // Try to verify payment (this will check if webhook already processed it)
        const success = await verifyPayment(reference);
        
        if (success) {
          if (paymentType === 'booking') {
            console.log('✅ Booking payment verified successfully');
            setIsVerified(true);
            setIsVerifying(false);
            
            // Stop polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            // Create counsel request automatically
            const pendingBooking = sessionStorage.getItem('pendingBooking');
            if (pendingBooking && user) {
              try {
                setIsCreatingRequest(true);
                const bookingDetails = JSON.parse(pendingBooking);
                
                const result = await createCounselRequest(
                  bookingDetails.userId || user.id,
                  bookingDetails.userName || user.name || 'User',
                  bookingDetails.userEmail || user.email || '',
                  bookingDetails.phone || user.email || '',
                  bookingDetails.note,
                  bookingDetails.category,
                  bookingDetails.counselorState
                );
                
                if (result.success && result.requestId) {
                  // Clear pending booking
                  sessionStorage.removeItem('pendingBooking');
                  
                  // Wait a moment for chat to be created, then get it
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  // Get chat session - try multiple times as it may take a moment to create
                  let chatSession = await getChatByRequestId(result.requestId);
                  let attempts = 0;
                  while (!chatSession && attempts < 5) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    chatSession = await getChatByRequestId(result.requestId);
                    attempts++;
                  }
                  
                  if (chatSession) {
                    // Navigate to home with chat open directly
                    navigate(`/?openChat=${chatSession.id}`);
                  } else {
                    // Navigate to home, chat will be created when counselor accepts
                    navigate(`/?openChat=${result.requestId}`);
                  }
                  
                  toast({
                    title: 'Booking Created',
                    description: 'Your consultation request has been created. A counselor will contact you soon.',
                  });
                } else {
                  toast({
                    title: 'Payment Successful',
                    description: 'Your payment was verified. You can now book a counselor from the home page.',
                    variant: 'default',
                  });
                  navigate('/');
                }
              } catch (error) {
                console.error('Error creating counsel request:', error);
                toast({
                  title: 'Payment Successful',
                  description: 'Your payment was verified. You can now book a counselor from the home page.',
                  variant: 'default',
                });
                navigate('/');
              } finally {
                setIsCreatingRequest(false);
              }
            } else {
              // No pending booking, just redirect
              navigate('/');
            }
          } else {
            console.log('✅ Subscription activated successfully');
            setIsVerified(true);
            setIsVerifying(false);
          }
          
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
              <CardTitle>
                {searchParams.get('type') === 'booking' ? 'Processing Your Payment...' : 'Processing Your Subscription...'}
              </CardTitle>
              <CardDescription>
                {searchParams.get('type') === 'booking' 
                  ? 'Please wait while we verify your payment and create your booking. This usually takes a few seconds.'
                  : 'Please wait while we activate your subscription. This usually takes a few seconds.'}
              </CardDescription>
              {isCreatingRequest && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating your consultation request...</span>
                </div>
              )}
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
              <CardTitle className="text-green-800">
                {searchParams.get('type') === 'booking' ? 'Payment Successful!' : 'Subscription Activated!'}
              </CardTitle>
              <CardDescription>
                {searchParams.get('type') === 'booking' 
                  ? 'Your booking payment has been verified. You can now proceed with your consultation.'
                  : 'Your monthly subscription has been successfully activated. Your tokens are ready to use!'}
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


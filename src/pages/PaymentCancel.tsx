import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft } from 'lucide-react';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-yellow-800">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              You can return to purchase a subscription plan at any time.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/')}
              className="flex-1"
              variant="default"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return Home
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
            >
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


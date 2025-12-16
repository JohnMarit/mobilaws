import React, { useState } from 'react';
import { useSubscription, SubscriptionPlan } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check, Crown, Zap, Star, CreditCard, RefreshCw } from 'lucide-react';
import PaymentModal from './PaymentModal';

interface SubscriptionManagerProps {
  onClose?: () => void;
}

export default function SubscriptionManager({ onClose }: SubscriptionManagerProps) {
  const { plans, userSubscription, purchasePlan, isLoading, refreshSubscription } = useSubscription();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePurchase = async (planId: string) => {
    setSelectedPlan(planId);
    const success = await purchasePlan(planId);
    if (success) {
      // Show success message or redirect
      console.log('Purchase successful!');
    }
    setSelectedPlan(null);
  };

  const handlePaymentPurchase = (planId: string) => {
    setSelectedPlanForPayment(planId);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setSelectedPlanForPayment(null);
    // Refresh subscription data
    window.location.reload(); // Simple refresh for now
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSubscription();
      console.log('✅ Subscription refreshed successfully');
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic':
        return <Zap className="h-6 w-6" />;
      case 'standard':
        return <Star className="h-6 w-6" />;
      case 'premium':
        return <Crown className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'basic':
        return 'border-blue-200 bg-blue-50';
      case 'standard':
        return 'border-purple-200 bg-purple-50';
      case 'premium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Please log in to view subscription options.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Get access to premium legal AI assistance with our flexible token-based plans.
        </p>
      </div>

      {/* Current Subscription Status */}
      {userSubscription && (
        <Card className="mb-4 sm:mb-6 border-green-200 bg-green-50">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-green-800 text-base sm:text-lg flex-1 min-w-0">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Current Plan: {plans.find(p => p.id === userSubscription.planId)?.name}</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-shrink-0 h-8 w-8 p-0"
                title="Refresh token balance"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Tokens Remaining</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">{userSubscription.tokensRemaining}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Tokens Used</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-700">{userSubscription.tokensUsed}</p>
              </div>
            </div>
            {userSubscription.expiryDate && (
              <p className="text-xs sm:text-sm text-gray-600 mt-3">
                Expires: {new Date(userSubscription.expiryDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${getPlanColor(plan.id)} ${
              plan.popular ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-xs whitespace-nowrap">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center p-4 sm:p-6">
              <div className="flex justify-center mb-2">
                {getPlanIcon(plan.id)}
              </div>
              <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
              <div className="mt-3 sm:mt-4">
                <span className="text-2xl sm:text-3xl font-bold">${plan.price}</span>
                <span className="text-sm sm:text-base text-gray-600">/month</span>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="p-4 sm:p-6 pt-0 sm:pt-0">
              <Button 
                className="w-full text-sm sm:text-base"
                onClick={() => handlePaymentPurchase(plan.id)}
                disabled={isLoading || selectedPlan === plan.id}
                variant={plan.popular ? "default" : "outline"}
              >
                {isLoading && selectedPlan === plan.id ? (
                  'Processing...'
                ) : userSubscription?.planId === plan.id ? (
                  'Current Plan'
                ) : (
                  <>
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Purchase {plan.name}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">How it works:</h3>
        <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
          <li>• Each AI query uses 1 token</li>
          <li>• Tokens don't expire until your subscription period ends</li>
          <li>• You can upgrade or purchase additional tokens anytime</li>
          <li>• All plans include access to our full legal document database</li>
        </ul>
      </div>

      {onClose && (
        <div className="mt-4 sm:mt-6 text-center pb-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto min-w-[120px]"
          >
            Close
          </Button>
        </div>
      )}

      {/* Payment Modal */}
      {selectedPlanForPayment && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPlanForPayment(null);
          }}
          planId={selectedPlanForPayment}
        />
      )}
    </div>
  );
}

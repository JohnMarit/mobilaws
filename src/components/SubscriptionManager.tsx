import React, { useState } from 'react';
import { useSubscription, SubscriptionPlan } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';

interface SubscriptionManagerProps {
  onClose?: () => void;
}

export default function SubscriptionManager({ onClose }: SubscriptionManagerProps) {
  const { plans, userSubscription, purchasePlan, isLoading } = useSubscription();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    setSelectedPlan(planId);
    const success = await purchasePlan(planId);
    if (success) {
      // Show success message or redirect
      console.log('Purchase successful!');
    }
    setSelectedPlan(null);
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
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">
          Get access to premium legal AI assistance with our flexible token-based plans.
        </p>
      </div>

      {/* Current Subscription Status */}
      {userSubscription && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Check className="h-5 w-5" />
              Current Plan: {plans.find(p => p.id === userSubscription.planId)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tokens Remaining</p>
                <p className="text-2xl font-bold text-green-700">{userSubscription.tokensRemaining}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tokens Used</p>
                <p className="text-2xl font-bold text-gray-700">{userSubscription.tokensUsed}</p>
              </div>
            </div>
            {userSubscription.expiryDate && (
              <p className="text-sm text-gray-600 mt-2">
                Expires: {new Date(userSubscription.expiryDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${getPlanColor(plan.id)} ${
              plan.popular ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-500">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {getPlanIcon(plan.id)}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => handlePurchase(plan.id)}
                disabled={isLoading || selectedPlan === plan.id}
                variant={plan.popular ? "default" : "outline"}
              >
                {isLoading && selectedPlan === plan.id ? (
                  'Processing...'
                ) : userSubscription?.planId === plan.id ? (
                  'Current Plan'
                ) : (
                  `Purchase ${plan.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Each AI query uses 1 token</li>
          <li>• Tokens don't expire until your subscription period ends</li>
          <li>• You can upgrade or purchase additional tokens anytime</li>
          <li>• All plans include access to our full legal document database</li>
        </ul>
      </div>

      {onClose && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

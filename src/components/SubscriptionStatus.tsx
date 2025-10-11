import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Crown, Zap, Star, CreditCard } from 'lucide-react';

interface SubscriptionStatusProps {
  onManageSubscription?: () => void;
  compact?: boolean;
}

export default function SubscriptionStatus({ onManageSubscription, compact = false }: SubscriptionStatusProps) {
  const { userSubscription, plans } = useSubscription();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic':
        return <Zap className="h-4 w-4" />;
      case 'standard':
        return <Star className="h-4 w-4" />;
      case 'premium':
        return <Crown className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'standard':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Show free plan badge if user has free plan
  if (userSubscription && userSubscription.isFree) {
    return (
      <div className={`flex flex-col gap-2 ${compact ? 'text-sm' : ''}`}>
        <Badge variant="outline" className="bg-green-700 text-green-200 border-green-600 text-xs">
          Free Plan: {userSubscription.tokensRemaining}/{userSubscription.totalTokens} tokens
        </Badge>
        {onManageSubscription && (
          <Button
            variant="outline"
            size="sm"
            onClick={onManageSubscription}
            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-500 w-full"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        )}
      </div>
    );
  }

  if (!userSubscription || !userSubscription.isActive) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
          No Plan
        </Badge>
        {onManageSubscription && (
          <Button
            variant="outline"
            size="sm"
            onClick={onManageSubscription}
            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Get Plan
          </Button>
        )}
      </div>
    );
  }

  const plan = plans.find(p => p.id === userSubscription.planId);
  const usagePercentage = (userSubscription.tokensUsed / userSubscription.totalTokens) * 100;

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-700 text-purple-100 border-purple-600 flex items-center gap-1">
            {getPlanIcon(userSubscription.planId)}
            {plan?.name}
          </Badge>
          <span className="text-xs text-gray-300">
            {userSubscription.tokensRemaining} left
          </span>
        </div>
        {onManageSubscription && (
          <Button
            variant="outline"
            size="sm"
            onClick={onManageSubscription}
            className="h-7 px-3 text-xs bg-gray-700 hover:bg-gray-600 text-white border-gray-600 w-full"
          >
            Manage
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${getPlanColor(userSubscription.planId)} flex items-center gap-1`}>
            {getPlanIcon(userSubscription.planId)}
            {plan?.name} Plan
          </Badge>
          {onManageSubscription && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageSubscription}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Manage
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tokens Used</span>
          <span className="font-medium">
            {userSubscription.tokensUsed} / {userSubscription.totalTokens}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              usagePercentage > 80 ? 'bg-red-500' :
              usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span>Remaining: {userSubscription.tokensRemaining}</span>
          <span>{Math.round(usagePercentage)}% used</span>
        </div>

        {userSubscription.expiryDate && (
          <div className="text-xs text-gray-500 pt-1 border-t">
            Expires: {new Date(userSubscription.expiryDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

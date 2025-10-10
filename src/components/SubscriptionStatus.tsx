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
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <Badge variant="outline" className="bg-green-100 text-green-600 border-green-300">
          Free Plan - {userSubscription.tokensRemaining}/{userSubscription.totalTokens} tokens today
        </Badge>
        {onManageSubscription && (
          <Button
            variant="outline"
            size="sm"
            onClick={onManageSubscription}
            className="h-6 px-2 text-xs"
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
        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
          No Plan
        </Badge>
        {onManageSubscription && (
          <Button
            variant="outline"
            size="sm"
            onClick={onManageSubscription}
            className="h-6 px-2 text-xs"
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
      <div className="flex items-center gap-2">
        <Badge className={`${getPlanColor(userSubscription.planId)} flex items-center gap-1`}>
          {getPlanIcon(userSubscription.planId)}
          {plan?.name}
        </Badge>
        <span className="text-sm text-gray-600">
          {userSubscription.tokensRemaining} tokens left
        </span>
        {onManageSubscription && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onManageSubscription}
            className="h-6 px-2 text-xs"
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

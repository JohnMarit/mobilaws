import { useState } from 'react';
import { User, LogOut, Settings, MessageSquare, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import SupportDialog from './SupportDialog';
import MyTickets from './MyTickets';

interface UserProfileNavProps {
  onManageSubscription?: () => void;
  compact?: boolean;
}

export default function UserProfileNav({ onManageSubscription, compact = false }: UserProfileNavProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { userSubscription } = useSubscription();
  const { setShowLoginModal, promptCount, maxPrompts, dailyTokensUsed, maxDailyTokens } = usePromptLimit();
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [ticketsDialogOpen, setTicketsDialogOpen] = useState(false);

  // Show nothing while auth is loading (prevents flickering and premature sign-in prompts)
  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    return (
      <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 px-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.picture} alt={user.name} />
                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                  {user.name?.charAt(0) || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
              {!compact && (
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500">
                    {userSubscription?.isActive 
                      ? userSubscription.planId === 'free' 
                        ? 'Free Plan'
                        : userSubscription.planId === 'admin_granted'
                        ? 'Granted Tokens'
                        : `${userSubscription.planId.charAt(0).toUpperCase() + userSubscription.planId.slice(1)} Plan`
                      : 'Free Plan'
                    }
                  </span>
                </div>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem>
            <User className="h-4 w-4 mr-2" />
            Profile
          </DropdownMenuItem>
          {onManageSubscription && (
            <DropdownMenuItem onClick={onManageSubscription}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Subscription
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSupportDialogOpen(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Support
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTicketsDialogOpen(true)}>
            <Inbox className="h-4 w-4 mr-2" />
            My Tickets
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Support Dialogs */}
      <SupportDialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen} />
      <MyTickets open={ticketsDialogOpen} onOpenChange={setTicketsDialogOpen} />
    </>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowLoginModal(true)}
      className="h-8 px-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    >
      <User className="h-4 w-4 mr-2" />
      <span className="text-sm">
        Sign In
      </span>
    </Button>
  );
}

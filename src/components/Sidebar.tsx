import { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  User, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  Edit3,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import SubscriptionStatus from './SubscriptionStatus';

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  chatHistory: ChatHistory[];
  currentChatId?: string;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onManageSubscription?: () => void;
}

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  chatHistory,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  isMobileOpen = false,
  onMobileClose,
  onManageSubscription
}: SidebarProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { userSubscription } = useSubscription();
  const { setShowLoginModal } = usePromptLimit();
  const [editingTitle, setEditingTitle] = useState('');

  const handleRenameStart = (chat: ChatHistory) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleRenameSave = () => {
    if (editingChatId && editingTitle.trim()) {
      onRenameChat(editingChatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleRenameCancel = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`flex flex-col h-screen bg-gray-900 text-white transition-all duration-300 border-r border-gray-700 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        isMobileOpen 
          ? 'fixed inset-y-0 left-0 z-50 md:relative md:inset-auto' 
          : 'hidden md:flex'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <img src="/whitelogo.png" alt="Mobilaws Logo" className="h-6 w-6" />
            <span className="font-semibold text-white">Mobilaws</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full bg-transparent border border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500 transition-colors"
          size="sm"
        >
          {isCollapsed ? (
            <Plus className="h-4 w-4" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              New chat
            </>
          )}
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className={`group relative rounded-lg p-2 cursor-pointer transition-colors ${
                currentChatId === chat.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              {editingChatId === chat.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSave();
                      if (e.key === 'Escape') handleRenameCancel();
                    }}
                    onBlur={handleRenameSave}
                    className="flex-1 bg-transparent text-white text-sm border-none outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {isCollapsed ? (
                      <div className="flex items-center justify-center">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-medium truncate">
                          {chat.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(chat.timestamp)}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!isCollapsed && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-70 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleRenameStart(chat);
                        }}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* User Profile Section - Fixed at bottom */}
      <div className="mt-auto border-t border-gray-700 px-4 py-3">
        {isAuthenticated && user ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-2 h-auto text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.picture} alt={user.name} />
                      <AvatarFallback className="bg-gray-700 text-white text-xs">
                        {user.name?.charAt(0) || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-gray-400">
                          {userSubscription?.isActive ? `${userSubscription.planId} Plan` : 'Free Plan'}
                        </div>
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
                <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Subscription Status */}
            {!isCollapsed && onManageSubscription && (
              <div className="mt-3">
                <SubscriptionStatus 
                  compact={true}
                  onManageSubscription={onManageSubscription}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Not signed in</div>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                setShowLoginModal(true);
              }}
            >
              Sign In
            </Button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

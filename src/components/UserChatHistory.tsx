/**
 * User Chat History Component
 * Shows user's past and active chats with counselors
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Clock, DollarSign, Ban } from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { getUserChats, type CounselChatSession } from '@/lib/counsel-chat-service';
import { getGravatarUrl } from '@/lib/gravatar';
import { CounselChatInterface } from './CounselChatInterface';
import { reactivateChatSession } from '@/lib/counsel-chat-service';
import { useToast } from '@/hooks/use-toast';

interface UserChatHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChat?: (chatId: string) => void;
}

export function UserChatHistory({ open, onOpenChange, onOpenChat }: UserChatHistoryProps) {
  const [chats, setChats] = useState<CounselChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<CounselChatSession | null>(null);
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      loadChats();
      // Poll for updates every 5 seconds
      const interval = setInterval(loadChats, 5000);
      return () => clearInterval(interval);
    }
  }, [open, user]);

  const loadChats = async () => {
    if (!user) return;
    
    // Only show loading on initial load
    if (chats.length === 0) {
      setIsLoading(true);
    }
    
    try {
      console.log(`📡 [USER HISTORY] Loading chats for user: ${user.id}`);
      const userChats = await getUserChats(user.id);
      console.log(`📋 [USER HISTORY] Loaded ${userChats.length} chats`);
      
      // Sort by updatedAt (most recent first)
      userChats.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.updatedAt || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.updatedAt || 0;
        return bTime - aTime;
      });
      setChats(userChats);
    } catch (error) {
      console.error('❌ [USER HISTORY] Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = async (chat: CounselChatSession) => {
    // If chat is dismissed, try to reactivate it
    if (chat.status === 'dismissed' || !chat.paymentPaid) {
      const confirmed = window.confirm(
        'This chat has been dismissed. Would you like to pay again to reactivate it?'
      );
      if (confirmed) {
        // Navigate to payment or booking
        onOpenChange(false);
        if (onOpenChat) {
          onOpenChat(chat.id);
        }
        return;
      }
    }

    setSelectedChat(chat);
    setShowChat(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (chat: CounselChatSession) => {
    if (chat.status === 'dismissed' || !chat.paymentPaid) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Ban className="h-3 w-3 mr-1" />
          Dismissed
        </Badge>
      );
    }
    if (chat.status === 'active') {
      return (
        <Badge variant="default" className="text-xs bg-green-500">
          Active
        </Badge>
      );
    }
    if (chat.status === 'ended') {
      return (
        <Badge variant="secondary" className="text-xs">
          Ended
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              My Chats
            </DialogTitle>
            <DialogDescription>
              Your conversation history with counselors
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 pb-6">
            {isLoading && chats.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No chats yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start a conversation by booking a counselor
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {chats.map((chat) => {
                  const avatarUrl = getGravatarUrl(chat.counselorEmail || chat.counselorName, 64);
                  const isDismissed = chat.status === 'dismissed' || !chat.paymentPaid;

                  return (
                    <div
                      key={chat.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isDismissed
                          ? 'bg-gray-50 border-gray-200 opacity-60'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => handleOpenChat(chat)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={avatarUrl} alt={chat.counselorName} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {chat.counselorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sm truncate">{chat.counselorName}</p>
                            {getStatusBadge(chat)}
                          </div>
                          {chat.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {chat.lastMessage}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(chat.updatedAt || chat.lastMessageAt)}
                            </span>
                            {chat.unreadCountUser > 0 && (
                              <Badge variant="default" className="ml-auto text-xs">
                                {chat.unreadCountUser} new
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedChat && (
        <CounselChatInterface
          open={showChat}
          onOpenChange={(open) => {
            setShowChat(open);
            if (!open) {
              setSelectedChat(null);
              loadChats(); // Reload to update unread counts
            }
          }}
          chatSession={selectedChat}
          userRole="user"
        />
      )}
    </>
  );
}


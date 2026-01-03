/**
 * Counsel Chat Interface
 * Real-time chat between users and counselors
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Phone, Video, X } from 'lucide-react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  sendChatMessage,
  subscribeToMessages,
  markMessagesAsRead,
  endChatSession,
  type ChatMessage,
  type CounselChatSession,
} from '@/lib/counsel-chat-service';
import { notificationSound } from '@/lib/notification-sound';

interface CounselChatInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatSession: CounselChatSession | null;
  userRole: 'user' | 'counselor';
}

export function CounselChatInterface({
  open,
  onOpenChange,
  chatSession,
  userRole,
}: CounselChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Subscribe to real-time messages
  useEffect(() => {
    if (!chatSession || !open) return;

    const unsubscribe = subscribeToMessages(chatSession.id, (newMessages) => {
      // Play sound for new messages from other party
      if (newMessages.length > messages.length) {
        const latestMessage = newMessages[newMessages.length - 1];
        if (latestMessage.senderRole !== userRole) {
          notificationSound.playMessageNotification();
        }
      }
      
      setMessages(newMessages);
      
      // Mark messages as read
      if (user) {
        markMessagesAsRead(chatSession.id, user.id, userRole);
      }
    });

    return () => unsubscribe();
  }, [chatSession, open, userRole, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatSession || !user) return;

    setIsSending(true);
    try {
      const success = await sendChatMessage(
        chatSession.id,
        user.id,
        user.name || 'User',
        userRole,
        newMessage.trim()
      );

      if (success) {
        setNewMessage('');
      } else {
        toast({
          title: 'Failed to send message',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleEndChat = async () => {
    if (!chatSession) return;

    const confirmed = window.confirm('Are you sure you want to end this chat session?');
    if (!confirmed) return;

    const success = await endChatSession(chatSession.id);
    if (success) {
      toast({
        title: 'Chat Ended',
        description: 'The chat session has been ended.',
      });
      onOpenChange(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chatSession) return null;

  const otherPartyName = userRole === 'user' ? chatSession.counselorName : chatSession.userName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{otherPartyName}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {chatSession.status === 'active' ? '🟢 Active' : '⚫ Ended'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" title="Voice Call">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="Video Call">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={handleEndChat} title="End Chat">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderRole === userRole;
              const isSystemMessage = message.messageType === 'system';

              if (isSystemMessage) {
                return (
                  <div key={message.id} className="flex justify-center">
                    <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {message.message}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold mb-1">{message.senderName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Input */}
        {chatSession.status === 'active' && (
          <div className="px-6 py-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSending}
              />
              <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


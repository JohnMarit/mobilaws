/**
 * Counsel Chat Interface
 * Real-time chat between users and counselors
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Phone, Video, X, Star, Ban, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  sendChatMessage,
  subscribeToMessages,
  markMessagesAsRead,
  endChatSession,
  dismissChatSession,
  getChatMessages,
  type ChatMessage,
  type CounselChatSession,
} from '@/lib/counsel-chat-service';
import { submitRating, getUserRatingForCounselor, type CounselorRating } from '@/lib/counselor-ratings-service';

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
  const [isDismissing, setIsDismissing] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [userRating, setUserRating] = useState<CounselorRating | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user's existing rating
  useEffect(() => {
    if (chatSession && user && userRole === 'user') {
      getUserRatingForCounselor(chatSession.counselorId, user.id).then(setUserRating);
    }
  }, [chatSession, user, userRole]);

  // Load initial messages and subscribe to real-time updates
  useEffect(() => {
    if (!chatSession || !open) {
      console.log('⚠️ Not subscribing: chatSession=', !!chatSession, 'open=', open);
      setMessages([]);
      return;
    }

    console.log(`📡 [${userRole.toUpperCase()}] Setting up message subscription for chat: ${chatSession.id}`);
    console.log(`   - Chat details:`, {
      id: chatSession.id,
      userName: chatSession.userName,
      counselorName: chatSession.counselorName,
      status: chatSession.status,
    });
    
    // Load initial messages first
    const loadInitialMessages = async () => {
      try {
        console.log(`📥 [${userRole.toUpperCase()}] Loading initial messages for chat ${chatSession.id}...`);
        const initialMessages = await getChatMessages(chatSession.id, 50);
        console.log(`✅ [${userRole.toUpperCase()}] Loaded ${initialMessages.length} initial messages:`, initialMessages);
        setMessages(initialMessages);
      } catch (error) {
        console.error(`❌ [${userRole.toUpperCase()}] Error loading initial messages:`, error);
      }
    };
    
    loadInitialMessages();
    
    // Subscribe to real-time updates
    console.log(`🔔 [${userRole.toUpperCase()}] Subscribing to real-time messages for chat ${chatSession.id}...`);
    const unsubscribe = subscribeToMessages(chatSession.id, (newMessages) => {
      console.log(`📨 [${userRole.toUpperCase()}] Real-time update received: ${newMessages.length} messages in chat ${chatSession.id}`);
      console.log(`   - Messages:`, newMessages.map(m => ({
        id: m.id,
        sender: m.senderName,
        role: m.senderRole,
        message: m.message.substring(0, 30),
        time: m.createdAt
      })));
      setMessages(newMessages);
      
      // Mark messages as read
      if (user) {
        markMessagesAsRead(chatSession.id, user.id, userRole).catch(err => {
          console.error('❌ Error marking messages as read:', err);
        });
      }
    });

    return () => {
      console.log(`🔌 [${userRole.toUpperCase()}] Unsubscribing from chat ${chatSession.id}`);
      unsubscribe();
    };
  }, [chatSession?.id, open, userRole, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatSession || !user) {
      console.log('⚠️ Cannot send message:', { hasMessage: !!newMessage.trim(), hasChat: !!chatSession, hasUser: !!user });
      return;
    }

    // Check if chat is ended
    if (chatSession.status === 'ended') {
      toast({
        title: 'Chat Ended',
        description: 'This chat has been ended. You cannot send new messages.',
        variant: 'destructive',
      });
      return;
    }

    // Check if chat is dismissed or payment not paid
    if (chatSession.status === 'dismissed' || !chatSession.paymentPaid) {
      toast({
        title: 'Chat Inactive',
        description: 'This chat has been dismissed. Please pay again to continue.',
        variant: 'destructive',
      });
      return;
    }

    console.log(`📤 Sending message in chat ${chatSession.id} as ${userRole}:`, newMessage.trim());
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
        console.log(`✅ Message sent successfully in chat ${chatSession.id}`);
        setNewMessage('');
      } else {
        console.error(`❌ Failed to send message in chat ${chatSession.id}`);
        toast({
          title: 'Failed to send message',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleEndChat = async () => {
    if (!chatSession) return;

    // Only counselor can end the chat
    if (userRole !== 'counselor') {
      toast({
        title: 'Cannot End Chat',
        description: 'Only the counselor can end the chat session.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm('Are you sure you want to end this chat session? The user will no longer be able to send messages.');
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

  const handleDismissChat = async () => {
    if (!chatSession || !user) return;

    const confirmed = window.confirm(
      'Are you sure you want to dismiss this chat? The user will need to pay again to continue.'
    );
    if (!confirmed) return;

    setIsDismissing(true);
    try {
      const success = await dismissChatSession(chatSession.id, user.id);
      if (success) {
        toast({
          title: 'Chat Dismissed',
          description: 'The chat has been dismissed. User needs to pay again to continue.',
        });
        onOpenChange(false);
      } else {
        toast({
          title: 'Failed to Dismiss',
          description: 'Could not dismiss the chat. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsDismissing(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!chatSession || !user || rating === 0) return;

    setIsSubmittingRating(true);
    try {
      const result = await submitRating(
        chatSession.counselorId,
        user.id,
        user.name || 'User',
        rating,
        ratingComment,
        chatSession.id
      );

      if (result.success) {
        toast({
          title: 'Rating Submitted',
          description: 'Thank you for your feedback!',
        });
        setShowRatingDialog(false);
        setRating(0);
        setRatingComment('');
        // Reload user rating
        const updatedRating = await getUserRatingForCounselor(chatSession.counselorId, user.id);
        setUserRating(updatedRating);
      } else {
        toast({
          title: 'Failed to Submit Rating',
          description: result.error || 'Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chatSession) return null;

  const otherPartyName = userRole === 'user' ? chatSession.counselorName : chatSession.userName;
  const isDismissed = chatSession.status === 'dismissed' || !chatSession.paymentPaid;
  const canSendMessages = chatSession.status === 'active' && chatSession.paymentPaid;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{otherPartyName}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {isDismissed ? '🔴 Dismissed - Payment Required' : 
                   chatSession.status === 'active' ? '🟢 Active' : '⚫ Ended'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {userRole === 'counselor' && chatSession.status === 'active' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={handleDismissChat}
                      disabled={isDismissing}
                      title="Dismiss Chat (requires user to pay again)"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={handleEndChat} title="End Chat (permanently closes chat)">
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {chatSession.status !== 'active' && (
                  <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-3" />
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            ) : (
              messages.map((message) => {
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
              })
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        {chatSession.status === 'ended' ? (
          <div className="px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-700 mb-2 flex items-center gap-2">
              <X className="h-4 w-4" />
              This chat has been ended. You can view the history but cannot send new messages.
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline" size="sm">
              Close
            </Button>
          </div>
        ) : canSendMessages ? (
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
        ) : isDismissed && userRole === 'user' ? (
          <div className="px-6 py-4 border-t bg-yellow-50">
            <p className="text-sm text-yellow-800 mb-2">
              This chat has been dismissed. Please pay again to continue the conversation.
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline" size="sm">
              Close
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>

    {/* Rating Dialog */}
    {userRole === 'user' && (
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rate {chatSession?.counselorName}</DialogTitle>
            <DialogDescription>
              How would you rate your experience with this counselor?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-2 transition-colors ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div className="space-y-2">
                <Label htmlFor="comment">Optional Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Share your experience..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRatingDialog(false);
                  setRating(0);
                  setRatingComment('');
                }}
                className="flex-1"
                disabled={isSubmittingRating}
              >
                Skip
              </Button>
              <Button
                onClick={handleSubmitRating}
                disabled={rating === 0 || isSubmittingRating}
                className="flex-1"
              >
                {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}


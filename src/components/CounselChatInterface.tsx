/**
 * Counsel Chat Interface
 * Real-time chat between users and counselors
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Phone, Video, X, Star, Ban, Loader2, Trash2 } from 'lucide-react';
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
import { getGravatarUrl } from '@/lib/gravatar';
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
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user's existing rating
  useEffect(() => {
    if (chatSession && user && userRole === 'user') {
      getUserRatingForCounselor(chatSession.counselorId, user.id).then(setUserRating);
    }
  }, [chatSession, user, userRole]);

  // Load initial messages, subscribe, and fallback poll to ensure delivery
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
    
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    // Load initial messages first
    const loadInitialMessages = async () => {
      try {
        console.log(`📥 [${userRole.toUpperCase()}] Loading initial messages for chat ${chatSession.id}...`);
        const initialMessages = await getChatMessages(chatSession.id, 50);
        console.log(`✅ [${userRole.toUpperCase()}] Loaded ${initialMessages.length} initial messages`);
        setMessages(initialMessages);
      } catch (error) {
        console.error(`❌ [${userRole.toUpperCase()}] Error loading initial messages:`, error);
      }
    };
    
    loadInitialMessages();
    
    // Subscribe to real-time updates
    console.log(`🔔 [${userRole.toUpperCase()}] Subscribing to real-time messages for chat ${chatSession.id}...`);
    const unsubscribe = subscribeToMessages(chatSession.id, (newMessages) => {
      console.log(`📨 [${userRole.toUpperCase()}] Real-time update: ${newMessages.length} messages in chat ${chatSession.id}`);
      setMessages(newMessages);
      
      // Mark messages as read
      if (user) {
        markMessagesAsRead(chatSession.id, user.id, userRole).catch(err => {
          console.error('❌ Error marking messages as read:', err);
        });
      }
    });

    // Fallback polling every 3s in case real-time listener fails
    fallbackInterval = setInterval(async () => {
      try {
        const polled = await getChatMessages(chatSession.id, 50);
        setMessages(prev => {
          // If new messages differ in length or last id, update
          const prevLast = prev.at(-1)?.id;
          const newLast = polled.at(-1)?.id;
          if (prev.length !== polled.length || prevLast !== newLast) {
            console.log(`🔁 [${userRole.toUpperCase()}] Fallback poll updated messages (${polled.length})`);
            return polled;
          }
          return prev;
        });
      } catch (err) {
        console.error('❌ [POLL] Error fetching messages:', err);
      }
    }, 3000);

    return () => {
      console.log(`🔌 [${userRole.toUpperCase()}] Unsubscribing from chat ${chatSession.id}`);
      unsubscribe();
      if (fallbackInterval) clearInterval(fallbackInterval);
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

    // ONLY dismiss blocks messaging - closed status does NOT block
    if (chatSession.status === 'dismissed' || !chatSession.paymentPaid) {
      toast({
        title: 'Chat Dismissed',
        description: 'This chat has been dismissed. You cannot send messages.',
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

  const handleCloseChat = async () => {
    if (!chatSession) return;

    // Only counselor can close the chat
    if (userRole !== 'counselor') {
      toast({
        title: 'Cannot Close Chat',
        description: 'Only the counselor can close the chat session.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm('Are you sure you want to close this chat session?');
    if (!confirmed) return;

    const success = await endChatSession(chatSession.id);
    if (success) {
      toast({
        title: 'Chat Closed',
        description: 'The chat session has been closed.',
      });
      onOpenChange(false);
    }
  };

  const handleDismissChat = async () => {
    if (!chatSession || !user) return;

    const confirmed = window.confirm(
      'Are you sure you want to dismiss this chat? The user will be blocked from sending messages.'
    );
    if (!confirmed) return;

    setIsDismissing(true);
    try {
      const success = await dismissChatSession(chatSession.id, user.id);
      if (success) {
        toast({
          title: 'Chat Dismissed',
          description: 'The chat has been dismissed. User is blocked from messaging.',
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

  const handleDeleteSelected = async () => {
    if (selectedMessages.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedMessages.size} message(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      // Delete messages from backend
      const apiUrl = `${window.location.origin}/api/counsel/chat/${chatSession.id}/messages/delete`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: Array.from(selectedMessages) }),
      });

      if (response.ok) {
        toast({
          title: 'Messages Deleted',
          description: `${selectedMessages.size} message(s) have been deleted.`,
        });
        setSelectedMessages(new Set());
        setIsSelectionMode(false);
        // Messages will be updated via real-time listener
      } else {
        toast({
          title: 'Failed to Delete',
          description: 'Could not delete messages. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete messages.',
        variant: 'destructive',
      });
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelection = new Set(selectedMessages);
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId);
    } else {
      newSelection.add(messageId);
    }
    setSelectedMessages(newSelection);
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
  const otherPartyEmail = userRole === 'user' ? chatSession.counselorEmail : chatSession.userEmail;
  // Use email for gravatar, fallback to name if email not available
  const otherPartyAvatar = otherPartyEmail 
    ? getGravatarUrl(otherPartyEmail, 40) 
    : getGravatarUrl(otherPartyName, 40);
  const myEmail = userRole === 'user' ? chatSession.userEmail : chatSession.counselorEmail;
  const myAvatar = myEmail 
    ? getGravatarUrl(myEmail, 40) 
    : getGravatarUrl(user?.name || 'User', 40);
  
  // Debug: Log email availability
  if (!otherPartyEmail && userRole === 'counselor') {
    console.warn(`⚠️ Chat ${chatSession.id} missing userEmail for ${chatSession.userName}`);
  }
  const isDismissed = chatSession.status === 'dismissed' || !chatSession.paymentPaid;
  // Only dismiss should block messaging, not ended status
  const canSendMessages = chatSession.paymentPaid && !isDismissed;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherPartyAvatar} alt={otherPartyName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                    {getInitials(otherPartyName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle>{otherPartyName}</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {isDismissed ? '🔴 Dismissed' : 
                     chatSession.status === 'active' ? '🟢 Active' : '⚫ Closed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {userRole === 'counselor' && !isDismissed && (
                  <>
                    {isSelectionMode ? (
                      <>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleDeleteSelected}
                          disabled={selectedMessages.size === 0}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete ({selectedMessages.size})
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setIsSelectionMode(false);
                            setSelectedMessages(new Set());
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setIsSelectionMode(true)}
                          title="Delete Messages"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={handleDismissChat}
                          disabled={isDismissing}
                          title="Dismiss Chat (blocks user from messaging)"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </>
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
                const isSelected = selectedMessages.has(message.id);
                const messageAvatar = isOwnMessage ? myAvatar : otherPartyAvatar;
                const messageInitials = isOwnMessage ? getInitials(user?.name || 'Me') : getInitials(otherPartyName);

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
                    className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                      isSelectionMode ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => isSelectionMode && userRole === 'counselor' && toggleMessageSelection(message.id)}
                  >
                    {!isOwnMessage && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={messageAvatar} alt={message.senderName} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs">
                          {messageInitials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isSelected
                          ? 'ring-2 ring-red-500'
                          : isOwnMessage
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
                    {isOwnMessage && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={messageAvatar} alt="You" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                          {messageInitials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        {canSendMessages ? (
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
        ) : isDismissed ? (
          <div className="px-6 py-4 border-t bg-red-50">
            <p className="text-sm text-red-800 mb-2 flex items-center gap-2">
              <Ban className="h-4 w-4" />
              This chat has been dismissed. You cannot send messages.
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


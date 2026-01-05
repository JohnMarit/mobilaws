import { useState, useEffect } from 'react';
import { Loader2, Menu, Heart, GraduationCap, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import UserProfileNav from '@/components/UserProfileNav';
import { useChatContext } from '@/contexts/ChatContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import { conversationalLawSearch } from '@/lib/search';
import { useToast } from '@/hooks/use-toast';
import CountrySelector from '@/components/CountrySelector';
import { BookCounsel } from '@/components/BookCounsel';
import { DonationDialog } from '@/components/DonationDialog';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showBookCounsel, setShowBookCounsel] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const { toast } = useToast();
  const {
    chatHistory,
    currentChatId,
    addChat,
    selectChat,
    deleteChat,
    renameChat
  } = useChatContext();
  const { setShowSubscriptionModal } = usePromptLimit();

  // Close mobile sidebar when chat is selected
  const handleSelectChat = (chatId: string) => {
    // selectChat will automatically use currentChatId to clean up empty chats
    selectChat(chatId);
    setIsMobileSidebarOpen(false);
  };

  // Initialize the conversational search system
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing law search system...');
        await conversationalLawSearch.initialize();
        console.log('✅ Chatbot initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize chatbot:', error);
        // Don't show error toast immediately - let the app load anyway
        console.warn('⚠️ Continuing without law data - app will still work');
      } finally {
        setIsLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Law search initialization timeout - continuing anyway');
      setIsLoading(false);
    }, 5000); // 5 second timeout

    initializeApp().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [toast]);


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading Law Data...</p>
        </div>
      </div>
    );
  }

  const handleNewChat = () => {
    addChat('New Chat');
    // addChat will automatically clean up the previous empty chat
    setIsMobileSidebarOpen(false);
  };

  const handleMobileShowDonation = () => {
    setShowDonationDialog(true);
  };

  const handleMobileOpenLearningPath = () => {
    window.dispatchEvent(new Event('open-learning-path'));
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar - Hidden on mobile by default */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        chatHistory={chatHistory}
        currentChatId={currentChatId || undefined}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        onManageSubscription={() => setShowSubscriptionModal(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-screen lg:h-auto overflow-hidden">
        {/* Mobile Header - Only visible on mobile and tablet */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span className="font-medium text-sm">Mobilaws</span>
            <CountrySelector className="text-xs" />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookCounsel(true)}
              className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              title="Book a Counsel"
            >
              <Scale className="h-4 w-4" />
            </Button>
            <UserProfileNav
              onManageSubscription={() => setShowSubscriptionModal(true)}
              compact={true}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMobileShowDonation}
              className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              title="Donate"
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMobileOpenLearningPath}
              className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              title="Learning Paths"
            >
              <GraduationCap className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ChatInterface
          onShowDonation={handleMobileShowDonation}
        />
      </div>

      {/* Book Counsel Dialog */}
      <BookCounsel open={showBookCounsel} onOpenChange={setShowBookCounsel} />
      
      {/* Donation Dialog */}
      <DonationDialog open={showDonationDialog} onOpenChange={setShowDonationDialog} />
    </div>
  );
};

export default Index;

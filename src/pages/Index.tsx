import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Menu, MessageSquare, Search, FileText, GraduationCap } from 'lucide-react';
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
import DocumentDrafting from '@/components/DocumentDrafting';
import LegalResearch from '@/components/LegalResearch';
import DocumentUpload from '@/components/DocumentUpload';
import ContractComparison from '@/components/ContractComparison';
import OCRConverter from '@/components/OCRConverter';
import DocumentTranslator from '@/components/DocumentTranslator';
import TemplateGenerator from '@/components/TemplateGenerator';
import AssistantModeSelector from '@/components/AssistantModeSelector';
import SubscriptionManager from '@/components/SubscriptionManager';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showBookCounsel, setShowBookCounsel] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string>('chat');
  const [mobileHeaderLogoFailed, setMobileHeaderLogoFailed] = useState(false);
  const { toast } = useToast();
  
  // Check for openChat/chatId/requestId query parameters (from payment success)
  const [autoOpenRequestId, setAutoOpenRequestId] = useState<string | undefined>();
  
  useEffect(() => {
    const openChat = searchParams.get('openChat');
    const openBookCounsel = searchParams.get('openBookCounsel');
    const chatId = searchParams.get('chatId');
    const requestId = searchParams.get('requestId');
    const bookingCreated = searchParams.get('bookingCreated');
    
    if (openBookCounsel === 'true') {
      // Open BookCounsel dialog with chatId or requestId
      if (chatId) {
        setAutoOpenRequestId(chatId);
      } else if (requestId) {
        setAutoOpenRequestId(requestId);
      }
      setShowBookCounsel(true);
      // Clear the query params
      setSearchParams({});
    } else if (openChat) {
      setAutoOpenRequestId(openChat);
      setShowBookCounsel(true);
      // Clear the query params
      setSearchParams({});
    } else if (bookingCreated) {
      setShowBookCounsel(true);
      // Clear the query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);
  const {
    chatHistory,
    currentChatId,
    addChat,
    selectChat,
    deleteChat,
    renameChat
  } = useChatContext();
  const { showSubscriptionModal, setShowSubscriptionModal } = usePromptLimit();

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
    // Switch to chat feature first
    setActiveFeature('chat');
    // Then create a new chat
    addChat('New Chat');
    // addChat will automatically clean up the previous empty chat
    setIsMobileSidebarOpen(false);
  };

  const handleMobileShowDonation = () => {
    setShowDonationDialog(true);
  };

  return (
    <div className="h-screen bg-brand-gradient-subtle flex overflow-hidden">
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
        activeFeature={activeFeature}
        onFeatureSelect={(feature) => {
          setActiveFeature(feature);
          setIsMobileSidebarOpen(false);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-screen lg:h-auto overflow-hidden">
        {/* Mobile Header - Only visible on mobile and tablet */}
        <div className="lg:hidden flex items-center justify-between px-3 py-2.5 border-b border-primary/10 bg-white/80 backdrop-blur-xl backdrop-saturate-150 sticky top-0 z-50 shadow-sm shadow-brand-sm/25 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="h-9 w-9 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md shadow-brand-sm overflow-hidden ring-2 ring-primary/20">
                {!mobileHeaderLogoFailed ? (
                  <img
                    src="/whitelogo.png"
                    alt=""
                    className="h-5 w-5 object-contain"
                    onError={() => setMobileHeaderLogoFailed(true)}
                  />
                ) : (
                  <span className="text-primary-foreground text-xs font-bold">M</span>
                )}
              </div>
              <span className="font-semibold text-sm text-gray-900 tracking-tight">Mobilaws</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <CountrySelector className="text-xs" />
            <UserProfileNav
              onManageSubscription={() => setShowSubscriptionModal(true)}
              compact={true}
            />
          </div>
        </div>

        {/* Feature content — add bottom padding on mobile for the nav bar */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16 lg:pb-0">
          {activeFeature === 'chat' && (
            <ChatInterface
              onShowDonation={handleMobileShowDonation}
            />
          )}
          {activeFeature === 'draft' && <DocumentDrafting />}
          {activeFeature === 'research' && <LegalResearch />}
          {activeFeature === 'upload' && <DocumentUpload />}
          {activeFeature === 'compare' && <ContractComparison />}
          {activeFeature === 'ocr' && <OCRConverter />}
          {activeFeature === 'translate' && <DocumentTranslator />}
          {activeFeature === 'templates' && <TemplateGenerator />}
          {activeFeature === 'mode' && (
            <AssistantModeSelector
              onSavedGoToStudy={() => {
                setActiveFeature('chat');
                setTimeout(() => {
                  window.dispatchEvent(new Event('open-learning-path'));
                }, 80);
              }}
            />
          )}
        </div>

        {/* Sticky Mobile Bottom Navigation */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl backdrop-saturate-150 border-t border-primary/10 shadow-[0_-4px_24px_-4px_rgba(37,99,235,0.12)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          aria-label="Main navigation"
        >
          <div className="flex items-stretch">
            {[
              { id: 'chat',     icon: MessageSquare, label: 'Chat' },
              { id: 'research', icon: Search,        label: 'Search' },
              { id: 'draft',    icon: FileText,      label: 'Draft' },
              { id: 'mode',     icon: GraduationCap, label: 'Learn' },
            ].map(({ id, icon: Icon, label }) => {
              const active = activeFeature === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveFeature(id)}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] touch-manipulation transition-colors ${
                    active
                      ? 'text-primary'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-0.5 bg-primary rounded-full" aria-hidden />
                  )}
                  <Icon className={`h-6 w-6 ${active ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
                  <span className={`text-[10px] font-semibold ${active ? 'text-primary' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Book Counsel Dialog */}
      <BookCounsel 
        open={showBookCounsel} 
        onOpenChange={(open) => {
          setShowBookCounsel(open);
          if (!open) {
            setAutoOpenRequestId(undefined);
          }
        }}
        autoOpenRequestId={autoOpenRequestId}
      />
      
      {/* Donation Dialog */}
      <DonationDialog open={showDonationDialog} onOpenChange={setShowDonationDialog} />

      {/* Subscription Modal - available from all features (chat, draft, research, etc.) */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b px-3 py-3 sm:px-4 sm:py-4 flex justify-between items-center shadow-sm z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-2">Subscription Plans</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-shrink-0 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                aria-label="Close"
              >
                <span className="text-xl text-gray-600">✕</span>
              </Button>
            </div>
            <SubscriptionManager onClose={() => setShowSubscriptionModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

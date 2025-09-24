import { useState, useEffect } from 'react';
import { Loader2, FileText, MessageSquare, Menu, HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import { useChatContext } from '@/contexts/ChatContext';
import { conversationalLawSearch } from '@/lib/search';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { 
    chatHistory, 
    currentChatId, 
    addChat, 
    selectChat, 
    deleteChat, 
    renameChat 
  } = useChatContext();

  // Close mobile sidebar when chat is selected
  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    setIsMobileSidebarOpen(false);
  };

  // Initialize the conversational search system
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await conversationalLawSearch.initialize();
        console.log('Chatbot initialized successfully');
      } catch (error) {
        console.error('Failed to initialize chatbot:', error);
        toast({
          title: "Error loading law data",
          description: "Failed to load law data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
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
    const newChatId = addChat('New Chat');
    // The chat context will automatically set this as currentChatId
    // and the ChatInterface will reset to show the welcome screen
    setIsMobileSidebarOpen(false);
  };

  const handleMobileShowHelp = () => {
    // This will be handled by the ChatInterface component
  };

  const handleMobileClearChat = () => {
    // This will be handled by the ChatInterface component
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
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile Header - Only visible on mobile */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-200 bg-white sticky top-0 z-30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/mobilogo.png" alt="Mobilaws Logo" className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-gray-900">Mobilaws</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMobileShowHelp}
              className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMobileClearChat}
              className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ChatInterface 
          onShowHelp={handleMobileShowHelp}
          onClearChat={handleMobileClearChat}
        />
      </div>
    </div>
  );
};

export default Index;

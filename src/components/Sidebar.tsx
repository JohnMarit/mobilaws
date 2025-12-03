import { useState } from 'react';
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import SubscriptionStatus from './SubscriptionStatus';
import DeleteChatDialog from './DeleteChatDialog';
import { useToast } from '@/hooks/use-toast';

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
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatHistory | null>(null);
  const { toast } = useToast();

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

  const handleDeleteClick = (chat: ChatHistory) => {
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (chatToDelete) {
      onDeleteChat(chatToDelete.id);
      toast({
        title: 'Chat deleted',
        description: `"${chatToDelete.title}" has been deleted.`,
      });
      setChatToDelete(null);
    }
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div className={`flex flex-col h-screen bg-gray-900 text-white transition-all duration-300 border-r border-gray-700 ${isCollapsed ? 'w-16' : 'w-64'
        } ${isMobileOpen
          ? 'fixed inset-y-0 left-0 z-50 lg:relative lg:inset-auto'
          : 'hidden lg:flex'
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
                className={`group relative rounded-lg p-2 cursor-pointer transition-colors ${currentChatId === chat.id
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

                    {/* Dropdown menu - LARGE and VISIBLE for real mobile devices */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`
                            h-10 w-10 min-w-[44px] min-h-[44px] p-2
                            md:h-8 md:w-8 md:min-w-0 md:min-h-0 md:p-1.5
                            opacity-100 
                            bg-gray-600 hover:bg-gray-500
                            transition-colors 
                            rounded-lg
                            flex items-center justify-center
                            shadow-md
                            z-10
                            ${isCollapsed ? 'ml-0' : 'ml-2'}
                          `}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-5 w-5 md:h-4 md:w-4 text-white font-bold" />
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
                            handleDeleteClick(chat);
                          }}
                          className="text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Subscription Status Section - Fixed at bottom */}
        {!isCollapsed && onManageSubscription && (
          <div className="mt-auto border-t border-gray-700 px-4 py-3 bg-gray-900">
            <SubscriptionStatus
              compact={true}
              onManageSubscription={onManageSubscription}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteChatDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        chatTitle={chatToDelete?.title || ''}
      />
    </>
  );
}

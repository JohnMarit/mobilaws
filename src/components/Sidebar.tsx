import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  MoreHorizontal,
  FileText,
  Search,
  Upload,
  GitCompare,
  Scan,
  Languages,
  FileCode,
  User,
  ChevronDown,
  ChevronUp,
  Gavel,
  Award,
  FileSearch,
} from 'lucide-react';
import { loadCourtSessions, deleteCourtSession, type CourtSessionRecord } from '@/lib/court-simulator/session-history';
import { useCourtSimulator } from '@/contexts/CourtSimulatorContext';
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
  activeFeature?: string;
  onFeatureSelect?: (feature: string) => void;
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
  onManageSubscription,
  activeFeature = 'chat',
  onFeatureSelect
}: SidebarProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatHistory | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [contextMenuChatId, setContextMenuChatId] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [courtSessions, setCourtSessions] = useState<CourtSessionRecord[]>([]);
  const [showCourtSessions, setShowCourtSessions] = useState(true);
  const { toast } = useToast();
  const { dispatch } = useCourtSimulator();

  // Load court sessions from localStorage and refresh when new ones are saved
  useEffect(() => {
    const refresh = () => setCourtSessions(loadCourtSessions());
    refresh();
    window.addEventListener('court_session_saved', refresh);
    return () => window.removeEventListener('court_session_saved', refresh);
  }, []);

  const handleDeleteCourtSession = (session: CourtSessionRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCourtSession(session.id);
    toast({ title: 'Session deleted', description: 'Court session removed from history.' });
  };

  const handleViewCourtSession = (session: CourtSessionRecord) => {
    if (!session.evaluation) {
      toast({ 
        title: 'Report unavailable', 
        description: 'This session was saved without full evaluation data.',
        variant: 'destructive'
      });
      return;
    }

    dispatch({
      type: 'RESTORE_SESSION',
      sessionId: session.id,
      evaluation: session.evaluation,
      transcript: session.transcript,
      interruptions: session.interruptions || [],
      emotionTimeline: session.emotionTimeline || [],
      elapsedSeconds: session.durationSeconds,
      userRole: session.userRole as any,
      userName: session.userName,
    });
  };

  const gradeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'text-green-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    if (grade === 'D') return 'text-orange-400';
    return 'text-red-400';
  };

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

  // Long press handlers for mobile
  const handleTouchStart = (chat: ChatHistory, e: React.TouchEvent) => {
    const timer = setTimeout(() => {
      // Long press detected - open context menu
      setContextMenuChatId(chat.id);
      // Trigger vibration if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Right-click context menu for desktop
  const handleContextMenu = (chat: ChatHistory, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuChatId(chat.id);
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

        {/* Feature Navigation */}
        <div className="px-2 pb-2 border-b border-gray-700">
          <div className="space-y-1">
            {(() => {
              const features = [
                { id: 'chat', icon: MessageSquare, label: 'AI Legal Chat' },
                { id: 'draft', icon: FileText, label: 'Document Drafting' },
                { id: 'research', icon: Search, label: 'Legal Research' },
                { id: 'upload', icon: Upload, label: 'Document Upload' },
                { id: 'compare', icon: GitCompare, label: 'Compare Contracts' },
                { id: 'ocr', icon: Scan, label: 'OCR Converter' },
                { id: 'translate', icon: Languages, label: 'Translate Documents' },
                { id: 'templates', icon: FileCode, label: 'Legal Templates' },
                { id: 'mode', icon: User, label: 'Assistant Mode' },
              ];

              const visibleFeatures = showAllFeatures || isCollapsed ? features : features.slice(0, 4);
              const hasMore = features.length > 4;

              return (
                <>
                  {visibleFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <button
                        key={feature.id}
                        onClick={() => onFeatureSelect?.(feature.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          activeFeature === feature.id
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                        title={isCollapsed ? feature.label : undefined}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm">{feature.label}</span>}
                      </button>
                    );
                  })}

                  {/* See More / See Less Button */}
                  {!isCollapsed && hasMore && (
                    <button
                      onClick={() => setShowAllFeatures(!showAllFeatures)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      {showAllFeatures ? (
                        <>
                          <ChevronUp className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">See Less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">See More</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Button
            onClick={() => {
              // Switch to chat feature first, then create new chat
              onFeatureSelect?.('chat');
              onNewChat();
            }}
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

        {/* Chat History Header */}
        {!isCollapsed && (
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Chat History
          </div>
        )}

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
                onTouchStart={(e) => handleTouchStart(chat, e)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onContextMenu={(e) => handleContextMenu(chat, e)}
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
                    <DropdownMenu
                      open={contextMenuChatId === chat.id}
                      onOpenChange={(open) => {
                        if (!open) setContextMenuChatId(null);
                      }}
                    >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenuChatId(chat.id);
                          }}
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

        {/* Court Session History */}
        {!isCollapsed && courtSessions.length > 0 && (
          <div className="border-t border-gray-700">
            <button
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
              onClick={() => setShowCourtSessions(s => !s)}
            >
              <div className="flex items-center gap-1.5">
                <Gavel className="h-3.5 w-3.5" />
                Court Sessions
              </div>
              {showCourtSessions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showCourtSessions && (
              <ScrollArea className="max-h-48 px-2">
                <div className="space-y-1 pb-2">
                  {courtSessions.map(session => (
                    <div
                      key={session.id}
                      className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => handleViewCourtSession(session)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Award className={`h-3 w-3 flex-shrink-0 ${gradeColor(session.grade)}`} />
                          <span className={`text-xs font-bold ${gradeColor(session.grade)}`}>{session.grade}</span>
                          <span className="text-xs text-gray-400 font-medium">{session.overallScore}/100</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {new Date(session.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                          {' · '}{Math.floor(session.durationSeconds / 60)}m
                          {' · '}{session.interruptionCount} interruption{session.interruptionCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <FileSearch className="h-3.5 w-3.5 text-gray-400" title="View Report" />
                        </div>
                        <Button
                          variant="ghost" size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                          onClick={(e) => handleDeleteCourtSession(session, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Subscription Status Section - Fixed at bottom */}
        {!isCollapsed && onManageSubscription && (
          <div className="border-t border-gray-700 px-4 py-3 bg-gray-900">
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

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Clock,
  FileText,
  User,
  Trash2,
  Download,
  X
} from 'lucide-react';
import { ChatStorageService } from '@/lib/chat-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface ChatSession {
  sessionId: string;
  documentType: string;
  userRole: string;
  lastMessageAt: Date | null;
  messageCount: number;
}

export function ChatHistoryPanel({ isOpen, onClose, className }: ChatHistoryPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [storageStats, setStorageStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    estimatedSizeKB: 0
  });

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = () => {
    const recentSessions = ChatStorageService.getRecentSessions(10);
    setSessions(recentSessions);

    const stats = ChatStorageService.getStorageStats();
    setStorageStats(stats);
  };

  const handleDeleteSession = (sessionId: string) => {
    ChatStorageService.deleteSession(sessionId);
    loadChatHistory(); // Refresh the list
  };

  const handleExportSession = (sessionId: string) => {
    const exportText = ChatStorageService.exportSessionAsText(sessionId);
    if (exportText) {
      const blob = new Blob([exportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_session_${sessionId.slice(0, 8)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClearAllSessions = () => {
    if (confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
      ChatStorageService.clearAllSessions();
      loadChatHistory();
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No messages';
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDocumentTypeColor = (documentType: string) => {
    const colors: Record<string, string> = {
      'Lease': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Employment': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'LoanAgreement': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'ServiceAgreement': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'NDA': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Purchase': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Contract': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[documentType] || colors['Other'];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 h-full w-full sm:w-80 bg-background border-l shadow-lg z-50',
              className
            )}
          >
            <Card className="h-full rounded-none border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Chat History
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Storage Stats */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Sessions:</span>
                    <span>{storageStats.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Messages:</span>
                    <span>{storageStats.totalMessages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage:</span>
                    <span>{storageStats.estimatedSizeKB} KB</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-4 pb-4">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No chat history yet</p>
                      <p className="text-xs">Start a conversation to see your history here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session, index) => (
                        <motion.div
                          key={session.sessionId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <div className="space-y-2">
                            {/* Document Type Badge */}
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="secondary"
                                className={cn("text-xs", getDocumentTypeColor(session.documentType))}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                {session.documentType}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleExportSession(session.sessionId)}
                                  title="Export chat"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteSession(session.sessionId)}
                                  title="Delete chat"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* User Role */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{session.userRole}</span>
                            </div>

                            {/* Message Count and Time */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{session.messageCount} messages</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(session.lastMessageAt)}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {sessions.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllSessions}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All History
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
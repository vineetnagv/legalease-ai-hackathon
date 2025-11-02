'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Document } from '@/types/document-types';
import { ChatMessage, DocumentContext, SuggestedQuestion } from '@/types/chat-types';
import { sendChatMessage, generateSuggestedQuestions } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, LoaderCircle, ChevronDown, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  document: Document;
}

export function ChatPanel({ document }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load suggested questions on mount
  useEffect(() => {
    if (document.analysis && document.userRole) {
      loadSuggestedQuestions();
    }
  }, [document]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSuggestedQuestions = async () => {
    try {
      const context = buildDocumentContext();
      const questions = await generateSuggestedQuestions(context);
      setSuggestedQuestions(questions.slice(0, 6)); // Show top 6 suggestions
    } catch (error) {
      console.error('Failed to load suggested questions:', error);
    }
  };

  const buildDocumentContext = (): DocumentContext => {
    return {
      documentType: document.documentType || 'Other',
      documentTypeConfidence: document.documentTypeConfidence || 0,
      userRole: document.userRole || 'User',
      documentText: document.content,
      keyNumbers: document.analysis?.keyNumbers || [],
      riskScore: document.analysis?.riskScore ?? null,
      riskSummary: document.analysis?.riskSummary || '',
      clauses: document.analysis?.clauses || [],
      faqs: document.analysis?.faqs || [],
    };
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || isLoading) return;

    // Hide suggestions after first message
    if (messages.length === 0) {
      setShowSuggestions(false);
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = buildDocumentContext();
      const response = await sendChatMessage(textToSend, messages, context);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestionClick = (question: string) => {
    setInputValue(question);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'risk': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'clauses': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'negotiation': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'missing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-2 bg-muted/30">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">Document Chat</h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 panel-scrollbar">
        {messages.length === 0 && showSuggestions ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Chat with Your Document</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Ask questions about {document.title}. I have analyzed the document and can help you understand its content, risks, and implications.
              </p>
            </div>

            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  Suggested Questions
                </div>
                <div className="grid gap-2">
                  {suggestedQuestions.map((question) => (
                    <Button
                      key={question.id}
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-4"
                      onClick={() => handleSuggestedQuestionClick(question.text)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <ChevronDown className="h-4 w-4 mt-0.5 flex-shrink-0 rotate-[-90deg]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{question.text}</p>
                          <Badge className={cn('mt-1.5 text-xs', getCategoryColor(question.category))}>
                            {question.category}
                          </Badge>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <Card className={cn(
                  'p-3 max-w-[80%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={cn(
                    'text-xs mt-2',
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </Card>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <Card className="p-3 bg-muted">
                  <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                </Card>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this document..."
            className="resize-none min-h-[60px] max-h-[120px]"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0"
          >
            {isLoading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

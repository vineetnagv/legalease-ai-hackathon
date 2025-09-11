'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, CornerDownLeft, User, Bot, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { getChatResponse } from '@/app/actions';
import { useLanguage } from '@/contexts/language-context';
import type { LanguageCode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { useTranslation } from '@/lib/translations';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface ChatInterfaceProps {
  documentText: string;
  userRole: string;
  children: React.ReactNode;
}

export default function ChatInterface({ documentText, userRole, children }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const t = useTranslation(language);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: messageContent }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getChatResponse({
        documentText,
        userRole,
        question: messageContent,
        history: newMessages.slice(0, -1), // Send history without the current user message
        languageCode: language as LanguageCode,
      });

      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('unexpected_error');
      setMessages(prev => [...prev, { role: 'model', content: `${t('error_prefix')}: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [documentText, userRole, language, messages, isLoading, t]);
  
  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };
  
  const ChatBubble = ({ message }: { message: ChatMessage }) => {
    const isUser = message.role === 'user';
    return (
      <div className={cn("flex items-start gap-3", isUser ? "justify-end" : "justify-start")}>
        {!isUser && (
          <Avatar className="h-8 w-8 border">
            <AvatarFallback><Bot size={20} /></AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn(
            "max-w-md rounded-lg p-3",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        {isUser && (
            <Avatar className="h-8 w-8 border">
                <AvatarFallback><User size={20} /></AvatarFallback>
            </Avatar>
        )}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t('ask_the_ai')}</SheetTitle>
          <SheetDescription>
            {t('chat_description')}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 pr-4 -mr-4 my-4" ref={scrollAreaRef}>
          <div className="space-y-4 p-4">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground p-8">
                    <p>{t('chat_no_messages')}</p>
                </div>
            )}
            {messages.map((message, index) => (
              <ChatBubble key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                 <Avatar className="h-8 w-8 border">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3 flex items-center">
                    <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">{t('ai_is_thinking')}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter>
            <div className="relative w-full">
            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat_placeholder')}
                className="pr-20 min-h-[60px]"
                disabled={isLoading}
                rows={1}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <p className="text-xs text-muted-foreground hidden sm:block">
                    {t('chat_shif_enter')} <CornerDownLeft size={12} className="inline-block" /> {t('chat_new_line')}
                </p>
                <Button
                type="submit"
                size="icon"
                onClick={() => handleSendMessage(input)}
                disabled={isLoading || !input.trim()}
                >
                <Send className="h-4 w-4" />
                <span className="sr-only">{t('chat_send_button')}</span>
                </Button>
            </div>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, MessageCircle, Mic, MicOff, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useSimpleVoiceInput } from '@/hooks/use-simple-voice-input';
import { VoiceRecordingIndicator, VoiceMicButton } from '@/components/ui/voice-recording-indicator';
import { ChatStorageService } from '@/lib/chat-storage';
import type { ChatMessage, DocumentContext, SuggestedQuestion } from '@/types/chat-types';
import { v4 as uuidv4 } from 'uuid';

interface ChatInterfaceProps {
  documentContext: DocumentContext;
  onSendMessage: (message: string) => Promise<{ response: string; suggestedFollowUps?: string[] }>;
  className?: string;
}

export function ChatInterface({ documentContext, onSendMessage, className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "What are the main risks in this document?",
    "Can you explain the key terms in simple language?",
    "What should I pay attention to before signing?"
  ]);
  const [sessionId] = useState(() => uuidv4());

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simple voice input setup
  const voiceInput = useSimpleVoiceInput({
    lang: 'en-US',
    onTranscript: (transcript) => {
      if (transcript.trim()) {
        console.log('Voice transcript received:', transcript);
        setInputValue(prev => {
          const newValue = prev + (prev ? ' ' : '') + transcript.trim();
          return newValue;
        });
      }
    },
    onError: (error) => {
      console.error('Voice input error:', error);
    }
  });

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize or load chat session
  useEffect(() => {
    const existingSession = ChatStorageService.loadSession(sessionId);
    if (existingSession) {
      setMessages(existingSession.conversationHistory);
    } else {
      // Create new session
      ChatStorageService.createSession(sessionId, documentContext);
    }
  }, [sessionId, documentContext]);

  // Save messages to storage when they change
  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach(message => {
        ChatStorageService.addMessageToSession(sessionId, message);
      });
    }
  }, [messages, sessionId]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await onSendMessage(messageText.trim());

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.suggestedFollowUps && response.suggestedFollowUps.length > 0) {
        setSuggestedQuestions(response.suggestedFollowUps);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Determine error type and provide appropriate message
      const err = error instanceof Error ? error : new Error('Unknown error');
      let errorContent = "I apologize, but I encountered an error processing your message. Please try again.";

      if (err.message.includes('network') || err.message.includes('fetch')) {
        errorContent = 'Unable to send your message due to a network issue. Please check your connection and try again.';
      } else if (err.message.includes('timeout')) {
        errorContent = 'Your message took too long to process. Please try a simpler question or try again later.';
      } else if (err.message.includes('rate limit')) {
        errorContent = 'Too many requests. Please wait a moment before sending another message.';
      } else if (err.message.includes('model') || err.message.includes('API')) {
        errorContent = 'The AI service is temporarily unavailable. Please try again in a few moments.';
      }

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleSuggestedQuestionClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleVoiceStart = () => {
    voiceInput.reset(); // Clear any previous state
    voiceInput.startRecording();
  };

  const handleVoiceStop = () => {
    voiceInput.stopRecording();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat about your {documentContext.documentType}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-[600px]">
          {/* Messages Area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Start a conversation</p>
                  <p className="text-sm">Ask me anything about your {documentContext.documentType}. I have full context of the document analysis.</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                    <div className={`text-xs text-muted-foreground mt-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          {messages.length === 0 || (messages.length > 0 && suggestedQuestions.length > 0) && (
            <div className="px-4 py-2 border-t bg-muted/30">
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestionClick(question)}
                    disabled={isLoading}
                    className="text-xs h-8"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t">
            {/* Voice Recording Status */}
            <VoiceRecordingIndicator
              state={voiceInput.state}
              recordingTime={voiceInput.recordingTime}
              transcript={voiceInput.transcript}
              error={voiceInput.error}
              className="mb-3"
            />

            {/* Browser Support Warning */}
            {!voiceInput.isSupported && (
              <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Voice input is not supported in your browser. Try Chrome, Edge, or Safari for voice features.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={voiceInput.state === 'recording' ? "Recording... or type your question" : "Ask a question about your document..."}
                  disabled={isLoading}
                  className="pr-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />

                {/* Voice Input Button */}
                {voiceInput.isSupported && (
                  <VoiceMicButton
                    state={voiceInput.state}
                    onStart={handleVoiceStart}
                    onStop={handleVoiceStop}
                    disabled={isLoading}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  />
                )}
              </div>

              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
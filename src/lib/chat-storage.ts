/**
 * @fileOverview Local storage utilities for persisting chat conversation history.
 */

import type { ChatMessage, ChatSession } from '@/types/chat-types';

const STORAGE_PREFIX = 'legal_chat_';
const MAX_SESSIONS = 10; // Keep only the 10 most recent sessions
const MAX_MESSAGES_PER_SESSION = 100; // Limit messages per session to prevent storage bloat

export class ChatStorageService {

  /**
   * Saves a chat session to localStorage
   */
  static saveSession(session: ChatSession): void {
    try {
      const storageKey = `${STORAGE_PREFIX}${session.sessionId}`;

      // Limit message history to prevent storage bloat
      const limitedSession = {
        ...session,
        conversationHistory: session.conversationHistory.slice(-MAX_MESSAGES_PER_SESSION)
      };

      localStorage.setItem(storageKey, JSON.stringify({
        ...limitedSession,
        startedAt: limitedSession.startedAt.toISOString(),
        lastMessageAt: limitedSession.lastMessageAt?.toISOString() || null,
        conversationHistory: limitedSession.conversationHistory.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        }))
      }));

      // Update session list
      this.updateSessionList(session.sessionId);
    } catch (error) {
      console.error('Failed to save chat session:', error);
    }
  }

  /**
   * Loads a chat session from localStorage
   */
  static loadSession(sessionId: string): ChatSession | null {
    try {
      const storageKey = `${STORAGE_PREFIX}${sessionId}`;
      const stored = localStorage.getItem(storageKey);

      if (!stored) return null;

      const parsed = JSON.parse(stored);

      return {
        ...parsed,
        startedAt: new Date(parsed.startedAt),
        lastMessageAt: parsed.lastMessageAt ? new Date(parsed.lastMessageAt) : null,
        conversationHistory: parsed.conversationHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
    } catch (error) {
      console.error('Failed to load chat session:', error);
      return null;
    }
  }

  /**
   * Adds a message to an existing session
   */
  static addMessageToSession(sessionId: string, message: ChatMessage): void {
    try {
      const session = this.loadSession(sessionId);
      if (!session) return;

      session.conversationHistory.push(message);
      session.lastMessageAt = message.timestamp;

      this.saveSession(session);
    } catch (error) {
      console.error('Failed to add message to session:', error);
    }
  }

  /**
   * Creates a new chat session
   */
  static createSession(sessionId: string, documentContext: any): ChatSession {
    const session: ChatSession = {
      sessionId,
      documentContext,
      conversationHistory: [],
      isActive: true,
      startedAt: new Date(),
      lastMessageAt: null
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Gets all session IDs sorted by most recent
   */
  static getSessionList(): string[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}sessions`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get session list:', error);
      return [];
    }
  }

  /**
   * Updates the session list with a new or existing session
   */
  private static updateSessionList(sessionId: string): void {
    try {
      let sessions = this.getSessionList();

      // Remove existing entry if present
      sessions = sessions.filter(id => id !== sessionId);

      // Add to beginning (most recent)
      sessions.unshift(sessionId);

      // Limit to max sessions and clean up old ones
      if (sessions.length > MAX_SESSIONS) {
        const removedSessions = sessions.splice(MAX_SESSIONS);
        removedSessions.forEach(id => {
          localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
        });
      }

      localStorage.setItem(`${STORAGE_PREFIX}sessions`, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to update session list:', error);
    }
  }

  /**
   * Deletes a specific session
   */
  static deleteSession(sessionId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${sessionId}`);

      const sessions = this.getSessionList().filter(id => id !== sessionId);
      localStorage.setItem(`${STORAGE_PREFIX}sessions`, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  /**
   * Clears all chat sessions
   */
  static clearAllSessions(): void {
    try {
      const sessions = this.getSessionList();
      sessions.forEach(sessionId => {
        localStorage.removeItem(`${STORAGE_PREFIX}${sessionId}`);
      });
      localStorage.removeItem(`${STORAGE_PREFIX}sessions`);
    } catch (error) {
      console.error('Failed to clear all sessions:', error);
    }
  }

  /**
   * Gets recent sessions with metadata
   */
  static getRecentSessions(limit: number = 5): Array<{
    sessionId: string;
    documentType: string;
    userRole: string;
    lastMessageAt: Date | null;
    messageCount: number;
  }> {
    try {
      const sessionIds = this.getSessionList().slice(0, limit);

      return sessionIds.map(sessionId => {
        const session = this.loadSession(sessionId);
        if (!session) return null;

        return {
          sessionId,
          documentType: session.documentContext.documentType,
          userRole: session.documentContext.userRole,
          lastMessageAt: session.lastMessageAt,
          messageCount: session.conversationHistory.length
        };
      }).filter(Boolean) as Array<{
        sessionId: string;
        documentType: string;
        userRole: string;
        lastMessageAt: Date | null;
        messageCount: number;
      }>;
    } catch (error) {
      console.error('Failed to get recent sessions:', error);
      return [];
    }
  }

  /**
   * Exports chat session as text
   */
  static exportSessionAsText(sessionId: string): string | null {
    try {
      const session = this.loadSession(sessionId);
      if (!session) return null;

      let text = `Chat Session Export\n`;
      text += `Session ID: ${session.sessionId}\n`;
      text += `Document Type: ${session.documentContext.documentType}\n`;
      text += `User Role: ${session.documentContext.userRole}\n`;
      text += `Started: ${session.startedAt.toLocaleString()}\n`;
      text += `Messages: ${session.conversationHistory.length}\n\n`;
      text += `${'='.repeat(50)}\n\n`;

      session.conversationHistory.forEach((message, index) => {
        text += `[${message.timestamp.toLocaleTimeString()}] ${message.role.toUpperCase()}:\n`;
        text += `${message.content}\n\n`;
      });

      text += `${'='.repeat(50)}\n`;
      text += `Exported on ${new Date().toLocaleString()}\n`;

      return text;
    } catch (error) {
      console.error('Failed to export session:', error);
      return null;
    }
  }

  /**
   * Gets storage usage statistics
   */
  static getStorageStats(): {
    totalSessions: number;
    totalMessages: number;
    estimatedSizeKB: number;
  } {
    try {
      const sessions = this.getSessionList();
      let totalMessages = 0;
      let estimatedSize = 0;

      sessions.forEach(sessionId => {
        const storageKey = `${STORAGE_PREFIX}${sessionId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          estimatedSize += stored.length;
          const session = JSON.parse(stored);
          totalMessages += session.conversationHistory?.length || 0;
        }
      });

      return {
        totalSessions: sessions.length,
        totalMessages,
        estimatedSizeKB: Math.round(estimatedSize / 1024)
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        estimatedSizeKB: 0
      };
    }
  }
}
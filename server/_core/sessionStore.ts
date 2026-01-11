/**
 * Session Store - In-memory session management for AI assistant
 * 
 * Stores conversation context and user information per session
 */

import type { AIContext } from "./aiAssistant";

// In-memory store (in production, consider using Redis or database)
const sessions = new Map<string, AIContext>();

/**
 * Get or create session context
 */
export function getSessionContext(
  sessionId: string,
  language: "en" | "pt" | "es" = "en"
): AIContext {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      language,
      conversationHistory: [],
    });
  }
  return sessions.get(sessionId)!;
}

/**
 * Update session context
 */
export function updateSessionContext(sessionId: string, updates: Partial<AIContext>): void {
  const context = getSessionContext(sessionId, updates.language);
  Object.assign(context, updates);
  sessions.set(sessionId, context);
}

/**
 * Add message to conversation history
 */
export function addMessageToHistory(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): void {
  const context = getSessionContext(sessionId);
  context.conversationHistory.push({
    role,
    content,
  });
  // Keep only last 20 messages to avoid memory issues
  if (context.conversationHistory.length > 20) {
    context.conversationHistory = context.conversationHistory.slice(-20);
  }
  sessions.set(sessionId, context);
}

/**
 * Clear session
 */
export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * Clean up old sessions (older than 24 hours)
 * This is a simple implementation - in production, use proper TTL
 */
export function cleanupOldSessions(): void {
  // For now, we'll keep all sessions
  // In production, implement proper TTL with timestamps
}


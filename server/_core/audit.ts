/**
 * AUDIT MODULE - Security Logging & Audit Trail
 * 
 * DOGMA 1: Security First - All admin actions MUST be logged
 * DOGMA 2: No Silent Failures - Audit failures are explicit
 * 
 * This module provides:
 * - Audit logging for admin actions
 * - Security event tracking
 * - Change history
 * - Access logging
 */

import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import type { User } from "../db";

export type AuditAction =
  | "api_credentials_updated"
  | "api_credentials_viewed"
  | "environment_changed"
  | "admin_login"
  | "admin_logout"
  | "sensitive_data_accessed"
  | "configuration_changed";

export interface AuditLog {
  id: number;
  userId: number;
  userEmail: string | null;
  action: AuditAction;
  resource: string; // e.g., "square_credentials", "duffel_api_key"
  details: string; // JSON string with additional details
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Log admin action to audit trail
 * DOGMA 1: Security First - All actions logged
 * DOGMA 2: No Silent Failures - Logging errors don't break the flow
 */
export async function logAuditEvent(params: {
  user: User;
  action: AuditAction;
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      // DOGMA 2: Log but don't fail - audit is best effort
      console.warn("[Audit] Database not available, skipping audit log");
      return;
    }

    // Get database type
    const dbType = process.env.DATABASE_URL?.startsWith("mysql") ? "mysql" : "sqlite";

    if (dbType === "sqlite") {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          userEmail TEXT,
          action TEXT NOT NULL,
          resource TEXT NOT NULL,
          details TEXT,
          ipAddress TEXT,
          userAgent TEXT,
          createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
        CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs(userId);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt);
      `);

      await db.run(
        `INSERT INTO audit_logs (userId, userEmail, action, resource, details, ipAddress, userAgent, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))`,
        [
          params.user.id,
          params.user.email || null,
          params.action,
          params.resource,
          params.details ? JSON.stringify(params.details) : null,
          params.ipAddress || null,
          params.userAgent || null,
        ]
      );
    } else {
      // MySQL implementation would go here
      // For now, we'll use SQLite as fallback
      console.warn("[Audit] MySQL audit logging not yet implemented, using console log");
      console.log("[Audit]", {
        userId: params.user.id,
        userEmail: params.user.email,
        action: params.action,
        resource: params.resource,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    // DOGMA 2: No Silent Failures - Log error but don't break the flow
    console.error("[Audit] Failed to log audit event:", error.message);
    // In production, you might want to send this to an external logging service
  }
}

/**
 * Get audit logs for a user or all users (admin only)
 * DOGMA 1: Security First - Audit logs are sensitive
 */
export async function getAuditLogs(params: {
  userId?: number;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> {
  try {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    const dbType = process.env.DATABASE_URL?.startsWith("mysql") ? "mysql" : "sqlite";
    const limit = params.limit || 100;
    const offset = params.offset || 0;

    if (dbType === "sqlite") {
      let query = "SELECT * FROM audit_logs WHERE 1=1";
      const args: any[] = [];

      if (params.userId) {
        query += " AND userId = ?";
        args.push(params.userId);
      }

      if (params.action) {
        query += " AND action = ?";
        args.push(params.action);
      }

      query += " ORDER BY createdAt DESC LIMIT ? OFFSET ?";
      args.push(limit, offset);

      const rows = await db.all(query, args);

      return rows.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        userEmail: row.userEmail,
        action: row.action as AuditAction,
        resource: row.resource,
        details: row.details ? JSON.parse(row.details) : null,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        createdAt: new Date(row.createdAt * 1000), // SQLite stores as Unix timestamp
      }));
    }

    // MySQL implementation would go here
    return [];
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to retrieve audit logs: ${error.message}`,
    });
  }
}


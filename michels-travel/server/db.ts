import { eq } from "drizzle-orm";
import { drizzle as drizzleMySQL } from "drizzle-orm/mysql2";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import { InsertUser as InsertUserMySQL, users as usersMySQL } from "../drizzle/schema";
import { InsertUser as InsertUserSQLite, users as usersSQLite } from "../drizzle/schema.sqlite";
import { ENV } from './_core/env';

type DbType = ReturnType<typeof drizzleMySQL> | ReturnType<typeof drizzleSQLite>;
let _db: DbType | null = null;
let _dbType: "mysql" | "sqlite" | null = null;
let _sqliteDb: Database.Database | null = null;

// Detect database type from DATABASE_URL
function detectDbType(url: string): "mysql" | "sqlite" {
  if (url.startsWith("sqlite:") || url.startsWith("file:")) {
    return "sqlite";
  }
  return "mysql";
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("[Database] ❌ DATABASE_URL not configured!");
      console.error("[Database] 💡 Create a .env file with: DATABASE_URL=sqlite:./database.db");
      console.error("[Database] 💡 Then run: pnpm db:init");
      return null;
    }
    
    try {
      _dbType = detectDbType(dbUrl);
      
      if (_dbType === "sqlite") {
        // Extract file path from sqlite:./database.db or file:./database.db
        let filePath = dbUrl.replace(/^(sqlite|file):/, "").trim();
        // Resolve relative paths
        if (!path.isAbsolute(filePath)) {
          filePath = path.resolve(process.cwd(), filePath);
        }
        // Ensure directory exists
        const dbDir = path.dirname(filePath);
        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
        }
        
        // Create database file if it doesn't exist
        if (!fs.existsSync(filePath)) {
          // Create empty file to initialize SQLite database
          fs.writeFileSync(filePath, "");
          console.log(`[Database] Created SQLite database file: ${filePath}`);
        }
        
        try {
          _sqliteDb = new Database(filePath);
          
          // Initialize schema if database is empty
          const tableInfo = _sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
          if (!tableInfo) {
            console.log("[Database] Initializing database schema...");
            _sqliteDb.exec(`
              CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                openId TEXT NOT NULL UNIQUE,
                name TEXT,
                email TEXT,
                phone TEXT,
                loginMethod TEXT,
                passwordHash TEXT,
                role TEXT NOT NULL DEFAULT 'user',
                avatarUrl TEXT,
                stripeCustomerId TEXT,
                squareCustomerId TEXT,
                preferredLanguage TEXT DEFAULT 'en',
                preferredCurrency TEXT DEFAULT 'USD',
                loyaltyPoints INTEGER DEFAULT 0,
                loyaltyTier TEXT DEFAULT 'bronze',
                emailNotifications INTEGER DEFAULT 1,
                priceAlertNotifications INTEGER DEFAULT 1,
                marketingEmails INTEGER DEFAULT 0,
                createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                lastSignedIn INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
              );
              
              CREATE INDEX IF NOT EXISTS idx_users_openId ON users(openId);
              CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            `);
            console.log("[Database] ✅ Schema initialized successfully");
          }
          
          _db = drizzleSQLite(_sqliteDb);
          console.log(`[Database] ✅ Connected to SQLite: ${filePath}`);
        } catch (error) {
          console.error(`[Database] ❌ Failed to connect to SQLite:`, error);
          throw error;
        }
      } else {
        _db = drizzleMySQL(dbUrl);
        console.log(`[Database] ✅ Connected to MySQL`);
      }
    } catch (error) {
      console.error("[Database] ❌ Failed to connect:", error);
      _db = null;
      _dbType = null;
      _sqliteDb = null;
    }
  }
  return _db;
}

// Get the users table based on database type
function getUsersTable() {
  if (_dbType === "sqlite") {
    return usersSQLite;
  }
  return usersMySQL;
}

export async function upsertUser(user: InsertUserMySQL | InsertUserSQLite): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const usersTable = getUsersTable();
    const values: any = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    if (_dbType === "sqlite") {
      // SQLite uses INSERT OR REPLACE
      const sqliteDb = db as ReturnType<typeof drizzleSQLite>;
      await sqliteDb.insert(usersSQLite).values(values).onConflictDoUpdate({
        target: usersSQLite.openId,
        set: updateSet,
      });
    } else {
      // MySQL uses ON DUPLICATE KEY UPDATE
      const mysqlDb = db as ReturnType<typeof drizzleMySQL>;
      await mysqlDb.insert(usersMySQL).values(values as InsertUserMySQL).onDuplicateKeyUpdate({
        set: updateSet,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const usersTable = getUsersTable();
  const result = await db.select().from(usersTable).where(eq(usersTable.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const usersTable = getUsersTable();
  const result = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

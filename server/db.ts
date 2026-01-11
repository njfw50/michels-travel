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

// Export helper to get current database type
export function getDbType(): "mysql" | "sqlite" | null {
  return _dbType;
}

// Detect database type from DATABASE_URL
function detectDbType(url: string): "mysql" | "sqlite" {
  if (url.startsWith("sqlite:") || url.startsWith("file:")) {
    return "sqlite";
  }
  return "mysql";
}

// Lazily create the drizzle instance so local tooling can run without a DB.
// DOGMA 6: SQLite as default database for development
// DOGMA 10: Database Auto-Initialization - Database must be available automatically
export async function getDb() {
  if (!_db) {
    // DOGMA 6: Use SQLite as default in development if DATABASE_URL is not set
    let dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("DATABASE_URL is required in production. Configure it in your .env file.");
      } else {
        // DOGMA 6: SQLite is the default for development
        // DOGMA 10: Auto-initialize with default SQLite database
        dbUrl = "sqlite:./database.db";
        console.log("[Database] ℹ️ DATABASE_URL not configured, using default: sqlite:./database.db (DOGMA 6)");
      }
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
        
        // DOGMA 10: Database Auto-Initialization - Always ensure database exists and is valid
        // Check if database file exists and is valid, recreate if corrupted
        const dbExists = fs.existsSync(filePath);
        const dbSize = dbExists ? fs.statSync(filePath).size : 0;
        
        // If database is empty or corrupted, recreate it
        if (!dbExists || dbSize === 0) {
          if (dbExists && dbSize === 0) {
            console.log(`[Database] ⚠️ Database file is empty (0 bytes), recreating...`);
            try {
              fs.unlinkSync(filePath);
            } catch (e) {
              // Ignore if file doesn't exist
            }
          }
          console.log(`[Database] Creating SQLite database file: ${filePath}`);
        }
        
        try {
          // DOGMA 10: Always try to connect, even if file doesn't exist (SQLite will create it)
          _sqliteDb = new Database(filePath);
          
          // DOGMA 10: Always initialize schema - SQLite will handle IF NOT EXISTS
          console.log("[Database] Ensuring database schema is initialized...");
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
            
            -- Leads table for booking requests and quote inquiries
            CREATE TABLE IF NOT EXISTS leads (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT,
              type TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'new',
              origin TEXT,
              originName TEXT,
              destination TEXT,
              destinationName TEXT,
              departureDate TEXT,
              returnDate TEXT,
              adults INTEGER,
              children INTEGER,
              infants INTEGER,
              travelClass TEXT,
              flightDetails TEXT,
              estimatedPrice TEXT,
              message TEXT,
              preferredLanguage TEXT DEFAULT 'en',
              createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
              updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
            CREATE INDEX IF NOT EXISTS idx_leads_createdAt ON leads(createdAt);
            CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
            
            -- Flight searches log for analytics
            CREATE TABLE IF NOT EXISTS flightSearches (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              origin TEXT NOT NULL,
              destination TEXT NOT NULL,
              departureDate TEXT NOT NULL,
              returnDate TEXT,
              adults INTEGER NOT NULL,
              children INTEGER,
              infants INTEGER,
              travelClass TEXT,
              resultsCount INTEGER,
              lowestPrice TEXT,
              searchedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_flightSearches_searchedAt ON flightSearches(searchedAt);
            CREATE INDEX IF NOT EXISTS idx_flightSearches_origin_destination ON flightSearches(origin, destination);
            
            -- Orders table for flight purchases
            CREATE TABLE IF NOT EXISTS orders (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              offerId TEXT NOT NULL,
              duffelOrderId TEXT,
              amount INTEGER NOT NULL,
              currency TEXT NOT NULL DEFAULT 'USD',
              status TEXT NOT NULL DEFAULT 'pending',
              customerEmail TEXT NOT NULL,
              customerName TEXT,
              paymentIntentId TEXT,
              paymentStatus TEXT,
              idempotencyKey TEXT NOT NULL UNIQUE,
              passengerDetails TEXT,
              flightDetails TEXT,
              errorMessage TEXT,
              createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
              updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
            );
            
            CREATE INDEX IF NOT EXISTS idx_orders_customerEmail ON orders(customerEmail);
            CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
            CREATE INDEX IF NOT EXISTS idx_orders_idempotencyKey ON orders(idempotencyKey);
            CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders(createdAt);
          `);
          
          // Verify schema was created
          const tableInfo = _sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
          if (tableInfo) {
            console.log("[Database] ✅ Schema verified and ready");
          } else {
            throw new Error("Failed to create users table");
          }
          
          _db = drizzleSQLite(_sqliteDb);
          console.log(`[Database] ✅ Connected to SQLite: ${filePath}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[Database] ❌ Failed to connect to SQLite:`, errorMessage);
          
          // DOGMA 10: Detect specific errors and provide actionable solutions
          if (errorMessage.includes("Could not locate the bindings file") || 
              errorMessage.includes("better_sqlite3.node")) {
            // This is a native module compilation issue
            console.error("");
            console.error("═══════════════════════════════════════════════════════════");
            console.error("🔧 DOGMA 10: Native Module Compilation Issue Detected");
            console.error("═══════════════════════════════════════════════════════════");
            console.error("");
            console.error("The better-sqlite3 module needs to be rebuilt.");
            console.error("");
            console.error("📋 Solution: Run the following command:");
            console.error("");
            console.error("   pnpm rebuild better-sqlite3");
            console.error("");
            console.error("Or reinstall all dependencies:");
            console.error("");
            console.error("   pnpm install --force");
            console.error("");
            console.error("═══════════════════════════════════════════════════════════");
            console.error("");
            throw new Error(
              "better-sqlite3 native module not compiled. " +
              "Please run 'pnpm rebuild better-sqlite3' or 'pnpm install --force' to rebuild native modules. " +
              "This is required because better-sqlite3 is a native Node.js module that needs to be compiled for your platform."
            );
          }
          
          // DOGMA 10: Try to recover by deleting corrupted database and retrying once
          if (fs.existsSync(filePath)) {
            try {
              console.log(`[Database] 🔄 Attempting to recover by recreating database...`);
              if (_sqliteDb) {
                try {
                  _sqliteDb.close();
                } catch (e) {
                  // Ignore close errors
                }
              }
              fs.unlinkSync(filePath);
              // Retry connection
              _sqliteDb = new Database(filePath);
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
                
                -- Leads table for booking requests and quote inquiries
                CREATE TABLE IF NOT EXISTS leads (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  email TEXT NOT NULL,
                  phone TEXT,
                  type TEXT NOT NULL,
                  status TEXT NOT NULL DEFAULT 'new',
                  origin TEXT,
                  originName TEXT,
                  destination TEXT,
                  destinationName TEXT,
                  departureDate TEXT,
                  returnDate TEXT,
                  adults INTEGER,
                  children INTEGER,
                  infants INTEGER,
                  travelClass TEXT,
                  flightDetails TEXT,
                  estimatedPrice TEXT,
                  message TEXT,
                  preferredLanguage TEXT DEFAULT 'en',
                  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                  updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
                );
                
                CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
                CREATE INDEX IF NOT EXISTS idx_leads_createdAt ON leads(createdAt);
                CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
                
                -- Flight searches log for analytics
                CREATE TABLE IF NOT EXISTS flightSearches (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  origin TEXT NOT NULL,
                  destination TEXT NOT NULL,
                  departureDate TEXT NOT NULL,
                  returnDate TEXT,
                  adults INTEGER NOT NULL,
                  children INTEGER,
                  infants INTEGER,
                  travelClass TEXT,
                  resultsCount INTEGER,
                  lowestPrice TEXT,
                  searchedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
                );
                
                CREATE INDEX IF NOT EXISTS idx_flightSearches_searchedAt ON flightSearches(searchedAt);
                CREATE INDEX IF NOT EXISTS idx_flightSearches_origin_destination ON flightSearches(origin, destination);
                
                -- Orders table for flight purchases
                CREATE TABLE IF NOT EXISTS orders (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  offerId TEXT NOT NULL,
                  duffelOrderId TEXT,
                  amount INTEGER NOT NULL,
                  currency TEXT NOT NULL DEFAULT 'USD',
                  status TEXT NOT NULL DEFAULT 'pending',
                  customerEmail TEXT NOT NULL,
                  customerName TEXT,
                  paymentIntentId TEXT,
                  paymentStatus TEXT,
                  idempotencyKey TEXT NOT NULL UNIQUE,
                  passengerDetails TEXT,
                  flightDetails TEXT,
                  errorMessage TEXT,
                  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
                  updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
                );
                
                CREATE INDEX IF NOT EXISTS idx_orders_customerEmail ON orders(customerEmail);
                CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
                CREATE INDEX IF NOT EXISTS idx_orders_idempotencyKey ON orders(idempotencyKey);
                CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders(createdAt);
              `);
              _db = drizzleSQLite(_sqliteDb);
              console.log(`[Database] ✅ Recovered and connected to SQLite: ${filePath}`);
            } catch (recoveryError) {
              console.error(`[Database] ❌ Recovery failed:`, recoveryError);
              throw new Error(`Database initialization failed after recovery attempt: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`);
            }
          } else {
            throw error;
          }
        }
      } else {
        // MySQL connection
        _db = drizzleMySQL(dbUrl);
        console.log(`[Database] ✅ Connected to MySQL`);
      }
    } catch (error) {
      // DOGMA 10: Never return null - always throw explicit error
      // DOGMA 2: No silent failures - all errors must be explicit
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[Database] ❌ Failed to initialize database:", errorMessage);
      throw new Error(`Database initialization failed: ${errorMessage}. Please check your DATABASE_URL configuration and ensure the database directory is writable.`);
    }
  }
  return _db;
}

// Helper to get the correct users table based on database type
function getUsersTable() {
  if (_dbType === "sqlite") {
    return usersSQLite;
  }
  return usersMySQL;
}

// Helper to get the correct InsertUser type based on database type
type InsertUser = InsertUserMySQL | InsertUserSQLite;

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    // DOGMA 10: Never return silently - always throw explicit error
    // DOGMA 2: No silent failures
    throw new Error("Database not available. Cannot upsert user.");
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
      const value = (user as any)[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    // DOGMA 10: Handle lastSignedIn - Drizzle expects Date object for timestamp fields
    // Drizzle will automatically convert Date to integer for SQLite
    if ((user as any).lastSignedIn !== undefined) {
      // Ensure it's a Date object
      const lastSignedIn = (user as any).lastSignedIn;
      if (lastSignedIn instanceof Date) {
        values.lastSignedIn = lastSignedIn;
        updateSet.lastSignedIn = lastSignedIn;
      } else if (typeof lastSignedIn === "number") {
        // Convert number (seconds or milliseconds) to Date
        const date = lastSignedIn > 10000000000 ? new Date(lastSignedIn) : new Date(lastSignedIn * 1000);
        values.lastSignedIn = date;
        updateSet.lastSignedIn = date;
      } else {
        // Default to now
        const now = new Date();
        values.lastSignedIn = now;
        updateSet.lastSignedIn = now;
      }
    } else {
      // No lastSignedIn provided, use current time
      const now = new Date();
      values.lastSignedIn = now;
      updateSet.lastSignedIn = now;
    }
    
    if ((user as any).role !== undefined) {
      values.role = (user as any).role;
      updateSet.role = (user as any).role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (_dbType === "sqlite") {
      // SQLite upsert
      const sqliteDb = db as ReturnType<typeof drizzleSQLite>;
      await sqliteDb.insert(usersSQLite).values(values).onConflictDoUpdate({
        target: usersSQLite.openId,
        set: updateSet,
      });
    } else {
      // MySQL upsert
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

  const users = getUsersTable();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const users = getUsersTable();
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

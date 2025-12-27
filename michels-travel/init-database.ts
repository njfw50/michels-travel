#!/usr/bin/env tsx
/**
 * Script para inicializar o banco de dados SQLite
 * Execute: tsx init-database.ts
 */

import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

const dbPath = path.resolve(process.cwd(), "database.db");

console.log("🗄️ Inicializando banco de dados SQLite...");
console.log(`📁 Caminho: ${dbPath}`);

// Criar banco de dados
const db = new Database(dbPath);

// Criar tabela users
db.exec(`
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

console.log("✅ Tabela 'users' criada com sucesso!");
console.log("✅ Banco de dados SQLite inicializado!");
console.log("");
console.log("📋 Próximos passos:");
console.log("   1. Certifique-se de que o arquivo .env existe com DATABASE_URL=sqlite:./database.db");
console.log("   2. Reinicie o servidor: pnpm dev");
console.log("   3. Acesse: http://localhost:3000/login");
console.log("   4. Crie uma conta e faça login!");

db.close();


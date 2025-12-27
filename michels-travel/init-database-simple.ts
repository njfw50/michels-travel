#!/usr/bin/env tsx
/**
 * Script simples para inicializar o banco de dados SQLite
 * Usa SQL puro sem depender de better-sqlite3 compilado
 * Execute: tsx init-database-simple.ts
 */

import * as fs from "fs";
import * as path from "path";

const dbPath = path.resolve(process.cwd(), "database.db");

console.log("🗄️ Inicializando banco de dados SQLite...");
console.log(`📁 Caminho: ${dbPath}`);

// SQL para criar a tabela users
const createTableSQL = `
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
`;

// Criar arquivo SQL temporário
const sqlFile = path.resolve(process.cwd(), "init-db.sql");
fs.writeFileSync(sqlFile, createTableSQL);

console.log("✅ Arquivo SQL criado: init-db.sql");
console.log("");
console.log("📋 Próximos passos:");
console.log("   1. Certifique-se de que o arquivo .env existe com DATABASE_URL=sqlite:./database.db");
console.log("   2. O banco será criado automaticamente quando o servidor iniciar");
console.log("   3. Reinicie o servidor: pnpm dev");
console.log("   4. Acesse: http://localhost:3000/login");
console.log("");
console.log("💡 O banco de dados será criado automaticamente na primeira conexão!");


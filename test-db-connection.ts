#!/usr/bin/env tsx
/**
 * Script de teste de conexão com banco de dados
 * DOGMA 10: Testa se o banco está funcionando antes de iniciar o servidor
 */

import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

console.log("🧪 Testando conexão com banco de dados...\n");

try {
  // Testar se o módulo pode ser importado
  console.log("1. Testando import do better-sqlite3...");
  const dbPath = path.resolve(process.cwd(), "test-db.db");
  
  // Criar banco de teste
  console.log("2. Criando banco de teste...");
  const db = new Database(dbPath);
  
  console.log("3. Criando tabela de teste...");
  db.exec(`
    CREATE TABLE IF NOT EXISTS test (
      id INTEGER PRIMARY KEY,
      name TEXT
    );
  `);
  
  console.log("4. Inserindo dados de teste...");
  const stmt = db.prepare("INSERT INTO test (name) VALUES (?)");
  stmt.run("teste");
  
  console.log("5. Lendo dados de teste...");
  const result = db.prepare("SELECT * FROM test").all();
  console.log("   Resultado:", result);
  
  console.log("6. Fechando conexão...");
  db.close();
  
  // Limpar arquivo de teste
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  console.log("\n✅ SUCESSO! better-sqlite3 está funcionando corretamente!");
  process.exit(0);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("\n❌ ERRO ao testar better-sqlite3:");
  console.error(errorMessage);
  
  if (errorMessage.includes("Could not locate the bindings file") || 
      errorMessage.includes("better_sqlite3.node")) {
    console.error("\n🔧 SOLUÇÃO:");
    console.error("   O módulo nativo não está compilado.");
    console.error("   Execute: pnpm rebuild better-sqlite3");
    console.error("   Ou instale Visual Studio Build Tools e tente novamente.");
  }
  
  process.exit(1);
}


#!/usr/bin/env tsx
/**
 * Script de verificação de módulos nativos
 * DOGMA 10: Verifica se módulos nativos estão compilados antes de iniciar
 */

import * as fs from "fs";
import * as path from "path";

function checkBetterSQLite3(): boolean {
  // Check multiple possible locations for the compiled .node file
  const possiblePaths = [
    // Direct node_modules
    path.resolve(process.cwd(), "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node"),
    path.resolve(process.cwd(), "node_modules", "better-sqlite3", "build", "Debug", "better_sqlite3.node"),
    // pnpm structure
    path.resolve(process.cwd(), "node_modules", ".pnpm", "better-sqlite3@12.5.0", "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node"),
    path.resolve(process.cwd(), "node_modules", ".pnpm", "better-sqlite3@12.5.0", "node_modules", "better-sqlite3", "build", "Debug", "better_sqlite3.node"),
    // Also check in lib/binding directories
    path.resolve(process.cwd(), "node_modules", "better-sqlite3", "lib", "binding"),
    path.resolve(process.cwd(), "node_modules", ".pnpm", "better-sqlite3@12.5.0", "node_modules", "better-sqlite3", "lib", "binding"),
  ];

  for (const checkPath of possiblePaths) {
    if (fs.existsSync(checkPath)) {
      // If it's a directory, check for .node files inside
      if (fs.statSync(checkPath).isDirectory()) {
        try {
          const files = fs.readdirSync(checkPath, { recursive: true });
          const hasNodeFile = files.some((file: string) => typeof file === "string" && file.endsWith(".node"));
          if (hasNodeFile) {
            return true;
          }
        } catch (e) {
          // Continue to next path
        }
      } else if (checkPath.endsWith(".node")) {
        // It's the .node file itself
        return true;
      }
    }
  }

  return false;
}

console.log("🔍 Verificando módulos nativos...\n");

const betterSQLite3Ok = checkBetterSQLite3();

if (!betterSQLite3Ok) {
  console.error("❌ better-sqlite3 não está compilado!");
  console.error("");
  console.error("📋 Solução:");
  console.error("   Execute: pnpm rebuild better-sqlite3");
  console.error("   Ou: pnpm install --force");
  console.error("");
  process.exit(1);
} else {
  console.log("✅ better-sqlite3 está compilado corretamente");
  process.exit(0);
}


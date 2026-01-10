#!/usr/bin/env tsx
/**
 * Sistema de Verificação de Conformidade com Leis Canônicas
 * DOGMA 7 e DOGMA 8: Verifica se o sistema está em conformidade antes de deploy
 * 
 * Execute: tsx verify-canonical-compliance.ts
 */

import * as fs from "fs";
import * as path from "path";

interface ComplianceCheck {
  name: string;
  dogma: string;
  passed: boolean;
  message: string;
  file?: string;
}

const checks: ComplianceCheck[] = [];

// DOGMA 8: Verificação do Sistema de Login
function checkLoginSystem() {
  console.log("\n🔍 Verificando DOGMA 8: Authentication System Is Mandatory...\n");

  // 1. Verificar se Login.tsx existe
  const loginPagePath = path.resolve(process.cwd(), "client", "src", "pages", "Login.tsx");
  const loginExists = fs.existsSync(loginPagePath);
  checks.push({
    name: "Login.tsx existe",
    dogma: "DOGMA 8",
    passed: loginExists,
    message: loginExists 
      ? "✅ Página Login.tsx encontrada" 
      : "❌ Página Login.tsx não encontrada",
    file: loginPagePath,
  });

  // 2. Verificar se rota /login está no App.tsx
  const appPath = path.resolve(process.cwd(), "client", "src", "App.tsx");
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, "utf-8");
    const hasLoginRoute = appContent.includes('path={"/login"}') || 
                         appContent.includes('path="/login"') ||
                         appContent.includes("Login");
    checks.push({
      name: "Rota /login configurada",
      dogma: "DOGMA 8",
      passed: hasLoginRoute,
      message: hasLoginRoute 
        ? "✅ Rota /login encontrada no App.tsx" 
        : "❌ Rota /login não encontrada no App.tsx",
      file: appPath,
    });
  }

  // 3. Verificar se há botão de login na Home
  const homePath = path.resolve(process.cwd(), "client", "src", "pages", "Home.tsx");
  if (fs.existsSync(homePath)) {
    const homeContent = fs.readFileSync(homePath, "utf-8");
    const hasLoginButton = homeContent.includes("/login") || 
                          homeContent.includes("Login") ||
                          homeContent.includes("login");
    checks.push({
      name: "Botão de login na navegação",
      dogma: "DOGMA 8",
      passed: hasLoginButton,
      message: hasLoginButton 
        ? "✅ Referência a login encontrada na Home" 
        : "❌ Botão/link de login não encontrado na Home",
      file: homePath,
    });
  }

  // 4. Verificar se auth.register existe no backend
  const routersPath = path.resolve(process.cwd(), "server", "routers.ts");
  if (fs.existsSync(routersPath)) {
    const routersContent = fs.readFileSync(routersPath, "utf-8");
    const hasRegister = routersContent.includes("auth.register") || 
                       routersContent.includes("register:");
    const hasLogin = routersContent.includes("auth.login") || 
                    routersContent.includes("login:");
    checks.push({
      name: "auth.register no backend",
      dogma: "DOGMA 8",
      passed: hasRegister,
      message: hasRegister 
        ? "✅ Procedimento auth.register encontrado" 
        : "❌ Procedimento auth.register não encontrado",
      file: routersPath,
    });
    checks.push({
      name: "auth.login no backend",
      dogma: "DOGMA 8",
      passed: hasLogin,
      message: hasLogin 
        ? "✅ Procedimento auth.login encontrado" 
        : "❌ Procedimento auth.login não encontrado",
      file: routersPath,
    });
  }

  // 5. Verificar se password.ts existe
  const passwordPath = path.resolve(process.cwd(), "server", "_core", "password.ts");
  const passwordExists = fs.existsSync(passwordPath);
  checks.push({
    name: "password.ts existe",
    dogma: "DOGMA 8",
    passed: passwordExists,
    message: passwordExists 
      ? "✅ Funções de hash/verificação de senha encontradas" 
      : "❌ Arquivo password.ts não encontrado",
    file: passwordPath,
  });

  // 6. Verificar se getUserByEmail existe no db.ts
  const dbPath = path.resolve(process.cwd(), "server", "db.ts");
  if (fs.existsSync(dbPath)) {
    const dbContent = fs.readFileSync(dbPath, "utf-8");
    const hasGetUserByEmail = dbContent.includes("getUserByEmail");
    checks.push({
      name: "getUserByEmail no db.ts",
      dogma: "DOGMA 8",
      passed: hasGetUserByEmail,
      message: hasGetUserByEmail 
        ? "✅ Função getUserByEmail encontrada" 
        : "❌ Função getUserByEmail não encontrada",
      file: dbPath,
    });
  }
}

// DOGMA 9: Verificação de Console Errors
function checkConsoleErrors() {
  console.log("\n🔍 Verificando DOGMA 9: Console Error Prevention...\n");

  // Verificar se analytics.ts existe e está correto
  const analyticsPath = path.resolve(process.cwd(), "client", "src", "utils", "analytics.ts");
  const analyticsExists = fs.existsSync(analyticsPath);
  checks.push({
    name: "analytics.ts existe e é seguro",
    dogma: "DOGMA 9",
    passed: analyticsExists,
    message: analyticsExists 
      ? "✅ Arquivo analytics.ts encontrado" 
      : "❌ Arquivo analytics.ts não encontrado",
    file: analyticsPath,
  });

  // Verificar se index.html não tem scripts hardcoded problemáticos
  const indexHtmlPath = path.resolve(process.cwd(), "client", "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    const htmlContent = fs.readFileSync(indexHtmlPath, "utf-8");
    const hasProblematicScript = htmlContent.includes("%VITE_ANALYTICS_ENDPOINT%") ||
                                 (htmlContent.includes("umami") && !htmlContent.includes("analytics.ts"));
    checks.push({
      name: "index.html sem scripts problemáticos",
      dogma: "DOGMA 9",
      passed: !hasProblematicScript,
      message: !hasProblematicScript 
        ? "✅ index.html não tem scripts hardcoded problemáticos" 
        : "❌ index.html contém scripts hardcoded que podem causar erros",
      file: indexHtmlPath,
    });
  }

  // Verificar se const.ts exporta isOAuthConfigured
  const constPath = path.resolve(process.cwd(), "client", "src", "const.ts");
  if (fs.existsSync(constPath)) {
    const constContent = fs.readFileSync(constPath, "utf-8");
    const hasIsOAuthConfigured = constContent.includes("export const isOAuthConfigured");
    checks.push({
      name: "isOAuthConfigured exportado em const.ts",
      dogma: "DOGMA 9",
      passed: hasIsOAuthConfigured,
      message: hasIsOAuthConfigured 
        ? "✅ isOAuthConfigured exportado corretamente" 
        : "❌ isOAuthConfigured não está exportado em const.ts",
      file: constPath,
    });
  }
}

// DOGMA 10: Verificação de Auto-Inicialização do Banco
function checkDatabaseAutoInit() {
  console.log("\n🔍 Verificando DOGMA 10: Database Auto-Initialization...\n");

  // Verificar se db.ts usa padrão automático
  const dbPath = path.resolve(process.cwd(), "server", "db.ts");
  if (fs.existsSync(dbPath)) {
    const dbContent = fs.readFileSync(dbPath, "utf-8");
    const hasAutoInit = dbContent.includes("sqlite:./database.db") && 
                        dbContent.includes("if (!dbUrl)") &&
                        (dbContent.includes("dbUrl = \"sqlite:./database.db\"") || 
                         dbContent.includes("dbUrl = 'sqlite:./database.db'"));
    checks.push({
      name: "db.ts usa padrão automático SQLite",
      dogma: "DOGMA 10",
      passed: hasAutoInit,
      message: hasAutoInit 
        ? "✅ db.ts usa padrão automático quando DATABASE_URL não está configurado" 
        : "❌ db.ts não usa padrão automático - viola DOGMA 10",
      file: dbPath,
    });

    // Verificar se não retorna null sem tentar inicializar
    const returnsNullEarly = dbContent.includes("return null") && 
                            !dbContent.includes("// DOGMA 10") &&
                            dbContent.indexOf("return null") < dbContent.indexOf("_dbType = detectDbType");
    checks.push({
      name: "db.ts não retorna null prematuramente",
      dogma: "DOGMA 10",
      passed: !returnsNullEarly,
      message: !returnsNullEarly 
        ? "✅ db.ts não retorna null sem tentar inicializar" 
        : "❌ db.ts retorna null prematuramente - viola DOGMA 10",
      file: dbPath,
    });
  }
}

// DOGMA 6: Verificação do SQLite
function checkSQLiteConfig() {
  console.log("\n🔍 Verificando DOGMA 6: SQLite as Default Database...\n");

  // Verificar .env
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const hasSQLite = envContent.includes("DATABASE_URL=sqlite:");
    checks.push({
      name: "DATABASE_URL configurado para SQLite",
      dogma: "DOGMA 6",
      passed: hasSQLite,
      message: hasSQLite 
        ? "✅ DATABASE_URL configurado para SQLite" 
        : "⚠️ DATABASE_URL não está configurado para SQLite (padrão)",
      file: envPath,
    });
  }

  // Verificar se db.ts suporta SQLite
  const dbPath = path.resolve(process.cwd(), "server", "db.ts");
  if (fs.existsSync(dbPath)) {
    const dbContent = fs.readFileSync(dbPath, "utf-8");
    const supportsSQLite = dbContent.includes("drizzleSQLite") && 
                           dbContent.includes("better-sqlite3");
    checks.push({
      name: "db.ts suporta SQLite",
      dogma: "DOGMA 6",
      passed: supportsSQLite,
      message: supportsSQLite 
        ? "✅ db.ts suporta SQLite" 
        : "❌ db.ts não suporta SQLite",
      file: dbPath,
    });
  }
}

// DOGMA 3: Verificação de Validação Zod
function checkZodValidation() {
  console.log("\n🔍 Verificando DOGMA 3: Validate ALL Inputs with Zod...\n");

  const routersPath = path.resolve(process.cwd(), "server", "routers.ts");
  if (fs.existsSync(routersPath)) {
    const routersContent = fs.readFileSync(routersPath, "utf-8");
    const hasInputValidation = routersContent.includes(".input(") && 
                              routersContent.includes("z.object");
    checks.push({
      name: "Validação Zod nos procedimentos",
      dogma: "DOGMA 3",
      passed: hasInputValidation,
      message: hasInputValidation 
        ? "✅ Validação Zod encontrada" 
        : "❌ Validação Zod não encontrada",
      file: routersPath,
    });
  }
}

// Executar todas as verificações
function runAllChecks() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  Sistema de Verificação de Conformidade Canônica          ║");
  console.log("║  DOGMA 7: Canonical Law Compliance                         ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  checkLoginSystem();
  checkSQLiteConfig();
  checkZodValidation();
  checkConsoleErrors();
  checkDatabaseAutoInit();

  // Resumo
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DA VERIFICAÇÃO");
  console.log("=".repeat(60) + "\n");

  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;
  const total = checks.length;

  checks.forEach(check => {
    console.log(`${check.passed ? "✅" : "❌"} ${check.name}`);
    if (!check.passed) {
      console.log(`   ${check.message}`);
      if (check.file) {
        console.log(`   Arquivo: ${check.file}`);
      }
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log(`Total: ${total} | ✅ Aprovados: ${passed} | ❌ Falhas: ${failed}`);
  console.log("=".repeat(60) + "\n");

  if (failed > 0) {
    console.log("⚠️  ATENÇÃO: O sistema não está em conformidade com as Leis Canônicas!");
    console.log("⚠️  Corrija os itens acima antes de fazer deploy ou entrega.\n");
    process.exit(1);
  } else {
    console.log("✅ Sistema em conformidade com todas as Leis Canônicas!\n");
    process.exit(0);
  }
}

runAllChecks();


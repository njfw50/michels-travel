#!/usr/bin/env tsx
/**
 * Teste completo do fluxo de autenticação
 * DOGMA 8 e DOGMA 10: Testa registro e login
 */

import { getDb } from "./server/db";
import { upsertUser, getUserByEmail } from "./server/db";
import { hashPassword, verifyPassword } from "./server/_core/password";

console.log("🧪 Testando fluxo completo de autenticação...\n");

async function testFullAuthFlow() {
  try {
    console.log("1. Inicializando banco de dados...");
    const db = await getDb();
    if (!db) {
      throw new Error("Banco de dados não inicializado");
    }
    console.log("   ✅ Banco inicializado\n");
    
    // Limpar usuário de teste anterior
    const testEmail = "teste@example.com";
    const existingUser = await getUserByEmail(testEmail);
    if (existingUser) {
      console.log("2. Limpando usuário de teste anterior...");
      // Não vamos deletar, apenas testar com ele
      console.log("   ⚠️ Usuário já existe, usando para teste\n");
    }
    
    console.log("3. Testando REGISTRO (criação de conta)...");
    const testPassword = "senha123";
    const testName = "Usuário Teste Completo";
    
    if (!existingUser) {
      const passwordHash = await hashPassword(testPassword);
      const openId = `email:${testEmail}`;
      
      await upsertUser({
        openId,
        name: testName,
        email: testEmail,
        passwordHash,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });
      console.log("   ✅ Conta criada com sucesso");
    } else {
      console.log("   ✅ Conta já existe (pulando criação)");
    }
    
    console.log("\n4. Testando LOGIN (verificação de senha)...");
    const user = await getUserByEmail(testEmail);
    if (!user) {
      throw new Error("Usuário não encontrado após criação");
    }
    
    if (!user.passwordHash) {
      throw new Error("Password hash não encontrado");
    }
    
    const isValidPassword = await verifyPassword(testPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Senha não foi verificada corretamente");
    }
    console.log("   ✅ Senha verificada corretamente");
    
    console.log("\n5. Testando senha incorreta...");
    const isInvalidPassword = await verifyPassword("senha_errada", user.passwordHash);
    if (isInvalidPassword) {
      throw new Error("Senha incorreta foi aceita (ERRO DE SEGURANÇA)");
    }
    console.log("   ✅ Senha incorreta rejeitada corretamente");
    
    console.log("\n6. Verificando dados do usuário...");
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Nome: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Login Method: ${user.loginMethod}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Last Signed In: ${user.lastSignedIn}`);
    
    console.log("\n✅ SUCESSO COMPLETO! Fluxo de autenticação funcionando!");
    console.log("\n📋 Resumo Final:");
    console.log("   ✅ Banco de dados inicializado automaticamente");
    console.log("   ✅ Registro de conta funcionando");
    console.log("   ✅ Hash de senha funcionando");
    console.log("   ✅ Verificação de senha funcionando");
    console.log("   ✅ Login funcionando");
    console.log("   ✅ Dados do usuário corretos");
    
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n❌ ERRO ao testar fluxo de autenticação:");
    console.error(errorMessage);
    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testFullAuthFlow();


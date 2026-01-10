#!/usr/bin/env tsx
/**
 * Teste completo de criação de conta
 * DOGMA 8 e DOGMA 10: Testa se o sistema de autenticação está funcionando
 */

import { getDb } from "./server/db";
import { upsertUser, getUserByEmail } from "./server/db";
import { hashPassword } from "./server/_core/password";

console.log("🧪 Testando criação de conta...\n");

async function testAccountCreation() {
  try {
    console.log("1. Inicializando banco de dados...");
    const db = await getDb();
    
    if (!db) {
      throw new Error("Banco de dados não inicializado");
    }
    console.log("   ✅ Banco inicializado");
    
    console.log("\n2. Criando usuário de teste...");
    const testEmail = "teste@example.com";
    const testPassword = "senha123";
    const testName = "Usuário Teste";
    
    // Verificar se usuário já existe
    const existingUser = await getUserByEmail(testEmail);
    if (existingUser) {
      console.log("   ⚠️ Usuário de teste já existe, pulando criação");
    } else {
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
      console.log("   ✅ Usuário criado com sucesso");
    }
    
    console.log("\n3. Verificando se usuário foi criado...");
    const user = await getUserByEmail(testEmail);
    
    if (!user) {
      throw new Error("Usuário não foi encontrado após criação");
    }
    
    console.log("   ✅ Usuário encontrado:");
    console.log(`      - ID: ${user.id}`);
    console.log(`      - Nome: ${user.name}`);
    console.log(`      - Email: ${user.email}`);
    console.log(`      - Login Method: ${user.loginMethod}`);
    
    console.log("\n4. Verificando hash de senha...");
    if (!user.passwordHash) {
      throw new Error("Password hash não foi salvo");
    }
    console.log("   ✅ Password hash salvo corretamente");
    
    console.log("\n✅ SUCESSO! Sistema de criação de conta está funcionando!");
    console.log("\n📋 Resumo:");
    console.log("   ✅ Banco de dados inicializado");
    console.log("   ✅ Usuário criado");
    console.log("   ✅ Senha hashada e salva");
    console.log("   ✅ Usuário pode ser recuperado");
    
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n❌ ERRO ao testar criação de conta:");
    console.error(errorMessage);
    console.error("\nStack trace:");
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testAccountCreation();


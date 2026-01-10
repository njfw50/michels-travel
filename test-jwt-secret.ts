#!/usr/bin/env tsx
/**
 * Teste de JWT_SECRET
 * DOGMA 2 e DOGMA 10: Verifica se JWT_SECRET está configurado corretamente
 */

import { sdk } from "./server/_core/sdk";

console.log("🧪 Testando JWT_SECRET...\n");

async function testJWTSecret() {
  try {
    console.log("1. Testando criação de session token...");
    const testOpenId = "test:openid";
    const testName = "Test User";
    
    const token = await sdk.createSessionToken(testOpenId, {
      name: testName,
      expiresInMs: 3600000, // 1 hora
    });
    
    if (!token || token.length === 0) {
      throw new Error("Token não foi criado");
    }
    console.log("   ✅ Token criado com sucesso");
    console.log(`   Token (primeiros 20 chars): ${token.substring(0, 20)}...`);
    
    console.log("\n2. Testando verificação de session token...");
    const verified = await sdk.verifySession(token);
    
    if (!verified) {
      // Try to decode token manually to see what's in it
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log("   Token payload:", payload);
        } catch (e) {
          // Ignore
        }
      }
      throw new Error("Token não foi verificado");
    }
    
    if (verified.openId !== testOpenId) {
      throw new Error(`openId não corresponde: esperado ${testOpenId}, recebido ${verified.openId}`);
    }
    
    if (verified.name !== testName) {
      throw new Error(`name não corresponde: esperado ${testName}, recebido ${verified.name}`);
    }
    
    console.log("   ✅ Token verificado com sucesso");
    console.log(`   - openId: ${verified.openId}`);
    console.log(`   - name: ${verified.name}`);
    console.log(`   - appId: ${verified.appId}`);
    
    console.log("\n✅ SUCESSO! JWT_SECRET está funcionando corretamente!");
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n❌ ERRO ao testar JWT_SECRET:");
    console.error(errorMessage);
    
    if (errorMessage.includes("Zero-length key") || errorMessage.includes("JWT_SECRET")) {
      console.error("\n🔧 SOLUÇÃO:");
      console.error("   Adicione JWT_SECRET ao arquivo .env:");
      console.error("   JWT_SECRET=uma-string-secreta-aleatoria-com-pelo-menos-32-caracteres");
    }
    
    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testJWTSecret();


import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";
import * as fs from "fs";
import * as path from "path";
import {
  encryptSensitiveData,
  decryptSensitiveData,
  maskApiKey,
  sanitizeInput,
  validateApiKeyFormat,
  isEncrypted,
  getEncryptionStatus,
} from "./security";
import { logAuditEvent, getAuditLogs } from "./audit";

// DOGMA 3: Validate ALL Inputs with Zod
// DOGMA 1: Security First - Sanitize all inputs
const UpdateApiCredentialsSchema = z.object({
  squareAccessTokenSandbox: z.string().optional().transform((val) => val ? sanitizeInput(val) : val),
  squareApplicationIdSandbox: z.string().optional().transform((val) => val ? sanitizeInput(val) : val),
  squareAccessTokenProduction: z.string().optional().transform((val) => val ? sanitizeInput(val) : val),
  squareApplicationIdProduction: z.string().optional().transform((val) => val ? sanitizeInput(val) : val),
  duffelApiKey: z.string().optional().transform((val) => val ? sanitizeInput(val) : val),
  duffelApiKeySandbox: z.string().optional().transform((val) => val ? sanitizeInput(val) : val),
  duffelApiKeyProduction: z.string().optional().transform((val) => val ? sanitizeInput(val) : val),
  squareEnvironment: z.enum(["sandbox", "production"]).optional(),
});

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  // Get current environment status (public - for UI indicator)
  // DOGMA 1: Security First - Only expose environment, not credentials
  getEnvironmentStatus: publicProcedure.query(async () => {
    const envPath = path.join(process.cwd(), ".env");
    
    if (!fs.existsSync(envPath)) {
      return {
        environment: "sandbox" as const,
      };
    }

    const envContent = fs.readFileSync(envPath, "utf-8");
    const squareEnvMatch = envContent.match(/^SQUARE_ENVIRONMENT=(.+)$/m);
    const squareEnv = squareEnvMatch?.[1]?.trim().toLowerCase() || "sandbox";
    
    return {
      environment: (squareEnv === "production" ? "production" : "sandbox") as "sandbox" | "production",
    };
  }),

  // Get current API credentials (admin only)
  // DOGMA 1: Security First - Mask sensitive data, log access
  getApiCredentials: adminProcedure.query(async ({ ctx }) => {
    // DOGMA 1: Security First - Log access to sensitive data
    await logAuditEvent({
      user: ctx.user!,
      action: "api_credentials_viewed",
      resource: "all_api_credentials",
      ipAddress: ctx.req.ip || ctx.req.headers["x-forwarded-for"] as string || undefined,
      userAgent: ctx.req.headers["user-agent"] || undefined,
    });
    const envPath = path.join(process.cwd(), ".env");
    
    if (!fs.existsSync(envPath)) {
      return {
        squareAccessTokenSandbox: "",
        squareApplicationIdSandbox: "",
        squareAccessTokenProduction: "",
        squareApplicationIdProduction: "",
        duffelApiKey: "",
        squareEnvironment: "sandbox" as const,
      };
    }

    const envContent = fs.readFileSync(envPath, "utf-8");
    const envLines = envContent.split("\n");

    const getEnvValue = (key: string, decrypt: boolean = false): string => {
      const line = envLines.find((l) => l.trim().startsWith(`${key}=`) && !l.trim().startsWith("#"));
      if (!line) return "";
      const match = line.match(/^[^=]+=(.+)$/);
      if (!match) return "";
      const value = match[1].trim();
      
      // DOGMA 1: Security First - Decrypt if encrypted
      if (decrypt && isEncrypted(value)) {
        try {
          return decryptSensitiveData(value);
        } catch (error) {
          // If decryption fails, return masked value
          return maskApiKey(value);
        }
      }
      
      return value;
    };

    const squareEnv = (getEnvValue("SQUARE_ENVIRONMENT") || "sandbox") as "sandbox" | "production";
    
    // Duffel: sempre retorna chaves separadas se existirem
    // DOGMA 1: Security First - Decrypt encrypted keys, mask for display
    const duffelKeySandbox = getEnvValue("DUFFEL_API_KEY_SANDBOX", true) || "";
    const duffelKeyProduction = getEnvValue("DUFFEL_API_KEY_PRODUCTION", true) || "";
    const duffelKeyMain = getEnvValue("DUFFEL_API_KEY", true) || "";
    
    // Se não tem chaves separadas, tenta detectar pelo prefixo da chave principal
    let finalSandboxKey = duffelKeySandbox;
    let finalProductionKey = duffelKeyProduction;
    
    if (!duffelKeySandbox && duffelKeyMain.startsWith("duffel_test_")) {
      finalSandboxKey = duffelKeyMain;
    }
    if (!duffelKeyProduction && duffelKeyMain.startsWith("duffel_live_")) {
      finalProductionKey = duffelKeyMain;
    }
    
    // Chave principal baseada no ambiente ativo (para compatibilidade)
    const duffelKeyMainForEnv = squareEnv === "production" 
      ? (finalProductionKey || duffelKeyMain)
      : (finalSandboxKey || duffelKeyMain);

    // DOGMA 1: Security First - Return masked values for display
    return {
      squareAccessTokenSandbox: maskApiKey(getEnvValue("SQUARE_ACCESS_TOKEN_SANDBOX", true) || getEnvValue("SQUARE_ACCESS_TOKEN", true) || ""),
      squareApplicationIdSandbox: getEnvValue("SQUARE_APPLICATION_ID_SANDBOX") || getEnvValue("SQUARE_APPLICATION_ID") || "",
      squareAccessTokenProduction: maskApiKey(getEnvValue("SQUARE_ACCESS_TOKEN_PRODUCTION", true) || ""),
      squareApplicationIdProduction: getEnvValue("SQUARE_APPLICATION_ID_PRODUCTION") || "",
      duffelApiKey: maskApiKey(duffelKeyMainForEnv), // Masked for display
      duffelApiKeySandbox: maskApiKey(finalSandboxKey), // Masked for display
      duffelApiKeyProduction: maskApiKey(finalProductionKey), // Masked for display
      squareEnvironment: squareEnv,
    };
  }),

  // Update API credentials (admin only)
  // DOGMA 1: Security First - Encrypt, validate, audit
  // DOGMA 2: No Silent Failures - All Errors Are Explicit
  updateApiCredentials: adminProcedure
    .input(UpdateApiCredentialsSchema)
    .mutation(async ({ input, ctx }) => {
      // DOGMA 1: Security First - Validate API key formats
      if (input.duffelApiKey && !validateApiKeyFormat(input.duffelApiKey, "duffel")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Formato inválido de API Key Duffel. Deve começar com 'duffel_test_' ou 'duffel_live_'",
        });
      }
      if (input.duffelApiKeySandbox && !validateApiKeyFormat(input.duffelApiKeySandbox, "duffel")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Formato inválido de API Key Duffel (Sandbox). Deve começar com 'duffel_test_'",
        });
      }
      if (input.duffelApiKeyProduction && !validateApiKeyFormat(input.duffelApiKeyProduction, "duffel")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Formato inválido de API Key Duffel (Produção). Deve começar com 'duffel_live_'",
        });
      }
      if (input.squareApplicationIdSandbox && !validateApiKeyFormat(input.squareApplicationIdSandbox, "square")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Formato inválido de Application ID Square (Sandbox)",
        });
      }
      if (input.squareApplicationIdProduction && !validateApiKeyFormat(input.squareApplicationIdProduction, "square")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Formato inválido de Application ID Square (Produção)",
        });
      }
      const envPath = path.join(process.cwd(), ".env");
      
      let envContent = "";
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf-8");
      }

      // Helper to update or add env variable with encryption for sensitive data
      // DOGMA 1: Security First - Encrypt sensitive data
      // DOGMA 2: Intelligent Fallback - Graceful degradation if encryption unavailable
      const updateEnvVar = (key: string, value: string, encrypt: boolean = false) => {
        let finalValue = value;
        
        // DOGMA 1: Security First - Encrypt API keys and tokens if encryption available
        if (encrypt && value) {
          try {
            finalValue = encryptSensitiveData(value);
          } catch (error: any) {
            // DOGMA 2: Intelligent Fallback - If encryption fails, use plain text with warning
            console.warn(`[SystemRouter] Failed to encrypt ${key}, storing in plain text: ${error.message}`);
            finalValue = value; // Fallback to plain text
          }
        }
        
        const regex = new RegExp(`^${key}=.*$`, "m");
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${finalValue}`);
        } else {
          // Add at the end if not exists
          if (envContent && !envContent.endsWith("\n")) {
            envContent += "\n";
          }
          envContent += `${key}=${finalValue}\n`;
        }
      };
      
      // Track what was changed for audit
      const changes: string[] = [];

      // Update Square credentials
      // DOGMA 1: Security First - Encrypt tokens, not application IDs
      if (input.squareAccessTokenSandbox !== undefined) {
        updateEnvVar("SQUARE_ACCESS_TOKEN_SANDBOX", input.squareAccessTokenSandbox, true); // Encrypt token
        changes.push("square_access_token_sandbox");
      }
      if (input.squareApplicationIdSandbox !== undefined) {
        updateEnvVar("SQUARE_APPLICATION_ID_SANDBOX", input.squareApplicationIdSandbox, false); // Don't encrypt ID
        changes.push("square_application_id_sandbox");
      }
      if (input.squareAccessTokenProduction !== undefined) {
        updateEnvVar("SQUARE_ACCESS_TOKEN_PRODUCTION", input.squareAccessTokenProduction, true); // Encrypt token
        changes.push("square_access_token_production");
      }
      if (input.squareApplicationIdProduction !== undefined) {
        updateEnvVar("SQUARE_APPLICATION_ID_PRODUCTION", input.squareApplicationIdProduction, false); // Don't encrypt ID
        changes.push("square_application_id_production");
      }
      // Duffel API Key - suporta separação por ambiente ou chave única
      // DOGMA 1: Security First - Encrypt all API keys
      if (input.duffelApiKeySandbox !== undefined) {
        updateEnvVar("DUFFEL_API_KEY_SANDBOX", input.duffelApiKeySandbox, true); // Encrypt
        changes.push("duffel_api_key_sandbox");
        // Se ambiente atual é sandbox, atualiza também a chave principal
        const currentEnv = envContent.match(/^SQUARE_ENVIRONMENT=(.+)$/m)?.[1]?.trim() || "sandbox";
        if (currentEnv === "sandbox") {
          const encryptedKey = encryptSensitiveData(input.duffelApiKeySandbox);
          updateEnvVar("DUFFEL_API_KEY", encryptedKey, false); // Already encrypted
        }
      }
      if (input.duffelApiKeyProduction !== undefined) {
        updateEnvVar("DUFFEL_API_KEY_PRODUCTION", input.duffelApiKeyProduction, true); // Encrypt
        changes.push("duffel_api_key_production");
        // Se ambiente atual é produção, atualiza também a chave principal
        const currentEnv = envContent.match(/^SQUARE_ENVIRONMENT=(.+)$/m)?.[1]?.trim() || "sandbox";
        if (currentEnv === "production") {
          const encryptedKey = encryptSensitiveData(input.duffelApiKeyProduction);
          updateEnvVar("DUFFEL_API_KEY", encryptedKey, false); // Already encrypted
        }
      }
      // Compatibilidade: se duffelApiKey for passado diretamente, atualiza a chave principal
      if (input.duffelApiKey !== undefined) {
        updateEnvVar("DUFFEL_API_KEY", input.duffelApiKey, true); // Encrypt
        changes.push("duffel_api_key");
      }
      if (input.squareEnvironment !== undefined) {
        updateEnvVar("SQUARE_ENVIRONMENT", input.squareEnvironment, false);
        changes.push("square_environment");
        // Quando ambiente muda, atualiza a chave principal do Duffel automaticamente
        const newEnv = input.squareEnvironment;
        if (newEnv === "production") {
          const prodKey = input.duffelApiKeyProduction || 
            envContent.match(/^DUFFEL_API_KEY_PRODUCTION=(.+)$/m)?.[1]?.trim() || "";
          if (prodKey) {
            // If already encrypted, keep it encrypted; otherwise encrypt
            const encryptedKey = isEncrypted(prodKey) ? prodKey : encryptSensitiveData(prodKey);
            updateEnvVar("DUFFEL_API_KEY", encryptedKey, false); // Already encrypted
          }
        } else {
          const sandboxKey = input.duffelApiKeySandbox || 
            envContent.match(/^DUFFEL_API_KEY_SANDBOX=(.+)$/m)?.[1]?.trim() || "";
          if (sandboxKey) {
            // If already encrypted, keep it encrypted; otherwise encrypt
            const encryptedKey = isEncrypted(sandboxKey) ? sandboxKey : encryptSensitiveData(sandboxKey);
            updateEnvVar("DUFFEL_API_KEY", encryptedKey, false); // Already encrypted
          }
        }
      }

      try {
        fs.writeFileSync(envPath, envContent, "utf-8");
        
        // DOGMA 1: Security First - Log all credential changes
        await logAuditEvent({
          user: ctx.user!,
          action: "api_credentials_updated",
          resource: "api_credentials",
          details: {
            changes: changes,
            environment: input.squareEnvironment || "unchanged",
            timestamp: new Date().toISOString(),
          },
          ipAddress: ctx.req.ip || ctx.req.headers["x-forwarded-for"] as string || undefined,
          userAgent: ctx.req.headers["user-agent"] || undefined,
        });
        
        // DOGMA 2: Intelligent Feedback - Inform user about encryption status
        const encryptionStatus = getEncryptionStatus() 
          ? " (criptografadas)" 
          : " (armazenadas em texto plano - configure ENCRYPTION_KEY ou JWT_SECRET com pelo menos 32 caracteres para criptografia)";
        
        return { 
          success: true, 
          message: `Credenciais atualizadas com sucesso${encryptionStatus}. Reinicie o servidor para aplicar as mudanças.` 
        };
      } catch (error: any) {
        // DOGMA 2: No Silent Failures - Explicit error messages
        // DOGMA 4: External Service Isolation - File system errors are explicit
        // DOGMA 1: Security First - Don't expose file paths in errors
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Falha ao salvar credenciais: ${error.message || "Erro desconhecido"}`,
        });
      }
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});

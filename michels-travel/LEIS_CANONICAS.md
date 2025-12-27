# 📜 LEIS CANÔNICAS - Michel's Travel

## 🎯 Princípios Fundamentais

Este documento define as leis canônicas que governam o desenvolvimento do projeto Michel's Travel. Estas leis garantem consistência, segurança, manutenibilidade e qualidade do código.

---

## 🔴 DOGMAS (Regras Absolutas - Não Violáveis)

### DOGMA 1: All `/api/*` Endpoints Return JSON ONLY
**Prioridade:** P0 - Crítico

**Regra:**
- Todos os endpoints que começam com `/api/*` DEVEM retornar apenas JSON
- Nunca retornar HTML, texto plano, ou outros formatos
- Erros de API também devem ser JSON com schema canônico

**Implementação:**
```typescript
// ✅ Correto
app.use("/api/trpc", createExpressMiddleware({ router, createContext }));

// ❌ Errado
app.get("/api/users", (req, res) => {
  res.send("<html>...</html>"); // NUNCA fazer isso
});
```

**Verificação:**
- Todos os endpoints tRPC retornam JSON por padrão
- `server/_core/vite.ts` tem guards explícitos para pular rotas de API
- Erros de API retornam JSON com schema canônico

---

### DOGMA 2: No Silent Failures - All Errors Are Explicit
**Prioridade:** P0 - Crítico

**Regra:**
- NUNCA retornar valores vazios ou padrão quando há erro
- TODOS os erros devem ser explícitos e lançados
- NUNCA usar `if (!db) return []` - sempre lançar erro

**Implementação:**
```typescript
// ❌ Errado (silent failure)
if (!db) return [];

// ✅ Correto (explicit error)
if (!db) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Database not available",
    cause: createCanonicalError(ErrorCode.DATABASE_ERROR, "Database not available"),
  });
}
```

**Verificação:**
- Todos os casos de banco indisponível lançam erros explícitos
- Nenhum procedimento retorna arrays vazios silenciosamente
- Todos os erros usam o schema canônico de erro

---

### DOGMA 3: Validate ALL Inputs with Zod
**Prioridade:** P0 - Crítico

**Regra:**
- TODOS os procedimentos tRPC DEVEM ter `.input(ZodSchema)`
- Nenhum procedimento pode aceitar inputs sem validação
- Validação deve ser explícita e tipada

**Implementação:**
```typescript
// ✅ Correto
publicProcedure
  .input(z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }))
  .mutation(async ({ input }) => {
    // input é tipado e validado
  });

// ❌ Errado
publicProcedure.mutation(async ({ input }) => {
  // input não validado - NUNCA fazer isso
});
```

**Verificação:**
- Todos os procedimentos têm `.input(ZodSchema)`
- Nenhum procedimento sem validação de input

---

### DOGMA 4: External Service Isolation
**Prioridade:** P0 - Crítico

**Regra:**
- TODAS as chamadas a serviços externos DEVEM passar por adapters
- NUNCA chamar SDKs de serviços externos diretamente no código de negócio
- Adapters isolam dependências externas e facilitam troca de provedores

**Implementação:**
```typescript
// ✅ Correto - Usar adapter
import { SquarePaymentAdapter } from "./providers/square/adapter";

const adapter = new SquarePaymentAdapter(credentials);
const paymentLink = await adapter.createPaymentLink(order);

// ❌ Errado - Chamar SDK diretamente
import { Client } from "@square/square-sdk";
const client = new Client({ ... });
// NUNCA fazer isso no código de negócio
```

**Verificação:**
- Square: `server/providers/square/adapter.ts` existe e é usado
- Todas as chamadas Square passam pelo adapter
- Erros de serviços externos são wrappados em `ExternalAPIError`

---

### DOGMA 5: Contract-First - Configuration Is Explicit
**Prioridade:** P0 - Crítico

**Regra:**
- Configuração deve ser explícita e validada
- Variáveis de ambiente devem ser verificadas no início
- Em produção, configurações obrigatórias devem impedir inicialização
- Em desenvolvimento, configurações opcionais devem logar warnings

**Implementação:**
```typescript
// ✅ Correto
if (process.env.NODE_ENV === "production") {
  if (!ENV.oAuthServerUrl) {
    throw new Error("OAUTH_SERVER_URL is required in production");
  }
} else {
  if (!ENV.oAuthServerUrl) {
    console.warn("[OAuth] WARNING: OAUTH_SERVER_URL is not configured");
  }
}
```

**Verificação:**
- OAuth: WARNING em dev, ERROR em prod
- Database: Verificação explícita de DATABASE_URL
- Todas as configurações críticas são validadas

---

## 📋 LEIS (Regras Importantes - Seguir Sempre)

### LAW 3.2: All API Outputs Must Have Explicit Schemas
**Prioridade:** P1 - Funcionalidade

**Regra:**
- TODOS os procedimentos tRPC DEVEM ter `.output(ZodSchema)`
- Schemas de saída garantem contratos de API estáveis
- Facilita geração de documentação e type-safety

**Implementação:**
```typescript
// ✅ Correto
publicProcedure
  .input(InputSchema)
  .output(OutputSchema)
  .query(async ({ input }) => {
    return { /* dados tipados conforme OutputSchema */ };
  });
```

**Verificação:**
- Arquivo `server/_core/outputSchemas.ts` existe
- Todos os procedimentos têm `.output(OutputSchema)`

---

### LAW 3.3: Canonical Error Schema for All API Errors
**Prioridade:** P0 - Crítico

**Regra:**
- TODOS os erros de API devem usar o schema canônico
- Erros devem incluir: `error: true`, `code`, `message`, opcionalmente `details` e `requestId`
- Códigos de erro seguem convenções HTTP

**Implementação:**
```typescript
// ✅ Correto
import { ErrorCode, createCanonicalError } from "./_core/canonicalErrors";

throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "Database not available",
  cause: createCanonicalError(ErrorCode.DATABASE_ERROR, "Database not available"),
});
```

**Verificação:**
- Arquivo `server/_core/canonicalErrors.ts` existe
- Todos os erros usam `createCanonicalError()`
- Códigos de erro seguem enum `ErrorCode`

---

### LAW 4.1: Domain Boundaries Must Be Enforced
**Prioridade:** P1 - Funcionalidade

**Regra:**
- Lógica de domínio deve estar isolada em classes de domínio
- Search NUNCA faz booking
- Checkout NUNCA processa pagamento
- Payment NUNCA faz booking
- Fulfillment NUNCA processa pagamento

**Implementação:**
```typescript
// ✅ Correto - Domain isolation
class CheckoutDomain {
  async createBookingAndPaymentLink(offer: Offer): Promise<PaymentLink> {
    // Cria booking em estado "pending"
    // Gera link de pagamento
    // NUNCA processa pagamento aqui
  }
}
```

**Verificação:**
- `server/domains/checkout/domain.ts` existe
- Lógica de checkout está isolada
- Boundaries são respeitados

---

### LAW 4.2: Payment Before Ticket Issuance
**Prioridade:** P1 - Funcionalidade

**Regra:**
- Booking é criado em estado "pending"
- Pagamento deve ser confirmado ANTES de emitir ticket
- `verifyPayment` verifica status no provedor antes de atualizar
- Ticket só é emitido após confirmação de pagamento

**Implementação:**
```typescript
// ✅ Correto - Flow
1. bookings.create → Estado "pending" + payment link
2. Usuário paga no Square
3. bookings.verifyPayment → Verifica Square
4. Se payment confirmado → Atualiza para "paid"
5. Ticket issuance → Só após "paid"
```

**Verificação:**
- Bookings são criados em "pending"
- `verifyPayment` verifica status antes de atualizar
- Ticket issuance só após "paid"

---

### LAW 5.1: No Redirects from API Logic
**Prioridade:** P0 - Crítico

**Regra:**
- APIs NUNCA devem fazer redirects
- OAuth callback redirect é aceitável (é parte do fluxo web)
- Lógica de API deve retornar dados, não redirecionar

**Implementação:**
```typescript
// ✅ Aceitável - OAuth callback
app.get("/api/oauth/callback", (req, res) => {
  // Processa OAuth
  res.redirect(302, "/"); // OK - é parte do fluxo de auth
});

// ❌ Errado - API fazendo redirect
app.get("/api/users", (req, res) => {
  res.redirect("/login"); // NUNCA fazer isso
});
```

**Verificação:**
- Apenas OAuth callback faz redirect
- Nenhuma outra API faz redirect

---

## 🎨 Princípios de Vibe Coding (Melhores Práticas Modernas)

### VIBE 1: Type Safety First
- Use TypeScript estritamente
- Tipos explícitos em todas as interfaces públicas
- Evite `any` - use `unknown` quando necessário

### VIBE 2: Explicit Over Implicit
- Código deve ser auto-explicativo
- Prefira nomes descritivos sobre comentários
- Funções pequenas e focadas

### VIBE 3: Fail Fast
- Validações no início das funções
- Erros explícitos imediatamente
- Não acumular erros silenciosamente

### VIBE 4: Single Responsibility
- Uma função = uma responsabilidade
- Classes focadas em um domínio
- Módulos com propósito claro

### VIBE 5: Testability
- Código deve ser testável
- Dependências injetáveis
- Lógica isolada de I/O

---

## 📊 Checklist de Conformidade

### DOGMAS (P0 - Crítico)
- [x] DOGMA 1: All `/api/*` return JSON ONLY
- [x] DOGMA 2: No silent failures
- [x] DOGMA 3: Validate ALL inputs with Zod
- [x] DOGMA 4: External Service Isolation (Square adapter)
- [x] DOGMA 5: Contract-first configuration

### LEIS (P1 - Funcionalidade)
- [x] LAW 3.2: All API outputs have explicit schemas
- [x] LAW 3.3: Canonical error schema
- [x] LAW 4.1: Domain boundaries enforced
- [x] LAW 4.2: Payment before ticket issuance
- [x] LAW 5.1: No redirects from API logic

### VIBE CODING (Melhores Práticas)
- [x] Type safety first
- [x] Explicit over implicit
- [x] Fail fast
- [x] Single responsibility
- [x] Testability

---

## 📚 Referências

- `server/_core/canonicalErrors.ts` - Sistema de erros canônico
- `server/_core/outputSchemas.ts` - Schemas de saída
- `server/providers/square/adapter.ts` - Adapter Square
- `server/domains/checkout/domain.ts` - Domínio de checkout
- `CANONICAL_IMPLEMENTATION_SUMMARY.md` - Resumo de implementação
- `CANONICAL_STARTUP_FIXES.md` - Correções de startup

---

## 🔄 Atualizações

**Última atualização:** 2025-01-26
**Versão:** 1.0.0

Este documento deve ser atualizado sempre que novas leis forem adicionadas ou leis existentes forem modificadas.


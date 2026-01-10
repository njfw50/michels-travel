# 📜 LEIS CANÔNICAS - Michel's Travel

> **📖 Referência Canônica:** Para histórico completo, decisões, precedentes e comandos executados, consulte o [LIVRO_DA_VIDA.md](./LIVRO_DA_VIDA.md)

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

### DOGMA 6: SQLite as Default Database for Development
**Prioridade:** P0 - Crítico

**Regra:**
- **Em desenvolvimento:** SQLite DEVE ser usado como padrão (`DATABASE_URL=sqlite:./database.db`)
- **Em produção:** SQLite é permitido e recomendado, MySQL é opcional
- O sistema DEVE detectar automaticamente o tipo de banco pela `DATABASE_URL`
- O código DEVE suportar ambos SQLite e MySQL sem modificações
- Schema SQLite DEVE estar em `drizzle/schema.sqlite.ts`
- Schema MySQL DEVE estar em `drizzle/schema.ts`

**Implementação:**
```typescript
// ✅ Correto - Detecção automática
function detectDbType(url: string): "mysql" | "sqlite" {
  if (url.startsWith("sqlite:") || url.startsWith("file:")) {
    return "sqlite";
  }
  return "mysql";
}

// ✅ Correto - Suporte dual
if (_dbType === "sqlite") {
  _db = drizzleSQLite(_sqliteDb);
} else {
  _db = drizzleMySQL(dbUrl);
}
```

**Configuração:**
```env
# ✅ Padrão para desenvolvimento
DATABASE_URL=sqlite:./database.db

# ✅ Alternativa para produção (opcional)
DATABASE_URL=mysql://user:password@localhost:3306/database
```

**Verificação:**
- `server/db.ts` detecta automaticamente SQLite vs MySQL
- `drizzle/schema.sqlite.ts` existe e está atualizado
- `drizzle/schema.ts` existe para MySQL (opcional)
- `.env` padrão usa `DATABASE_URL=sqlite:./database.db`
- Banco SQLite é criado automaticamente se não existir
- Schema é inicializado automaticamente no primeiro uso

**Razão:**
- SQLite elimina dependências externas em desenvolvimento
- Facilita setup inicial para novos desenvolvedores
- Não requer instalação/configuração de servidor MySQL
- Banco de dados é um arquivo simples (`database.db`)
- Funciona perfeitamente em produção para muitos casos de uso

---

### DOGMA 7: Canonical Law Compliance - No Changes Without Authorization
**Prioridade:** P0 - Crítico

**Regra:**
- TODAS as alterações no sistema DEVEM ser precedidas de consulta às Leis Canônicas
- NUNCA remover, modificar ou desabilitar funcionalidades existentes sem autorização explícita
- ANTES de qualquer alteração, verificar se ela viola algum DOGMA ou LEI
- Se uma alteração violar qualquer lei canônica, ela DEVE ser rejeitada ou requerer autorização explícita
- O sistema DEVE manter todas as funcionalidades estabelecidas pelas leis canônicas

**Processo de Alteração:**
1. **Consulta Obrigatória:** Antes de qualquer mudança, consultar `LEIS_CANONICAS.md`
2. **Verificação de Conformidade:** Verificar se a mudança viola algum DOGMA ou LEI
3. **Autorização:** Se violar qualquer lei, requerer autorização explícita do mantenedor
4. **Documentação:** Se autorizada, documentar a exceção e o motivo

**Implementação:**
```typescript
// ✅ Correto - Consultar leis antes de alterar
// 1. Verificar LEIS_CANONICAS.md
// 2. Confirmar que não viola DOGMA 1-6
// 3. Se violar, solicitar autorização
// 4. Apenas então fazer a alteração

// ❌ Errado - Alterar sem consultar
// Remover funcionalidade de login sem verificar se viola DOGMA 2 ou DOGMA 3
```

**Exemplos de Violações:**
- Remover sistema de login sem autorização ❌
- Remover validação Zod de inputs ❌
- Fazer APIs retornarem HTML em vez de JSON ❌
- Adicionar silent failures ❌
- Remover suporte SQLite sem autorização ❌

**Verificação:**
- Todas as alterações são precedidas de consulta às leis
- Nenhuma funcionalidade é removida sem autorização
- Sistema mantém conformidade com todos os DOGMAS
- Exceções são documentadas quando autorizadas

**Razão:**
- Garante consistência e estabilidade do sistema
- Previne regressões e perda de funcionalidades
- Mantém qualidade e conformidade com arquitetura estabelecida
- Protege o sistema contra mudanças não autorizadas

---

### DOGMA 8: Authentication System Is Mandatory and Must Be Visible
**Prioridade:** P0 - Crítico

**Regra:**
- O sistema de autenticação (login/registro) DEVE estar sempre presente e funcional
- A rota `/login` DEVE estar configurada no router do frontend
- O botão/link de login DEVE estar visível na navegação principal
- Os procedimentos `auth.register` e `auth.login` DEVEM estar implementados no backend
- NUNCA remover, ocultar ou desabilitar o sistema de login sem autorização explícita
- O sistema DEVE suportar login com email/senha (obrigatório) e OAuth (opcional)

**Implementação Frontend:**
```typescript
// ✅ Correto - Rota de login obrigatória
<Route path={"/login"} component={Login} />

// ✅ Correto - Botão de login visível
<Link href="/login">
  <Button>Login</Button>
</Link>

// ❌ Errado - Remover rota de login
// ❌ Errado - Ocultar botão de login
// ❌ Errado - Desabilitar sistema de login
```

**Implementação Backend:**
```typescript
// ✅ Correto - Procedimentos obrigatórios
auth: router({
  register: publicProcedure.input(RegisterSchema).mutation(...),
  login: publicProcedure.input(LoginSchema).mutation(...),
  me: publicProcedure.query(...),
  logout: publicProcedure.mutation(...),
})

// ❌ Errado - Remover procedimentos de auth
// ❌ Errado - Desabilitar autenticação
```

**Verificação Obrigatória:**
- [ ] Rota `/login` existe no `App.tsx` ou router principal
- [ ] Página `Login.tsx` existe e está funcional
- [ ] Botão/link de login está visível na navegação
- [ ] Procedimentos `auth.register` e `auth.login` existem no backend
- [ ] Sistema suporta login com email/senha
- [ ] Sistema suporta OAuth (opcional, mas deve estar implementado se configurado)

**Sistema de Prevenção:**
- Antes de qualquer deploy ou entrega, executar verificação de conformidade
- Se qualquer item de verificação falhar, bloquear a entrega
- Documentar exceções quando autorizadas

**Razão:**
- Autenticação é funcionalidade core do sistema
- Usuários precisam de acesso claro ao login
- Remover login quebra a experiência do usuário
- Sistema deve estar sempre acessível para novos usuários

---

### DOGMA 9: Console Error Prevention - Zero Console Errors in Production
**Prioridade:** P0 - Crítico

**Regra:**
- NENHUM erro deve aparecer no DevTools Console em produção
- Scripts externos (analytics, tracking) DEVEM ser condicionais e ter fallbacks
- Recursos bloqueados por adblockers DEVEM ser tratados graciosamente
- Imports e exports DEVEM estar sempre corretos e verificados
- Variáveis de ambiente DEVEM ser validadas antes do uso
- Logs de desenvolvimento DEVEM ser removidos ou condicionados em produção

**Implementação:**
```typescript
// ✅ Correto - Analytics condicional e seguro
export function initializeAnalytics(): void {
  if (import.meta.env.MODE !== 'production') return;
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  if (!endpoint) return;
  
  script.onerror = () => {
    // Silently handle - analytics is optional
    if (import.meta.env.DEV) console.debug('[Analytics] Blocked');
  };
}

// ❌ Errado - Script hardcoded no HTML sem validação
<script src="%VITE_ANALYTICS_ENDPOINT%/umami"></script>

// ✅ Correto - Exports sempre verificados
export const isOAuthConfigured = (): boolean => {
  // Implementation
};

// ❌ Errado - Import de export inexistente
import { isOAuthConfigured } from "@/const"; // Se não existe, causa erro
```

**Verificações Obrigatórias:**
- [ ] Nenhum script externo carregado sem validação de variáveis de ambiente
- [ ] Todos os imports verificados e exports existentes
- [ ] Recursos externos têm tratamento de erro (onerror handlers)
- [ ] Logs condicionados por ambiente (DEV vs PROD)
- [ ] Analytics e tracking são opcionais e não quebram a aplicação se bloqueados

**Prevenção de Erros Comuns:**
1. **Analytics bloqueado por adblocker:** Usar onerror handler e não quebrar app
2. **Variável de ambiente não definida:** Validar antes de usar
3. **Export não encontrado:** Verificar exports antes de importar
4. **Script externo falhando:** Usar try/catch e fallbacks
5. **MIME type incorreto:** Validar URLs antes de carregar scripts

**Razão:**
- Erros no console indicam problemas no código
- Scripts externos bloqueados não devem quebrar a aplicação
- Experiência do usuário não deve ser afetada por recursos opcionais
- Desenvolvimento deve ser facilitado com logs apropriados

---

### DOGMA 10: Database Auto-Initialization - Zero Database Errors
**Prioridade:** P0 - Crítico

**Regra:**
- O sistema DEVE inicializar o banco de dados automaticamente se não existir
- Se `DATABASE_URL` não estiver configurado em desenvolvimento, DEVE usar o padrão SQLite (`sqlite:./database.db`)
- O banco de dados DEVE ser criado automaticamente na primeira execução
- O schema DEVE ser inicializado automaticamente se o banco estiver vazio
- NUNCA retornar `null` de `getDb()` sem tentar inicializar primeiro
- Mensagens de erro DEVEM ser úteis e acionáveis

**Implementação:**
```typescript
// ✅ Correto - Auto-inicialização com padrão e recuperação
export async function getDb() {
  if (!_db) {
    let dbUrl = process.env.DATABASE_URL;
    
    // DOGMA 6: Use SQLite as default in development
    if (!dbUrl && process.env.NODE_ENV !== "production") {
      dbUrl = "sqlite:./database.db"; // Padrão automático
    }
    
    // DOGMA 10: Detectar banco vazio (0 bytes) e recriar
    if (fs.existsSync(filePath) && fs.statSync(filePath).size === 0) {
      fs.unlinkSync(filePath); // Remove banco vazio
    }
    
    // DOGMA 10: Sempre inicializar schema (SQLite trata IF NOT EXISTS)
    _sqliteDb.exec(`CREATE TABLE IF NOT EXISTS users (...)`);
    
    // DOGMA 10: Tentar recuperar se houver erro
    try {
      _db = drizzleSQLite(_sqliteDb);
    } catch (error) {
      // Recuperar deletando e recriando
      fs.unlinkSync(filePath);
      _sqliteDb = new Database(filePath);
      _sqliteDb.exec(`CREATE TABLE IF NOT EXISTS users (...)`);
      _db = drizzleSQLite(_sqliteDb);
    }
  }
  return _db; // Nunca retorna null
}

// ❌ Errado - Retorna null sem tentar inicializar
if (!dbUrl) {
  return null; // Viola DOGMA 10
}

// ❌ Errado - Não detecta banco vazio
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, ""); // Cria vazio mas não inicializa
}
```

**Verificações Obrigatórias:**
- [ ] `getDb()` nunca retorna `null` sem tentar inicializar primeiro
- [ ] Padrão SQLite é usado automaticamente em desenvolvimento
- [ ] Banco de dados é criado automaticamente se não existir
- [ ] Schema é inicializado automaticamente se banco estiver vazio
- [ ] Mensagens de erro são úteis e acionáveis

**Prevenção de Erros:**
1. **DATABASE_URL não configurado:** Usar padrão SQLite em desenvolvimento
2. **Banco não existe:** Criar automaticamente
3. **Banco vazio (0 bytes):** Detectar e recriar automaticamente
4. **Schema não inicializado:** Sempre inicializar (usar CREATE TABLE IF NOT EXISTS)
5. **Banco corrompido:** Tentar recuperar deletando e recriando
6. **Permissões:** Verificar e criar diretório se necessário
7. **Erros de conexão:** Nunca retornar null - sempre lançar erro explícito com detalhes
8. **Módulo nativo não compilado (better-sqlite3):** Detectar erro específico e fornecer instruções claras para `pnpm rebuild better-sqlite3`
9. **JWT_SECRET vazio:** Usar chave padrão em desenvolvimento, validar mínimo de 32 caracteres, lançar erro explícito em produção
10. **VITE_APP_ID vazio:** Usar appId padrão em desenvolvimento, lançar erro explícito em produção

**Razão:**
- Desenvolvedores não devem precisar configurar manualmente o banco
- Sistema deve funcionar "out of the box" em desenvolvimento
- Erros de banco devem ser prevenidos, não apenas tratados
- Experiência de desenvolvimento deve ser fluida
- Erros de módulos nativos devem ser detectados e ter soluções claras

**Erros Específicos Tratados:**
- **"Could not locate the bindings file"**: Indica que `better-sqlite3` precisa ser recompilado
  - Solução: `pnpm rebuild better-sqlite3` ou `pnpm install --force`
  - Sistema detecta automaticamente e fornece instruções claras

### DOGMA 11: Flight Search API Error Prevention - Zero API Errors in Console
**Prioridade:** P0 - Crítico  
**Versão:** 1.6.0  
**Data de Estabelecimento:** 2025-01-02

**Regra:**
- APIs de busca de voos (Amadeus, Duffel, etc.) DEVEM validar credenciais antes de fazer chamadas
- Erros de API não configurada NUNCA devem aparecer como erros 500 no console
- Sistema deve fornecer mensagens amigáveis quando API não está disponível
- Busca de aeroportos deve ter fallback quando API não está configurada
- TODOS os erros de API devem ser tratados explicitamente e retornar mensagens claras

**Implementação:**
1. **Validação de Credenciais:**
   - Verificar se `AMADEUS_API_KEY` e `AMADEUS_API_SECRET` estão configurados
   - Se não configurados, retornar erro amigável, não lançar exceção não tratada

2. **Tratamento de Erros:**
   - Erros de API devem ser capturados e retornados como TRPCError com código apropriado
   - Nunca permitir que erros de API causem erros 500 não tratados
   - Mensagens de erro devem ser claras e orientar o usuário

3. **Fallback para Busca de Aeroportos:**
   - Se API não disponível, fornecer lista estática de aeroportos principais
   - Ou retornar mensagem clara de que API não está configurada
   - Inputs de aeroportos devem funcionar mesmo sem API

4. **Prevenção de Erros no Console:**
   - Erros de API não configurada não devem aparecer como "Failed to load resource: 500"
   - Usar DOGMA 9 para prevenir erros no console
   - Logs de erro apenas em desenvolvimento, nunca em produção

**Exemplos:**
```typescript
// ✅ Correto - Validar antes de usar
export async function searchLocations(keyword: string): Promise<LocationSearchResult[]> {
  // DOGMA 11: Validar credenciais antes de fazer chamada
  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    // Retornar lista estática ou erro amigável, não lançar exceção
    return getStaticAirports(keyword);
  }
  
  try {
    const token = await getAmadeusToken();
    // ... fazer chamada
  } catch (error) {
    // DOGMA 2: Tratamento explícito de erros
    console.error("[Flight API] Error:", error);
    return getStaticAirports(keyword); // Fallback
  }
}

// ❌ Errado - Lançar erro não tratado
export async function searchLocations(keyword: string) {
  const token = await getAmadeusToken(); // Pode lançar erro se não configurado
  // ...
}
```

**Razão:**
- Erros 500 no console violam DOGMA 9 (Zero Console Errors)
- Usuários não devem ver erros técnicos de API não configurada
- Sistema deve funcionar graciosamente mesmo sem APIs externas configuradas
- Desenvolvedores precisam de mensagens claras sobre configuração faltando

**Erros Específicos Tratados:**
- **"Amadeus API credentials not configured"**: Retornar lista estática de aeroportos ou mensagem amigável
- **"Failed to load resource: 500"**: Prevenir com validação prévia e tratamento de erros
- **Inputs de aeroportos não populados**: Fornecer fallback estático ou mensagem clara

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
- [x] DOGMA 6: SQLite as default database for development
- [x] DOGMA 7: Canonical Law Compliance - No Changes Without Authorization
- [x] DOGMA 8: Authentication System Is Mandatory and Must Be Visible
- [x] DOGMA 9: Console Error Prevention - Zero Console Errors in Production
- [x] DOGMA 10: Database Auto-Initialization - Zero Database Errors

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

**Última atualização:** 2025-01-02
**Versão:** 1.5.0

**Mudanças na versão 1.1.0:**
- Adicionado DOGMA 6: SQLite as default database for development

**Mudanças na versão 1.2.0:**
- Adicionado DOGMA 7: Canonical Law Compliance - No Changes Without Authorization
- Estabelecido processo obrigatório de consulta às leis antes de alterações
- Estabelecido princípio de não remover funcionalidades sem autorização

**Mudanças na versão 1.3.0:**
- Adicionado DOGMA 8: Authentication System Is Mandatory and Must Be Visible
- Criado sistema de verificação automática de conformidade (`verify-canonical-compliance.ts`)
- Estabelecido checklist obrigatório de verificação antes de deploy/entrega
- Adicionado script `pnpm verify:canonical` para verificação automática

**Mudanças na versão 1.4.0:**
- Adicionado DOGMA 9: Console Error Prevention - Zero Console Errors in Production
- Corrigidos todos os erros de console (analytics, exports, logs)
- Criado sistema seguro de inicialização de analytics

**Mudanças na versão 1.5.0:**
- Adicionado DOGMA 10: Database Auto-Initialization - Zero Database Errors
- Sistema agora usa padrão SQLite automaticamente em desenvolvimento
- Banco de dados é criado e inicializado automaticamente
- Mensagens de erro melhoradas e mais acionáveis

Este documento deve ser atualizado sempre que novas leis forem adicionadas ou leis existentes forem modificadas.


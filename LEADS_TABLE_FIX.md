# 🔧 Correção: Tabela `leads` Ausente no SQLite

## ❌ Problema Identificado

O formulário "Request Quote" estava falhando com erro SQLite:
```
no such table: leads
```

## 🔍 Causa Raiz

1. **Schema MySQL vs SQLite:** O código importava `leads` de `drizzle/schema` (MySQL), mas o projeto está usando SQLite
2. **Schema SQLite incompleto:** O arquivo `drizzle/schema.sqlite.ts` não tinha a tabela `leads` definida
3. **Inicialização incompleta:** O `db.ts` só criava a tabela `users` no SQLite, não criava `leads` nem `flightSearches`

## ✅ Solução Implementada

### 1. Adicionada Tabela `leads` ao Schema SQLite

**Arquivo:** `drizzle/schema.sqlite.ts`

Adicionada definição completa da tabela `leads` compatível com SQLite:

```typescript
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  type: text("type").notNull(), // "booking" | "quote" | "contact"
  status: text("status").notNull().default("new"),
  // ... todos os campos necessários
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

**Campos incluídos:**
- ✅ `id` (primary key, auto-increment)
- ✅ `name`, `email`, `phone`
- ✅ `type` (booking/quote/contact)
- ✅ `status` (new/contacted/converted/closed)
- ✅ `origin`, `originName`, `destination`, `destinationName`
- ✅ `departureDate`, `returnDate`
- ✅ `adults`, `children`, `infants`
- ✅ `travelClass`
- ✅ `flightDetails` (JSON armazenado como TEXT no SQLite)
- ✅ `estimatedPrice`
- ✅ `message`
- ✅ `preferredLanguage`
- ✅ `createdAt`, `updatedAt` (timestamps)

### 2. Adicionada Tabela `flightSearches` ao Schema SQLite

Também adicionada a tabela `flightSearches` que estava faltando:

```typescript
export const flightSearches = sqliteTable("flightSearches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  // ... todos os campos necessários
  searchedAt: integer("searchedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

### 3. Atualizada Inicialização do Banco de Dados

**Arquivo:** `server/db.ts`

Adicionado CREATE TABLE para `leads` e `flightSearches` durante a inicialização do SQLite:

```sql
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  -- ... todos os campos
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_createdAt ON leads(createdAt);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
```

### 4. Atualizado `routers.ts` para Usar Schema Correto

**Arquivo:** `server/routers.ts`

Criadas funções helper para obter as tabelas corretas baseadas no tipo de banco:

```typescript
function getLeadsTable() {
  const dbType = getDbType();
  return dbType === "sqlite" ? leadsSQLite : leadsMySQL;
}

function getFlightSearchesTable() {
  const dbType = getDbType();
  return dbType === "sqlite" ? flightSearchesSQLite : flightSearchesMySQL;
}
```

Atualizado código para:
- ✅ Usar `getLeadsTable()` em vez de `leads` diretamente
- ✅ Serializar JSON para TEXT no SQLite (`JSON.stringify()`)
- ✅ Deserializar JSON ao ler do SQLite (`JSON.parse()`)
- ✅ Tratamento de erros adequado com `TRPCError`

### 5. Tratamento de Erros Aprimorado

Adicionado tratamento de erros específico:

```typescript
try {
  await db.insert(leadsTable).values(leadData);
} catch (error: any) {
  if (errorMessage.includes("no such table")) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database schema not initialized. Please restart the server to initialize the database.",
    });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `Failed to submit request: ${errorMessage}`,
  });
}
```

## 📋 Arquivos Modificados

### 1. `drizzle/schema.sqlite.ts`
- ✅ Adicionada tabela `leads` completa
- ✅ Adicionada tabela `flightSearches` completa
- ✅ Exportados tipos `Lead`, `InsertLead`, `FlightSearch`, `InsertFlightSearch`

### 2. `server/db.ts`
- ✅ Adicionado CREATE TABLE para `leads` na inicialização do SQLite
- ✅ Adicionado CREATE TABLE para `flightSearches` na inicialização do SQLite
- ✅ Adicionados índices para performance
- ✅ Atualizado bloco de recuperação de erro para incluir as novas tabelas

### 3. `server/routers.ts`
- ✅ Adicionadas funções helper `getLeadsTable()` e `getFlightSearchesTable()`
- ✅ Atualizado `leads.create` para usar schema correto e serializar JSON
- ✅ Atualizado `leads.list` para usar schema correto e deserializar JSON
- ✅ Atualizado `leads.updateStatus` para usar schema correto
- ✅ Atualizado `dashboard.getStats` para usar `flightSearches` correto
- ✅ Atualizado `searchHistory.list` para usar `flightSearches` correto
- ✅ Atualizado `flights.search` para usar `flightSearches` correto
- ✅ Adicionado tratamento de erros robusto com `TRPCError`

## 🎯 Por Que Esta Solução é Correta

### 1. **Compatibilidade Multi-Banco**
- Suporta tanto SQLite (desenvolvimento) quanto MySQL (produção)
- Funções helper garantem uso do schema correto automaticamente
- Não quebra código existente

### 2. **Inicialização Automática**
- Tabelas são criadas automaticamente na primeira conexão
- Usa `CREATE TABLE IF NOT EXISTS` para idempotência
- Segue DOGMA 10 (Database Auto-Initialization)

### 3. **Tratamento de JSON**
- SQLite armazena JSON como TEXT (serializado)
- MySQL tem tipo JSON nativo
- Código trata ambos os casos corretamente

### 4. **Tratamento de Erros**
- Erros específicos (ex: "no such table") retornam mensagens claras
- Todos os erros são convertidos para `TRPCError` apropriado
- Logs estruturados para debugging

## ✅ Critérios de Aceitação Atendidos

- ✅ Submitting "Request Quote" agora funciona
- ✅ Lead record é persistido no SQLite
- ✅ Não há mais erros de runtime de banco de dados
- ✅ Schema é criado de forma canônica e repetível (não manual)
- ✅ Tratamento de erros adequado com `TRPCError`

## 🚀 Como Verificar Localmente

### 1. Verificar se a tabela foi criada:

```powershell
cd C:\Users\njfw2\michels-travel
sqlite3 database.db ".tables"
```

Deve mostrar: `leads`, `flightSearches`, `users`

### 2. Verificar estrutura da tabela:

```powershell
sqlite3 database.db ".schema leads"
```

### 3. Testar inserção manual:

```powershell
sqlite3 database.db "INSERT INTO leads (name, email, type) VALUES ('Test', 'test@example.com', 'quote');"
sqlite3 database.db "SELECT * FROM leads;"
```

### 4. Reiniciar o servidor:

```powershell
cd C:\Users\njfw2\michels-travel
# Pare o servidor (Ctrl+C)
pnpm dev
```

### 5. Testar o formulário:

1. Acesse `http://localhost:3000`
2. Preencha o formulário "Request Quote"
3. Submeta o formulário
4. Deve funcionar sem erros

## 📝 Notas Técnicas

- **Compatibilidade:** Suporta SQLite e MySQL
- **JSON Storage:** SQLite usa TEXT, MySQL usa JSON nativo
- **Auto-inicialização:** Tabelas criadas automaticamente na primeira conexão
- **Índices:** Criados para `email`, `createdAt`, `status` em `leads`
- **Timestamps:** Usa `strftime('%s', 'now')` no SQLite para compatibilidade

---

**Data da Correção:** 2025-01-10
**Status:** ✅ Implementado e Testado
**Arquitetura:** Canonical (DOGMA 6, DOGMA 10)


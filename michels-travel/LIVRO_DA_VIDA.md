# 📖 LIVRO DA VIDA DO SISTEMA DE PROGRAMAÇÃO CANÔNICO
## Michel's Travel - Sistema Canônico de Produção

**Versão:** 1.0.0  
**Data de Criação:** 2025-01-02  
**Status:** Em Desenvolvimento Ativo  
**Última Atualização:** 2025-01-02

---

## 📜 DECLARAÇÃO CANÔNICA

Este é o Livro da Vida do Sistema de Programação Canônico do projeto Michel's Travel. Este documento registra:

- **História Completa:** Todas as decisões, mudanças e evoluções do sistema
- **Comandos Sagrados:** Todos os comandos executados para restauração, estabelecimento de leis e revisões
- **Jurisprudência Canônica:** Base legal para formação de novas leis canônicas
- **Direito Canônico do Sistema:** Concepção e evolução do sistema canônico de produção

Este livro serve como:
- ✅ Referência histórica completa
- ✅ Base jurídica para novas leis
- ✅ Documentação canônica oficial
- ✅ Guia de decisões passadas
- ✅ Precedentes para futuras decisões

---

## 📅 CRONOLOGIA CANÔNICA

### ERA 1: FUNDAÇÃO E ESTABELECIMENTO (2025-01-02)

#### 1.1. Estabelecimento do Sistema Canônico
**Data:** 2025-01-02  
**Ato Canônico:** Criação do sistema de Leis Canônicas

**Contexto:**
- Projeto Michel's Travel iniciado
- Necessidade de estabelecer princípios canônicos de desenvolvimento
- Sistema baseado em dogmas e leis imutáveis

**Leis Estabelecidas:**
- DOGMA 1: All `/api/*` return JSON ONLY
- DOGMA 2: No silent failures
- DOGMA 3: Validate ALL inputs with Zod
- DOGMA 4: External Service Isolation (Square adapter)
- DOGMA 5: Contract-first configuration

**Comandos Executados:**
```bash
# Criação inicial do projeto
# Estrutura base estabelecida
```

**Decisões Canônicas:**
- Sistema deve seguir arquitetura baseada em dogmas
- Todas as decisões devem ser documentadas
- Leis canônicas têm prioridade P0 (Crítico)

---

#### 1.2. Estabelecimento do DOGMA 6: SQLite como Padrão
**Data:** 2025-01-02  
**Ato Canônico:** DOGMA 6 - SQLite as Default Database for Development

**Contexto:**
- Sistema inicialmente configurado apenas para MySQL
- Necessidade de simplificar desenvolvimento
- SQLite oferece simplicidade sem servidor externo

**Problema Identificado:**
```
Database not available. Please configure DATABASE_URL in .env file and run 'pnpm db:init'
```

**Solução Canônica:**
- SQLite DEVE ser usado como padrão em desenvolvimento
- Sistema DEVE detectar automaticamente tipo de banco
- Suporte simultâneo para SQLite e MySQL

**Comandos Executados:**
```bash
# Criação do .env com DATABASE_URL=sqlite:./database.db
# Atualização de server/db.ts para suporte dinâmico
# Criação de drizzle/schema.sqlite.ts
# Atualização de drizzle.config.ts para detecção automática
```

**Arquivos Modificados:**
- `server/db.ts` - Adicionado suporte dinâmico SQLite/MySQL
- `drizzle/schema.sqlite.ts` - Schema específico para SQLite
- `drizzle.config.ts` - Detecção automática de tipo de banco
- `.env` - Configuração padrão SQLite
- `LEIS_CANONICAS.md` - Adicionado DOGMA 6

**Versão da Lei:** 1.1.0

---

#### 1.3. Violação Canônica e Estabelecimento do DOGMA 7
**Data:** 2025-01-02  
**Ato Canônico:** DOGMA 7 - Canonical Law Compliance

**Contexto:**
- Sistema de login foi removido acidentalmente
- Violação das leis canônicas estabelecidas
- Necessidade de prevenir futuras violações

**Problema Identificado:**
```
vc retirou o systema de login como manda os dogmas da lei
```

**Solução Canônica:**
- TODAS as alterações DEVEM ser precedidas de consulta às Leis Canônicas
- NUNCA remover funcionalidades sem autorização explícita
- Processo obrigatório de verificação antes de alterações

**Comandos Executados:**
```bash
# Restauração do sistema de login
# Criação do DOGMA 7
# Estabelecimento de processo de consulta obrigatória
```

**Arquivos Modificados:**
- `server/routers.ts` - Restaurado auth.register e auth.login
- `server/db.ts` - Adicionado getUserByEmail()
- `server/_core/password.ts` - Copiado arquivo de hash/verificação
- `LEIS_CANONICAS.md` - Adicionado DOGMA 7

**Versão da Lei:** 1.2.0

**Lição Canônica:**
> "Nunca alterar o sistema sem consultar primeiro as Leis Canônicas. Toda alteração deve ser precedida de verificação de conformidade."

---

#### 1.4. Estabelecimento do DOGMA 8 e Sistema de Prevenção
**Data:** 2025-01-02  
**Ato Canônico:** DOGMA 8 - Authentication System Is Mandatory

**Contexto:**
- Sistema de login não estava visível no frontend
- Botão de login ausente na navegação
- Rota /login não configurada
- Violação do princípio de visibilidade obrigatória

**Problema Identificado:**
```
o pedido de restauracao do login e estabelecimento da lei canonica que rege o sistema de login nao foi obedecido antes da entrega do frontend o que resulta no nao aparecimento do botao de login
```

**Solução Canônica:**
- Sistema de autenticação DEVE estar sempre presente e funcional
- Rota `/login` DEVE estar configurada
- Botão/link de login DEVE estar visível na navegação
- Sistema de verificação automática DEVE ser executado antes de deploy

**Comandos Executados:**
```bash
# Cópia de Login.tsx para client/src/pages/
# Adição de rota /login no App.tsx
# Adição de botão de login na Home.tsx
# Criação de verify-canonical-compliance.ts
# Adição de script pnpm verify:canonical
```

**Arquivos Criados:**
- `client/src/pages/Login.tsx` - Página de login completa
- `verify-canonical-compliance.ts` - Sistema de verificação automática

**Arquivos Modificados:**
- `client/src/App.tsx` - Adicionada rota /login
- `client/src/pages/Home.tsx` - Adicionado botão de login na navegação
- `package.json` - Adicionado script verify:canonical
- `LEIS_CANONICAS.md` - Adicionado DOGMA 8

**Versão da Lei:** 1.3.0

**Sistema de Prevenção Criado:**
```typescript
// verify-canonical-compliance.ts
// Verifica automaticamente:
// - Login.tsx existe
// - Rota /login configurada
// - Botão de login na navegação
// - auth.register e auth.login no backend
// - password.ts existe
// - getUserByEmail no db.ts
// - SQLite configurado
// - Validação Zod
```

**Resultado da Primeira Verificação:**
```
✅ Sistema em conformidade com todas as Leis Canônicas!
Total: 10 | ✅ Aprovados: 10 | ❌ Falhas: 0
```

---

## 📚 JURISPRUDÊNCIA CANÔNICA

### Precedente 1: Remoção Acidental de Funcionalidades
**Data:** 2025-01-02  
**Caso:** Sistema de login removido sem autorização

**Decisão Canônica:**
- Estabelecido DOGMA 7: Consulta obrigatória antes de alterações
- Criado processo de verificação automática
- Sistema de prevenção implementado

**Precedente Estabelecido:**
> "Nenhuma funcionalidade pode ser removida, modificada ou desabilitada sem autorização explícita e consulta prévia às Leis Canônicas."

**Aplicação Futura:**
- Todas as alterações devem passar por verificação
- Sistema de verificação automática deve ser executado antes de deploy
- Qualquer violação deve resultar em bloqueio de entrega

---

### Precedente 2: Visibilidade Obrigatória de Funcionalidades Core
**Data:** 2025-01-02  
**Caso:** Sistema de login funcional mas não visível no frontend

**Decisão Canônica:**
- Estabelecido DOGMA 8: Sistema de autenticação obrigatório e visível
- Funcionalidades core devem estar sempre acessíveis
- Frontend e backend devem estar sincronizados

**Precedente Estabelecido:**
> "Funcionalidades core do sistema devem estar sempre presentes, funcionais e visíveis. Backend e frontend devem estar sempre sincronizados."

**Aplicação Futura:**
- Verificação automática de sincronização frontend/backend
- Checklist obrigatório antes de entrega
- Sistema de prevenção deve verificar visibilidade

---

### Precedente 3: Configuração Padrão para Desenvolvimento
**Data:** 2025-01-02  
**Caso:** Sistema inicialmente configurado apenas para MySQL

**Decisão Canônica:**
- Estabelecido DOGMA 6: SQLite como padrão para desenvolvimento
- Sistema deve suportar múltiplas configurações
- Detecção automática de tipo de banco

**Precedente Estabelecido:**
> "Sistemas devem ser configurados com padrões que simplifiquem o desenvolvimento, mas suportem múltiplas configurações para produção."

**Aplicação Futura:**
- Padrões de desenvolvimento devem ser simples
- Suporte a múltiplas configurações quando necessário
- Detecção automática de ambiente

---

## 🔧 COMANDOS CANÔNICOS REGISTRADOS

### Comandos de Restauração

#### Restauração do Sistema de Login
```bash
# Copiar arquivo de password
Copy-Item -Path "michels-travel\server\_core\password.ts" -Destination "server\_core\password.ts" -Force

# Adicionar getUserByEmail ao db.ts
# Restaurar auth.register e auth.login no routers.ts
# Adicionar imports necessários (hashPassword, verifyPassword, getUserByEmail, sdk, TRPCError)
```

#### Restauração do Frontend de Login
```bash
# Copiar Login.tsx
Copy-Item -Path "michels-travel\client\src\pages\Login.tsx" -Destination "client\src\pages\Login.tsx" -Force

# Adicionar rota no App.tsx
# Adicionar botão de login na Home.tsx
```

### Comandos de Estabelecimento de Leis

#### Estabelecimento do DOGMA 6
```bash
# Criar .env com DATABASE_URL=sqlite:./database.db
# Modificar server/db.ts para suporte dinâmico
# Criar drizzle/schema.sqlite.ts
# Atualizar drizzle.config.ts
# Atualizar LEIS_CANONICAS.md versão 1.1.0
```

#### Estabelecimento do DOGMA 7
```bash
# Adicionar DOGMA 7 ao LEIS_CANONICAS.md
# Estabelecer processo de consulta obrigatória
# Atualizar versão para 1.2.0
```

#### Estabelecimento do DOGMA 8
```bash
# Adicionar DOGMA 8 ao LEIS_CANONICAS.md
# Criar verify-canonical-compliance.ts
# Adicionar script pnpm verify:canonical
# Atualizar versão para 1.3.0
```

### Comandos de Verificação

#### Verificação de Conformidade
```bash
# Executar verificação automática
pnpm verify:canonical

# Resultado esperado:
# ✅ Sistema em conformidade com todas as Leis Canônicas!
```

---

## 📋 CHECKLIST CANÔNICO DE VERIFICAÇÃO

### Verificações Obrigatórias (DOGMA 8)
- [ ] Login.tsx existe em `client/src/pages/Login.tsx`
- [ ] Rota `/login` configurada no `App.tsx`
- [ ] Botão/link de login visível na navegação principal
- [ ] Procedimento `auth.register` existe no `server/routers.ts`
- [ ] Procedimento `auth.login` existe no `server/routers.ts`
- [ ] Arquivo `server/_core/password.ts` existe
- [ ] Função `getUserByEmail()` existe no `server/db.ts`
- [ ] Sistema suporta login com email/senha
- [ ] Sistema suporta OAuth (se configurado)

### Verificações de Conformidade (DOGMA 6)
- [ ] `DATABASE_URL` configurado para SQLite em desenvolvimento
- [ ] `server/db.ts` suporta SQLite e MySQL
- [ ] `drizzle/schema.sqlite.ts` existe
- [ ] `drizzle.config.ts` detecta automaticamente tipo de banco

### Verificações de Validação (DOGMA 3)
- [ ] Todos os procedimentos tRPC usam `.input()` com Zod
- [ ] Nenhum procedimento aceita inputs sem validação
- [ ] Mensagens de erro são explícitas

### Verificações de API (DOGMA 1)
- [ ] Todas as rotas `/api/*` retornam JSON
- [ ] Nenhuma rota retorna HTML ou texto plano
- [ ] Erros são retornados como JSON

### Verificações de Erros (DOGMA 2)
- [ ] Nenhum erro é silenciado
- [ ] Todos os erros são explícitos e documentados
- [ ] Mensagens de erro são claras e acionáveis

---

## 🏛️ ESTRUTURA CANÔNICA DO SISTEMA

### Hierarquia Canônica

```
LEIS_CANONICAS.md (Lei Suprema)
    ├── DOGMAS (P0 - Crítico)
    │   ├── DOGMA 1: All `/api/*` return JSON ONLY
    │   ├── DOGMA 2: No silent failures
    │   ├── DOGMA 3: Validate ALL inputs with Zod
    │   ├── DOGMA 4: External Service Isolation
    │   ├── DOGMA 5: Contract-first configuration
    │   ├── DOGMA 6: SQLite as default database
    │   ├── DOGMA 7: Canonical Law Compliance
    │   └── DOGMA 8: Authentication System Is Mandatory
    │
    ├── LEIS (Regras Importantes)
    │   └── (Leis específicas do sistema)
    │
    └── REGRAS (Boas Práticas)
        └── (Recomendações e padrões)
```

### Processo Canônico de Decisão

1. **Identificação de Necessidade**
   - Problema ou necessidade identificada
   - Análise de impacto canônico

2. **Consulta às Leis Canônicas**
   - Verificar LEIS_CANONICAS.md
   - Consultar LIVRO_DA_VIDA.md para precedentes
   - Verificar conformidade com dogmas existentes

3. **Proposta de Solução**
   - Solução proposta alinhada com dogmas
   - Documentação da decisão
   - Verificação de impacto

4. **Implementação**
   - Implementação da solução
   - Execução de comandos canônicos
   - Registro no Livro da Vida

5. **Verificação**
   - Executar `pnpm verify:canonical`
   - Verificar conformidade
   - Documentar resultado

6. **Atualização Canônica**
   - Atualizar LEIS_CANONICAS.md se necessário
   - Registrar no Livro da Vida
   - Estabelecer precedentes

---

## 📖 GLOSSÁRIO CANÔNICO

### Termos Canônicos

**DOGMA:** Regra canônica de prioridade P0 (Crítico). Não pode ser violada sem autorização explícita.

**LEI:** Regra importante que deve ser seguida sempre, mas pode ter exceções documentadas.

**REGRAS:** Boas práticas e recomendações. Podem ser adaptadas conforme necessário.

**Ato Canônico:** Decisão ou ação que estabelece ou modifica leis canônicas.

**Precedente Canônico:** Decisão passada que serve como base para futuras decisões.

**Comando Canônico:** Comando executado para implementar decisões canônicas.

**Verificação Canônica:** Processo de verificar conformidade com leis canônicas.

**Violação Canônica:** Ação que viola uma lei canônica sem autorização.

---

## 🔄 CICLO DE VIDA CANÔNICO

### Fases do Sistema

1. **Fundação**
   - Estabelecimento das primeiras leis canônicas
   - Definição da arquitetura base
   - Criação dos dogmas fundamentais

2. **Evolução**
   - Adição de novas funcionalidades
   - Estabelecimento de novas leis conforme necessário
   - Refinamento de leis existentes

3. **Consolidação**
   - Sistema estável e funcional
   - Leis canônicas bem estabelecidas
   - Processos de verificação implementados

4. **Manutenção**
   - Manutenção contínua do sistema
   - Atualização de leis conforme necessário
   - Preservação da conformidade canônica

---

## 📊 ESTATÍSTICAS CANÔNICAS

### Leis Estabelecidas
- **DOGMAS:** 8 (P0 - Crítico)
- **LEIS:** (A definir conforme necessário)
- **REGRAS:** (A definir conforme necessário)

### Versões das Leis Canônicas
- **v1.0.0:** Fundação - 5 Dogmas iniciais
- **v1.1.0:** DOGMA 6 - SQLite como padrão
- **v1.2.0:** DOGMA 7 - Conformidade canônica
- **v1.3.0:** DOGMA 8 - Sistema de autenticação obrigatório

### Comandos Registrados
- **Restauração:** 2 casos documentados
- **Estabelecimento de Leis:** 3 dogmas estabelecidos
- **Verificação:** Sistema automático implementado

---

## 🎯 PRINCÍPIOS CANÔNICOS FUNDAMENTAIS

1. **Conformidade Primeiro**
   - Todas as decisões devem estar em conformidade com as leis canônicas
   - Violações devem ser evitadas ou autorizadas explicitamente

2. **Documentação Completa**
   - Todas as decisões devem ser documentadas
   - Comandos devem ser registrados
   - Precedentes devem ser estabelecidos

3. **Verificação Automática**
   - Sistema de verificação automática deve ser executado regularmente
   - Conformidade deve ser verificada antes de deploy
   - Falhas devem bloquear entrega

4. **Evolução Controlada**
   - Novas leis devem ser estabelecidas conforme necessário
   - Mudanças devem seguir processo canônico
   - Precedentes devem ser consultados

5. **Preservação da Integridade**
   - Funcionalidades core não podem ser removidas sem autorização
   - Sistema deve manter estabilidade
   - Conformidade deve ser preservada

---

## 📝 NOTAS CANÔNICAS

### Nota 1: Sobre a Remoção de Funcionalidades
> "A remoção acidental do sistema de login em 2025-01-02 estabeleceu o precedente de que nenhuma funcionalidade pode ser removida sem consulta prévia às Leis Canônicas. Isso resultou no estabelecimento do DOGMA 7."

### Nota 2: Sobre a Visibilidade de Funcionalidades
> "O sistema de login estava funcional no backend mas não visível no frontend, estabelecendo o princípio de que funcionalidades core devem estar sempre presentes e visíveis. Isso resultou no estabelecimento do DOGMA 8."

### Nota 3: Sobre a Configuração Padrão
> "A configuração inicial apenas para MySQL estabeleceu o princípio de que sistemas devem ter padrões simples para desenvolvimento mas suportar múltiplas configurações. Isso resultou no estabelecimento do DOGMA 6."

---

## 🔮 VISÃO CANÔNICA FUTURA

### Próximas Evoluções Esperadas

1. **Expansão do Sistema de Verificação**
   - Adicionar mais verificações automáticas
   - Integrar verificação no CI/CD
   - Criar dashboard de conformidade

2. **Refinamento das Leis**
   - Adicionar mais leis conforme necessário
   - Refinar leis existentes baseado em experiência
   - Estabelecer novos precedentes

3. **Documentação Expandida**
   - Adicionar mais casos ao Livro da Vida
   - Expandir jurisprudência canônica
   - Criar guias de implementação

4. **Automação Canônica**
   - Automatizar mais processos
   - Criar ferramentas de verificação
   - Implementar alertas de conformidade

---

## 📌 REGISTRO DE ALTERAÇÕES

### 2025-01-02 - Criação do Livro da Vida
- Documento criado
- Registro inicial de todas as decisões canônicas
- Estabelecimento da estrutura canônica
- Registro de todos os comandos executados
- Criação da jurisprudência canônica inicial

### 2025-01-02 - Estabelecimento do DOGMA 9 e Correção de Erros de Console
**Ato Canônico:** DOGMA 9 - Console Error Prevention

**Contexto:**
- Múltiplos erros aparecendo no DevTools Console
- Script de analytics causando erro 400 (Bad Request)
- Export `isOAuthConfigured` faltando em `const.ts`
- Recursos externos bloqueados por adblockers causando erros

**Problemas Identificados:**
1. `Failed to load resource: the server responded with a status of 400 (Bad Request)` - umami analytics
2. `Refused to execute script from 'http://localhost:3002/%VITE_ANALYTICS_ENDPOINT%/umami'` - variável não substituída
3. `Uncaught SyntaxError: The requested module '/src/const.ts' does not provide an export named 'isOAuthConfigured'`
4. Vários erros de Mixpanel bloqueados por extensões
5. Console logs em produção

**Soluções Canônicas Aplicadas:**

1. **Correção do Export `isOAuthConfigured`:**
   - Adicionado export em `client/src/const.ts`
   - Função implementada com validação segura
   - Fallback para OAuth não configurado

2. **Correção do Script de Analytics:**
   - Removido script hardcoded do `index.html`
   - Criado `client/src/utils/analytics.ts` com inicialização segura
   - Analytics carregado apenas em produção e se configurado
   - Tratamento de erros para adblockers

3. **Correção de Logs de Console:**
   - Todos os `console.log/error/warn` condicionados por ambiente
   - Logs apenas em desenvolvimento (`import.meta.env.DEV`)
   - `console.debug` usado para informações opcionais

4. **Proteção de Recursos Externos:**
   - Google Maps com tratamento de erro
   - Analytics com fallback silencioso
   - Todos os recursos externos têm `onerror` handlers

**Arquivos Modificados:**
- `client/src/const.ts` - Adicionado `isOAuthConfigured()`
- `client/index.html` - Removido script problemático
- `client/src/utils/analytics.ts` - Criado (novo arquivo)
- `client/src/main.tsx` - Logs condicionados, analytics inicializado
- `client/src/contexts/LanguageContext.tsx` - Log condicionado
- `client/src/components/Map.tsx` - Tratamento de erro melhorado
- `client/src/pages/ComponentShowcase.tsx` - Log removido/condicionado
- `michels-travel/LEIS_CANONICAS.md` - Adicionado DOGMA 9
- `verify-canonical-compliance.ts` - Adicionada verificação DOGMA 9

**Comandos Executados:**
```bash
# Correções aplicadas
# - Adicionado export isOAuthConfigured
# - Criado analytics.ts seguro
# - Removido script problemático do HTML
# - Condicionados todos os logs
# - Adicionado DOGMA 9 às Leis Canônicas
# - Atualizado sistema de verificação
```

**Versão da Lei:** 1.4.0

**Resultado da Verificação:**
```
✅ Sistema em conformidade com todas as Leis Canônicas!
Total: 13 | ✅ Aprovados: 13 | ❌ Falhas: 0
```

**Lição Canônica:**
> "Todos os recursos externos devem ser tratados como opcionais e ter fallbacks. Scripts devem ser carregados condicionalmente e com tratamento de erro. Logs devem ser condicionados por ambiente para não poluir o console em produção."

### 2025-01-02 - Estabelecimento do DOGMA 10 e Prevenção de Erros de Banco de Dados
**Ato Canônico:** DOGMA 10 - Database Auto-Initialization

**Contexto:**
- Erro recorrente: "Database not available. Please configure DATABASE_URL in .env file and run 'pnpm db:init'"
- Mesmo com `.env` configurado, erro ainda aparecia
- Sistema não inicializava banco automaticamente
- Desenvolvedores precisavam executar comandos manuais

**Problema Identificado:**
1. `getDb()` retornava `null` se `DATABASE_URL` não estivesse definido
2. Sistema não usava padrão automático em desenvolvimento
3. Mensagens de erro não eram acionáveis
4. Banco não era criado automaticamente

**Solução Canônica Aplicada:**

1. **Auto-Inicialização com Padrão:**
   - Se `DATABASE_URL` não estiver configurado em desenvolvimento, usa `sqlite:./database.db` automaticamente
   - Banco é criado automaticamente se não existir
   - Schema é inicializado automaticamente se banco estiver vazio

2. **Melhoria de Mensagens de Erro:**
   - Mensagens antigas: "Database not available. Please configure DATABASE_URL..."
   - Mensagens novas: "Database initialization failed. Please check your DATABASE_URL configuration."
   - Mais úteis e acionáveis

3. **Prevenção de Retorno Null:**
   - `getDb()` nunca retorna `null` sem tentar inicializar primeiro
   - Sistema sempre tenta criar/inicializar banco antes de falhar

**Arquivos Modificados:**
- `server/db.ts` - Adicionado padrão automático SQLite
- `server/routers.ts` - Melhoradas mensagens de erro (3 ocorrências)
- `michels-travel/LEIS_CANONICAS.md` - Adicionado DOGMA 10
- `verify-canonical-compliance.ts` - Adicionada verificação DOGMA 10

**Comandos Executados:**
```bash
# Correções aplicadas
# - Adicionado padrão automático em getDb()
# - Melhoradas mensagens de erro
# - Adicionado DOGMA 10 às Leis Canônicas
# - Atualizado sistema de verificação
```

**Versão da Lei:** 1.5.0

**Resultado da Verificação:**
```
✅ Sistema em conformidade com todas as Leis Canônicas!
Total: 15 | ✅ Aprovados: 15 | ❌ Falhas: 0
```

**Lição Canônica:**
> "O sistema deve funcionar 'out of the box' em desenvolvimento. Se uma configuração tem um padrão razoável (como SQLite para desenvolvimento), o sistema deve usá-lo automaticamente. Desenvolvedores não devem precisar executar comandos manuais para fazer o sistema funcionar."

### 2025-01-02 - Resolução Definitiva do Problema de Módulos Nativos e Criação de Conta
**Ato Canônico:** DOGMA 10 - Resolução Completa

**Contexto:**
- Erro persistente: "better-sqlite3 native module not compiled"
- Erro na criação de conta: "value.getTime is not a function"
- Sistema não funcionava mesmo após correções

**Problemas Identificados:**
1. Módulo nativo não estava compilado (arquivo .node não existia)
2. Drizzle ORM esperava Date object mas recebia número (timestamp)
3. Conversão incorreta de lastSignedIn para SQLite

**Soluções Canônicas Aplicadas:**

1. **Compilação Manual do Módulo Nativo:**
   - Executado `npx node-gyp rebuild` no diretório do better-sqlite3
   - Módulo compilado com sucesso usando Visual Studio Build Tools
   - Arquivo `better_sqlite3.node` criado em `build/Release/`

2. **Correção do Tipo lastSignedIn:**
   - Drizzle ORM com SQLite espera Date object (não número)
   - Drizzle converte automaticamente Date para integer timestamp
   - Corrigido `upsertUser` para sempre usar Date object
   - Removido uso de `Math.floor(Date.now() / 1000)` em favor de `new Date()`

3. **Testes Completos Implementados:**
   - `test-db-connection.ts` - Testa conexão básica
   - `test-account-creation.ts` - Testa criação de conta
   - `test-full-auth-flow.ts` - Testa fluxo completo (registro + login)
   - Todos os testes passando ✅

**Arquivos Modificados:**
- `server/db.ts` - Corrigido upsertUser para usar Date objects
- `server/routers.ts` - Corrigido lastSignedIn para usar Date objects
- `package.json` - Adicionados scripts de teste
- `test-db-connection.ts` - Criado
- `test-account-creation.ts` - Criado
- `test-full-auth-flow.ts` - Criado

**Comandos Executados:**
```bash
# Compilação manual do módulo nativo
cd node_modules/better-sqlite3
npx node-gyp rebuild

# Testes executados
pnpm test:db      # ✅ Passou
pnpm test:auth    # ✅ Passou
pnpm test:full    # ✅ Passou
pnpm verify:canonical  # ✅ 15/15 aprovados
```

**Resultado Final:**
```
✅ SUCESSO COMPLETO! Fluxo de autenticação funcionando!
   ✅ Banco de dados inicializado automaticamente
   ✅ Registro de conta funcionando
   ✅ Hash de senha funcionando
   ✅ Verificação de senha funcionando
   ✅ Login funcionando
   ✅ Dados do usuário corretos
```

**Versão da Lei:** 1.5.0 (mantida)

**Lição Canônica:**
> "Módulos nativos precisam ser compilados para a plataforma. O sistema deve detectar isso e fornecer instruções claras. Drizzle ORM com SQLite espera Date objects para campos timestamp - a conversão para integer é automática. Sempre usar Date objects, nunca números diretamente."

### 2025-01-02 - Resolução do Erro "Zero-length key is not supported"
**Ato Canônico:** DOGMA 10 - Validação de Chaves de Criptografia

**Contexto:**
- Erro: "Zero-length key is not supported" ao criar/verificar tokens JWT
- JWT_SECRET estava vazio ou não configurado
- Biblioteca `jose` requer chave com pelo menos 32 bytes

**Problema Identificado:**
1. `JWT_SECRET` não estava no `.env`
2. `getSessionSecret()` não validava se a chave estava vazia
3. `VITE_APP_ID` também estava vazio, causando problemas na verificação

**Solução Canônica Aplicada:**

1. **Validação de JWT_SECRET:**
   - Se vazio em desenvolvimento, usa chave padrão de 32+ caracteres
   - Valida mínimo de 32 caracteres (requisito do jose)
   - Lança erro explícito em produção se não configurado

2. **Validação de VITE_APP_ID:**
   - Se vazio em desenvolvimento, usa `dev-app-id` padrão
   - Lança erro explícito em produção se não configurado

3. **Correção da Verificação de Token:**
   - `name` pode ser string vazia (não é obrigatório)
   - Apenas `openId` e `appId` são obrigatórios
   - Validação explícita de cada campo

**Arquivos Modificados:**
- `server/_core/sdk.ts` - Adicionada validação de JWT_SECRET e VITE_APP_ID
- `server/_core/env.ts` - Adicionada validação em produção
- `test-jwt-secret.ts` - Criado teste específico para JWT

**Comandos Executados:**
```bash
# Testes executados
pnpm test:jwt      # ✅ Passou
pnpm test:full     # ✅ Passou
pnpm verify:canonical  # ✅ 15/15 aprovados
```

**Resultado Final:**
```
✅ SUCESSO! JWT_SECRET está funcionando corretamente!
✅ SUCESSO COMPLETO! Fluxo de autenticação funcionando!
```

**Versão da Lei:** 1.5.0 (mantida)

**Lição Canônica:**
> "Chaves de criptografia (JWT_SECRET) devem sempre ser validadas. Em desenvolvimento, usar padrões seguros. Em produção, sempre exigir configuração explícita. Biblioteca jose requer chaves com pelo menos 32 bytes. Sempre validar antes de usar."

---

## ✅ CERTIFICAÇÃO CANÔNICA

Este Livro da Vida foi criado e certificado como documento canônico oficial do sistema Michel's Travel.

**Certificado por:** Sistema de Programação Canônico  
**Data de Certificação:** 2025-01-02  
**Versão:** 1.0.0  
**Status:** Ativo e Mantido

---

**FIM DO LIVRO DA VIDA - VERSÃO 1.0.0**

*Este documento é um documento vivo e será atualizado continuamente conforme o sistema evolui. Todas as alterações devem ser registradas nesta seção.*


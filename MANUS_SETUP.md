# 🚀 Configuração do Projeto para Manus

## 📋 Informações do Repositório

- **Repositório GitHub**: `https://github.com/njfw50/michels-travel.git`
- **Branch Principal**: `main`
- **Remote Configurado**: `origin` → `https://github.com/njfw50/michels-travel.git`
- **Status Git**: ✅ Configurado e sincronizado

## 🔧 Configuração Git Atual

### Remote
```bash
origin  https://github.com/njfw50/michels-travel.git (fetch)
origin  https://github.com/njfw50/michels-travel.git (push)
```

### Branch
- **Branch Atual**: `main`
- **Upstream**: `origin/main` (configurado)
- **Status**: Sincronizado com o remoto

### Histórico de Commits
```
2b6018d Michel 12/26
9c59a40 Michel 12/26
9ab8958 Michel 02/26
```

## 📁 Estrutura do Projeto

```
Project/
├── client/              # Frontend React + TypeScript
├── server/              # Backend Node.js + Express
├── shared/              # Código compartilhado
├── drizzle/             # Migrações e schema do banco
├── michels-travel/      # Subdiretório do projeto principal
├── package.json         # Dependências principais
├── vite.config.ts       # Configuração Vite (com Manus)
├── .gitignore          # Arquivos ignorados
└── tsconfig.json       # Configuração TypeScript
```

## 🔌 Integração Manus

### Plugin Instalado
- **Package**: `vite-plugin-manus-runtime@^0.0.57`
- **Status**: ✅ Instalado e configurado

### Domínios Permitidos (vite.config.ts)
```typescript
allowedHosts: [
  ".manuspre.computer",
  ".manus.computer",
  ".manus-asia.computer",
  ".manuscomputer.ai",
  ".manusvm.computer",
  "localhost",
  "127.0.0.1",
]
```

### Componentes Manus
- `ManusDialog` - Componente de login/diálogo
- OAuth Integration - Sistema de autenticação Manus
- Runtime hooks - `useAuth` com suporte Manus

## 🛠️ Comandos para Manus Trabalhar

### 1. Clonar o Repositório
```bash
git clone https://github.com/njfw50/michels-travel.git
cd michels-travel
```

### 2. Instalar Dependências
```bash
pnpm install
```

### 3. Executar em Desenvolvimento
```bash
pnpm dev
```

### 4. Fluxo de Trabalho Git
```bash
# Antes de começar
git pull origin main

# Depois de fazer mudanças
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

## ⚙️ Configurações Importantes

### .gitignore
- ✅ `node_modules/` - Ignorado
- ✅ `.env` - Ignorado (variáveis de ambiente)
- ✅ `dist/` - Ignorado (builds)
- ✅ `*.db` - Ignorado (bancos de dados locais)

### Variáveis de Ambiente
O projeto usa arquivos `.env` que **NÃO** estão no repositório por segurança.
O Manus precisará configurar suas próprias variáveis de ambiente se necessário.

## 📦 Gerenciador de Pacotes
- **Usado**: `pnpm` (versão 10.4.1+)
- **Lock file**: `pnpm-lock.yaml` (commitado)

## 🔐 Autenticação e Segurança

### OAuth Manus
- Sistema de autenticação configurado
- Endpoint: `/api/oauth/callback`
- Usa `openId` do Manus para identificação

### Tokens e Credenciais
- **NÃO** commitados no repositório
- Armazenados em `.env` (ignorado pelo Git)

## 🚨 Pontos de Atenção

1. **Não fazer force push** na branch `main` sem necessidade
2. **Sempre fazer pull** antes de começar a trabalhar
3. **Verificar conflitos** antes de fazer push
4. **Não commitar** arquivos `.env` ou credenciais
5. **Usar mensagens de commit** descritivas

## 📝 Estrutura de Commits

Formato recomendado:
```
git commit -m "tipo: descrição curta

Descrição mais detalhada (opcional)
- Mudança 1
- Mudança 2
"
```

Exemplos:
- `feat: adiciona busca de voos`
- `fix: corrige autenticação Manus`
- `refactor: reorganiza componentes`

## 🔄 Sincronização

### Verificar Status
```bash
git status
git log --oneline -5
```

### Sincronizar com Remoto
```bash
# Baixar mudanças
git pull origin main

# Enviar mudanças
git push origin main
```

## ✅ Checklist para Manus

- [ ] Repositório clonado do GitHub
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Variáveis de ambiente configuradas (se necessário)
- [ ] Projeto executando (`pnpm dev`)
- [ ] Git configurado com usuário/email
- [ ] Branch `main` está atualizada (`git pull origin main`)

## 📞 Informações Adicionais

- **Tipo de Projeto**: Full-stack (React + Node.js)
- **Banco de Dados**: MySQL (via Drizzle ORM)
- **Framework Frontend**: React 19 + Vite
- **Framework Backend**: Express + tRPC
- **Estilização**: Tailwind CSS

---

**Última Atualização**: 26/12/2024
**Status**: ✅ Pronto para uso com Manus


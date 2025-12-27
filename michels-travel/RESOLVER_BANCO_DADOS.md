# 🔧 Resolver Problema de Banco de Dados

## ⚠️ Erro: "Database not available"

Este erro acontece porque o arquivo `.env` não existe ou o banco de dados não foi inicializado.

## 🚀 Solução Rápida (3 passos):

### Passo 1: Criar arquivo `.env`

Crie um arquivo chamado `.env` na raiz de `michels-travel/` com este conteúdo:

```env
DATABASE_URL=sqlite:./database.db
JWT_SECRET=michels-travel-jwt-secret-key-minimum-32-characters-long
```

### Passo 2: Inicializar banco de dados

Execute no terminal (no diretório `michels-travel/`):

```bash
pnpm db:init
```

Isso criará o arquivo `database.db` e a tabela `users`.

### Passo 3: Reiniciar servidor

Pare o servidor (Ctrl+C) e reinicie:

```bash
pnpm dev
```

## ✅ Verificar se funcionou:

1. Acesse: `http://localhost:3000/login`
2. Tente criar uma conta
3. O erro "Database not available" deve desaparecer!

## 🔍 Se ainda não funcionar:

Verifique os logs do servidor. Você deve ver:
- `[Database] ✅ Connected to SQLite: ...`

Se não aparecer, verifique:
1. O arquivo `.env` está na raiz de `michels-travel/`?
2. O arquivo `database.db` foi criado?
3. O servidor foi reiniciado após criar o `.env`?

## 📝 Script Automático:

Você também pode executar:
```powershell
.\configurar-tudo.ps1
```

Isso criará o `.env` e inicializará o banco automaticamente.


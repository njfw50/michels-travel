# ✅ SQLite Configurado com Sucesso!

## 🎉 O que foi feito:

1. ✅ **better-sqlite3 instalado**
2. ✅ **Schema SQLite criado** (`drizzle/schema.sqlite.ts`)
3. ✅ **Código atualizado** para suportar SQLite e MySQL automaticamente
4. ✅ **Scripts de inicialização criados**

## 🚀 Como usar agora:

### Opção 1: Script Automático (Recomendado)

```powershell
# 1. Criar .env
.\init-sqlite.ps1

# 2. Inicializar banco de dados
pnpm db:init

# 3. Reiniciar servidor
pnpm dev
```

### Opção 2: Manual

1. **Criar arquivo `.env`** na raiz de `michels-travel/`:
   ```env
   DATABASE_URL=sqlite:./database.db
   JWT_SECRET=uma-string-secreta-aleatoria-com-pelo-menos-32-caracteres
   ```

2. **Inicializar banco de dados**:
   ```bash
   pnpm db:init
   ```

3. **Reiniciar servidor**:
   ```bash
   pnpm dev
   ```

4. **Acessar e testar**:
   - Acesse: `http://localhost:3000/login`
   - Crie uma conta
   - Faça login!

## 📁 Arquivos Criados:

- `database.db` - Banco de dados SQLite (criado automaticamente)
- `.env` - Configurações (não commitado no Git)

## 🔑 Configurar Admin:

Após criar sua conta:

1. Verifique o console do servidor - ele mostrará seu `openId` (será `email:seu@email.com`)
2. Adicione no `.env`:
   ```env
   OWNER_OPEN_ID=email:seu@email.com
   ```
3. Reinicie o servidor
4. Faça login novamente - você terá permissões de admin!

## ✅ Pronto!

Agora você pode fazer login com email/senha usando SQLite, sem precisar de MySQL ou OAuth!

---

**Nota**: O sistema detecta automaticamente se você está usando SQLite ou MySQL baseado na `DATABASE_URL`. Se quiser voltar para MySQL, apenas mude a `DATABASE_URL` no `.env`.


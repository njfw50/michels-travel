# 🗄️ Como Inicializar SQLite

## ✅ SQLite Configurado!

O sistema agora suporta SQLite. Siga estes passos:

## 📋 Passo a Passo:

### 1. Criar arquivo `.env`

Execute o script:
```powershell
.\init-sqlite.ps1
```

Ou crie manualmente um arquivo `.env` na raiz de `michels-travel/` com:

```env
DATABASE_URL=sqlite:./database.db
JWT_SECRET=uma-string-secreta-aleatoria-com-pelo-menos-32-caracteres
```

### 2. Criar as tabelas no banco

Execute:
```bash
pnpm db:push
```

Isso criará a tabela `users` no banco SQLite.

### 3. Reiniciar o servidor

```bash
pnpm dev
```

### 4. Testar o login

1. Acesse: `http://localhost:3000/login`
2. Clique em "Não tem uma conta? Criar conta"
3. Preencha:
   - Nome
   - Email
   - Senha (mínimo 6 caracteres)
4. Clique em "Criar conta"
5. Você será redirecionado para o dashboard!

## 🔑 Configurar Admin:

Após criar sua conta:

1. Verifique o console do servidor - ele mostrará seu `openId` (será `email:seu@email.com`)
2. Adicione no `.env`:
   ```env
   OWNER_OPEN_ID=email:seu@email.com
   ```
3. Reinicie o servidor
4. Faça login novamente - você terá permissões de admin!

## 📁 Arquivos Criados:

- `database.db` - Banco de dados SQLite (será criado automaticamente)
- `.env` - Configurações (não commitado no Git)

## ✅ Pronto!

Agora você pode fazer login com email/senha sem precisar de MySQL ou OAuth!


# ✅ Sistema de Login Simples Implementado

## 🎉 O que foi feito:

1. **Campo `passwordHash` adicionado** ao schema de usuários
2. **Funções de hash de senha** criadas (`hashPassword`, `verifyPassword`)
3. **Endpoints de autenticação** criados:
   - `auth.register` - Criar conta com email/senha
   - `auth.login` - Fazer login com email/senha
4. **Página de login atualizada** com formulário de email/senha
5. **Sistema de registro** integrado na mesma página

## 🚀 Como usar:

### 1. Instalar dependências

```bash
cd michels-travel
pnpm install
```

Isso instalará `bcryptjs` e `@types/bcryptjs`.

### 2. Atualizar o banco de dados

Execute a migração para adicionar o campo `passwordHash`:

```bash
pnpm db:push
```

### 3. Usar o sistema de login

1. Acesse `http://localhost:3000/login`
2. **Criar conta**:
   - Preencha nome, email e senha
   - Clique em "Criar conta"
3. **Fazer login**:
   - Preencha email e senha
   - Clique em "Entrar"

## 🔐 Como funciona:

- **Registro**: Cria um usuário com `openId = email:${email}` e senha hasheada
- **Login**: Verifica email e senha, cria sessão JWT
- **Autenticação**: O sistema atual já funciona com o `openId` gerado

## 👤 Configurar Admin:

Para dar permissões de admin a um usuário:

1. Faça login com a conta que deseja tornar admin
2. Verifique o console do servidor - ele mostrará o `openId` (será `email:seu@email.com`)
3. Adicione no `.env`:
   ```env
   OWNER_OPEN_ID=email:seu@email.com
   ```
4. Reinicie o servidor
5. Faça login novamente - você terá permissões de admin!

## 📝 Notas:

- O sistema suporta **ambos** os métodos de login:
  - ✅ Email/Senha (novo - implementado agora)
  - ✅ OAuth do Manus (se configurado)
- A senha é hasheada com bcrypt antes de ser armazenada
- O sistema gera um `openId` único para cada email: `email:${email}`

## ⚠️ Importante:

- Certifique-se de ter o banco de dados configurado (`DATABASE_URL` no `.env`)
- Execute `pnpm db:push` para atualizar o schema
- O sistema funciona independente do OAuth do Manus

---

**Pronto!** Agora você pode fazer login com email/senha e acessar o dashboard/admin! 🎉


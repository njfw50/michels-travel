# 🚀 Configurar Login Agora - Guia Rápido

## 📋 O que você precisa:

Para configurar o login e ter acesso ao admin, você precisa das seguintes informações do **Manus OAuth Portal**:

1. **VITE_OAUTH_PORTAL_URL** - URL do portal (ex: `https://portal.manus.computer`)
2. **VITE_APP_ID** - ID da sua aplicação
3. **OAUTH_SERVER_URL** - URL do servidor OAuth (geralmente igual ao portal)
4. **JWT_SECRET** - Chave secreta (pode ser gerada automaticamente)
5. **DATABASE_URL** - URL do banco de dados MySQL

## 🔧 Como Configurar:

### Opção 1: Script Interativo (Recomendado)

1. Abra o PowerShell no diretório `michels-travel`
2. Execute:
   ```powershell
   .\criar-env.ps1
   ```
3. Preencha as informações quando solicitado

### Opção 2: Manual

1. Crie um arquivo `.env` na raiz de `michels-travel/`
2. Copie o conteúdo do arquivo `ENV_EXAMPLE.txt`
3. Preencha os valores:

```env
# OAuth Configuration (Manus) - Frontend
VITE_OAUTH_PORTAL_URL=https://portal.manus.computer
VITE_APP_ID=seu-app-id-aqui

# OAuth Configuration (Manus) - Backend
OAUTH_SERVER_URL=https://oauth.manus.computer
JWT_SECRET=gerar-uma-string-aleatoria-segura-aqui

# Database Configuration
DATABASE_URL=mysql://usuario:senha@localhost:3306/michels_travel
```

## 🔑 Como Obter as Credenciais do Manus OAuth:

1. **Acesse o Portal do Manus**: https://portal.manus.computer
2. **Faça login** na sua conta
3. **Vá em Configurações** ou **Aplicações**
4. **Procure por**:
   - OAuth Portal URL → `VITE_OAUTH_PORTAL_URL` e `OAUTH_SERVER_URL`
   - App ID → `VITE_APP_ID`

> 💡 **Nota**: Se você não tem uma conta no Manus OAuth Portal, você precisará criar uma e registrar sua aplicação primeiro.

## 🔐 Configurar Admin:

Após configurar o `.env` e fazer o primeiro login:

1. **Faça login** em `http://localhost:3000/login`
2. **Verifique o console do servidor** - ele mostrará seu `openId`
3. **Adicione no `.env`**:
   ```env
   OWNER_OPEN_ID=seu-open-id-aqui
   ```
4. **Reinicie o servidor**
5. **Faça login novamente** - você terá permissões de admin!

## ✅ Depois de Configurar:

1. **Reinicie o servidor**: `pnpm dev`
2. **Teste o login**: Acesse `http://localhost:3000/login`
3. **Clique em "Entrar com Manus"**
4. **Você será redirecionado** para o portal de autenticação

## 📝 Gerar JWT_SECRET Automaticamente:

Se você não quiser gerar manualmente, o script `criar-env.ps1` gera automaticamente quando você pressiona Enter.

Ou use este comando PowerShell:
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

## ⚠️ Importante:

- O arquivo `.env` **NÃO** deve ser commitado no Git (já está no `.gitignore`)
- Mantenha as credenciais seguras
- Nunca compartilhe o arquivo `.env`

---

**Precisa de ajuda?** Veja também:
- `COMO_OBTER_CREDENCIAIS_OAUTH.md` - Guia detalhado
- `GUIA_CONFIGURAR_OAUTH.md` - Guia completo


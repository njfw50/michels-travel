# 🔐 Como Configurar o Login

## 📋 Passo a Passo

### 1. Criar arquivo `.env`

Na raiz do projeto `michels-travel/`, crie um arquivo chamado `.env` com o seguinte conteúdo:

```env
# OAuth Configuration (Manus) - OBRIGATÓRIO para login
VITE_OAUTH_PORTAL_URL=https://portal.manus.computer
VITE_APP_ID=seu-app-id-aqui

# Backend OAuth (Server-side) - OBRIGATÓRIO
OAUTH_SERVER_URL=https://oauth.manus.computer
JWT_SECRET=seu-jwt-secret-aqui

# Database - OBRIGATÓRIO
DATABASE_URL=mysql://usuario:senha@localhost:3306/michels_travel
```

### 2. Onde obter as informações:

#### VITE_OAUTH_PORTAL_URL e VITE_APP_ID
- Acesse o portal do Manus
- Vá em **Configurações da Aplicação**
- Copie a **URL do portal OAuth** e o **App ID**

#### OAUTH_SERVER_URL
- Geralmente é a mesma URL base do portal OAuth
- Exemplo: `https://oauth.manus.computer`

#### JWT_SECRET
- Gere uma string aleatória segura
- Pode usar: `openssl rand -base64 32`
- Ou qualquer string longa e aleatória

### 3. Reiniciar o servidor

Após criar o arquivo `.env`:
```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
pnpm dev
```

### 4. Testar

1. Acesse `http://localhost:3000/login`
2. Clique em "Entrar com Manus"
3. Você será redirecionado para o portal de autenticação

## ⚠️ Importante

- O arquivo `.env` **NÃO** deve ser commitado no Git (já está no .gitignore)
- Mantenha as credenciais seguras
- Nunca compartilhe o arquivo `.env`

## 🔍 Verificar se está funcionando

Se o login estiver configurado corretamente:
- A página `/login` mostrará o botão "Entrar com Manus"
- Ao clicar, você será redirecionado para o portal OAuth
- Após login, voltará para o site autenticado

---

**Precisa de ajuda?** Verifique os logs do console do navegador e do servidor para mais detalhes.


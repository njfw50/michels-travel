# 🔐 Como Obter Credenciais do Manus OAuth

## 📌 O que você precisa:

1. **VITE_OAUTH_PORTAL_URL** - URL do portal OAuth
2. **VITE_APP_ID** - ID da sua aplicação
3. **OAUTH_SERVER_URL** - URL do servidor OAuth (geralmente igual ao portal)

## 🚀 Passo a Passo:

### Opção 1: Se você já tem uma conta no Manus

1. Acesse o **Portal do Manus**: https://portal.manus.computer
2. Faça login na sua conta
3. Vá em **Configurações** ou **Aplicações**
4. Procure por:
   - **OAuth Portal URL** → Use como `VITE_OAUTH_PORTAL_URL` e `OAUTH_SERVER_URL`
   - **App ID** ou **Application ID** → Use como `VITE_APP_ID`

### Opção 2: Se você NÃO tem uma conta no Manus

O Manus OAuth Portal é um serviço de autenticação. Você precisa:

1. **Criar uma conta** no portal do Manus
2. **Registrar sua aplicação** no portal
3. **Obter as credenciais** da aplicação

## 💡 Valores Padrão (se disponíveis):

Se você estiver usando o Manus em desenvolvimento, os valores padrão podem ser:

```env
VITE_OAUTH_PORTAL_URL=https://portal.manus.computer
OAUTH_SERVER_URL=https://oauth.manus.computer
VITE_APP_ID=seu-app-id-aqui
```

## ⚠️ Importante:

- O **Manus OAuth Portal** é um serviço separado do **Manus AI Assistant**
- Você precisa ter uma conta e uma aplicação registrada no portal
- Se você não tem acesso ao portal, pode precisar criar uma conta primeiro

## 🔑 Depois de Configurar:

1. Execute o script: `.\criar-env.ps1`
2. Preencha as informações quando solicitado
3. Reinicie o servidor: `pnpm dev`
4. Teste o login em: `http://localhost:3000/login`

## 📝 Para Configurar Admin:

Após fazer o primeiro login:
1. Verifique o console do servidor - ele mostrará seu `openId`
2. Adicione no `.env`: `OWNER_OPEN_ID=seu-open-id-aqui`
3. Reinicie o servidor
4. Faça login novamente - você terá permissões de admin!

---

**Precisa de ajuda?** Verifique os logs do servidor para mais informações.


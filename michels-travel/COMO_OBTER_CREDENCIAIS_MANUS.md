# 🔑 Como Obter Credenciais do Manus

## 📋 Passo a Passo

### 1. Acessar o Portal Manus

1. Acesse o portal do Manus (geralmente em `https://portal.manus.computer` ou similar)
2. Faça login com sua conta Manus

### 2. Criar ou Acessar Aplicação

1. No portal, vá em **"Aplicações"** ou **"Apps"**
2. Se já tem uma aplicação:
   - Clique na aplicação existente
   - Vá em **"Configurações"** ou **"Settings"**
3. Se não tem:
   - Clique em **"Criar Nova Aplicação"** ou **"New App"**
   - Preencha os dados básicos
   - Salve

### 3. Obter as Credenciais

Na página de configurações da aplicação, você encontrará:

#### VITE_OAUTH_PORTAL_URL
- Procure por: **"OAuth Portal URL"**, **"Portal URL"**, ou **"Auth URL"**
- Exemplo: `https://portal.manus.computer`
- Copie esta URL

#### VITE_APP_ID
- Procure por: **"App ID"**, **"Application ID"**, ou **"Client ID"**
- Geralmente é uma string alfanumérica
- Copie este ID

#### OAUTH_SERVER_URL
- Geralmente é a mesma URL base do portal
- Ou procure por: **"OAuth Server URL"**, **"API URL"**
- Exemplo: `https://oauth.manus.computer`

### 4. Configurar Redirect URI

No portal, configure o Redirect URI para:
```
http://localhost:3000/api/oauth/callback
```

E para produção (quando fizer deploy):
```
https://seu-dominio.com/api/oauth/callback
```

## 🔍 Onde Procurar

Se não encontrar essas opções:

1. **Verifique a documentação do Manus**
   - Procure por "OAuth Setup" ou "Authentication"
   - Veja exemplos de configuração

2. **Entre em contato com suporte**
   - Portal Manus geralmente tem suporte
   - Pergunte sobre "OAuth credentials" ou "App credentials"

3. **Verifique se está no ambiente correto**
   - Pode haver ambientes de desenvolvimento e produção
   - Use o ambiente de desenvolvimento para testes

## ⚠️ Importante

- **Mantenha as credenciais seguras**
- **Nunca compartilhe o App ID publicamente**
- **Use diferentes credenciais para desenvolvimento e produção**

## 📝 Template de Perguntas para Suporte

Se precisar de ajuda, pergunte:

> "Olá, preciso configurar OAuth para minha aplicação. Onde encontro:
> - OAuth Portal URL
> - App ID
> - OAuth Server URL
> 
> E como configuro o Redirect URI para http://localhost:3000/api/oauth/callback?"

---

**Dica**: Se você está usando o Manus pela primeira vez, pode ser necessário criar uma conta e uma aplicação primeiro.


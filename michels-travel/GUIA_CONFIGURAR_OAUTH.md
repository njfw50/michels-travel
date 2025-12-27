# 🔐 Guia Completo: Configurar OAuth

## 📋 O que você precisa

Para configurar o OAuth, você precisa das seguintes informações do portal Manus:

1. **VITE_OAUTH_PORTAL_URL** - URL do portal OAuth
2. **VITE_APP_ID** - ID da sua aplicação
3. **OAUTH_SERVER_URL** - URL do servidor OAuth
4. **JWT_SECRET** - Chave secreta (pode gerar)
5. **DATABASE_URL** - URL de conexão do banco MySQL

## 🚀 Método 1: Script Interativo (Recomendado)

Execute o script que criamos:

```powershell
cd michels-travel
.\criar-env.ps1
```

O script vai perguntar cada informação e criar o arquivo `.env` automaticamente.

## 📝 Método 2: Criar Manualmente

### Passo 1: Criar arquivo `.env`

No diretório `michels-travel/`, crie um arquivo chamado `.env` (sem extensão).

### Passo 2: Copiar o template

Abra o arquivo `ENV_EXAMPLE.txt` e copie o conteúdo para o `.env`.

### Passo 3: Preencher os valores

Substitua os valores de exemplo pelos seus valores reais:

```env
# OAuth - Frontend
VITE_OAUTH_PORTAL_URL=https://portal.manus.computer
VITE_APP_ID=seu-app-id-real-aqui

# OAuth - Backend  
OAUTH_SERVER_URL=https://oauth.manus.computer
JWT_SECRET=uma-string-aleatoria-segura-de-32-caracteres-minimo

# Database
DATABASE_URL=mysql://usuario:senha@localhost:3306/michels_travel
```

## 🔑 Onde obter as informações

### VITE_OAUTH_PORTAL_URL e VITE_APP_ID

1. Acesse o portal do Manus
2. Vá em **Configurações da Aplicação** ou **App Settings**
3. Copie:
   - **Portal URL**: URL do portal OAuth
   - **App ID**: ID da aplicação

### OAUTH_SERVER_URL

- Geralmente é a mesma URL base do portal
- Exemplo: Se o portal é `https://portal.manus.computer`, o servidor pode ser `https://oauth.manus.computer`

### JWT_SECRET

Gere uma string aleatória segura:

**Windows PowerShell:**
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Ou use qualquer string longa e aleatória** (mínimo 32 caracteres)

### DATABASE_URL

Formato: `mysql://usuario:senha@host:porta/nome_do_banco`

Exemplo:
```env
DATABASE_URL=mysql://root:minhasenha@localhost:3306/michels_travel
```

## ✅ Verificar Configuração

Após criar o `.env`:

1. **Reinicie o servidor:**
   ```bash
   # Pare o servidor (Ctrl+C)
   pnpm dev
   ```

2. **Teste o login:**
   - Acesse: `http://localhost:3000/login`
   - Deve aparecer o botão "Entrar com Manus"
   - Ao clicar, deve redirecionar para o portal OAuth

## 🔍 Troubleshooting

### Erro: "OAuth não configurado"
- Verifique se o arquivo `.env` está na raiz de `michels-travel/`
- Verifique se as variáveis começam com `VITE_` para o frontend
- Reinicie o servidor após criar/editar o `.env`

### Erro: "Invalid OAuth portal URL"
- Verifique se a URL está correta (deve começar com `https://`)
- Verifique se não há espaços extras

### Login não redireciona
- Verifique o console do navegador (F12) para erros
- Verifique os logs do servidor
- Confirme que `VITE_OAUTH_PORTAL_URL` e `VITE_APP_ID` estão corretos

## 📞 Precisa de ajuda?

Se você não tem as credenciais do Manus ainda:
1. Acesse o portal do Manus
2. Crie uma nova aplicação ou use uma existente
3. Copie as credenciais fornecidas

---

**Última atualização**: 26/12/2024


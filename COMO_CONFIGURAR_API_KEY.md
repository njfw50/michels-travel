# 🔑 Como Configurar a Chave de API (DUFFEL_API_KEY)

## 📍 Localização do Arquivo

A chave de API deve ser inserida no arquivo `.env` na **raiz do projeto**:

```
C:\Users\njfw2\michels-travel\.env
```

## 📝 Como Criar/Editar o Arquivo .env

### Opção 1: Criar a partir do exemplo

1. **Copie o arquivo de exemplo:**
   ```powershell
   cd C:\Users\njfw2\michels-travel
   copy ENV_EXAMPLE.txt .env
   ```

2. **Edite o arquivo `.env`** e adicione sua chave:
   ```
   DUFFEL_API_KEY=sua-nova-chave-aqui
   ```

### Opção 2: Criar manualmente

1. **Crie o arquivo `.env`** na raiz do projeto:
   ```
   C:\Users\njfw2\michels-travel\.env
   ```

2. **Adicione o seguinte conteúdo:**

```env
# ============================================
# Configuração Essencial
# ============================================

# JWT Secret - Chave secreta para autenticação
# Gere uma string aleatória segura (mínimo 32 caracteres)
JWT_SECRET=sua-chave-jwt-secreta-aqui-minimo-32-caracteres

# Database Configuration
# DOGMA 6: SQLite as default database for development
DATABASE_URL=sqlite:./database.db

# ============================================
# Flight Search API - DUFFEL
# ============================================
# DOGMA 11: Duffel é a API oficial - NUNCA usar Amadeus
# Obtenha sua API key em: https://duffel.com
DUFFEL_API_KEY=sua-nova-duffel-api-key-aqui

# ============================================
# Configurações Opcionais (OAuth)
# ============================================

# OAuth Configuration (Manus) - Frontend
# VITE_OAUTH_PORTAL_URL=https://portal.manus.computer
# VITE_APP_ID=seu-app-id-aqui

# OAuth Configuration (Manus) - Backend
# OAUTH_SERVER_URL=https://oauth.manus.computer

# Owner OpenID (opcional - para dar permissões de admin)
# OWNER_OPEN_ID=seu-open-id-aqui
```

## ✅ Variáveis Obrigatórias

Para o sistema funcionar, você **DEVE** configurar:

1. **`DUFFEL_API_KEY`** - Para busca de voos
   ```env
   DUFFEL_API_KEY=duffel_live_xxxxxxxxxxxxx
   ```

2. **`JWT_SECRET`** - Para autenticação
   ```env
   JWT_SECRET=uma-string-aleatoria-segura-com-pelo-menos-32-caracteres
   ```

3. **`DATABASE_URL`** - Para banco de dados (opcional em desenvolvimento)
   ```env
   DATABASE_URL=sqlite:./database.db
   ```

## 🔍 Como Verificar se Está Configurado

### 1. Verificar se o arquivo existe:
```powershell
cd C:\Users\njfw2\michels-travel
Test-Path .env
```

### 2. Verificar se a chave está no arquivo:
```powershell
Select-String -Path .env -Pattern "DUFFEL_API_KEY"
```

### 3. Testar se o servidor lê a chave:
```powershell
# Inicie o servidor e tente fazer uma busca de voos
# Se a chave estiver configurada, a busca funcionará
# Se não estiver, verá: "Flight search service is not configured"
```

## ⚠️ Importante

1. **Nunca commite o arquivo `.env`** no Git (deve estar no `.gitignore`)
2. **Reinicie o servidor** após alterar o `.env`
3. **A chave deve ser válida** - obtenha em https://duffel.com

## 🚀 Após Configurar

1. **Pare o servidor** (Ctrl+C)
2. **Reinicie o servidor:**
   ```powershell
   cd C:\Users\njfw2\michels-travel
   pnpm dev
   ```
3. **Teste a busca de voos** - deve funcionar agora!

## 📋 Exemplo Completo de .env

```env
# Configuração Essencial
JWT_SECRET=minha-chave-secreta-super-segura-com-32-caracteres-minimo
DATABASE_URL=sqlite:./database.db

# Flight Search API - DUFFEL
DUFFEL_API_KEY=duffel_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

**Arquivo a editar:** `C:\Users\njfw2\michels-travel\.env`


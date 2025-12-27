# ✅ Solução Final - Banco de Dados

## ⚠️ Não precisa instalar sqlite3 via pip!

O `sqlite3` via pip é para Python, não para Node.js. O projeto usa `better-sqlite3` que já está instalado.

## 🔧 O que foi feito:

Modifiquei o código para **criar o banco automaticamente** quando o servidor iniciar. Agora você só precisa:

### 1. Criar arquivo `.env`

Crie um arquivo `.env` na raiz de `michels-travel/` com:

```
DATABASE_URL=sqlite:./database.db
JWT_SECRET=michels-travel-jwt-secret-key-minimum-32-characters-long
```

**No PowerShell:**
```powershell
@"
DATABASE_URL=sqlite:./database.db
JWT_SECRET=michels-travel-jwt-secret-key-minimum-32-characters-long
"@ | Out-File -FilePath .env -Encoding utf8 -NoNewline
```

### 2. Recompilar better-sqlite3 (se necessário)

Se o `better-sqlite3` não estiver compilado, execute:

```powershell
pnpm rebuild better-sqlite3
```

Se não funcionar:
```powershell
pnpm remove better-sqlite3
pnpm add better-sqlite3
```

### 3. Reiniciar servidor

```powershell
pnpm dev
```

## ✅ O que acontece agora:

1. O servidor detecta que o banco não existe
2. **Cria automaticamente** o arquivo `database.db`
3. **Cria automaticamente** a tabela `users` com o schema correto
4. Você pode usar o login imediatamente!

## 🔍 Verificar se funcionou:

Nos logs do servidor, você deve ver:
```
[Database] Created SQLite database file: ...
[Database] Initializing database schema...
[Database] ✅ Schema initialized successfully
[Database] ✅ Connected to SQLite: ...
```

## ❌ Se ainda der erro:

O erro pode ser que o `better-sqlite3` não foi compilado. Nesse caso:

1. Instale as ferramentas de build do Windows:
   - Baixe: https://visualstudio.microsoft.com/downloads/
   - Instale "Desktop development with C++"

2. Ou use uma alternativa:
   - Remova `better-sqlite3` e use `sql.js` (mais lento, mas não precisa compilar)

Mas tente primeiro apenas criar o `.env` e reiniciar o servidor - o código agora cria tudo automaticamente!


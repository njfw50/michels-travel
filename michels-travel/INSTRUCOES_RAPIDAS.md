# ⚡ Instruções Rápidas - Resolver Banco de Dados

## 🔴 Problema: "Database not available"

## ✅ Solução (Execute no terminal dentro de `michels-travel/`):

### 1. Recompilar better-sqlite3:
```bash
pnpm rebuild better-sqlite3
```

### 2. Criar arquivo `.env`:

**No PowerShell:**
```powershell
@"
DATABASE_URL=sqlite:./database.db
JWT_SECRET=michels-travel-jwt-secret-key-minimum-32-characters-long
"@ | Out-File -FilePath .env -Encoding utf8 -NoNewline
```

**Ou crie manualmente** um arquivo `.env` na raiz de `michels-travel/` com:
```
DATABASE_URL=sqlite:./database.db
JWT_SECRET=michels-travel-jwt-secret-key-minimum-32-characters-long
```

### 3. Inicializar banco de dados:
```bash
pnpm db:init
```

### 4. Reiniciar servidor:
```bash
pnpm dev
```

## ✅ Verificar se funcionou:

Nos logs do servidor, você deve ver:
```
[Database] ✅ Connected to SQLite: C:\Users\...\database.db
```

Se aparecer, está funcionando! Tente criar uma conta novamente.

---

**Se o `pnpm rebuild` não funcionar**, tente:
```bash
pnpm remove better-sqlite3
pnpm add better-sqlite3
```


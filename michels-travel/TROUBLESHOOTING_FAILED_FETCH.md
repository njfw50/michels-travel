# 🔧 Troubleshooting: "Failed to fetch"

## ⚠️ Erro: "Failed to fetch"

Este erro geralmente acontece quando o cliente não consegue se conectar ao servidor.

## ✅ Verificações:

### 1. Servidor está rodando?

Verifique se o servidor está rodando:
```powershell
# Ver processos Node.js
Get-Process -Name node -ErrorAction SilentlyContinue

# Ver portas em uso
netstat -ano | findstr ":3000"
```

Se não estiver rodando, inicie:
```powershell
cd michels-travel
pnpm dev
```

### 2. Servidor está na porta correta?

O servidor deve estar rodando em `http://localhost:3000` (ou porta próxima se 3000 estiver ocupada).

Verifique os logs do servidor ao iniciar:
```
Server running on http://localhost:3000/
```

### 3. Cliente está acessando a porta correta?

O cliente tRPC está configurado para usar `/api/trpc` (URL relativa), o que significa que ele espera que o servidor esteja na mesma origem.

**Se você estiver acessando `localhost:3001` mas o servidor está em `localhost:3000`, isso causará o erro!**

### 4. Verificar se o endpoint está funcionando:

No PowerShell:
```powershell
# Testar endpoint
Invoke-WebRequest -Uri "http://localhost:3000/api/trpc/auth.me" -Method POST -ContentType "application/json" -Body '{"0":{"json":{}}}'
```

Ou no navegador, abra o DevTools (F12) e vá para a aba Network. Tente fazer login e veja qual requisição está falhando.

## 🔍 Soluções Comuns:

### Solução 1: Reiniciar o servidor

```powershell
# Parar o servidor (Ctrl+C no terminal)
# Depois reiniciar:
cd michels-travel
pnpm dev
```

### Solução 2: Verificar porta

Se o servidor estiver em uma porta diferente (ex: 3001), você precisa acessar a mesma porta no navegador.

### Solução 3: Verificar logs do servidor

Os logs do servidor devem mostrar:
- `[Server] Vite dev server configured successfully`
- `Server running on http://localhost:3000/`
- `[Database] ✅ Connected to SQLite: ...`

Se houver erros, corrija-os primeiro.

### Solução 4: Limpar cache do navegador

Às vezes o navegador pode ter cache antigo. Tente:
- Ctrl+Shift+R (hard refresh)
- Ou abra em modo anônimo

### Solução 5: Verificar CORS (se aplicável)

Se você estiver acessando de um domínio diferente, pode ser necessário configurar CORS no servidor.

## 📋 Checklist:

- [ ] Servidor está rodando (`pnpm dev`)
- [ ] Servidor está na porta 3000 (ou porta mostrada nos logs)
- [ ] Navegador está acessando a mesma porta
- [ ] Arquivo `.env` existe e está configurado
- [ ] Banco de dados está inicializado
- [ ] Não há erros nos logs do servidor
- [ ] Console do navegador não mostra outros erros

## 🆘 Se nada funcionar:

1. Pare o servidor completamente (Ctrl+C)
2. Feche todos os processos Node.js:
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```
3. Reinicie o servidor:
   ```powershell
   cd michels-travel
   pnpm dev
   ```
4. Acesse `http://localhost:3000` (ou a porta mostrada nos logs)
5. Tente fazer login novamente


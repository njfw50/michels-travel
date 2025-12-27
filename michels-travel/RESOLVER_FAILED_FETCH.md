# ⚡ Resolver "Failed to fetch" - Guia Rápido

## 🔴 Problema: "Failed to fetch"

O servidor está rodando, mas o cliente não consegue se conectar.

## ✅ Solução Rápida:

### 1. Verificar se o servidor está rodando corretamente

No terminal onde o servidor está rodando, você deve ver:
```
[Server] Vite dev server configured successfully
Server running on http://localhost:3000/
[Database] ✅ Connected to SQLite: ...
```

### 2. Verificar a porta no navegador

**IMPORTANTE:** O servidor pode estar em uma porta diferente se 3000 estiver ocupada.

Verifique nos logs qual porta está sendo usada e acesse essa porta no navegador.

### 3. Reiniciar o servidor

```powershell
# Parar o servidor (Ctrl+C)
# Depois:
cd michels-travel
pnpm dev
```

### 4. Acessar a URL correta

- ✅ Correto: `http://localhost:3000` (ou a porta mostrada nos logs)
- ❌ Errado: `http://localhost:3001` (se o servidor está em 3000)

### 5. Verificar console do navegador

Abra o DevTools (F12) → Console e veja se há outros erros.

## 🔍 Verificações Técnicas:

### O servidor está respondendo?

```powershell
# Testar se o servidor responde
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
```

### Ver processos Node.js:

```powershell
Get-Process -Name node
```

### Ver portas em uso:

```powershell
netstat -ano | findstr ":3000"
```

## 🎯 Solução Mais Comum:

**O problema geralmente é que você está acessando uma porta diferente da que o servidor está usando.**

1. Olhe os logs do servidor ao iniciar
2. Veja qual porta está sendo usada (ex: `Server running on http://localhost:3000/`)
3. Acesse exatamente essa URL no navegador

## 📋 Checklist Final:

- [ ] Servidor está rodando (`pnpm dev`)
- [ ] Vejo a mensagem "Server running on http://localhost:XXXX/"
- [ ] Estou acessando a mesma porta no navegador
- [ ] Arquivo `.env` existe
- [ ] Banco de dados está conectado (vejo logs do banco)
- [ ] Não há erros vermelhos nos logs do servidor

## 🆘 Se ainda não funcionar:

1. **Pare tudo:**
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```

2. **Limpe e reinstale (se necessário):**
   ```powershell
   cd michels-travel
   Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
   pnpm install
   ```

3. **Reinicie o servidor:**
   ```powershell
   pnpm dev
   ```

4. **Acesse a URL mostrada nos logs**


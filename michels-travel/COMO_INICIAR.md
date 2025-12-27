# 🚀 Como Iniciar o Servidor

## ⚡ Método Mais Simples

1. **Abra o PowerShell**
2. **Navegue para o diretório:**
   ```powershell
   cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
   ```

3. **Execute o script:**
   ```powershell
   .\INICIAR.ps1
   ```

---

## 🔧 Método Manual

Se o script não funcionar, execute estes comandos um por um:

```powershell
# 1. Ir para o diretório
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"

# 2. Parar processos antigos
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Verificar .env
if (-not (Test-Path ".env")) {
    .\criar-env-agora.ps1
}

# 4. Instalar dependências (se necessário)
if (-not (Test-Path "node_modules")) {
    pnpm install
}

# 5. Iniciar servidor
pnpm dev
```

---

## 📋 O Que Você Deve Ver

Quando o servidor iniciar corretamente, você verá algo como:

```
[Vite] Setting up Vite dev server...
[Vite] Vite server created successfully
[Database] ✅ Connected to SQLite: C:\Users\...\database.db
Server running on http://localhost:3000/
```

**Acesse a URL mostrada nos logs!**

---

## ❌ Se Der Erro

### Erro: "Command 'dev' not found"
**Causa:** Não está no diretório correto ou `package.json` não existe
**Solução:** Certifique-se de estar em `michels-travel/` e que `package.json` existe

### Erro: "Cannot find module"
**Causa:** Dependências não instaladas
**Solução:** Execute `pnpm install`

### Erro: "Database not available"
**Causa:** Arquivo `.env` não existe ou está incorreto
**Solução:** Execute `.\criar-env-agora.ps1`

### Erro: "Port 3000 is busy"
**Causa:** Outro processo usando a porta
**Solução:** 
```powershell
Get-Process -Name node | Stop-Process -Force
```

---

## 🆘 Se Nada Funcionar

1. **Feche todos os terminais**
2. **Abra um novo PowerShell**
3. **Execute:**
   ```powershell
   cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
   .\INICIAR.ps1
   ```

4. **Copie e cole TODOS os erros que aparecerem nos logs**

---

## 📞 Informações para Depuração

Se ainda não funcionar, me envie:

1. **O comando que você executou**
2. **A mensagem de erro completa** (copie tudo)
3. **O diretório onde você está** (execute `pwd` no PowerShell)


# 🔍 Diagnóstico de Erros - Por que o site não está funcionando

## 🚨 Problemas Comuns e Soluções

### 1. Servidor não está rodando

**Sintomas:**
- Página em branco
- "Failed to fetch"
- Erro de conexão no navegador

**Solução:**
```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
pnpm dev
```

**Verificar:**
- Veja os logs do servidor
- Procure por: `Server running on http://localhost:XXXX/`
- Acesse a porta mostrada nos logs

---

### 2. Porta já está em uso

**Sintomas:**
- Erro: "Port 3000 is busy, using port 3001 instead"
- Ou servidor não inicia

**Solução:**
```powershell
# Parar todos os processos Node.js
Get-Process -Name node | Stop-Process -Force

# Depois iniciar novamente
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
pnpm dev
```

---

### 3. Arquivo .env não existe ou está incorreto

**Sintomas:**
- Erro: "Database not available"
- Erro: "DATABASE_URL not configured"

**Solução:**
```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
.\criar-env-agora.ps1
```

Ou crie manualmente o arquivo `.env` com:
```
DATABASE_URL=sqlite:./database.db
JWT_SECRET=michels-travel-jwt-secret-key-minimum-32-characters-long
```

---

### 4. Dependências não instaladas

**Sintomas:**
- Erro: "Cannot find module"
- Erro: "Module not found"

**Solução:**
```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
pnpm install
```

---

### 5. Banco de dados não inicializado

**Sintomas:**
- Erro: "Database not available"
- Erro ao criar conta ou fazer login

**Solução:**
O banco será criado automaticamente na primeira conexão. Se não funcionar:

```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
pnpm db:init
```

---

### 6. Erro de compilação do TypeScript

**Sintomas:**
- Erros no console do servidor
- Página não carrega

**Solução:**
```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
pnpm check
```

Corrija os erros de TypeScript mostrados.

---

### 7. better-sqlite3 não compilado

**Sintomas:**
- Erro: "Could not locate the bindings file"
- Erro relacionado a better-sqlite3

**Solução:**
```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
pnpm rebuild better-sqlite3
```

Se não funcionar:
```powershell
pnpm remove better-sqlite3
pnpm add better-sqlite3
```

---

## 🔧 Script de Diagnóstico Completo

Execute este script para verificar tudo:

```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"

Write-Host "🔍 Diagnóstico Completo" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar .env
if (Test-Path ".env") {
    Write-Host "✅ .env existe" -ForegroundColor Green
    Get-Content .env | Select-Object -First 2
} else {
    Write-Host "❌ .env NÃO existe - Execute: .\criar-env-agora.ps1" -ForegroundColor Red
}

Write-Host ""

# 2. Verificar node_modules
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules existe" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules NÃO existe - Execute: pnpm install" -ForegroundColor Red
}

Write-Host ""

# 3. Verificar processos Node.js
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcs) {
    Write-Host "⚠️  $($nodeProcs.Count) processo(s) Node.js rodando" -ForegroundColor Yellow
    Write-Host "   Se o servidor não está funcionando, pare-os:" -ForegroundColor Gray
    Write-Host "   Get-Process -Name node | Stop-Process -Force" -ForegroundColor Gray
} else {
    Write-Host "ℹ️  Nenhum processo Node.js rodando" -ForegroundColor Cyan
    Write-Host "   Inicie o servidor: pnpm dev" -ForegroundColor Gray
}

Write-Host ""

# 4. Verificar portas
Write-Host "Verificando portas 3000, 3001, 3002..." -ForegroundColor Cyan
$ports = @(3000, 3001, 3002)
foreach ($p in $ports) {
    $result = netstat -ano | findstr ":$p "
    if ($result) {
        Write-Host "   Porta $p está em uso" -ForegroundColor Yellow
    } else {
        Write-Host "   Porta $p está livre" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Diagnóstico completo!" -ForegroundColor Green
```

---

## 🚀 Solução Rápida (Tudo de Uma Vez)

Execute este comando para resolver tudo:

```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"

# Parar processos existentes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Criar .env se não existir
if (-not (Test-Path ".env")) {
    Write-Host "Criando .env..." -ForegroundColor Cyan
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    @"
DATABASE_URL=sqlite:./database.db
JWT_SECRET=$jwtSecret
"@ | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
}

# Instalar dependências se necessário
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependências..." -ForegroundColor Cyan
    pnpm install
}

# Recompilar better-sqlite3
Write-Host "Recompilando better-sqlite3..." -ForegroundColor Cyan
pnpm rebuild better-sqlite3

# Iniciar servidor
Write-Host "Iniciando servidor..." -ForegroundColor Cyan
pnpm dev
```

---

## 📋 Checklist de Verificação

Antes de reportar problemas, verifique:

- [ ] Arquivo `.env` existe e tem `DATABASE_URL=sqlite:./database.db`
- [ ] `node_modules` existe (execute `pnpm install` se não existir)
- [ ] Nenhum processo Node.js antigo rodando (pare com `Get-Process -Name node | Stop-Process -Force`)
- [ ] Porta 3000 (ou próxima) está livre
- [ ] Dependências instaladas (`pnpm install`)
- [ ] better-sqlite3 compilado (`pnpm rebuild better-sqlite3`)
- [ ] Servidor iniciado (`pnpm dev`)
- [ ] Acessando a porta correta no navegador (veja logs do servidor)

---

## 🆘 Se Nada Funcionar

1. **Pare tudo:**
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```

2. **Limpe e reinstale:**
   ```powershell
   cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
   Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
   pnpm install
   ```

3. **Recrie .env:**
   ```powershell
   .\criar-env-agora.ps1
   ```

4. **Recompile better-sqlite3:**
   ```powershell
   pnpm rebuild better-sqlite3
   ```

5. **Inicie o servidor:**
   ```powershell
   pnpm dev
   ```

6. **Veja os logs e acesse a porta mostrada**


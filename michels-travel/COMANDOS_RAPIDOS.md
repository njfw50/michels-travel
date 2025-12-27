# ⚡ Comandos Rápidos - Fazer o Site Funcionar

## 🚀 Solução Mais Rápida

Execute este comando no PowerShell (dentro de `michels-travel/`):

```powershell
.\REPARAR_TUDO.ps1
```

Este script vai:
1. ✅ Parar processos Node.js antigos
2. ✅ Criar .env se não existir
3. ✅ Instalar dependências se necessário
4. ✅ Recompilar better-sqlite3
5. ✅ Iniciar o servidor

---

## 🔧 Comandos Individuais

### Se o servidor não está rodando:

```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
pnpm dev
```

### Se há processos Node.js travados:

```powershell
Get-Process -Name node | Stop-Process -Force
```

Depois inicie novamente:
```powershell
pnpm dev
```

### Se .env não existe:

```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
.\criar-env-agora.ps1
```

### Se dependências não estão instaladas:

```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
pnpm install
```

### Se better-sqlite3 não está compilado:

```powershell
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
pnpm rebuild better-sqlite3
```

---

## 📋 Checklist Rápido

Antes de iniciar, verifique:

1. ✅ Está no diretório correto: `michels-travel/`
2. ✅ Arquivo `.env` existe
3. ✅ `node_modules` existe
4. ✅ Nenhum processo Node.js antigo rodando

---

## 🎯 Passo a Passo Completo

```powershell
# 1. Ir para o diretório
cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"

# 2. Parar processos antigos
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Criar .env (se não existir)
if (-not (Test-Path ".env")) {
    .\criar-env-agora.ps1
}

# 4. Instalar dependências (se necessário)
if (-not (Test-Path "node_modules")) {
    pnpm install
}

# 5. Recompilar better-sqlite3
pnpm rebuild better-sqlite3

# 6. Iniciar servidor
pnpm dev
```

---

## 🔍 Verificar se Está Funcionando

Após iniciar o servidor, você verá nos logs algo como:

```
Server running on http://localhost:3000/
```

Acesse essa URL no navegador!

Se a porta for diferente (3001, 3002, etc.), acesse a porta mostrada nos logs.

---

## ❌ Se Ainda Não Funcionar

1. **Veja os erros nos logs do servidor**
2. **Verifique o console do navegador (F12)**
3. **Execute o diagnóstico:**
   ```powershell
   .\DIAGNOSTICO_ERROS.md
   ```


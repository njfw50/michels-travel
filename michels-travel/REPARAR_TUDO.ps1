# Script para reparar e iniciar o servidor
# Execute: .\REPARAR_TUDO.ps1

Write-Host "🔧 Reparando e iniciando servidor..." -ForegroundColor Cyan
Write-Host ""

# 1. Parar processos Node.js existentes
Write-Host "1. Parando processos Node.js existentes..." -ForegroundColor Yellow
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcs) {
    $nodeProcs | Stop-Process -Force
    Write-Host "   ✅ Processos parados" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ️  Nenhum processo para parar" -ForegroundColor Gray
}

# 2. Verificar/criar .env
Write-Host ""
Write-Host "2. Verificando arquivo .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "   ⚠️  .env não existe. Criando..." -ForegroundColor Yellow
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    @"
DATABASE_URL=sqlite:./database.db
JWT_SECRET=$jwtSecret
"@ | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
    Write-Host "   ✅ .env criado!" -ForegroundColor Green
} else {
    Write-Host "   ✅ .env existe" -ForegroundColor Green
}

# 3. Verificar node_modules
Write-Host ""
Write-Host "3. Verificando dependências..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⚠️  node_modules não existe. Instalando..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Erro ao instalar dependências" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Dependências instaladas!" -ForegroundColor Green
} else {
    Write-Host "   ✅ node_modules existe" -ForegroundColor Green
}

# 4. Recompilar better-sqlite3
Write-Host ""
Write-Host "4. Recompilando better-sqlite3..." -ForegroundColor Yellow
pnpm rebuild better-sqlite3 2>&1 | Out-Null
Write-Host "   ✅ Concluído" -ForegroundColor Green

# 5. Iniciar servidor
Write-Host ""
Write-Host "5. Iniciando servidor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Servidor iniciando..." -ForegroundColor Cyan
Write-Host "   Acesse a URL mostrada nos logs abaixo" -ForegroundColor Gray
Write-Host ""

pnpm dev


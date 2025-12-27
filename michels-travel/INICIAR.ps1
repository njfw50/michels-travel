# Script simples para iniciar o servidor
# Execute este script no diretório michels-travel

Write-Host "🚀 Iniciando servidor Michel's Travel..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script dentro do diretório michels-travel" -ForegroundColor Red
    Write-Host "   cd michels-travel" -ForegroundColor Yellow
    exit 1
}

# Parar processos Node.js existentes
Write-Host "1. Parando processos Node.js existentes..." -ForegroundColor Yellow
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcs) {
    $nodeProcs | Stop-Process -Force
    Write-Host "   ✅ Processos parados" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ℹ️  Nenhum processo para parar" -ForegroundColor Gray
}

# Verificar .env
Write-Host ""
Write-Host "2. Verificando .env..." -ForegroundColor Yellow
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

# Verificar node_modules
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

# Iniciar servidor
Write-Host ""
Write-Host "4. Iniciando servidor..." -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 SERVIDOR INICIANDO..." -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Veja a porta mostrada nos logs abaixo" -ForegroundColor White
Write-Host "   - Acesse: http://localhost:XXXX (onde XXXX é a porta)" -ForegroundColor White
Write-Host "   - Para parar o servidor: Ctrl+C" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor
pnpm dev


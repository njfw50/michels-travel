# Script para iniciar o servidor corretamente
# Execute: .\INICIAR_SERVIDOR.ps1

Write-Host "🚀 Iniciando servidor Michel's Travel..." -ForegroundColor Cyan
Write-Host ""

$workspacePath = "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"

# Verificar se está no diretório correto
if (-not (Test-Path (Join-Path $workspacePath "package.json"))) {
    Write-Host "❌ Erro: Não encontrado package.json" -ForegroundColor Red
    Write-Host "Certifique-se de estar no diretório michels-travel" -ForegroundColor Yellow
    exit 1
}

# Verificar .env
$envPath = Join-Path $workspacePath ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "Criando .env..." -ForegroundColor Cyan
    
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    
    $envContent = @"
DATABASE_URL=sqlite:./database.db
JWT_SECRET=$jwtSecret
"@
    
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
    Write-Host "✅ Arquivo .env criado!" -ForegroundColor Green
}

# Verificar node_modules
if (-not (Test-Path (Join-Path $workspacePath "node_modules"))) {
    Write-Host "⚠️  node_modules não encontrado!" -ForegroundColor Yellow
    Write-Host "Instalando dependências..." -ForegroundColor Cyan
    Set-Location $workspacePath
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
}

# Parar processos Node.js existentes (opcional)
Write-Host ""
Write-Host "Verificando processos Node.js existentes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️  Encontrados $($nodeProcesses.Count) processo(s) Node.js rodando" -ForegroundColor Yellow
    $stop = Read-Host "Deseja parar processos existentes? (s/N)"
    if ($stop -eq "s" -or $stop -eq "S") {
        $nodeProcesses | Stop-Process -Force
        Write-Host "✅ Processos parados" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

# Iniciar servidor
Write-Host ""
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
Write-Host ""
Set-Location $workspacePath
pnpm dev


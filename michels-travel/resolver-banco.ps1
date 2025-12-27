# Script para resolver problema de banco de dados
# Execute este script no diretório michels-travel

Write-Host "🔧 Resolvendo problema de banco de dados..." -ForegroundColor Cyan
Write-Host ""

# 1. Recompilar better-sqlite3
Write-Host "📦 Recompilando better-sqlite3..." -ForegroundColor Yellow
pnpm rebuild better-sqlite3
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Rebuild falhou. Tentando reinstalar..." -ForegroundColor Yellow
    pnpm remove better-sqlite3
    pnpm add better-sqlite3
}

Write-Host ""

# 2. Criar .env se não existir
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    
    # Gerar JWT_SECRET aleatório
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    
    $envContent = @"
DATABASE_URL=sqlite:./database.db
JWT_SECRET=$jwtSecret
"@
    
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
    Write-Host "✅ Arquivo .env criado!" -ForegroundColor Green
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

Write-Host ""

# 3. Inicializar banco de dados
Write-Host "🗄️ Inicializando banco de dados..." -ForegroundColor Yellow
pnpm db:init

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Tudo configurado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Reinicie o servidor: pnpm dev" -ForegroundColor White
    Write-Host "   2. Acesse: http://localhost:3000/login" -ForegroundColor White
    Write-Host "   3. Crie uma conta!" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Erro ao inicializar banco. Verifique os logs acima." -ForegroundColor Red
}


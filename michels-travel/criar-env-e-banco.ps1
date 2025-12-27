# Script simples para criar .env e inicializar banco SQLite
# Execute: .\criar-env-e-banco.ps1

$envPath = Join-Path $PSScriptRoot ".env"

# Criar .env se não existir
if (-not (Test-Path $envPath)) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Cyan
    
    # Gerar JWT_SECRET
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

# Inicializar banco de dados
Write-Host ""
Write-Host "🗄️ Inicializando banco de dados..." -ForegroundColor Cyan
& pnpm db:init

Write-Host ""
Write-Host "✅ Pronto! Agora reinicie o servidor: pnpm dev" -ForegroundColor Green


# Script para criar arquivo .env
# Execute: .\criar-env-agora.ps1

$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    Write-Host "⚠️  Arquivo .env já existe!" -ForegroundColor Yellow
    Write-Host "Localização: $envPath" -ForegroundColor Gray
    Write-Host ""
    $overwrite = Read-Host "Deseja sobrescrever? (s/N)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 0
    }
}

Write-Host "📝 Criando arquivo .env..." -ForegroundColor Cyan

# Gerar JWT_SECRET aleatório
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$jwtSecret = [Convert]::ToBase64String($bytes)

$envContent = @"
# Database Configuration - SQLite
DATABASE_URL=sqlite:./database.db

# JWT Secret - Chave secreta para assinar tokens
JWT_SECRET=$jwtSecret

# OAuth Configuration (Opcional - não necessário para login email/senha)
# VITE_OAUTH_PORTAL_URL=https://portal.manus.computer
# VITE_APP_ID=seu-app-id-aqui
# OAUTH_SERVER_URL=https://oauth.manus.computer

# Owner OpenID (opcional - para dar permissões de admin após primeiro login)
# OWNER_OPEN_ID=email:seu@email.com
"@

try {
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
    Write-Host ""
    Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
    Write-Host "   Localização: $envPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Recompile better-sqlite3: pnpm rebuild better-sqlite3" -ForegroundColor White
    Write-Host "   2. Reinicie o servidor: pnpm dev" -ForegroundColor White
    Write-Host "   3. O banco será criado automaticamente!" -ForegroundColor White
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao criar arquivo .env: $_" -ForegroundColor Red
    exit 1
}


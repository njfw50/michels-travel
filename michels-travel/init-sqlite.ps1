# Script para inicializar SQLite e criar o arquivo .env
# Execute este script no diretório michels-travel

Write-Host "🗄️ Configurando SQLite para Michel's Travel" -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"

# Verificar se .env já existe
if (Test-Path $envPath) {
    Write-Host "⚠️  Arquivo .env já existe!" -ForegroundColor Yellow
    $overwrite = Read-Host "Deseja sobrescrever? (s/N)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 0
    }
}

# Gerar JWT_SECRET aleatório
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$jwtSecret = [Convert]::ToBase64String($bytes)

# Criar conteúdo do .env
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

# Salvar arquivo
try {
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
    Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
    Write-Host "   Localização: $envPath" -ForegroundColor Gray
    Write-Host ""
    
    # Criar banco de dados SQLite
    Write-Host "📦 Criando banco de dados SQLite..." -ForegroundColor Cyan
    $dbPath = Join-Path $PSScriptRoot "database.db"
    
    if (Test-Path $dbPath) {
        Write-Host "⚠️  Banco de dados já existe: $dbPath" -ForegroundColor Yellow
    } else {
        # O banco será criado automaticamente quando o servidor conectar
        Write-Host "✅ Banco de dados será criado automaticamente na primeira conexão" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Execute: pnpm db:init" -ForegroundColor White
    Write-Host "   2. Reinicie o servidor: pnpm dev" -ForegroundColor White
    Write-Host "   3. Acesse: http://localhost:3000/login" -ForegroundColor White
    Write-Host "   4. Crie uma conta e faça login!" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao criar arquivo .env: $_" -ForegroundColor Red
    exit 1
}


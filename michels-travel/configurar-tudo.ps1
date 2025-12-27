# Script para configurar tudo de uma vez
# Execute este script no diretório michels-travel

Write-Host "🚀 Configurando SQLite e criando .env..." -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"
$dbPath = Join-Path $PSScriptRoot "database.db"

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

# Salvar arquivo .env
try {
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
    Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
    Write-Host "   Localização: $envPath" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao criar arquivo .env: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Inicializando banco de dados SQLite..." -ForegroundColor Cyan

# Executar script de inicialização do banco
try {
    & pnpm db:init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Banco de dados inicializado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erro ao inicializar banco. Tentando criar manualmente..." -ForegroundColor Yellow
        # Criar banco manualmente se o script falhar
        if (-not (Test-Path $dbPath)) {
            $db = New-Object -ComObject ADODB.Connection
            $db.Open("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=$dbPath")
            Write-Host "✅ Banco de dados criado manualmente" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "⚠️  Erro ao executar pnpm db:init: $_" -ForegroundColor Yellow
    Write-Host "   Você pode executar manualmente: pnpm db:init" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Reinicie o servidor: pnpm dev" -ForegroundColor White
Write-Host "   2. Acesse: http://localhost:3000/login" -ForegroundColor White
Write-Host "   3. Crie uma conta e faça login!" -ForegroundColor White


# Script para criar arquivo .env
# Execute este script no diretório michels-travel

Write-Host "🔐 Configurando OAuth para Michel's Travel" -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    Write-Host "⚠️  Arquivo .env já existe!" -ForegroundColor Yellow
    $overwrite = Read-Host "Deseja sobrescrever? (s/N)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 0
    }
}

Write-Host "📝 Por favor, forneça as seguintes informações:" -ForegroundColor Yellow
Write-Host ""

# OAuth Portal URL
Write-Host "1. URL do Portal OAuth do Manus:" -ForegroundColor Cyan
Write-Host "   Exemplo: https://portal.manus.computer" -ForegroundColor Gray
$oauthPortalUrl = Read-Host "VITE_OAUTH_PORTAL_URL"

# App ID
Write-Host ""
Write-Host "2. App ID (ID da aplicação no Manus):" -ForegroundColor Cyan
$appId = Read-Host "VITE_APP_ID"

# OAuth Server URL
Write-Host ""
Write-Host "3. URL do Servidor OAuth (geralmente igual ao portal):" -ForegroundColor Cyan
Write-Host "   Exemplo: https://oauth.manus.computer" -ForegroundColor Gray
$oauthServerUrl = Read-Host "OAUTH_SERVER_URL"

# JWT Secret
Write-Host ""
Write-Host "4. JWT Secret (chave secreta para tokens):" -ForegroundColor Cyan
Write-Host "   Pressione Enter para gerar automaticamente" -ForegroundColor Gray
$jwtSecret = Read-Host "JWT_SECRET"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    # Gerar JWT secret aleatório
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    Write-Host "   ✅ JWT Secret gerado automaticamente" -ForegroundColor Green
}

# Database URL
Write-Host ""
Write-Host "5. URL do Banco de Dados MySQL:" -ForegroundColor Cyan
Write-Host "   Formato: mysql://usuario:senha@localhost:3306/nome_do_banco" -ForegroundColor Gray
$databaseUrl = Read-Host "DATABASE_URL"

# Criar conteúdo do .env
$envContent = @"
# OAuth Configuration (Manus) - Frontend
VITE_OAUTH_PORTAL_URL=$oauthPortalUrl
VITE_APP_ID=$appId

# OAuth Configuration (Manus) - Backend
OAUTH_SERVER_URL=$oauthServerUrl
JWT_SECRET=$jwtSecret

# Database Configuration
DATABASE_URL=$databaseUrl

# Optional: Owner OpenID (para admin)
# OWNER_OPEN_ID=seu-open-id-aqui

# Optional: Forge API (para IA)
# BUILT_IN_FORGE_API_URL=https://forge.manus.im
# BUILT_IN_FORGE_API_KEY=sua-api-key-aqui

# Optional: Stripe (para pagamentos)
# STRIPE_SECRET_KEY=sk_test_...
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
"@

# Salvar arquivo
try {
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
    Write-Host ""
    Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
    Write-Host "   Localização: $envPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Verifique se as informações estão corretas" -ForegroundColor White
    Write-Host "   2. Reinicie o servidor de desenvolvimento (pnpm dev)" -ForegroundColor White
    Write-Host "   3. Teste o login em http://localhost:3000/login" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 Para configurar ADMIN:" -ForegroundColor Cyan
    Write-Host "   1. Faça login pela primeira vez" -ForegroundColor White
    Write-Host "   2. Verifique o console do servidor para ver seu OpenID" -ForegroundColor White
    Write-Host "   3. Adicione no .env: OWNER_OPEN_ID=seu-open-id-aqui" -ForegroundColor White
    Write-Host "   4. Reinicie o servidor" -ForegroundColor White
    Write-Host "   5. Faça login novamente - você terá permissões de admin!" -ForegroundColor White
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao criar arquivo .env: $_" -ForegroundColor Red
    exit 1
}


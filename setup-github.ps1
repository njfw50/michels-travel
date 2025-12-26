# Script para configurar e enviar projeto para o GitHub
# Execute este script no diretório raiz do projeto

Write-Host "🚀 Configurando GitHub..." -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto!" -ForegroundColor Red
    exit 1
}

# Verificar se já existe remote
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "⚠️  Já existe um remote 'origin' configurado:" -ForegroundColor Yellow
    Write-Host "   $existingRemote" -ForegroundColor Gray
    $overwrite = Read-Host "Deseja substituir? (s/N)"
    if ($overwrite -eq "s" -or $overwrite -eq "S") {
        git remote remove origin
        Write-Host "✅ Remote removido" -ForegroundColor Green
    } else {
        Write-Host "❌ Operação cancelada" -ForegroundColor Red
        exit 0
    }
}

# Solicitar URL do repositório
Write-Host ""
Write-Host "📋 Por favor, forneça a URL do seu repositório GitHub:" -ForegroundColor Yellow
Write-Host "   Exemplo: https://github.com/seu-usuario/michels-travel.git" -ForegroundColor Gray
$repoUrl = Read-Host "URL do repositório"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ URL não fornecida. Operação cancelada." -ForegroundColor Red
    exit 1
}

# Adicionar remote
Write-Host ""
Write-Host "➕ Adicionando remote 'origin'..." -ForegroundColor Yellow
git remote add origin $repoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote adicionado com sucesso!" -ForegroundColor Green
    
    # Verificar remotes
    Write-Host ""
    Write-Host "📡 Remotes configurados:" -ForegroundColor Cyan
    git remote -v
    
    # Fazer push
    Write-Host ""
    Write-Host "📤 Enviando commits para o GitHub..." -ForegroundColor Yellow
    Write-Host "   (Isso pode pedir suas credenciais do GitHub)" -ForegroundColor Gray
    Write-Host ""
    
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Sucesso! Seu projeto está no GitHub!" -ForegroundColor Green
        Write-Host "   Acesse: $repoUrl" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "⚠️  Erro ao fazer push. Possíveis causas:" -ForegroundColor Yellow
        Write-Host "   1. Problemas de autenticação (use Personal Access Token)" -ForegroundColor Gray
        Write-Host "   2. Repositório não existe ou você não tem permissão" -ForegroundColor Gray
        Write-Host "   3. URL incorreta" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Tente executar manualmente:" -ForegroundColor Yellow
        Write-Host "   git push -u origin main" -ForegroundColor White
    }
} else {
    Write-Host "❌ Erro ao adicionar remote" -ForegroundColor Red
}


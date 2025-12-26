# Script para resolver o problema do submodule michels-travel
# Execute este script no diretório raiz do projeto

Write-Host "🔧 Resolvendo problema do submodule..." -ForegroundColor Cyan

# 1. Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto!" -ForegroundColor Red
    exit 1
}

# 2. Verificar se michels-travel/.git existe
if (Test-Path "michels-travel\.git") {
    Write-Host "📁 Removendo repositório Git de dentro de michels-travel..." -ForegroundColor Yellow
    Remove-Item -Path "michels-travel\.git" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Repositório Git removido de michels-travel" -ForegroundColor Green
} else {
    Write-Host "ℹ️  michels-travel\.git não encontrado (pode já ter sido removido)" -ForegroundColor Gray
}

# 3. Remover do índice do Git se foi adicionado como submodule
Write-Host "🗑️  Removendo michels-travel do índice do Git..." -ForegroundColor Yellow
git rm --cached michels-travel -r -f 2>$null

# 4. Adicionar todos os arquivos novamente
Write-Host "➕ Adicionando todos os arquivos ao Git..." -ForegroundColor Yellow
git add .

# 5. Verificar status
Write-Host "`n📊 Status do repositório:" -ForegroundColor Cyan
git status --short

Write-Host "`n✅ Pronto! Agora você pode fazer o commit:" -ForegroundColor Green
Write-Host "   git commit -m 'Michel 12/26'" -ForegroundColor White


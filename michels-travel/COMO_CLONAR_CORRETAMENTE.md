# 📋 Como Clonar o Repositório Corretamente

## ⚠️ Problema: Estrutura Aninhada

Se você clonar o repositório dentro de um diretório que já contém o projeto, você criará uma estrutura aninhada:
```
michels-travel/
  └── michels-travel/
      └── michels-travel/
          └── ...
```

## ✅ Solução: Clonar Corretamente

### Opção 1: Clonar em um Diretório Novo (Recomendado)

```powershell
# 1. Navegue para onde você quer o projeto (NÃO dentro de michels-travel!)
cd C:\Users\njfw2\OneDrive\Área de Trabalho\Project

# 2. Se já existe um diretório michels-travel, remova-o primeiro:
Remove-Item -Recurse -Force michels-travel -ErrorAction SilentlyContinue

# 3. Clone o repositório:
git clone https://github.com/njfw50/michels-travel.git

# 4. Entre no diretório:
cd michels-travel

# 5. Instale as dependências:
pnpm install
```

### Opção 2: Clonar com Nome Específico

```powershell
# Clone em um diretório com nome diferente para evitar confusão:
cd C:\Users\njfw2\OneDrive\Área de Trabalho\Project
git clone https://github.com/njfw50/michels-travel.git michels-travel-novo

cd michels-travel-novo
pnpm install
```

### Opção 3: Usar o Diretório Atual (Se já está no lugar certo)

```powershell
# Se você já está no diretório correto e só precisa atualizar:
cd C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel

# Verifique se é um repositório git:
git status

# Se não for, inicialize:
git init
git remote add origin https://github.com/njfw50/michels-travel.git
git pull origin main
```

## 🔍 Como Verificar se Está Correto

A estrutura deve ser:
```
Project/
  └── michels-travel/          ← Você deve estar AQUI
      ├── client/
      ├── server/
      ├── package.json
      ├── .env
      └── ...
```

**NÃO deve ser:**
```
Project/
  └── michels-travel/
      └── michels-travel/       ← ❌ Isso está errado!
          └── michels-travel/   ← ❌ Muito errado!
```

## 🧹 Limpar Estrutura Aninhada Existente

Se você já tem uma estrutura aninhada:

```powershell
# 1. Navegue para o diretório raiz do projeto:
cd C:\Users\njfw2\OneDrive\Área de Trabalho\Project

# 2. Verifique a estrutura:
Get-ChildItem michels-travel -Recurse -Directory | Where-Object { $_.Name -eq "michels-travel" } | Select-Object FullName

# 3. Se encontrar diretórios aninhados, você pode:
#    - Mover o conteúdo do diretório mais interno para o raiz
#    - Ou remover tudo e clonar novamente (mais seguro)
```

## 📝 Checklist ao Clonar

- [ ] Estou em um diretório que **NÃO** contém `michels-travel/`
- [ ] Vou clonar em um diretório novo ou vazio
- [ ] Após clonar, vou executar `pnpm install`
- [ ] Vou criar o arquivo `.env` (não está no git)
- [ ] Vou executar `pnpm db:init` se usar SQLite

## 🎯 Comando Completo (Copy-Paste)

```powershell
# Navegar para onde quer o projeto
cd C:\Users\njfw2\OneDrive\Área de Trabalho\Project

# Remover diretório antigo se existir
Remove-Item -Recurse -Force michels-travel -ErrorAction SilentlyContinue

# Clonar
git clone https://github.com/njfw50/michels-travel.git

# Entrar no diretório
cd michels-travel

# Instalar dependências
pnpm install

# Criar .env (usar o script)
.\criar-env-agora.ps1

# Inicializar banco (se usar SQLite)
pnpm db:init

# Iniciar servidor
pnpm dev
```


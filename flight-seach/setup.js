#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando setup do Michel\'s Flight Search...\n');

// Cores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        log(`✅ Criado diretório: ${dirPath}`, 'green');
    } else {
        log(`📁 Diretório já existe: ${dirPath}`, 'yellow');
    }
}

function createFile(filePath, content) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        log(`✅ Criado arquivo: ${filePath}`, 'green');
    } else {
        log(`📄 Arquivo já existe: ${filePath}`, 'yellow');
    }
}

function checkNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
        log(`❌ Node.js versão ${nodeVersion} não é suportada. Requer Node.js >= 16.0.0`, 'red');
        process.exit(1);
    }
    
    log(`✅ Node.js ${nodeVersion} - Versão compatível`, 'green');
}

function installDependencies() {
    log('\n📦 Instalando dependências...', 'cyan');
    
    try {
        execSync('npm install', { stdio: 'inherit' });
        log('✅ Dependências instaladas com sucesso!', 'green');
    } catch (error) {
        log('❌ Erro ao instalar dependências', 'red');
        console.error(error);
        process.exit(1);
    }
}

function setupEnvironment() {
    log('\n🔧 Configurando ambiente...', 'cyan');
    
    // Criar arquivo .env se não existir
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        const envExample = fs.readFileSync(path.join(process.cwd(), 'env.example'), 'utf8');
        fs.writeFileSync(envPath, envExample);
        log('✅ Arquivo .env criado a partir do template', 'green');
    } else {
        log('📄 Arquivo .env já existe', 'yellow');
    }
}

function createDirectories() {
    log('\n📁 Criando diretórios necessários...', 'cyan');
    
    const directories = [
        'databases',
        'backups',
        'logs',
        'uploads',
        'public/images',
        'public/js',
        'public/css'
    ];
    
    directories.forEach(dir => {
        createDirectory(path.join(process.cwd(), dir));
    });
}

function setupDatabase() {
    log('\n🗄️ Configurando banco de dados...', 'cyan');
    
    try {
        // Criar diretório de databases se não existir
        const dbDir = path.join(process.cwd(), 'databases');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        log('✅ Banco de dados configurado', 'green');
    } catch (error) {
        log('❌ Erro ao configurar banco de dados', 'red');
        console.error(error);
    }
}

function setupLogs() {
    log('\n📝 Configurando logs...', 'cyan');
    
    const logsDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logsDir, 'app.log');
    
    if (!fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, '');
        log('✅ Arquivo de log criado', 'green');
    } else {
        log('📄 Arquivo de log já existe', 'yellow');
    }
}

function createGitignore() {
    log('\n🔒 Configurando .gitignore...', 'cyan');
    
    const gitignoreContent = `# Dependências
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Ambiente
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Banco de dados
databases/
*.db
*.sqlite
*.sqlite3

# Backups
backups/

# Uploads
uploads/

# Cache
.cache/
.temp/

# Sistema
.DS_Store
Thumbs.db

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Build
dist/
build/

# Coverage
coverage/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
`;

    createFile('.gitignore', gitignoreContent);
}

function createDockerfile() {
    log('\n🐳 Criando Dockerfile...', 'cyan');
    
    const dockerfileContent = `FROM node:16-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p databases backups logs uploads

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
`;

    createFile('Dockerfile', dockerfileContent);
}

function createDockerCompose() {
    log('\n🐳 Criando docker-compose.yml...', 'cyan');
    
    const dockerComposeContent = `version: '3.8'

services:
  flight-search:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./databases:/app/databases
      - ./backups:/app/backups
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis para cache (opcional)
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
`;

    createFile('docker-compose.yml', dockerComposeContent);
}

function createScripts() {
    log('\n📜 Criando scripts úteis...', 'cyan');
    
    // Script para backup
    const backupScript = `#!/bin/bash
# Script de backup do banco de dados

BACKUP_DIR="./backups"
DB_FILE="./databases/flight_search.db"
DATE=$(date +%Y%m%d_%H%M%S)

if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
fi

if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/backup_$DATE.db"
    echo "Backup criado: backup_$DATE.db"
else
    echo "Arquivo de banco de dados não encontrado"
fi
`;

    createFile('scripts/backup.sh', backupScript);
    
    // Tornar executável
    try {
        execSync('chmod +x scripts/backup.sh');
        log('✅ Script de backup criado e configurado', 'green');
    } catch (error) {
        log('⚠️ Não foi possível tornar o script executável (Windows)', 'yellow');
    }
}

function showNextSteps() {
    log('\n🎉 Setup concluído com sucesso!', 'green');
    log('\n📋 Próximos passos:', 'cyan');
    log('1. Configure as variáveis de ambiente no arquivo .env', 'yellow');
    log('2. Execute: npm run dev', 'yellow');
    log('3. Acesse: http://localhost:3000', 'yellow');
    log('\n🔧 Comandos úteis:', 'cyan');
    log('• npm run dev     - Iniciar em modo desenvolvimento', 'yellow');
    log('• npm start       - Iniciar em modo produção', 'yellow');
    log('• npm test        - Executar testes', 'yellow');
    log('• npm run backup  - Fazer backup do banco', 'yellow');
    log('\n📚 Documentação:', 'cyan');
    log('• README.md       - Documentação completa', 'yellow');
    log('• /api/health     - Verificar saúde da API', 'yellow');
    log('\n✨ Surpreenda-se com uma experiência extraordinária!', 'magenta');
}

// Executar setup
async function main() {
    try {
        log('🛩️ Michel\'s Flight Search - Setup', 'bright');
        log('=====================================\n', 'bright');
        
        checkNodeVersion();
        installDependencies();
        setupEnvironment();
        createDirectories();
        setupDatabase();
        setupLogs();
        createGitignore();
        createDockerfile();
        createDockerCompose();
        createScripts();
        showNextSteps();
        
    } catch (error) {
        log('❌ Erro durante o setup:', 'red');
        console.error(error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { main };

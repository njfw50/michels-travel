# 🛩️ Michel's Flight Search - Sistema Completo de Busca de Voos

Um sistema extraordinário e independente de busca de voos com IA integrada, painéis de preços dinâmicos e experiência de usuário moderna.

## ✨ Características Principais

### 🚀 **Sistema Completo de Aeroporto**
- **Busca Inteligente**: Autocomplete avançado para aeroportos
- **Filtros Avançados**: Preço, companhia aérea, horário, paradas
- **Paginação Inteligente**: Navegação otimizada de resultados
- **Painéis de Preços**: Exibição dinâmica de preços em tempo real

### 🤖 **IA Integrada**
- **Recomendações Personalizadas**: Baseadas no histórico do usuário
- **Análise de Preços**: Previsões e tendências de preços
- **Insights Inteligentes**: Dicas e sugestões para economia
- **Padrões de Usuário**: Análise comportamental para melhor experiência

### 🎨 **Experiência Extraordinária**
- **Design Moderno**: Interface limpa e responsiva
- **Acessibilidade**: Suporte para usuários com dificuldades
- **Performance Otimizada**: Cache inteligente e carregamento rápido
- **Modo Escuro**: Alternância automática baseada no sistema

### 🔒 **Sistema de Autenticação**
- **Registro/Login**: Sistema completo de usuários
- **Perfil Personalizado**: Histórico, favoritos, configurações
- **Segurança**: JWT tokens e criptografia de senhas

## 🏗️ Arquitetura do Sistema

### Backend (Node.js + Express)
```
src/
├── server.js              # Servidor principal
├── services/
│   ├── flightService.js   # Lógica de voos
│   ├── aiService.js       # Serviços de IA
│   ├── cacheService.js    # Sistema de cache
│   └── databaseService.js # Banco de dados
├── routes/
│   ├── flightRoutes.js    # APIs de voos
│   ├── aiRoutes.js        # APIs de IA
│   └── userRoutes.js      # APIs de usuários
└── models/                # Modelos de dados
```

### Frontend (HTML5 + CSS3 + JavaScript)
```
public/
├── index.html             # Página principal
├── css/
│   └── style.css         # Estilos completos
└── js/
    ├── app.js            # Aplicação principal
    ├── auth.js           # Autenticação
    ├── search.js         # Busca de voos
    ├── results.js        # Exibição de resultados
    └── insights.js       # Insights da IA
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js >= 16.0.0
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <repository-url>
cd flight-search
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Configurações de Segurança
JWT_SECRET=sua_chave_secreta_aqui
BCRYPT_ROUNDS=12

# Configurações de Cache
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600

# Configurações de Banco de Dados
DB_PATH=./databases/flight_search.db
BACKUP_DIR=./backups

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 4. Inicialize o banco de dados
```bash
npm run init-db
```

### 5. Execute o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📱 Como Usar

### 1. **Busca de Voos**
- Acesse a página principal
- Digite origem e destino (autocomplete disponível)
- Selecione datas de ida e retorno
- Escolha número de passageiros e classe
- Use filtros avançados se necessário
- Clique em "Buscar Voos"

### 2. **Filtros Avançados**
- **Preço**: Slider para definir preço máximo
- **Companhia Aérea**: Selecione companhias específicas
- **Horário**: Escolha horários de partida
- **Paradas**: Direto ou com paradas

### 3. **Insights da IA**
- **Análise de Preços**: Tendências e previsões
- **Recomendações**: Sugestões personalizadas
- **Dicas de Economia**: Como economizar na viagem
- **Alertas de Preço**: Notificações quando preços baixam

### 4. **Sistema de Usuários**
- **Registro**: Crie sua conta gratuitamente
- **Login**: Acesse com email e senha
- **Perfil**: Gerencie suas informações
- **Favoritos**: Salve voos de interesse
- **Histórico**: Veja suas buscas anteriores

## 🔧 Funcionalidades Técnicas

### Cache Inteligente
- **Multi-nível**: Cache principal, voos, aeroportos, usuários
- **TTL Dinâmico**: Tempo de vida baseado no tipo de dados
- **Compressão**: Dados comprimidos para economia de memória
- **Invalidação Inteligente**: Remoção automática de dados obsoletos

### Banco de Dados SQLite
- **Persistência**: Dados salvos localmente
- **Backup Automático**: Backup diário automático
- **Transações**: Operações atômicas
- **Índices**: Performance otimizada

### APIs RESTful
- **Flight APIs**: Busca, detalhes, aeroportos
- **AI APIs**: Recomendações, insights, previsões
- **User APIs**: Autenticação, perfil, favoritos
- **Validação**: Validação robusta de entrada

### Segurança
- **Helmet**: Headers de segurança
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Proteção contra abuso
- **JWT**: Autenticação segura
- **Bcrypt**: Hash de senhas

## 🎯 Recursos de Acessibilidade

### Design Inclusivo
- **Alto Contraste**: Modo de alto contraste disponível
- **Redução de Movimento**: Suporte para usuários sensíveis
- **Navegação por Teclado**: Navegação completa via teclado
- **Screen Readers**: Compatível com leitores de tela
- **Fontes Legíveis**: Tipografia otimizada para leitura

### Funcionalidades Especiais
- **Zoom**: Suporte para zoom até 200%
- **Foco Visível**: Indicadores de foco claros
- **Contraste**: Relação de contraste adequada
- **Semântica**: HTML semântico correto

## 📊 APIs Disponíveis

### Flight APIs
```
POST /api/flights/search          # Buscar voos
GET  /api/flights/:id             # Detalhes do voo
GET  /api/flights/airports/list   # Lista de aeroportos
GET  /api/flights/airports/search # Buscar aeroportos
GET  /api/flights/promotions      # Voos promocionais
```

### AI APIs
```
GET  /api/ai/recommendations      # Recomendações personalizadas
GET  /api/ai/patterns/analysis    # Análise de padrões
GET  /api/ai/predictions/price    # Previsões de preço
GET  /api/ai/insights/general     # Insights gerais
```

### User APIs
```
POST /api/users/register          # Registrar usuário
POST /api/users/login             # Login
GET  /api/users/profile           # Perfil do usuário
PUT  /api/users/profile           # Atualizar perfil
GET  /api/users/favorites         # Favoritos
POST /api/users/favorites         # Adicionar favorito
DELETE /api/users/favorites/:id   # Remover favorito
```

## 🎨 Personalização

### Temas
- **Claro**: Tema padrão
- **Escuro**: Modo escuro automático
- **Alto Contraste**: Para acessibilidade

### Configurações do Usuário
- **Notificações**: Email e navegador
- **Alertas de Preço**: Configuração personalizada
- **Histórico**: Salvar buscas ou não
- **Privacidade**: Compartilhamento de dados

## 🚀 Deploy

### Produção
```bash
# Build do projeto
npm run build

# Configurar variáveis de produção
NODE_ENV=production
PORT=3000

# Iniciar servidor
npm start
```

### Docker (Opcional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Monitoramento

### Logs
- **Acesso**: Logs de requisições
- **Erros**: Logs de erros detalhados
- **Performance**: Métricas de tempo de resposta

### Métricas
- **Cache Hit Rate**: Eficiência do cache
- **API Response Time**: Tempo de resposta das APIs
- **User Sessions**: Sessões ativas
- **Search Volume**: Volume de buscas

## 🔮 Roadmap

### Próximas Funcionalidades
- [ ] **Integração com APIs Reais**: Skyscanner, Amadeus
- [ ] **Notificações Push**: Alertas em tempo real
- [ ] **PWA**: Progressive Web App
- [ ] **Chatbot**: Assistente virtual
- [ ] **Múltiplos Idiomas**: Internacionalização
- [ ] **App Mobile**: React Native

### Melhorias Técnicas
- [ ] **Microserviços**: Arquitetura distribuída
- [ ] **Redis**: Cache distribuído
- [ ] **PostgreSQL**: Banco de dados robusto
- [ ] **Docker Compose**: Orquestração
- [ ] **CI/CD**: Pipeline automatizado

## 🤝 Contribuição

### Como Contribuir
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### Padrões de Código
- **ESLint**: Linting de JavaScript
- **Prettier**: Formatação de código
- **Jest**: Testes unitários
- **Conventional Commits**: Padrão de commits

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Michel's Travel**
- Email: contato@michelstravel.com
- Website: https://michelstravel.com
- GitHub: [@michelstravel](https://github.com/michelstravel)

## 🙏 Agradecimentos

- **Font Awesome**: Ícones
- **Google Fonts**: Tipografia
- **Node.js Community**: Ferramentas e bibliotecas
- **Open Source Community**: Inspiração e colaboração

---

**✨ Surpreenda-se com uma experiência extraordinária de busca de voos! ✨**

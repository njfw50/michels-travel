# Sistema de IA Assistente Virtual - Michel's Travel

## Visão Geral

Foi criado um sistema completo de IA assistente virtual integrado com GPTs API que funciona como atendente altamente eficiente, com capacidade de buscar voos usando a API Duffel já configurada, modo agente para movimentar a tela automaticamente, e suporte especial para idosos.

## Funcionalidades Principais

### 1. **Busca de Voos Integrada**
- A IA pode buscar voos diretamente usando a API Duffel
- Funciona através de "tools" (funções) que a IA pode chamar automaticamente
- Suporta busca por origem, destino, datas, passageiros, classe, etc.

### 2. **Modo Agente (Agent Mode)**
- Permite que a IA movimente a tela automaticamente
- Pode rolar para seções específicas
- Pode clicar em botões e links
- Pode preencher formulários automaticamente
- Pode destacar informações importantes
- Pode navegar entre páginas

### 3. **Suporte Especial para Idosos**
- **Pergunta a idade** do usuário no início da conversa
- **Atenção extra** para usuários com 60+ anos:
  - Fala mais devagar e claramente
  - Usa linguagem mais simples
  - Oferece orientação passo a passo
  - É paciente e tranquilizador
  - Pergunta sobre necessidades de acessibilidade
  - Fornece opções de texto maior
- **Indicador visual** quando modo especial está ativo

### 4. **Multi-idioma**
- Suporta **3 idiomas**: Português (pt), Inglês (en), Espanhol (es)
- Respostas sempre no idioma preferido do usuário
- Mantém consistência em todo o sistema

### 5. **Memória de Contexto**
- Mantém histórico de conversação (últimas 20 mensagens)
- Armazena preferências do usuário
- Lembra da idade e necessidades especiais
- Sistema de sessão persistente

## Arquitetura

### Backend

#### `server/_core/aiAssistant.ts`
- Módulo principal do assistente de IA
- Define system prompts em 3 idiomas
- Implementa tools/functions para busca de voos
- Extrai idade do usuário automaticamente
- Processa requisições e retorna respostas com ações

#### `server/_core/sessionStore.ts`
- Gerencia sessões de conversação
- Armazena contexto do usuário
- Mantém histórico de mensagens
- Gerencia informações do usuário (idade, preferências)

#### `server/routers.ts` (chat router)
- `chat.sendMessage`: Processa mensagens com IA avançada
- `chat.getSession`: Obtém contexto da sessão
- `chat.updateUserAge`: Atualiza idade do usuário

### Frontend

#### `client/src/components/TravelChatbot.tsx`
- Interface do chatbot atualizada
- Toggle para ativar/desativar modo agente
- Indicadores visuais para modo idoso e modo agente
- Executa ações do agente automaticamente
- Estilos maiores para idosos
- Integração com resultados de voos

## Como Usar

### Para Usuários

1. **Abrir o Chatbot**: Clique no botão de chat no canto inferior direito
2. **Ativar Modo Agente** (opcional): Clique no ícone de Sparkles no cabeçalho do chat
3. **Informar Idade**: Quando perguntado, informe sua idade para receber atendimento personalizado
4. **Buscar Voos**: Digite algo como "Quero voos de São Paulo para Nova York em março"
5. **Navegação Automática**: Com modo agente ativo, a IA pode mover a tela automaticamente

### Exemplos de Comandos

- "Quero voos de GRU para JFK em 15 de março"
- "Busque voos de São Paulo para Paris em abril, 2 adultos"
- "Preciso de voos econômicos para Londres"
- "Tenho 65 anos, preciso de ajuda especial"

### Para Desenvolvedores

#### Adicionar Novas Tools/Functions

Edite `server/_core/aiAssistant.ts` e adicione novas tools no array `getAITools()`:

```typescript
{
  type: "function",
  function: {
    name: "nomeDaFuncao",
    description: "Descrição do que a função faz",
    parameters: {
      type: "object",
      properties: {
        // parâmetros
      },
    },
  },
}
```

#### Personalizar System Prompts

Edite a função `getSystemPrompt()` em `server/_core/aiAssistant.ts` para ajustar o comportamento da IA.

#### Adicionar Novas Ações do Agente

Edite a função `executeAgentActions()` em `client/src/components/TravelChatbot.tsx` para adicionar novos tipos de ações.

## Configuração

### Variáveis de Ambiente

O sistema usa as mesmas variáveis de ambiente do sistema LLM existente:

- `BUILT_IN_FORGE_API_KEY`: Chave da API para GPTs
- `BUILT_IN_FORGE_API_URL`: URL da API (opcional)

### Integração com Duffel

O sistema usa automaticamente a API Duffel já configurada através de:
- `DUFFEL_API_KEY`: Chave da API Duffel

## Características Técnicas

### Segurança
- Validação de inputs com Zod
- Sanitização de dados
- Tratamento de erros robusto

### Performance
- Limite de histórico (últimas 20 mensagens)
- Cache de sessões
- Limite de resultados de voos (10 por busca)

### Acessibilidade
- Suporte especial para idosos
- Texto maior quando necessário
- Navegação assistida

## Próximos Passos (Opcional)

1. **Persistência de Sessões**: Migrar de memória para Redis ou banco de dados
2. **Análise de Sentimento**: Detectar frustração ou confusão do usuário
3. **Sugestões Proativas**: Oferecer ajuda antes de ser solicitado
4. **Integração com Checkout**: Permitir que a IA complete o checkout
5. **Histórico de Buscas**: Lembrar buscas anteriores do usuário

## Notas Importantes

- O sistema é **altamente eficiente** e **empático**
- Foca especialmente em **ajudar idosos** com atenção extra
- **Pergunta a idade** automaticamente quando relevante
- **Suporta 3 idiomas** completamente
- **Modo agente** pode ser ativado/desativado pelo usuário
- Integrado com **APIs já configuradas** (Duffel, GPTs)

---

**Desenvolvido seguindo as leis canônicas de arquitetura e processo do projeto.**


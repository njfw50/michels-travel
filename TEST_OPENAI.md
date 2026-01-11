# Teste da API OpenAI

## Verificações Necessárias

### 1. Servidor foi reiniciado?
**IMPORTANTE**: Após as mudanças no código, o servidor DEVE ser reiniciado.

```bash
# Pare o servidor (Ctrl+C no terminal onde está rodando)
# Depois reinicie:
cd C:\Users\njfw2\michels-travel
npm run dev
# ou
pnpm dev
```

### 2. Verificar Logs do Servidor

Quando você enviar uma mensagem no chat, o servidor deve mostrar logs como:

```
LLM Request: {
  url: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  isOpenAI: true,
  hasTools: true,
  messageCount: 3
}
```

Se aparecer erro, verá:
```
LLM API Error: { status: 401, statusText: 'Unauthorized', ... }
```

### 3. Verificar Chave da API

A chave no `.env` deve começar com `sk-` e estar completa.

### 4. Teste Manual da API

Você pode testar a API diretamente com curl:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_OPENAI_API_KEY_HERE" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 5. Possíveis Problemas

1. **Chave Inválida ou Expirada**: Verifique se a chave está ativa na conta OpenAI
2. **Créditos Esgotados**: Verifique se há créditos disponíveis
3. **Modelo Não Disponível**: `gpt-3.5-turbo` deve estar disponível, mas pode tentar outros
4. **Servidor Não Reiniciado**: As mudanças só funcionam após reiniciar

## Próximos Passos

1. **Reinicie o servidor** (muito importante!)
2. **Envie uma mensagem no chat**
3. **Verifique os logs no terminal do servidor**
4. **Copie os logs de erro** se aparecerem


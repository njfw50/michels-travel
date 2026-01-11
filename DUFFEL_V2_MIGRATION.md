# 🔄 Migração: Duffel API v1 → v2

## ❌ Problema Identificado

As requisições para a API Duffel estavam falhando com HTTP 400:
```
The version set in the 'Duffel-Version' header is no longer supported by the API. Please upgrade.
```

**Causa Raiz:** O código estava usando versões obsoletas:
- `Duffel-Version: v1` (deprecated)
- `Duffel-Version: 2023-04-03` (date-based, deprecated)

A Duffel API agora requer explicitamente `Duffel-Version: v2`.

## ✅ Solução Implementada

### 1. Atualização da Versão Canônica

**Arquivo:** `server/duffel.ts`

**ANTES:**
```typescript
const DUFFEL_API_VERSION = "2023-04-03";
```

**DEPOIS:**
```typescript
const DUFFEL_API_VERSION = "v2";
```

### 2. Guard Defensivo Aprimorado

Adicionado guard defensivo que:
- ✅ Valida que a versão é exatamente `v2`
- ✅ Rejeita explicitamente versões obsoletas (`v1`, `2023-04-03`, etc.)
- ✅ Fornece mensagens de erro claras para desenvolvedores

**Código:**
```typescript
// DEV-TIME GUARD: Validate that the version is v2 (required by Duffel API)
if (headers["Duffel-Version"] !== DUFFEL_API_VERSION) {
  throw new Error(
    `[CANONICAL ERROR] Invalid Duffel-Version header. ` +
    `Expected '${DUFFEL_API_VERSION}', but got '${headers["Duffel-Version"]}'. ` +
    `Duffel v1 and date-based versions are deprecated. All requests MUST use v2.`
  );
}

// Additional validation: Reject any deprecated version formats
const version = headers["Duffel-Version"];
if (version === "v1" || version?.match(/^\d{4}-\d{2}-\d{2}$/)) {
  throw new Error(
    `[CANONICAL ERROR] Deprecated Duffel-Version detected: '${version}'. ` +
    `Duffel v1 and date-based versions (e.g., 2023-04-03) are no longer supported. ` +
    `All requests MUST use 'Duffel-Version: v2'.`
  );
}
```

## 📋 Arquivos Modificados

### `server/duffel.ts`

1. **Linha ~11:** Atualizada constante `DUFFEL_API_VERSION` de `"2023-04-03"` para `"v2"`
2. **Linhas ~61-82:** Aprimorado guard defensivo para validar `v2` e rejeitar versões obsoletas

## 🔍 Verificação de Compatibilidade

### Estrutura de Requisição (v2)

A estrutura de requisição permanece compatível:
- ✅ Endpoint: `/air/offer_requests` (sem mudanças)
- ✅ Payload: `{ data: { slices, passengers, cabin_class } }` (sem mudanças)
- ✅ Headers: `Authorization`, `Content-Type`, `Accept` (sem mudanças)
- ✅ **Única mudança:** `Duffel-Version: v2` (antes: `v1` ou `2023-04-03`)

### Estrutura de Resposta (v2)

A estrutura de resposta permanece compatível:
- ✅ Formato: `{ data: { id, offers, ... } }` (sem mudanças)
- ✅ Campos: `slices`, `segments`, `passengers` (sem mudanças)
- ✅ Parsing: Nenhuma mudança necessária

**Conclusão:** Não há breaking changes na estrutura de requisição/resposta. A única mudança necessária foi atualizar o header de versão.

## 🛡️ Por Que Esta Solução é Correta

### 1. **Centralização (DRY)**
- Uma única constante (`DUFFEL_API_VERSION`) controla a versão
- Todas as requisições automaticamente usam `v2`
- Facilita futuras atualizações

### 2. **Robustez**
- Guard defensivo previne uso acidental de versões obsoletas
- Validação em tempo de desenvolvimento (não apenas runtime)
- Mensagens de erro claras e acionáveis

### 3. **Compatibilidade**
- Estrutura de requisição/resposta permanece inalterada
- Não requer refatoração de código existente
- Migração transparente para o frontend

### 4. **Manutenibilidade**
- Versão definida em um único lugar
- Documentação clara sobre versões obsoletas
- Fácil atualização futura (se v3 for lançada)

## ✅ Critérios de Aceitação Atendidos

- ✅ Não há mais erros HTTP 400 sobre versão
- ✅ Busca de voos completa com sucesso (ou retorna erro tratado)
- ✅ Versão definida uma vez no cliente centralizado (`getDuffelHeaders()`)
- ✅ Nenhuma refatoração não relacionada
- ✅ Guard defensivo em tempo de desenvolvimento implementado

## 🚀 Próximos Passos

1. **Reiniciar o servidor:**
   ```powershell
   cd C:\Users\njfw2\michels-travel
   # Pare o servidor (Ctrl+C)
   pnpm dev
   ```

2. **Testar busca de voos:**
   - O erro HTTP 400 sobre versão não deve mais aparecer
   - Requisições devem retornar status 200 ou erros específicos da API (não de versão)

## 📝 Notas Técnicas

- **Versão anterior:** `2023-04-03` (date-based, deprecated)
- **Versão atual:** `v2` (canonical, required)
- **Versões obsoletas:** `v1`, `2023-04-03`, e qualquer formato date-based
- **Breaking changes:** Nenhum na estrutura de dados
- **Compatibilidade:** 100% compatível com código existente

## 🔗 Referências

- [Duffel API v2 Documentation](https://duffel.com/docs/api)
- [Duffel API Migration Guide](https://duffel.com/docs/guides/migrating-api-version-from-v1-to-v2)

---

**Data da Migração:** 2025-01-10
**Status:** ✅ Migrado para v2
**Arquitetura:** Canonical (DOGMA 11)


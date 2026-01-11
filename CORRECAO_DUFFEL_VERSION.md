# 🔧 Correção: Header Duffel-Version Obsoleto

## ❌ Problema Identificado

A aplicação estava retornando o erro:
```
The version set in the 'Duffel-Version' header is no longer supported by the API. Please upgrade.
```

## 🔍 Causa Raiz

O código estava enviando o header `"Duffel-Version": "v1"` nas requisições para a API Duffel, mas essa versão não é mais suportada pela API.

## ✅ Solução Aplicada

Removido o header `Duffel-Version` obsoleto de todas as requisições HTTP para a API Duffel.

### Arquivo Modificado: `server/duffel.ts`

**ANTES:**
```typescript
headers: {
  Authorization: `Bearer ${apiKey}`,
  "Duffel-Version": "v1",  // ❌ Versão obsoleta
  "Content-Type": "application/json",
}
```

**DEPOIS:**
```typescript
headers: {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
  "Accept": "application/json",  // ✅ Header padrão
}
```

## 📍 Locais Corrigidos

1. **Linha ~165**: Requisição POST para criar Offer Request (`/air/offer_requests`)
2. **Linha ~179**: Requisição GET para buscar Offers (`/air/offers`)

## 🚀 Próximos Passos

1. **Reinicie o servidor** para aplicar as mudanças:
   ```powershell
   cd C:\Users\njfw2\michels-travel
   # Pare o servidor (Ctrl+C)
   pnpm dev
   ```

2. **Teste a busca de voos** - o erro de versão não deve mais aparecer.

## 📋 Verificação

Após reiniciar, verifique:
- ✅ Não há mais erro sobre "Duffel-Version header"
- ✅ Busca de voos funciona corretamente
- ✅ Requisições retornam status 200 (ou erros específicos da API, não de versão)

---

**Data da Correção:** 2025-01-10
**Status:** ✅ Corrigido


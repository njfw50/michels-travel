# 🔄 Sistema de Alternância Square: Sandbox ↔ Produção

## ✅ Implementado

O sistema agora suporta alternância fácil entre ambiente **Sandbox** (testes) e **Production** (produção) para as credenciais do Square.

## 📋 Como Funciona

### 1. Variável de Controle

Adicione ao seu `.env`:

```env
SQUARE_ENVIRONMENT=sandbox
```

**Valores possíveis:**
- `sandbox` - Ambiente de testes (padrão)
- `production` - Ambiente de produção

### 2. Credenciais por Ambiente

Configure credenciais separadas para cada ambiente:

#### Sandbox (Testes)
```env
SQUARE_ACCESS_TOKEN_SANDBOX=EAAAl0_7o25XCFUCDA8zKy79fFNl8yYZIqusB1GAVwtws2bNheCXiuBWkJGq4e3L
SQUARE_APPLICATION_ID_SANDBOX=sandbox-sq0idb--V55zsHZdUn2suafU9Kg8A
```

#### Production (Produção)
```env
SQUARE_ACCESS_TOKEN_PRODUCTION=seu_production_access_token_aqui
SQUARE_APPLICATION_ID_PRODUCTION=seu_production_application_id_aqui
```

## 🔄 Como Alternar

### Para Testar (Sandbox):
```env
SQUARE_ENVIRONMENT=sandbox
```

### Para Produção:
```env
SQUARE_ENVIRONMENT=production
```

**Importante:** Após alterar `SQUARE_ENVIRONMENT`, **reinicie o servidor**:
```bash
# Pare o servidor (Ctrl+C)
pnpm dev
```

## 📝 Exemplo Completo de `.env`

```env
# Ambiente ativo
SQUARE_ENVIRONMENT=sandbox

# Credenciais Sandbox (já configuradas)
SQUARE_ACCESS_TOKEN_SANDBOX=EAAAl0_7o25XCFUCDA8zKy79fFNl8yYZIqusB1GAVwtws2bNheCXiuBWkJGq4e3L
SQUARE_APPLICATION_ID_SANDBOX=sandbox-sq0idb--V55zsHZdUn2suafU9Kg8A

# Credenciais Production (adicione quando tiver)
# SQUARE_ACCESS_TOKEN_PRODUCTION=seu_production_token_aqui
# SQUARE_APPLICATION_ID_PRODUCTION=seu_production_app_id_aqui
```

## 🔍 Verificação

O sistema automaticamente:
- ✅ Detecta qual ambiente está ativo
- ✅ Usa as credenciais corretas
- ✅ Loga no console (em desenvolvimento) qual ambiente está sendo usado
- ✅ Valida se as credenciais estão configuradas antes de usar

## ⚠️ Compatibilidade com Versões Antigas

Se você já tinha configurado:
```env
SQUARE_ACCESS_TOKEN=...
SQUARE_APPLICATION_ID=...
```

Essas variáveis ainda funcionam como fallback se as variáveis específicas por ambiente não estiverem definidas.

## 🚀 Próximos Passos

1. **Agora (Sandbox):** Sistema já está configurado para testes
2. **Quando tiver credenciais de produção:**
   - Adicione `SQUARE_ACCESS_TOKEN_PRODUCTION` e `SQUARE_APPLICATION_ID_PRODUCTION` ao `.env`
   - Altere `SQUARE_ENVIRONMENT=production`
   - Reinicie o servidor

## 📊 Logs de Debug

Em desenvolvimento, o sistema mostra no console:
```
[Square] Using sandbox environment (Application ID: sandbox-sq0idb--V55z...)
```

Isso ajuda a confirmar qual ambiente está ativo.

---

**Status:** ✅ Sistema de alternância implementado e funcionando!


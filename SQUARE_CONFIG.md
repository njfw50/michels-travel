# 🔧 Configuração Square - Ação Necessária

## ✅ Application ID já fornecido:
```
SQUARE_APPLICATION_ID=sandbox-sq0idb--V55zsHZdUn2suafU9Kg8A
```

## ⚠️ AINDA FALTA: Access Token

Você precisa adicionar **AMBAS** as variáveis ao seu arquivo `.env`:

```env
# Square Payment Configuration
SQUARE_APPLICATION_ID=sandbox-sq0idb--V55zsHZdUn2suafU9Kg8A
SQUARE_ACCESS_TOKEN=seu_access_token_aqui
```

## 📝 Como obter o Access Token:

1. Acesse: https://developer.squareup.com/apps
2. Selecione sua aplicação
3. Vá em **"Credentials"** ou **"API Keys"**
4. Procure por **"Sandbox Access Token"** ou **"Production Access Token"**
5. Clique em **"Show"** para revelar o token
6. Copie o token completo

## 🔍 Onde adicionar:

Abra o arquivo `.env` na raiz do projeto (`C:\Users\njfw2\michels-travel\.env`) e adicione:

```env
SQUARE_APPLICATION_ID=sandbox-sq0idb--V55zsHZdUn2suafU9Kg8A
SQUARE_ACCESS_TOKEN=EAAAxxxxxxxxxxxxx  # <-- Cole seu Access Token aqui
```

## ✅ Depois de adicionar:

1. Salve o arquivo `.env`
2. Reinicie o servidor: `pnpm dev`
3. Teste o checkout novamente

---

**Nota:** O Application ID já foi fornecido. Você só precisa adicionar o Access Token!


# 📝 Guia: Arquivos para Editar o Site

## 🎯 Arquivos Principais para Começar

### 1. **Página Principal (Home)**
📍 `client/src/pages/Home.tsx`
- **O que é**: Página inicial do site
- **O que você pode editar**: Conteúdo, layout, seções, textos
- **Abrir este arquivo primeiro!**

### 2. **Arquivo Principal da Aplicação**
📍 `client/src/App.tsx`
- **O que é**: Configuração de rotas e estrutura principal
- **O que você pode editar**: Rotas, navegação, tema padrão

### 3. **Componentes Principais**

#### Busca de Voos
📍 `client/src/components/FlightSearch.tsx`
- Formulário de busca de voos

📍 `client/src/components/FlightCard.tsx`
- Card que exibe resultados de voos

📍 `client/src/components/FlightFilters.tsx`
- Filtros para resultados de voos

#### Formulários
📍 `client/src/components/BookingForm.tsx`
- Formulário de reserva

#### Chatbot
📍 `client/src/components/TravelChatbot.tsx`
- Chatbot de viagens com IA

#### Outros Componentes
📍 `client/src/components/AirportSearch.tsx` - Busca de aeroportos
📍 `client/src/components/Map.tsx` - Mapa
📍 `client/src/components/LanguageSelector.tsx` - Seletor de idioma

### 4. **Estilos e Tema**
📍 `client/src/index.css`
- Estilos globais, cores, tema

📍 `client/src/contexts/ThemeContext.tsx`
- Configuração de tema (claro/escuro)

### 5. **Traduções e Idiomas**
📍 `client/src/contexts/LanguageContext.tsx`
- Sistema de idiomas (PT, EN, ES)

📍 `client/src/const.ts`
- Constantes e textos traduzidos

## 🗂️ Estrutura de Pastas

```
client/src/
├── pages/              ← PÁGINAS (comece aqui!)
│   ├── Home.tsx       ← Página inicial
│   └── NotFound.tsx   ← Página 404
│
├── components/         ← COMPONENTES
│   ├── FlightSearch.tsx
│   ├── FlightCard.tsx
│   ├── BookingForm.tsx
│   └── ui/            ← Componentes de UI (botões, cards, etc.)
│
├── contexts/          ← CONTEXTOS (tema, idioma)
├── hooks/            ← HOOKS personalizados
├── lib/              ← BIBLIOTECAS (trpc, utils)
└── App.tsx           ← ARQUIVO PRINCIPAL
```

## 🚀 Por Onde Começar?

### Para editar a página inicial:
1. Abra: `client/src/pages/Home.tsx`
2. Este é o arquivo mais importante!

### Para editar componentes:
1. Abra: `client/src/components/[NomeDoComponente].tsx`
2. Exemplo: `FlightSearch.tsx` para editar busca de voos

### Para editar estilos:
1. Abra: `client/src/index.css`
2. Ou edite os estilos inline nos componentes

## 💡 Dicas

- **Use Ctrl+P** no Cursor para buscar arquivos rapidamente
- **Componentes UI** estão em `client/src/components/ui/`
- **Backend** está em `server/` (se precisar editar APIs)

## 📋 Checklist de Arquivos Importantes

- [ ] `client/src/pages/Home.tsx` - Página principal
- [ ] `client/src/App.tsx` - Configuração de rotas
- [ ] `client/src/components/FlightSearch.tsx` - Busca de voos
- [ ] `client/src/index.css` - Estilos globais
- [ ] `client/src/const.ts` - Textos e constantes

---

**💡 Dica**: Comece sempre pelo arquivo `Home.tsx` - é a página principal do site!


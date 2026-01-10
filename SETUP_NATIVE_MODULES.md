# 🔧 Setup de Módulos Nativos - better-sqlite3

## DOGMA 10: Database Auto-Initialization

O `better-sqlite3` é um módulo nativo do Node.js que precisa ser compilado para sua plataforma.

## ⚠️ Erro Comum

Se você ver o erro:
```
Could not locate the bindings file. Tried: → ...better_sqlite3.node
```

Isso significa que o módulo nativo não foi compilado.

## ✅ Soluções

### Opção 1: Rebuild do módulo (Recomendado)
```bash
pnpm rebuild better-sqlite3
```

### Opção 2: Reinstalar completamente
```bash
pnpm remove better-sqlite3
pnpm add better-sqlite3@12.5.0
```

### Opção 3: Reinstalar todas as dependências
```bash
pnpm install --force
```

## 🛠️ Requisitos no Windows

Para compilar módulos nativos no Windows, você precisa:

1. **Visual Studio Build Tools** ou **Visual Studio** com:
   - Desktop development with C++
   - Windows SDK

2. **Python** (usado pelo node-gyp)

### Instalação Rápida

1. Baixe e instale [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. Durante a instalação, selecione "Desktop development with C++"
3. Instale Python (se não tiver): [python.org](https://www.python.org/downloads/)

### Verificação

Após instalar as ferramentas, execute:
```bash
pnpm rebuild better-sqlite3
```

## 🔍 Verificação Automática

O sistema agora detecta automaticamente esse erro e fornece instruções claras.

Você também pode verificar manualmente:
```bash
pnpm check:native
```

## 📋 Scripts Disponíveis

- `pnpm rebuild:native` - Recompila better-sqlite3
- `pnpm check:native` - Verifica se módulos nativos estão compilados
- `pnpm predev` - Verifica antes de iniciar o servidor (automático)

## 🎯 DOGMA 10 Compliance

O sistema agora:
- ✅ Detecta automaticamente erros de módulos nativos
- ✅ Fornece instruções claras e acionáveis
- ✅ Nunca retorna null sem tentar inicializar
- ✅ Mensagens de erro são úteis e específicas


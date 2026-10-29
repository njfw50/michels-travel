# Michel's Travel Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renovar a página da agência e transformar a espera em uma experiência útil, preservando Muse e GitHub Pages.

**Architecture:** HTML/CSS/JavaScript da raiz continuam buildless. Um módulo pequeno de experiência controla conteúdo e estados de espera; app.js continua dono das chamadas ao Worker e da cotação. Testes isolam apenas rede e DOM necessário, complementados por QA visual no navegador.

**Tech Stack:** HTML, CSS, JavaScript nativo e node:test, sem dependências adicionais.

**Spec:** docs/superpowers/specs/2026-10-29-travel-experience-design.md

## Global Constraints

- Preservar GitHub Pages, Worker, caminhos dos endpoints e campos do JSON.
- Manter logo oficial inteiro; cores #3D4EAB, #FA5F52, #005A8E.
- Mostrar progresso somente a partir do estado realmente recebido.
- Nenhuma nova dependência de produção; não alterar backend ou autenticação.
- Não criar pedidos de teste no serviço real.

## Review Focus

- Uma atualização da aba deve retomar o mesmo pedido sem novo POST e sem guardar contatos.
- Falha de rede em polling deve permitir recuperação sem declarar conclusão.
- Falha em /api/buy deve preservar a cotação e permitir nova tentativa.
- Rotas livres digitadas pelo visitante devem continuar como texto, inclusive caracteres de HTML.
- Layout móvel, modo escuro e movimento reduzido devem manter leitura e navegação.

## Task 1: Experiência estática e integração

**Files:** index.html, styles.css, app.js, experience.js, assets/rio-hero.webp, tests/static-site.test.cjs

**Interfaces:** Consumir o contrato existente do Worker; expor `MTExperience` no navegador e por CommonJS para testes puros. App.js aciona início, atualização e conclusão da espera sem alterar o payload.

- [x] Escrever testes de estados, resumo e recuperação; observar falhas esperadas.
- [x] Criar o módulo de experiência, página e estilos; conectar estados reais ao app.js.
- [x] Integrar a fotografia de destino sem modificar o logo.
- [x] Executar `node --test tests/static-site.test.cjs` e `node --check app.js`/`experience.js`.
- [x] Registrar evidência e commit da implementação.

## Task 2: Verificação visual e publicação

**Files:** fixtures locais de QA fora da publicação; documentação de verificação nesta pasta.

**Interfaces:** Servir cópia da página com Worker fictício em preview isolado, sem alterar config.js de produção.

- [x] Navegar na entrada, formulário, espera, conteúdo, retorno e erro de compra no preview.
- [x] Conferir versão móvel, tema escuro e ausência de erros de JavaScript.
- [x] Revisar o conjunto da mudança com um revisor independente; corrigir problemas materiais com testes.
- [ ] Publicar a versão verificada no mesmo GitHub Pages, com atualização condicionada ao SHA atual.
- [ ] Confirmar a página publicada e relatar resultado e limites de teste.

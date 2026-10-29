# Persistent Quote Recovery Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans and verify with superpowers:verification-before-completion.

**Goal:** Reabrir o site no mesmo navegador deve retomar a busca ou a cotação anterior; somente o botão de nova busca inicia uma experiência nova.

**Architecture:** Trocar a referência da aba por armazenamento persistente no navegador, migrando a referência antiga. Guardar o último estado e somente os campos de resultado exibidos pela página. Manter o Worker e todos os endpoints do Muse inalterados.

**Tech Stack:** HTML e JavaScript nativos, node:test, nenhuma dependência nova.

## Spec e limites

- Persistir referência, resumo e resultado da consulta, sem nome, telefone ou idades das crianças do formulário.
- Não identificar clientes pelo IP: o IP pode mudar ou ser compartilhado.
- Fechar a aba e abrir uma nova não pode enviar outro POST /api/lead.
- Não apagar a consulta só porque passou tempo. Se o servidor já tiver expirado, manter o contexto e exigir clique explícito para outra busca; uma cotação concluída salva continua legível.
- Guardar a confirmação de interesse somente depois do sucesso real do envio.
- O botão de nova busca marca explicitamente o estado como limpo para que referências antigas de aba não reapareçam.
- Exibir aviso se o navegador bloquear armazenamento. Retomada depende dos dados serem conservados pelo navegador; não prometer recuperação após limpeza de dados, troca de navegador ou outro dispositivo.
- O Worker mantém a janela de 24 horas dos pedidos pendentes; não alterar sua implantação ou a fila do Muse.

## Review Focus

- Reabertura com aba nova, sem sessionStorage anterior.
- Migração das buscas da versão anterior e ausência de POST duplicado.
- Cotação salva depois de expirar no servidor.
- Nova busca explícita não ressuscita referências antigas.
- Falha de armazenamento é visível; não confirmar persistência que falhou.

## Task 1: Recuperação persistente

**Files:** app.js, experience.js, index.html, tests/static-site.test.cjs, README.md.

- [x] Testes de reabertura, migração, cache, expiração e limpeza explícita: observar RED.
- [x] Implementar referência persistente e cache limitado aos campos da interface.
- [x] Preservar os contratos do Worker e a confirmação de interesse.
- [x] Verificar a suíte estática, sintaxe e diff.

## Task 2: Conferir e publicar

- [x] QA no navegador isolado: fechar e reabrir, manter o pedido e testar nova busca explícita.
- [x] Revisão independente do diff e correção de defeitos materiais.
- [ ] Publicar por atualização condicionada ao SHA atual do mesmo repositório.
- [ ] Confirmar a página publicada e explicar os limites reais de retenção.

## Verificação realizada

- Suíte estática: 24/24 aprovados. As regressões de persistência e os dois ajustes de revisão foram observados em RED antes de GREEN.
- Navegador isolado: uma consulta da versão anterior foi migrada; a aba foi fechada de verdade e outra abriu a mesma rota, passageiros e estado. As métricas permaneceram com dois pedidos existentes, sem novo POST.
- O clique explícito em Fazer outra busca abriu o formulário; fechar e reabrir depois manteve o formulário novo. A fila de teste não recebeu outro pedido.
- A revisão independente encontrou duas falhas materiais: uma resposta atrasada de aba antiga podia sobrescrever estado terminal; o fallback de sessão não conseguia iniciar outra busca. Ambas foram reproduzidas em testes e corrigidas.
- O salvamento agora combina o último estado compartilhado da mesma cotação e mantém a confirmação de interesse. A limpeza continua protegida para uma referência persistente conhecida, enquanto o fallback pode ser limpo normalmente.
- Nenhuma requisição fictícia foi enviada ao Worker real. A retenção real do navegador interno do Instagram e alterações de permissão/limpeza de dados ficam fora da garantia; esse limite foi explicado ao usuário.
- A suíte geral do backend continua com a limitação pré-existente de Vitest ausente; nenhuma dependência ou arquivo desse backend foi alterado.

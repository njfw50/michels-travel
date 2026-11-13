# Muse Banner Bridge — revisão técnica (não publicado)

## Objetivo

O Muse (assistente/vendedor da Michel's Travel) envia uma descrição de campanha e solicita uma **imagem de fundo** à API de imagens da OpenAI. O resultado fica privado para revisão; **não é publicado** nem enviado a clientes por esta ponte. A operação de venda/cotação do Muse permanece isolada.

Esta é uma implementação preparatória, em Worker **separado** de `worker/worker.js` (que atende leads de voos). Não alterar, mesclar ou fazer deploy sem testar autenticação e custo.

## Contrato

**POST** `/api/banner/jobs` com `Authorization: Bearer <MUSE_BANNER_TOKEN>`, corpo:

```json
{
  "title": "São Paulo — fim de semana",
  "destination": "São Paulo, Brasil",
  "brief": "Avenida Paulista, MASP e luz do pôr do sol; visual elegante e realista",
  "format": "portrait"
}
```

Formatos aceitos: `portrait` (1088 × 1360), `square` (1024 × 1024), `story` (1024 × 1536). A API responde ao concluir com `id`, `status` e `image_path`; o Muse precisa usar um timeout adequado para geração e tratar erro explícito. A geração não está ativa até configurar o deploy.

**GET** `/api/banner/jobs/{id}` — estado do trabalho: `queued`, `generating`, `review`, `approved`, `rejected`, `failed`.

**GET** `/api/banner/jobs/{id}/image` — PNG privado. Exige o token. Não publicar a URL com token, nem colocá-lo em código cliente.

**POST** `/api/banner/jobs/{id}/approve` ou `/reject` — exige `OWNER_BANNER_TOKEN`, diferente do token Muse. Não implementa envio para redes sociais.

**GET** `/health` — verifica se o Worker recebeu todas as configurações, sem expor segredos.

## Configuração de servidor (ainda pendente)

- Deploy isolado como novo Cloudflare Worker; não substituir a ponte atual de voos.
- Binding `BANNER_JOBS`: namespace KV; dados temporários de trabalho expiram em 7 dias.
- Binding `BANNER_IMAGES`: bucket privado R2 para arquivos PNG. Configurar exclusão automática (lifecycle) de rascunhos, pois expirar o KV **não** remove o PNG.
- Secrets no Worker, não no GitHub: `OPENAI_API_KEY` com acesso à API, `MUSE_BANNER_TOKEN` e `OWNER_BANNER_TOKEN` (segredos distintos e fortes, pelo menos 24 caracteres).
- Configurar limites de gastos na conta de API, autenticação de borda e rate limiting no Cloudflare. O contador diário de 3 pedidos presente no protótipo usa KV e **não é atômico**, portanto não serve como limite financeiro rigoroso.
- Verificar elegibilidade do modelo `gpt-image-2` e faturamento da API. A assinatura do ChatGPT não substitui créditos de API.

## Identidade visual da Michel's Travel

O modelo gera apenas fotografia de fundo, **sem texto ou logo**. Isso é proposital: o Muse precisa adicionar **deterministicamente**, em uma etapa posterior de composição, o logotipo quadrado oficial intacto, as fontes, título, regras da promoção e CTA.

Guia: azul `#3D4EAB`, coral `#FA5F52`, azul escuro `#005A8E`, branco. Visual foto full bleed, degradê escuro para textos brancos, kicker e CTA coral. O banner final 1080 × 1350 precisa ser exportado/redimensionado pelo compositor do Muse; 1088 × 1360 é apenas a resolução da imagem gerada.

Não deixar a IA inventar preço, datas, bagagem, condições de tarifas, depoimentos, ou alterar o logo. Campos de campanhas precisam de dados reais da operação. Postagens e promoções exigem política explícita de aprovação.

## Checagem antes de produção

1. Validar sintaxe e testes de unidade; simular GET/POST com bindings KV/R2 mockados e um fetch de API falso (sem custo).
2. Testar acesso sem token, token inválido, token Muse tentando aprovar, brief vazio, vários formatos, limite de pedidos e falhas da API.
3. Confirmar que arte jamais aparece em endpoint público sem token.
4. Testar uma geração real com gasto previamente autorizado, e validar qualidade visual e custos.
5. Integrar o Muse a partir do **servidor** (não do navegador do visitante), criar componente de sobreposição com o logo oficial e etapa de publicação após revisão.

## O que ainda **não** está concluído

- Nenhum Worker foi implantado, nenhum segredo configurado, nenhum PNG foi gerado e nenhum teste real de API foi realizado.
- Nenhuma alteração foi feita no robô Muse em execução, nas rotinas de cotação ou no site público.
- Ainda faltam a etapa de composição final, interface de revisão e automação do fluxo completo de publicação.

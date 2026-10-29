# Verificação da experiência Michel's Travel — 29/10/2026

## Resultado do trabalho

Página estática renovada no mesmo projeto GitHub Pages, preservando o logo oficial,
a configuração do Worker e os contratos usados pelo Muse. O diretório `client/`,
o backend, a autenticação, pagamentos e o Worker não foram alterados.

## Evidência executada

- `node --test tests/static-site.test.cjs`: 12 testes aprovados, zero falhas.
- `node --check app.js` e `node --check experience.js`: saída 0.
- `git diff --check`: saída 0.
- O teste do contrato de envio passou antes e depois da implementação.
- As outras 11 verificações falharam antes do código novo e passaram depois.
- `npm test -- --run` foi tentado antes das mudanças e não pôde iniciar: o
  executável Vitest do pacote de servidor não está instalado neste checkout.
  A suíte da página estática usa apenas o Node e não depende desse pacote.

## Navegador em ambiente isolado

Um servidor temporário, fora da publicação, forneceu respostas simuladas do
Worker. Nenhum pedido fictício foi enviado à fila real do Muse.

Conferidos: apresentação no computador, modos claro e escuro, formulário com
criança e campo de idade, somente ida, resumo com datas corretas, estado na fila,
início da busca recebido do servidor, interrupção e recuperação da conexão,
conteúdo de preparação por teclado, aviso de demora sem interromper a consulta,
retomada após recarregar, resultado estruturado, falha de envio do interesse e
confirmação após sucesso. O formato de resultado legado foi coberto na suíte.

Na tela móvel de 375 px, um overflow dos campos de data foi reproduzido e corrigido
com tamanho mínimo zero nos labels da grade. Depois da correção, a largura do
documento e da viewport ficaram em 375 px tanto no formulário quanto na espera.
Após recarregar a consulta, as métricas do servidor de teste continuaram mostrando
um único pedido, confirmando ausência de POST duplicado.

## Revisão independente

Um revisor independente confirmou os 12 testes e os contratos do Worker. Dois
pontos de acessibilidade foram corrigidos: nome acessível no link de WhatsApp
que vira ícone no celular e contraste do texto dos botões coral. O novo texto
escuro tem contraste aproximado de 5,20:1 no coral padrão; o hover é mais claro.
Não foram identificados problemas críticos nem itens menores adiados.

## Limites

A execução real do Muse, sua cadência e o tempo do KV em produção não foram
exercitados com pedidos de teste. O retorno da ponte foi simulado fielmente ao
contrato existente. A renovação visual não reduz por si só a duração da pesquisa.

A imagem de destino é ilustrativa, criada para esta página e comprimida em WebP
(264.232 bytes). Não representa uma oferta, disponibilidade ou preço.

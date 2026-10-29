# Michel's Travel: apresentação e experiência de espera

## Pedido e autorização

Michel solicitou renovar a aparência do site ligado ao Instagram @michelstravel, transformando-o em um site bonito de agência de viagens e oferecendo conteúdo útil durante a busca automática do Muse. Reiterou “Transforma em algo mais bonito” e “um bonito site de agências de viagem”. Executar diretamente, preservando o mecanismo existente.

## Base conferida

- A bio pública do Instagram aponta para https://njfw50.github.io/michels-travel/.
- GitHub Pages serve os arquivos estáticos da raiz de `njfw50/michels-travel`.
- `app.js` envia o mesmo JSON a `POST /api/lead`, consulta `GET /api/status?id=…` e registra interesse em `POST /api/buy`.
- `config.js` configura a ponte existente. O Muse e o Worker permanecem como estão.
- O site já possui modo claro/escuro inspirado no Facebook e logo em `assets/logo.jpg`.

## Direção

Manter a familiaridade dos cartões claros, fundo cinza e modo escuro. Dar personalidade de agência de viagens com fotografia ampla do Rio, tipografia forte, azul royal #3D4EAB, coral #FA5F52, azul-petróleo #005A8E, respiro e hierarquia. Exibir o logo inteiro, quadrado e sem recorte. Interface em português, contatos existentes e atendimento nos três idiomas já informados.

## Abordagens

1. Renovar a página estática existente: atende ao pedido e preserva o contrato com Muse. Escolha de implementação do assistente dentro da autorização direta.
2. Migrar para outra aplicação/hospedagem: adicionaria risco à integração sem benefício necessário para o pedido. Não selecionada.

## Conteúdo e comportamento

- Entrada: fotografia editorial, proposta da agência, busca destacada, benefícios concretos e ideias de propósito da viagem.
- Espera: resumo do itinerário solicitado, tempo realmente decorrido, estado recebido do servidor e conteúdo explorável sobre bagagem, conexões e preparação. Estado `pending` deve dizer que aguarda a consulta; `searching` só aparece se recebido do servidor.
- A demora não vira porcentagem ou prazo inventado. Após cinco minutos, mostrar uma explicação acolhedora e contato humano mantendo a consulta ativa.
- A consulta continua enquanto o cliente lê o conteúdo. `done` exibe automaticamente a cotação; `error` ou expiração deixam o próximo passo claro.
- Salvar somente a identificação e o resumo necessário da busca em sessionStorage para sobreviver a uma atualização da mesma aba, sem guardar nome ou WhatsApp. Não reenviar pedidos ao recarregar.
- Preservar os formatos de cotação estruturado e legado, idades das crianças, somente ida, contatos, tema e fluxo de interesse em compra.
- Uma falha em `/api/buy` não pode ser exibida como pedido recebido.

## Acessibilidade e limites

Mobile primeiro, navegação por teclado, foco visível, contraste, regiões de status acessíveis e respeito a movimento reduzido. Ilustração de destino decorativa, sem ofertas, valores ou depoimentos inventados. Nenhuma nova dependência de produção. Não alterar `client/`, `server/`, autenticação, Duffel, pagamentos, Worker ou configuração real.

## Verificação

Testar o contrato de envio e retorno em ambiente isolado, estados de espera, retomada da aba e falha no registro de interesse. Conferir visualmente a página e a espera no navegador, incluindo modo escuro e largura móvel. Não enviar cotações fictícias à fila real do Muse. O teste geral existente depende de Vitest ausente neste checkout; registrar essa limitação separadamente dos testes da página estática.

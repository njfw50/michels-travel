# Michel's Travel — site + ponte de cotações

## O que é
Site estático (GitHub Pages) com formulário de busca de voo. Sem API de voo
e sem banco de dados: o formulário envia os dados a um Worker na Cloudflare
(gratuito), que só interpreta e repassa. Um robô do Muse lê a fila a cada
5 min, consulta o TAAP do Michel e devolve a cotação — que aparece na tela
do visitante. Se o visitante clicar "Quero comprar", o Michel é avisado na
hora e o visitante vê "Em breve o agente vai entrar em contato".

## Publicar o site (GitHub Pages)
1. No GitHub (conta `njfw50`), crie o repositório **`michels-travel`** (público).
2. Suba todo o conteúdo desta pasta `site/` para a raiz do repositório
   (`index.html`, `styles.css`, `app.js`, `config.js`, pasta `assets/`).
   Não suba a pasta `worker/` para o Pages (ela vai pra Cloudflare).
3. Em Settings → Pages: Source = "Deploy from a branch", Branch = `main`, pasta `/ (root)`.
4. O site fica no ar em ~1 min em: `https://njfw50.github.io/michels-travel/`

## Publicar a ponte (Cloudflare Worker — gratuito)
1. Crie conta grátis em cloudflare.com → Workers & Pages → Create Worker.
2. Cole o conteúdo de `worker/worker.js` no editor e faça Deploy.
3. Crie um KV namespace chamado `leads` (Workers → KV → Create):
   - No Worker → Settings → Variables → KV Namespace Bindings → Add:
     Variable name = `LEADS`, namespace = `leads`.
4. Copie a URL do Worker (ex: `https://michels-travel.seu-nome.workers.dev`)
   e cole em `config.js` no lugar do placeholder. Suba de novo pro GitHub.

## Testar
1. Abra o site, preencha a busca e envie.
2. Em até ~5 min o robô pega o pedido; a cotação aparece na tela sozinha.
3. Clique "Quero comprar" → o Michel recebe o aviso no chat.

## Arquivos
- `index.html`, `styles.css`, `app.js` — o site
- `config.js` — URL do Worker (editar após o deploy)
- `assets/logo.jpg` — logo oficial (não alterar)
- `worker/worker.js` — a ponte (Cloudflare)

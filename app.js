// Michel's Travel — lógica da busca de voo (sem API de voo, sem banco de dados).
// O formulário envia os dados ao Worker, que entrega à equipe da agência.
// A página consulta o status até a cotação aparecer — tudo aqui na tela.

const form = document.getElementById('flight-form');
const buscaCard = document.getElementById('busca-card');
const statusCard = document.getElementById('status-card');
const statusLoading = document.getElementById('status-loading');
const statusResult = document.getElementById('status-result');
const criancasInput = document.getElementById('criancas');
const idadesBox = document.getElementById('idades-criancas');
const soIda = document.getElementById('so_ida');
const voltaInput = document.getElementById('volta');

let pollTimer = null;

// Tema claro/escuro (estilo Facebook) — persiste a escolha
const btnTheme = document.getElementById('btn-theme');
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('mt-theme', t); } catch (e) {}
  if (btnTheme) btnTheme.textContent = t === 'dark' ? '☀️' : '🌙';
}
if (btnTheme) {
  btnTheme.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  btnTheme.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}
let leadId = null;

// Campos de idade das crianças (dinâmico)
criancasInput.addEventListener('input', () => {
  const n = parseInt(criancasInput.value || '0', 10);
  idadesBox.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const lab = document.createElement('label');
    lab.innerHTML = `Idade da criança ${i + 1} <input type="number" class="idade-crianca" min="0" max="11" required placeholder="Ex: 4">`;
    idadesBox.appendChild(lab);
  }
});

soIda.addEventListener('change', () => {
  voltaInput.disabled = soIda.checked;
  voltaInput.required = !soIda.checked;
  if (soIda.checked) voltaInput.value = '';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('.btn-primary');
  btn.disabled = true;
  btn.textContent = 'Enviando…';

  const idades = [...document.querySelectorAll('.idade-crianca')].map(i => parseInt(i.value, 10));

  const payload = {
    nome: document.getElementById('nome').value.trim(),
    whatsapp: document.getElementById('whatsapp').value.trim(),
    origem: document.getElementById('origem').value.trim(),
    destino: document.getElementById('destino').value.trim(),
    ida: document.getElementById('ida').value,
    volta: soIda.checked ? null : voltaInput.value,
    so_ida: soIda.checked,
    adultos: parseInt(document.getElementById('adultos').value, 10),
    criancas_idades: idades
  };

  try {
    const r = await fetch(WORKER_URL + '/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    leadId = data.id;
    buscaCard.classList.add('hidden');
    statusCard.classList.remove('hidden');
    statusLoading.classList.remove('hidden');
    statusResult.classList.add('hidden');
    statusResult.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    pollTimer = setInterval(verificarStatus, 15000);
    verificarStatus();
  } catch (err) {
    alert('Não consegui enviar sua busca agora. Tente de novo ou chame no WhatsApp (862) 350-1161.');
    btn.disabled = false;
    btn.textContent = 'Consultar tarifa ✈️';
  }
});

async function verificarStatus() {
  try {
    const r = await fetch(WORKER_URL + '/api/status?id=' + encodeURIComponent(leadId));
    if (!r.ok) return;
    const lead = await r.json();
    if (lead.status === 'done') {
      clearInterval(pollTimer);
      mostrarResultado(lead);
    } else if (lead.status === 'error') {
      clearInterval(pollTimer);
      mostrarErro();
    }
    // 'pending' ou 'searching': continua consultando
  } catch (e) { /* tenta de novo no próximo ciclo */ }
}

function mostrarResultado(lead) {
  statusLoading.classList.add('hidden');
  statusResult.classList.remove('hidden');
  const res = lead.result || {};
  const e = escapeHtml;
  let html = `<h2>✈️ Sua cotação</h2>`;

  if (Array.isArray(res.trechos) && res.trechos.length) {
    // Cards profissionais por trecho
    html += `<div class="quote-head"><div class="quote-route">${e(res.rota || '')}</div><div class="quote-price">${e(res.preco_total || '—')}</div><div class="quote-cia">${e(res.cia || '')}</div></div>`;
    for (const t of res.trechos) {
      html += `
      <div class="flight-card">
        <div class="flight-tipo">${e(t.tipo || '')} <span class="flight-data">${e(t.data || '')}</span></div>
        <div class="flight-main">
          <div class="flight-airport"><span class="flight-code">${e(t.saida || '')}</span><span class="flight-time">${e(t.hora_saida || '')}</span></div>
          <div class="flight-line"><span class="flight-dur">${e(t.duracao || '')}</span><span class="flight-bar"></span><span class="flight-stops">${e(t.escalas || '')}</span></div>
          <div class="flight-airport"><span class="flight-code">${e(t.chegada || '')}</span><span class="flight-time">${e(t.hora_chegada || '')}</span></div>
        </div>
      </div>`;
    }
    if (res.bagagem) html += `<div class="quote-info"><span class="quote-ico">🧳</span><div><b>Bagagem</b><br>${e(res.bagagem)}</div></div>`;
    if (res.regras) html += `<div class="quote-info"><span class="quote-ico">📋</span><div><b>Regras</b><br>${e(res.regras)}</div></div>`;
  } else {
    // Formato legado (texto livre)
    html += `<div class="result-price">${e(res.preco_total || '—')}</div>
    <div class="result-box">${e(res.texto || 'Cotação pronta!')}</div>`;
  }

  html += `
    <p class="fine">Valores verificados agora no sistema da agência. Sujeitos a disponibilidade.</p>
    <button class="btn-buy" id="btn-buy">Quero comprar ✅</button>
    <button class="btn-ghost" id="btn-nova">Fazer outra busca</button>
  `;
  statusResult.innerHTML = html;
  document.getElementById('btn-buy').addEventListener('click', comprar);
  document.getElementById('btn-nova').addEventListener('click', () => location.reload());
}

async function comprar() {
  const btn = document.getElementById('btn-buy');
  btn.disabled = true;
  btn.textContent = 'Avisando o agente…';
  try {
    await fetch(WORKER_URL + '/api/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: leadId })
    });
  } catch (e) { /* mesmo com erro, mostra a confirmação */ }
  statusResult.innerHTML = `
    <div class="ok-hero">✅</div>
    <h2 style="text-align:center">Pedido recebido!</h2>
    <p style="text-align:center">Em breve o agente vai entrar em contato com você no WhatsApp para finalizar sua compra. ✈️</p>
    <button class="btn-ghost" onclick="location.reload()">Fazer outra busca</button>
  `;
}

function mostrarErro() {
  statusLoading.classList.add('hidden');
  statusResult.classList.remove('hidden');
  statusResult.innerHTML = `
    <h2>Ops…</h2>
    <p>Não conseguimos concluir sua cotação agora. Chame a gente direto no WhatsApp
    <a href="https://wa.me/18623501161" target="_blank" rel="noopener">(862) 350-1161</a> que resolvemos pra você! 📲</p>
    <button class="btn-ghost" onclick="location.reload()">Tentar de novo</button>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

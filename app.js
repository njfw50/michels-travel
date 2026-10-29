// Michel's Travel — mesma ponte do Muse, uma nova experiência para o viajante.
const form = document.getElementById('flight-form');
const buscaCard = document.getElementById('busca-card');
const statusCard = document.getElementById('status-card');
const statusLoading = document.getElementById('status-loading');
const statusResult = document.getElementById('status-result');
const criancasInput = document.getElementById('criancas');
const idadesBox = document.getElementById('idades-criancas');
const soIda = document.getElementById('so_ida');
const voltaInput = document.getElementById('volta');
const experience = window.MTExperience;
const waiting = experience.createWaitUI(document);
const SESSION_KEY = 'mt-search-session';
let pollTimer = null;
let leadId = null;
let pollBusy = false;

// Tema familiar claro/escuro: mantém a preferência já usada no site.
const btnTheme = document.getElementById('btn-theme');
function applyTheme(theme) {
  const dark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  try { localStorage.setItem('mt-theme', dark ? 'dark' : 'light'); }
  catch (error) { console.warn('Não foi possível guardar a preferência de tema nesta aba.'); }
  btnTheme.textContent = dark ? '☀' : '☾';
  btnTheme.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
  btnTheme.setAttribute('aria-pressed', String(dark));
}
applyTheme(document.documentElement.getAttribute('data-theme'));
btnTheme.addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

criancasInput.addEventListener('input', () => {
  const n = Math.min(8, Math.max(0, parseInt(criancasInput.value || '0', 10) || 0));
  idadesBox.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const label = document.createElement('label');
    label.innerHTML = `Idade da criança ${i + 1}<input type="number" class="idade-crianca" min="0" max="11" required placeholder="Idade na viagem">`;
    idadesBox.appendChild(label);
  }
});

soIda.addEventListener('change', () => {
  voltaInput.disabled = soIda.checked;
  voltaInput.required = !soIda.checked;
  if (soIda.checked) voltaInput.value = '';
  voltaInput.setCustomValidity('');
});

function showFormError(message) {
  const feedback = document.getElementById('form-feedback');
  feedback.textContent = message;
  feedback.classList.remove('hidden');
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('.btn-primary');
  if (button.disabled) return;
  const ida = document.getElementById('ida').value;
  if (!soIda.checked && voltaInput.value < ida) {
    voltaInput.setCustomValidity('A data de volta precisa ser igual ou posterior à ida.');
    voltaInput.reportValidity();
    return;
  }
  voltaInput.setCustomValidity('');
  button.disabled = true;
  button.textContent = 'Enviando sua viagem…';
  document.getElementById('form-feedback').classList.add('hidden');
  const idades = [...document.querySelectorAll('.idade-crianca')].map(input => parseInt(input.value, 10));
  // Contrato preservado: nomes, tipos e campos usados pelo Worker e pelo Muse.
  const payload = {
    nome: document.getElementById('nome').value.trim(),
    whatsapp: document.getElementById('whatsapp').value.trim(),
    origem: document.getElementById('origem').value.trim(),
    destino: document.getElementById('destino').value.trim(),
    ida,
    volta: soIda.checked ? null : voltaInput.value,
    so_ida: soIda.checked,
    adultos: parseInt(document.getElementById('adultos').value, 10),
    criancas_idades: idades
  };
  try {
    const response = await fetch(WORKER_URL + '/api/lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Envio indisponível');
    const data = await response.json();
    if (typeof data.id !== 'string' || !/^[\w-]{1,128}$/.test(data.id)) throw new Error('Referência da consulta ausente');
    const session = experience.makeSession(data.id, payload, Date.now());
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
    catch (error) { console.warn('Não foi possível guardar a referência. Mantenha esta aba aberta para acompanhar a consulta.'); }
    beginQuote(session);
  } catch (error) {
    showFormError('Não foi possível enviar sua busca agora. Tente novamente ou fale com a agência pelo WhatsApp (862) 350-1161.');
    button.disabled = false;
    button.textContent = 'Consultar tarifa →';
  }
});

// Uma data corrigida precisa liberar a validação anterior imediatamente.
voltaInput.addEventListener('input', () => voltaInput.setCustomValidity(''));
document.getElementById('ida').addEventListener('input', () => voltaInput.setCustomValidity(''));

function beginQuote(session, restored = false) {
  leadId = session.id;
  buscaCard.classList.add('hidden');
  statusCard.classList.remove('hidden');
  statusLoading.classList.remove('hidden');
  statusResult.classList.add('hidden');
  statusResult.innerHTML = '';
  waiting.start(session.trip, session.startedAt);
  if (restored) waiting.update('restoring');
  const searchLink = document.getElementById('nav-search');
  searchLink.setAttribute('href', '#status-card');
  searchLink.textContent = 'Sua cotação';
  if (!restored) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  clearInterval(pollTimer);
  pollTimer = setInterval(verificarStatus, 15000);
  verificarStatus();
}

function stopWaiting() {
  clearInterval(pollTimer);
  pollTimer = null;
  waiting.finish();
  statusLoading.classList.add('hidden');
  statusResult.classList.remove('hidden');
}

async function verificarStatus() {
  if (!leadId || pollBusy) return;
  pollBusy = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(WORKER_URL + '/api/status?id=' + encodeURIComponent(leadId), { signal: controller.signal });
    if (response.status === 404) { mostrarErro(true); return; }
    if (!response.ok) throw new Error('Status temporariamente indisponível');
    const lead = await response.json();
    if (lead.status === 'done') {
      waiting.update('done');
      mostrarResultado(lead);
    } else if (lead.status === 'error') {
      mostrarErro();
    } else if (lead.status === 'buy_intent' || lead.status === 'notified') {
      showBuyConfirmed();
    } else {
      waiting.update(lead.status);
    }
  } catch (error) {
    waiting.update('reconnecting');
    console.warn('A atualização da cotação será tentada novamente.');
  } finally {
    clearTimeout(timeout);
    pollBusy = false;
  }
}

function icon(name) { return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`; }

function mostrarResultado(lead) {
  stopWaiting();
  const result = lead.result || {};
  const e = escapeHtml;
  let html = `<div class="quote-heading"><div><span class="eyebrow">O PRÓXIMO PASSO DA SUA VIAGEM</span><h1>Sua cotação chegou.</h1></div><span class="icon-box">${icon('plane')}</span></div>`;
  if (Array.isArray(result.trechos) && result.trechos.length) {
    html += `<div class="quote-head"><div><div class="quote-route">${e(result.rota || '')}</div><div class="quote-cia">${e(result.cia || '')}</div></div><div class="quote-price"><small>VALOR TOTAL INFORMADO</small>${e(result.preco_total || 'A confirmar')}</div></div>`;
    for (const trecho of result.trechos) {
      html += `<div class="flight-card"><div class="flight-tipo">${e(trecho.tipo || '')}<span class="flight-data">${e(trecho.data || '')}</span></div><div class="flight-main"><div class="flight-airport"><span class="flight-code">${e(trecho.saida || '')}</span><span class="flight-time">${e(trecho.hora_saida || '')}</span></div><div class="flight-line"><span class="flight-dur">${e(trecho.duracao || '')}</span><span class="flight-bar"></span><span class="flight-stops">${e(trecho.escalas || '')}</span></div><div class="flight-airport"><span class="flight-code">${e(trecho.chegada || '')}</span><span class="flight-time">${e(trecho.hora_chegada || '')}</span></div></div></div>`;
    }
    html += '<div class="quote-details">';
    if (result.bagagem) html += `<div class="quote-info">${icon('case')}<div><b>Bagagem</b>${e(result.bagagem)}</div></div>`;
    if (result.regras) html += `<div class="quote-info">${icon('check')}<div><b>Antes de decidir</b>${e(result.regras)}</div></div>`;
    html += '</div>';
  } else {
    html += `<div class="result-price">${e(result.preco_total || 'Valor a confirmar')}</div><div class="result-box">${e(result.texto || 'Converse com a agência para conferir os detalhes desta cotação.')}</div>`;
  }
  html += `<p class="quote-fine">Cotação enviada pela agência. Valores, regras e disponibilidade precisam ser confirmados no momento da reserva.</p><div class="quote-actions"><button type="button" class="btn-buy" id="btn-buy">Quero comprar ${icon('arrow')}</button><button type="button" class="btn-ghost" id="btn-nova">Fazer outra busca</button></div><p class="purchase-explanation">Seu interesse será enviado à agência. A compra é finalizada com atendimento, após a confirmação dos detalhes.</p><p class="buy-feedback hidden" id="buy-feedback" role="alert"></p>`;
  statusResult.innerHTML = html;
  document.getElementById('btn-buy').addEventListener('click', comprar);
  bindNewSearch();
  statusResult.focus();
}

async function comprar() {
  const button = document.getElementById('btn-buy');
  if (button.disabled) return;
  const feedback = document.getElementById('buy-feedback');
  button.disabled = true;
  button.textContent = 'Enviando seu interesse…';
  feedback.classList.add('hidden');
  try {
    const response = await fetch(WORKER_URL + '/api/buy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: leadId })
    });
    if (!response.ok) throw new Error('Não foi possível registrar o interesse');
    const data = await response.json();
    if (data.ok !== true) throw new Error('Confirmação de interesse ausente');
    showBuyConfirmed();
  } catch (error) {
    button.disabled = false;
    button.innerHTML = `Quero comprar ${icon('arrow')}`;
    feedback.textContent = 'Não foi possível confirmar o envio do seu interesse. Tente novamente ou fale com a agência pelo WhatsApp (862) 350-1161.';
    feedback.classList.remove('hidden');
  }
}

function showBuyConfirmed() {
  stopWaiting();
  statusResult.innerHTML = `<div class="outcome"><span class="icon-box">${icon('check')}</span><span class="eyebrow">MAIS PERTO DO SEU DESTINO</span><h2>Seu interesse foi enviado!</h2><p>A agência vai entrar em contato pelo WhatsApp para conferir os detalhes e seguir com a sua reserva.</p><p class="fine">Este envio registra seu interesse. A passagem será emitida após a finalização da compra com a agência.</p><button type="button" class="btn-ghost" id="btn-nova">Planejar outra viagem</button></div>`;
  bindNewSearch();
  statusResult.focus();
}

function mostrarErro(expired = false) {
  stopWaiting();
  statusResult.innerHTML = `<div class="outcome"><span class="icon-box">${icon('chat')}</span><span class="eyebrow">VAMOS ENCONTRAR OUTRO CAMINHO</span><h2>${expired ? 'Esta consulta expirou.' : 'Sua viagem merece uma nova tentativa.'}</h2><p>${expired ? 'Não foi possível encontrar esta cotação. Faça uma nova busca ou fale com a agência para continuar.' : 'Não foi possível concluir sua cotação agora. Você pode tentar novamente ou contar com o atendimento da agência.'}</p><p><a href="https://wa.me/18623501161" target="_blank" rel="noopener">Falar no WhatsApp · (862) 350-1161</a></p><button type="button" class="btn-ghost" id="btn-nova">Fazer uma nova busca</button></div>`;
  bindNewSearch();
  statusResult.focus();
}

function bindNewSearch() {
  document.getElementById('btn-nova').addEventListener('click', () => {
    try { sessionStorage.removeItem(SESSION_KEY); }
    catch (error) { console.warn('Não foi possível limpar a referência desta aba.'); }
    leadId = null;
    clearInterval(pollTimer);
    location.reload();
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

// Recarregar a mesma aba não cria outro pedido na fila do Muse.
try {
  const raw = sessionStorage.getItem(SESSION_KEY);
  const session = experience.parseSession(raw, Date.now());
  if (session) beginQuote(session, true);
  else if (raw) sessionStorage.removeItem(SESSION_KEY);
} catch (error) {
  console.warn('A retomada automática não está disponível neste navegador.');
}
window.addEventListener('online', () => { if (pollTimer) verificarStatus(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && pollTimer) verificarStatus(); });

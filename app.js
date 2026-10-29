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
let currentSession = null;
let durableReferenceSeen = false;

function resumeWarning() {
  const feedback = document.getElementById('resume-feedback');
  feedback.textContent = 'Este navegador não permitiu salvar a busca de forma permanente. Mantenha esta página aberta para acompanhar a cotação.';
  feedback.classList.remove('hidden');
  document.getElementById('resume-note').textContent = '';
}

function persistResume(session, force = false) {
  currentSession = session;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const previous = experience.parseSession(raw, Date.now());
    if (previous) durableReferenceSeen = true;
    // A cleared or newer search in another tab owns the persistent reference.
    if (!force && raw !== null && previous?.id !== session.id) return session;
    // Merge the latest shared snapshot, not just this tab's older memory.
    if (!force && previous) session = experience.cacheSession(previous, session);
    currentSession = session;
    const serialized = JSON.stringify(session);
    localStorage.setItem(SESSION_KEY, serialized);
    if (localStorage.getItem(SESSION_KEY) !== serialized) throw new Error('Salvamento não confirmado');
    durableReferenceSeen = true;
    try { sessionStorage.removeItem(SESSION_KEY); }
    catch (error) { console.warn('Não foi possível limpar a referência antiga da aba.'); }
    document.getElementById('resume-feedback').classList.add('hidden');
    document.getElementById('resume-note').textContent = 'Sua busca está salva neste navegador. Ao voltar por este link, você retoma a mesma consulta.';
  } catch (error) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
    catch (fallbackError) { console.warn('Não foi possível guardar a referência da consulta nesta aba.'); }
    resumeWarning();
  }
  return session;
}

function rememberLead(lead) {
  if (!currentSession) return null;
  const saved = experience.cacheSession(currentSession, lead);
  return persistResume(saved);
}

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
    persistResume(session, true);
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
  currentSession = session;
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
  if (restored && session.status === 'done' && session.result) {
    mostrarResultado({ result: session.result }, true);
    verificarStatus();
    return;
  }
  if (restored && ['buy_intent', 'notified'].includes(session.status)) {
    showBuyConfirmed();
    return;
  }
  if (restored && ['error', 'expired'].includes(session.status)) {
    mostrarErro(session.status === 'expired');
    return;
  }
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
  const requestId = leadId;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(WORKER_URL + '/api/status?id=' + encodeURIComponent(requestId), { signal: controller.signal });
    if (leadId !== requestId) return;
    if (response.status === 404) {
      if (currentSession?.status === 'done' && currentSession.result) {
        mostrarResultado({ result: currentSession.result }, true);
      } else {
        rememberLead({ status: 'expired' });
        mostrarErro(true);
      }
      return;
    }
    if (!response.ok) throw new Error('Status temporariamente indisponível');
    const lead = await response.json();
    if (leadId !== requestId) return;
    if (lead.id && lead.id !== requestId) throw new Error('Referência de cotação divergente');
    const saved = rememberLead(lead);
    const status = saved?.status || lead.status;
    if (status === 'done') {
      waiting.update('done');
      mostrarResultado({ result: saved?.result || lead.result });
    } else if (status === 'error') {
      mostrarErro();
    } else if (status === 'buy_intent' || status === 'notified') {
      showBuyConfirmed();
    } else {
      waiting.update(status);
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

function mostrarResultado(lead, saved = false) {
  stopWaiting();
  const result = lead.result || {};
  const e = escapeHtml;
  let html = `<div class="quote-heading"><div><span class="eyebrow">O PRÓXIMO PASSO DA SUA VIAGEM</span><h1>${saved ? 'Sua cotação salva.' : 'Sua cotação chegou.'}</h1></div><span class="icon-box">${icon('plane')}</span></div>`;
  if (saved) html += '<p class="quote-fine">Você retomou a última cotação salva neste navegador. Confirme os valores e a disponibilidade com a agência antes da compra.</p>';
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
    rememberLead({ status: 'buy_intent' });
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
  document.getElementById('btn-nova').addEventListener('click', startNewSearch);
}

function startNewSearch() {
  // A durable null marks an intentional reset, preventing old-tab migration.
  let durableCleared = false;
  try {
    try { localStorage.setItem(SESSION_KEY, 'null'); }
    catch (error) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.setItem(SESSION_KEY, 'null');
    }
    if (localStorage.getItem(SESSION_KEY) !== 'null') throw new Error('Limpeza não confirmada');
    durableCleared = true;
  } catch (error) {
    if (durableReferenceSeen) { showResetError(); return; }
  }
  try {
    sessionStorage.removeItem(SESSION_KEY);
    if (sessionStorage.getItem(SESSION_KEY) !== null) throw new Error('Limpeza da aba não confirmada');
  } catch (error) {
    if (!durableCleared) { showResetError(); return; }
    console.warn('A referência antiga da aba foi substituída pela limpeza persistente.');
  }
  leadId = null;
  currentSession = null;
  clearInterval(pollTimer);
  waiting.finish();
  location.reload();
}

function showResetError() {
  const feedback = document.getElementById('resume-feedback');
  feedback.textContent = 'Não foi possível limpar a busca salva neste navegador. Tente novamente antes de iniciar outra consulta.';
  feedback.classList.remove('hidden');
}

document.getElementById('btn-waiting-new').addEventListener('click', startNewSearch);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

// Reabrir no mesmo navegador retoma a busca; a aba antiga não é necessária.
try {
  let raw = null;
  try { raw = localStorage.getItem(SESSION_KEY); }
  catch (error) { resumeWarning(); }
  if (raw === null) {
    try { raw = sessionStorage.getItem(SESSION_KEY); }
    catch (error) { console.warn('Não foi possível ler a referência antiga desta aba.'); }
  }
  const session = experience.parseSession(raw, Date.now());
  if (session) {
    persistResume(session);
    beginQuote(session, true);
  }
} catch (error) {
  console.warn('A retomada automática não está disponível neste navegador.');
}
window.addEventListener('online', () => { if (pollTimer) verificarStatus(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && pollTimer) verificarStatus(); });

/* Michel's Travel — conteúdo e estados da experiência, sem dependências. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MTExperience = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function describeStatus(status) {
    const states = {
      pending: { step: 1, terminal: false, label: 'Pedido na fila', message: 'Recebemos sua viagem. Assim que a consulta terminar, a cotação aparece aqui automaticamente.' },
      restoring: { step: 1, terminal: false, label: 'Retomando sua cotação', message: 'Estamos consultando o status do pedido já recebido. Você não precisa enviar a busca novamente.' },
      searching: { step: 2, terminal: false, label: 'Busca em andamento', message: 'Sua solicitação está em consulta. Enquanto isso, aproveite para preparar os próximos detalhes da viagem.' },
      reconnecting: { step: 1, terminal: false, label: 'Atualizando a conexão', message: 'Não conseguimos atualizar o status neste momento. Vamos tentar novamente, sem reenviar o seu pedido.' },
      done: { step: 3, terminal: true, label: 'Cotação recebida', message: 'Sua cotação chegou. Confira os detalhes antes de falar com a agência.' },
      error: { step: 1, terminal: true, label: 'Precisamos de uma nova tentativa', message: 'Não foi possível concluir esta consulta. Você pode tentar novamente ou falar com a agência.' }
    };
    return states[status] || states.reconnecting;
  }

  const neutralGuide = {
    destination: 'Sua próxima viagem',
    title: 'Toda viagem começa com uma boa ideia.',
    text: 'Pode ser um reencontro, uma pausa ou a vontade de descobrir um lugar novo. Pense no que faria esta viagem ser especial para você.',
    prompt: 'O que você quer trazer na volta, além da bagagem?'
  };

  function destinationGuide(value) {
    const text = String(value || '').trim();
    if (/[<>]/.test(text)) return { ...neutralGuide };
    const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const code = normalized.match(/^(?:[A-Z]{3})$/)?.[0] || normalized.match(/\(([A-Z]{3})\)\s*$/)?.[1];
    const guides = [
      { codes: ['GIG', 'SDU'], names: ['RIO', 'RIO DE JANEIRO'], destination: 'Rio de Janeiro', title: 'Deixe espaço para viver o Rio.', text: 'Praia, paisagens e reencontros podem dividir o mesmo roteiro. Reserve também um tempo sem pressa, para aproveitar a cidade do seu jeito.', prompt: 'Sua viagem combina mais com um reencontro ou uma nova descoberta?' },
      { codes: ['GRU', 'CGH', 'VCP'], names: ['SAO PAULO', 'CAMPINAS'], destination: 'São Paulo', title: 'Um destino, muitas histórias.', text: 'Entre compromissos, família e descobertas, vale pensar no ritmo que você quer dar à viagem. Um roteiro com espaço para descansar também faz parte do plano.', prompt: 'Quem ou o que você quer encontrar primeiro?' },
      { codes: ['JFK', 'LGA', 'EWR'], names: ['NOVA YORK', 'NEW YORK', 'NEWARK'], destination: 'Nova York', title: 'Planeje os momentos, além dos lugares.', text: 'Uma caminhada, um café sem pressa, a primeira vista da cidade. Pense nas experiências que você quer guardar desta viagem.', prompt: 'Qual seria o primeiro momento da sua história por lá?' },
      { codes: ['LIS'], names: ['LISBOA', 'LISBON'], destination: 'Lisboa', title: 'Vá com tempo para descobrir.', text: 'Viagens também são feitas de encontros inesperados e pequenas pausas. Deixe algum espaço livre no roteiro para seguir sua curiosidade.', prompt: 'O que você gostaria de descobrir no seu próprio ritmo?' }
    ];
    return guides.find(guide => guide.codes.includes(code) || guide.names.includes(normalized)) || { ...neutralGuide };
  }

  function dateLabel(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return 'Data a confirmar';
    const date = new Date(value + 'T12:00:00');
    if (!Number.isFinite(date.getTime())) return 'Data a confirmar';
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(date);
  }

  function tripSummary(trip) {
    const adults = Number(trip.adultos) || 1;
    const children = Array.isArray(trip.criancas_idades) ? trip.criancas_idades.length : Number(trip.criancas) || 0;
    return {
      route: `${String(trip.origem || 'Sua origem')} → ${String(trip.destino || 'Seu destino')}`,
      dates: trip.so_ida ? `${dateLabel(trip.ida)} · Somente ida` : `${dateLabel(trip.ida)} → ${dateLabel(trip.volta)}`,
      travelers: `${adults} ${adults === 1 ? 'adulto' : 'adultos'}${children ? ` · ${children} ${children === 1 ? 'criança' : 'crianças'}` : ''}`
    };
  }

  function makeSession(id, payload, startedAt) {
    return {
      id, startedAt, status: 'pending',
      trip: {
        origem: String(payload.origem || '').slice(0, 200),
        destino: String(payload.destino || '').slice(0, 200),
        ida: payload.ida || null, volta: payload.volta || null,
        so_ida: !!payload.so_ida, adultos: Number(payload.adultos) || 1,
        criancas: Array.isArray(payload.criancas_idades) ? payload.criancas_idades.length : Number(payload.criancas) || 0
      }
    };
  }

  function cacheSession(original, lead) {
    const saved = makeSession(original.id, original.trip, original.startedAt);
    const states = ['pending', 'searching', 'done', 'error', 'expired', 'buy_intent', 'notified'];
    saved.status = states.includes(lead.status) ? lead.status : original.status || 'pending';
    // A stale status read must not undo a received quote or confirmed interest.
    if (['buy_intent', 'notified'].includes(original.status) && saved.status !== 'notified') saved.status = original.status;
    else if (original.status === 'done' && ['pending', 'searching'].includes(saved.status)) saved.status = 'done';
    const result = lead.result || original.result;
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      saved.result = {};
      for (const field of ['rota', 'preco_total', 'cia', 'bagagem', 'regras', 'texto']) {
        if (result[field] !== undefined && result[field] !== null) saved.result[field] = String(result[field]);
      }
      if (Array.isArray(result.trechos)) {
        saved.result.trechos = result.trechos.filter(trecho => trecho && typeof trecho === 'object').map(trecho => {
          const item = {};
          for (const field of ['tipo', 'data', 'saida', 'hora_saida', 'chegada', 'hora_chegada', 'duracao', 'escalas']) {
            if (trecho[field] !== undefined && trecho[field] !== null) item[field] = String(trecho[field]);
          }
          return item;
        });
      }
    }
    return saved;
  }

  function parseSession(raw, now) {
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data.id !== 'string' || !/^[\w-]{1,128}$/.test(data.id)) return null;
      if (!Number.isFinite(data.startedAt) || data.startedAt < 0 || data.startedAt > now) return null;
      const trip = data.trip;
      if (!trip || typeof trip.origem !== 'string' || typeof trip.destino !== 'string') return null;
      if (!Number.isInteger(trip.adultos) || trip.adultos < 1 || trip.adultos > 9) return null;
      if (!Number.isInteger(trip.criancas) || trip.criancas < 0 || trip.criancas > 8) return null;
      return cacheSession(makeSession(data.id, trip, data.startedAt), data);
    } catch (error) {
      // A malformed local reference is discarded, never submitted as a new lead.
      return null;
    }
  }

  function formatElapsed(milliseconds) {
    const seconds = Number.isFinite(milliseconds) ? Math.max(0, Math.floor(milliseconds / 1000)) : 0;
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function createWaitUI(doc) {
    let clock = null;
    let startedAt = 0;
    const text = (id, value) => { const node = doc.getElementById(id); if (node) node.textContent = value; };
    const hidden = (id, value) => doc.getElementById(id)?.classList.toggle('hidden', value);
    const tabs = Array.from(doc.querySelectorAll('[data-guide-tab]'));
    const tips = [
      { title: 'Sua bagagem começa pela tarifa.', text: 'Compare o que está incluído na cotação: item pessoal, mala de mão e bagagem despachada podem ter regras diferentes.', extra: 'Quando sua cotação chegar, confira os detalhes de bagagem antes de decidir.' },
      { title: 'Uma conexão também faz parte da viagem.', text: 'Além do preço, observe o tempo de conexão e se existe troca de aeroporto. Pense em um ritmo confortável para todos que vão viajar.', extra: 'Se tiver alguma necessidade de assistência, converse com a agência antes da reserva.' },
      { title: 'Deixe os detalhes importantes por perto.', text: 'Prepare os nomes como aparecem nos documentos, confira as datas desejadas e anote as dúvidas que quer esclarecer com a agência.', extra: 'Requisitos de entrada e trânsito devem ser verificados para a sua nacionalidade e o itinerário escolhido.' }
    ];

    function selectTip(index) {
      const tip = tips[index];
      text('guide-tip-title', tip.title); text('guide-tip-text', tip.text); text('guide-tip-extra', tip.extra);
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.setAttribute('tabindex', i === index ? '0' : '-1');
        tab.classList.toggle('is-active', i === index);
      });
      if (tabs[index]) doc.getElementById('guide-panel')?.setAttribute('aria-labelledby', tabs[index].id);
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTip(index));
      tab.addEventListener('keydown', event => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault(); selectTip(next); tabs[next].focus();
      });
    });
    selectTip(0);

    function update(status) {
      const state = describeStatus(status);
      text('search-state-label', state.label); text('search-state-message', state.message);
      doc.getElementById('search-state')?.setAttribute('data-state', status);
      doc.querySelectorAll('[data-progress-step]').forEach(node => {
        const step = Number(node.dataset.progressStep);
        node.classList.toggle('is-complete', step < state.step || status === 'done');
        node.classList.toggle('is-current', step === state.step);
        if (step === state.step) node.setAttribute('aria-current', 'step');
        else node.removeAttribute('aria-current');
      });
    }

    function tick() {
      const elapsed = Date.now() - startedAt;
      text('elapsed-time', formatElapsed(elapsed));
      hidden('long-wait', elapsed < 300000);
    }

    function start(trip, timestamp) {
      startedAt = timestamp;
      const summary = tripSummary(trip);
      text('journey-route', summary.route); text('journey-dates', summary.dates); text('journey-travelers', summary.travelers);
      const guide = destinationGuide(trip.destino);
      text('destination-name', guide.destination); text('destination-title', guide.title);
      text('destination-copy', guide.text); text('destination-prompt', guide.prompt);
      doc.body.classList.add('has-search');
      update('pending'); tick();
      clearInterval(clock); clock = setInterval(tick, 1000);
      doc.getElementById('waiting-title')?.focus();
    }

    function finish() { clearInterval(clock); clock = null; }
    return { start, update, finish };
  }

  return { describeStatus, destinationGuide, tripSummary, makeSession, cacheSession, parseSession, formatElapsed, createWaitUI };
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const experiencePath = path.join(root, 'experience.js');
// Load as the classic browser script. The unrelated server package is ESM.
const exportsContext = { module: { exports: {} } };
vm.createContext(exportsContext);
if (fs.existsSync(experiencePath)) vm.runInContext(fs.readFileSync(experiencePath, 'utf8'), exportsContext);
const experience = exportsContext.module.exports;

function api(name) {
  assert.equal(typeof experience[name], 'function', `${name} must implement the waiting experience`);
  return experience[name];
}

test('pending stays in the queue until the server reports searching', () => {
  const describe = api('describeStatus');
  assert.equal(describe('pending').step, 1);
  assert.equal(describe('pending').terminal, false);
  assert.equal(describe('searching').step, 2);
  assert.equal(describe('searching').terminal, false);
  assert.equal(describe('done').step, 3);
  assert.equal(describe('done').terminal, true);
});

test('network interruption does not turn a live quote into a completed quote', () => {
  const state = api('describeStatus')('reconnecting');
  assert.equal(state.terminal, false);
  assert.equal(state.step, 1);
  assert.equal(api('describeStatus')('error').terminal, true);
});

test('destination guide recognizes IATA codes and uses neutral content for an unknown destination', () => {
  const guide = api('destinationGuide');
  assert.equal(guide('Rio de Janeiro (GIG)').destination, 'Rio de Janeiro');
  assert.equal(guide('GRU').destination, 'São Paulo');
  assert.equal(guide('New York (JFK)').destination, 'Nova York');
  assert.equal(guide('Um lugar novo').destination, 'Sua próxima viagem');
  assert.equal(guide('JFK<script>Rio</script>').destination, 'Sua próxima viagem');
});

test('search summary formats dates without changing the calendar day and keeps free text as text', () => {
  const summary = api('tripSummary')({ origem: 'Newark (EWR)', destino: '<img src=x>', ida: '2026-11-24', volta: null, so_ida: true, adultos: 2, criancas_idades: [5] });
  assert.equal(summary.route, 'Newark (EWR) → <img src=x>');
  assert.match(summary.dates, /24 de nov/);
  assert.match(summary.dates, /Somente ida/);
  assert.equal(summary.travelers, '2 adultos · 1 criança');
});

test('session keeps the quote reference without retaining the visitor name, phone or child ages', () => {
  const session = api('makeSession')('quote-123', { nome: 'Cliente privado', whatsapp: '999999999', origem: 'EWR', destino: 'GRU', ida: '2026-11-24', volta: '2026-12-05', so_ida: false, adultos: 1, criancas_idades: [7, 9] }, 10000);
  assert.equal(session.id, 'quote-123');
  assert.equal(session.startedAt, 10000);
  assert.equal(session.trip.criancas, 2);
  const serialized = JSON.stringify(session);
  assert.equal(serialized.includes('Cliente privado'), false);
  assert.equal(serialized.includes('999999999'), false);
  assert.equal(serialized.includes('criancas_idades'), false);
});

test('resume rejects broken or future references but does not erase a real older search', () => {
  const parse = api('parseSession');
  assert.equal(parse('not json', 20000), null);
  assert.equal(parse(JSON.stringify({id: 'a', startedAt: 30000, trip: {}}), 20000), null);
  const session = api('makeSession')('quote-123', { origem: 'EWR', destino: 'GRU', adultos: 1, criancas_idades: [] }, 10000);
  assert.equal(parse(JSON.stringify(session), 20000).id, 'quote-123');
  assert.equal(parse(JSON.stringify(session), 86420000)?.id, 'quote-123');
});

test('elapsed clock reports actual elapsed time and cannot display a negative countdown', () => {
  const format = api('formatElapsed');
  assert.equal(format(125000), '02:05');
  assert.equal(format(-1000), '00:00');
  assert.equal(format(3600000), '60:00');
});

// The browser is exercised separately. This small boundary harness runs the
// actual application with only browser facilities and the external Worker replaced.
function mount({ responder, session, localMemory, blockPersistence = false, failClear = false } = {}) {
  const ids = new Map();
  const listeners = new Map();
  class Element {
    constructor(id = '') {
      this.id = id; this.value = ''; this.checked = false; this.disabled = false;
      this.textContent = ''; this.dataset = {}; this.children = []; this.attributes = {};
      this.handlers = {};
      const classes = new Set();
      this.classList = { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle: (x, force) => { const on = force === undefined ? !classes.has(x) : force; on ? classes.add(x) : classes.delete(x); return on; } };
    }
    set innerHTML(text) {
      this.html = text;
      for (const match of text.matchAll(/id="([^"]+)"/g)) if (!ids.has(match[1])) ids.set(match[1], new Element(match[1]));
    }
    get innerHTML() { return this.html || ''; }
    addEventListener(type, handler) { this.handlers[type] = handler; }
    querySelector(selector) { return selector === '.btn-primary' ? ids.get('submit-button') : null; }
    querySelectorAll() { return []; }
    appendChild(element) { this.children.push(element); }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    removeAttribute(name) { delete this.attributes[name]; }
    setCustomValidity(text) { this.validationMessage = text; }
    reportValidity() { return !this.validationMessage; }
    focus() {}
  }
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const match of html.matchAll(/id="([^"]+)"/g)) ids.set(match[1], new Element(match[1]));
  ids.set('submit-button', new Element('submit-button'));
  const values = { nome: 'Ana', whatsapp: '+15555550123', origem: 'Newark (EWR)', destino: 'São Paulo (GRU)', ida: '2026-11-24', volta: '2026-12-05', adultos: '1', criancas: '0' };
  for (const [id, value] of Object.entries(values)) ids.get(id).value = value;
  const memory = localMemory || new Map();
  const tabMemory = new Map(session ? [['mt-search-session', JSON.stringify(session)]] : []);
  const makeStorage = data => ({ getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) });
  const normalStorage = makeStorage(memory);
  const persistentStorage = blockPersistence ? {getItem() {throw new Error('Storage blocked');}, setItem() {throw new Error('Storage blocked');}, removeItem() {throw new Error('Storage blocked');}} : {
    ...normalStorage,
    setItem(key, value) { if (failClear && key === 'mt-search-session' && value === 'null') throw new Error('Reset blocked'); normalStorage.setItem(key,value); },
    removeItem(key) { if (failClear && key === 'mt-search-session') throw new Error('Reset blocked'); normalStorage.removeItem(key); }
  };
  const calls = [];
  let timer = 0;
  const context = {
    document: { getElementById: id => ids.get(id) ?? null, createElement: () => new Element(), querySelectorAll: () => [], documentElement: new Element(), body: new Element(), addEventListener: (type, fn) => listeners.set(type, fn), hidden: false },
    console: {...console, warn() {}}, Intl, Date, URL, URLSearchParams, AbortController, encodeURIComponent,
    setInterval: () => ++timer, clearInterval() {}, setTimeout: () => ++timer, clearTimeout() {},
    matchMedia: () => ({ matches: false }), localStorage: persistentStorage, sessionStorage: makeStorage(tabMemory),
    location: { reload() { context.didReload = true; } }, alert(message) { context.lastAlert = message; }, scrollTo() {},
    addEventListener: (type, fn) => listeners.set(type, fn),
    fetch: async (url, options = {}) => {
      calls.push({url, options});
      if (responder) return responder(url, options);
      if (url.endsWith('/api/lead')) return {ok: true, json: async () => ({id: 'quote-123'})};
      return {ok: true, json: async () => ({id: 'quote-123', status: 'pending', result: null})};
    },
    WORKER_URL: 'https://worker.example',
  };
  context.window = context;
  vm.createContext(context);
  if (fs.existsSync(experiencePath)) vm.runInContext(fs.readFileSync(experiencePath, 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
  return {context, ids, calls, memory, tabMemory, submit: () => ids.get('flight-form').handlers.submit({preventDefault() {}})};
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('submitting keeps the existing Muse request contract', async () => {
  const page = mount();
  await page.submit(); await flush();
  const sent = page.calls.find(call => call.url.endsWith('/api/lead'));
  assert.equal(sent.options.method, 'POST');
  assert.deepEqual(JSON.parse(sent.options.body), {nome:'Ana', whatsapp:'+15555550123', origem:'Newark (EWR)', destino:'São Paulo (GRU)', ida:'2026-11-24', volta:'2026-12-05', so_ida:false, adultos:1, criancas_idades:[]});
});

test('a submitted quote is resumable without keeping contact details', async () => {
  const page = mount(); await page.submit(); await flush();
  const saved = page.memory.get('mt-search-session');
  assert.ok(saved, 'the in-flight reference should survive a reload');
  assert.equal(JSON.parse(saved).id, 'quote-123');
  assert.equal(saved.includes('+15555550123'), false);
});

test('reloading an active session polls the old reference without creating a duplicate request', async () => {
  const session = {id:'existing-quote', startedAt: Date.now() - 1000, trip:{origem:'EWR', destino:'GRU', ida:'2026-11-24', volta:null, so_ida:true, adultos:1, criancas:0}};
  const page = mount({session}); await flush();
  assert.equal(page.calls.filter(call => call.options.method === 'POST').length, 0);
  assert.ok(page.calls.some(call => call.url.endsWith('/api/status?id=existing-quote')));
});

test('a failed buy-intent response leaves the quote available and never confirms receipt', async () => {
  const page = mount({responder: async url => {
    if (url.endsWith('/api/lead')) return {ok:true, json:async()=>({id:'quote-123'})};
    if (url.includes('/api/status')) return {ok:true, json:async()=>({id:'quote-123', status:'done', result:{preco_total:'US$ 800', texto:'Cotação de teste'}})};
    return {ok:false, status:503, json:async()=>({error:'unavailable'})};
  }});
  await page.submit(); await flush();
  await page.ids.get('btn-buy').handlers.click(); await flush();
  assert.equal(page.ids.get('status-result').innerHTML.includes('Pedido recebido!'), false);
  assert.equal(page.ids.get('btn-buy').disabled, false);
  assert.match(page.ids.get('buy-feedback')?.textContent || '', /não foi possível/i);
});

test('a missing quote is terminal and gives the visitor a route to retry', async () => {
  const page = mount({responder: async url => url.endsWith('/api/lead') ? {ok:true, json:async()=>({id:'quote-123'})} : {ok:false, status:404, json:async()=>({error:'not_found'})}});
  await page.submit(); await flush();
  assert.equal(page.ids.get('status-result').classList.contains('hidden'), false);
  assert.match(page.ids.get('status-result').innerHTML, /expirou|encontrar|encontrada/i);
});

test('closing the tab and reopening restores the same search without a duplicate POST', async () => {
  const first = mount(); await first.submit(); await flush();
  const reopened = mount({localMemory:first.memory}); await flush();
  assert.equal(reopened.tabMemory.size, 0, 'the old tab is gone');
  assert.ok(reopened.calls.some(call=>call.url.endsWith('/api/status?id=quote-123')));
  assert.equal(reopened.calls.some(call=>call.options.method==='POST'), false);
  assert.equal(reopened.ids.get('busca-card').classList.contains('hidden'), true);
});

test('legacy references are migrated from the old tab storage to persistent storage', async () => {
  const session = {id:'legacy-quote',startedAt:Date.now()-1000,trip:{origem:'EWR',destino:'GRU',ida:'2026-11-24',volta:null,so_ida:true,adultos:1,criancas:0}};
  const page = mount({session}); await flush();
  assert.equal(JSON.parse(page.memory.get('mt-search-session') || 'null')?.id, 'legacy-quote');
  assert.equal(page.tabMemory.has('mt-search-session'), false);
});

test('a completed quote survives reopening even after the server no longer has the record', async () => {
  const session = {id:'saved-quote',startedAt:Date.now()-90000000,status:'done',trip:{origem:'EWR',destino:'GRU',ida:'2026-11-24',volta:null,so_ida:true,adultos:1,criancas:0},result:{preco_total:'US$ 850',texto:'Minha cotação salva'}};
  const page = mount({localMemory:new Map([['mt-search-session',JSON.stringify(session)]]),responder:async()=>({ok:false,status:404,json:async()=>({error:'not_found'})})});
  await flush();
  assert.match(page.ids.get('status-result').innerHTML, /Minha cotação salva/);
  assert.match(page.ids.get('status-result').innerHTML, /salva/i);
  assert.equal(page.ids.get('busca-card').classList.contains('hidden'), true);
  assert.equal(JSON.parse(page.memory.get('mt-search-session')).id, 'saved-quote');
});

test('server expiry keeps the existing search visible until an explicit new-search click', async () => {
  const session = {id:'expired-quote',startedAt:Date.now()-90000000,trip:{origem:'EWR',destino:'GRU',ida:'2026-11-24',volta:null,so_ida:true,adultos:1,criancas:0}};
  const page = mount({localMemory:new Map([['mt-search-session',JSON.stringify(session)]]),responder:async()=>({ok:false,status:404,json:async()=>({error:'not_found'})})});
  await flush();
  assert.equal(page.ids.get('busca-card').classList.contains('hidden'), true);
  assert.match(page.ids.get('status-result').innerHTML, /expirou/);
  assert.equal(JSON.parse(page.memory.get('mt-search-session')).id, 'expired-quote');
});

test('only an explicit new-search click clears persistent recovery and prevents legacy resurrection', async () => {
  const session = {id:'old-quote',startedAt:Date.now()-1000,status:'done',trip:{origem:'EWR',destino:'GRU',ida:'2026-11-24',volta:null,so_ida:true,adultos:1,criancas:0},result:{texto:'Cotação antiga'}};
  const memory = new Map([['mt-search-session',JSON.stringify(session)]]);
  const page = mount({localMemory:memory,session,responder:async()=>({ok:true,json:async()=>({id:'old-quote',status:'done',result:{texto:'Cotação antiga'}})})});
  await flush(); await page.ids.get('btn-nova').handlers.click();
  assert.equal(memory.get('mt-search-session'), 'null');
  const reopened = mount({localMemory:memory,session}); await flush();
  assert.equal(reopened.calls.length, 0);
  assert.equal(reopened.ids.get('busca-card').classList.contains('hidden'), false);
});

test('blocked persistent storage gives the visitor an explicit warning and keeps a same-tab fallback', async () => {
  const page = mount({blockPersistence:true}); await page.submit(); await flush();
  assert.match(page.ids.get('resume-feedback')?.textContent || '', /salvar|guardar/i);
  assert.equal(page.ids.get('resume-feedback')?.classList.contains('hidden'), false);
  assert.equal(JSON.parse(page.tabMemory.get('mt-search-session') || 'null')?.id, 'quote-123');
});

test('cached quote snapshots retain displayed fields without copying passenger contact fields', () => {
  const original = api('makeSession')('quote-123',{origem:'EWR',destino:'GRU',adultos:1,criancas_idades:[]},Date.now());
  const saved = api('cacheSession')(original,{status:'done',result:{preco_total:'US$ 850',texto:'Cotação completa',nome:'Nome privado',whatsapp:'Número privado',trechos:[{tipo:'Ida',saida:'EWR',chegada:'GRU',passageiro:'Outro nome'}]}});
  assert.equal(saved.status,'done');
  assert.equal(saved.result.texto,'Cotação completa');
  assert.equal(saved.result.trechos[0].saida,'EWR');
  assert.equal(JSON.stringify(saved).includes('privado'),false);
  assert.equal(JSON.stringify(saved).includes('Outro nome'),false);
});

test('an explicit new-search button is available while the old quote is still pending', async () => {
  const page = mount(); await page.submit(); await flush();
  const button = page.ids.get('btn-waiting-new');
  assert.equal(typeof button?.handlers.click, 'function');
  await button.handlers.click();
  assert.equal(page.memory.get('mt-search-session'), 'null');
  assert.equal(page.context.didReload, true);
});

test('a blocked reset does not silently reload the old quote as though it were cleared', async () => {
  const page = mount({failClear:true}); await page.submit(); await flush();
  const button = page.ids.get('btn-waiting-new');
  assert.equal(typeof button?.handlers.click, 'function');
  await button.handlers.click();
  assert.equal(page.context.didReload, undefined);
  assert.match(page.ids.get('resume-feedback')?.textContent || '', /limpar/i);
  assert.equal(JSON.parse(page.memory.get('mt-search-session')).id,'quote-123');
});

test('a browser using only the session fallback can explicitly start another search', async () => {
  const page = mount({blockPersistence:true}); await page.submit(); await flush();
  assert.equal(JSON.parse(page.tabMemory.get('mt-search-session')).id,'quote-123');
  await page.ids.get('btn-waiting-new').handlers.click();
  assert.equal(page.tabMemory.has('mt-search-session'),false);
  assert.equal(page.context.didReload,true);
});

for (const terminal of ['done','buy_intent']) {
  test(`a delayed pending response in an older tab cannot overwrite shared ${terminal} state`, async () => {
    let releaseOldStatus;
    const old = mount({responder: async url => {
      if (url.endsWith('/api/lead')) return {ok:true,json:async()=>({id:'quote-123'})};
      return new Promise(resolve=>{releaseOldStatus=resolve;});
    }});
    await old.submit(); await flush();
    assert.equal(typeof releaseOldStatus,'function');
    const newer = mount({localMemory:old.memory,responder:async url=>{
      if(url.endsWith('/api/buy'))return {ok:true,json:async()=>({ok:true})};
      return {ok:true,json:async()=>({id:'quote-123',status:'done',result:{texto:'Cotação atualizada',preco_total:'US$ 900'}})};
    }});
    await flush();
    if(terminal==='buy_intent')await newer.ids.get('btn-buy').handlers.click();
    assert.equal(JSON.parse(old.memory.get('mt-search-session')).status,terminal);
    releaseOldStatus({ok:true,json:async()=>({id:'quote-123',status:'pending',result:null})});
    await flush();
    const stored=JSON.parse(old.memory.get('mt-search-session'));
    assert.equal(stored.status,terminal);
    assert.equal(stored.result.texto,'Cotação atualizada');
  });
}

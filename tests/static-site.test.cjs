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

test('resume rejects broken, future and expired references', () => {
  const parse = api('parseSession');
  assert.equal(parse('not json', 20000), null);
  assert.equal(parse(JSON.stringify({id: 'a', startedAt: 30000, trip: {}}), 20000), null);
  assert.equal(parse(JSON.stringify({id: 'a', startedAt: 1, trip: {}}), 86400002), null);
  const session = api('makeSession')('quote-123', { origem: 'EWR', destino: 'GRU', adultos: 1, criancas_idades: [] }, 10000);
  assert.equal(parse(JSON.stringify(session), 20000).id, 'quote-123');
});

test('elapsed clock reports actual elapsed time and cannot display a negative countdown', () => {
  const format = api('formatElapsed');
  assert.equal(format(125000), '02:05');
  assert.equal(format(-1000), '00:00');
  assert.equal(format(3600000), '60:00');
});

// The browser is exercised separately. This small boundary harness runs the
// actual application with only browser facilities and the external Worker replaced.
function mount({ responder, session } = {}) {
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
  const memory = new Map(session ? [['mt-search-session', JSON.stringify(session)]] : []);
  const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
  const calls = [];
  let timer = 0;
  const context = {
    document: { getElementById: id => ids.get(id) ?? null, createElement: () => new Element(), querySelectorAll: () => [], documentElement: new Element(), body: new Element(), addEventListener: (type, fn) => listeners.set(type, fn), hidden: false },
    console, Intl, Date, URL, URLSearchParams, AbortController, encodeURIComponent,
    setInterval: () => ++timer, clearInterval() {}, setTimeout: () => ++timer, clearTimeout() {},
    matchMedia: () => ({ matches: false }), localStorage: storage, sessionStorage: storage,
    location: { reload() {} }, alert(message) { context.lastAlert = message; }, scrollTo() {},
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
  return {context, ids, calls, memory, submit: () => ids.get('flight-form').handlers.submit({preventDefault() {}})};
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

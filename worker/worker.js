// ============================================================
// Michel's Travel — ponte de leads (Cloudflare Worker)
// Sem API de voo, sem banco de dados: só interpreta os dados do
// formulário, guarda temporariamente (24h) e entrega à equipe.
// A equipe (Muse) lê /api/pending, consulta o TAAP e devolve o
// resultado via /api/result. A página do visitante consulta
// /api/status até a cotação aparecer.
// Binding KV necessário: LEADS
// ============================================================

const TTL = 86400; // 24h — dado temporário, não é base de dados

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// "Interpretação de dados": normaliza o que o visitante digitou.
function interpretar(v) {
  const t = String(v || '').trim();
  const m = t.match(/\(([A-Za-z]{3})\)/); // extrai "GRU" de "São Paulo (GRU)"
  return {
    original: t,
    codigo: m ? m[1].toUpperCase() : null,
    busca: t.toUpperCase(),
  };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    // ---- Visitante envia a busca ----
    if (url.pathname === '/api/lead' && req.method === 'POST') {
      const d = await req.json();
      const id = crypto.randomUUID();
      const lead = {
        id,
        status: 'pending',
        criado_em: new Date().toISOString(),
        nome: String(d.nome || '').trim().slice(0, 80),
        whatsapp: String(d.whatsapp || '').trim().slice(0, 30),
        origem: interpretar(d.origem),
        destino: interpretar(d.destino),
        ida: d.ida || null,
        volta: d.volta || null,
        so_ida: !!d.so_ida,
        adultos: Math.min(9, Math.max(1, parseInt(d.adultos, 10) || 1)),
        criancas_idades: Array.isArray(d.criancas_idades) ? d.criancas_idades.slice(0, 8) : [],
        result: null,
      };
      await env.LEADS.put('lead:' + id, JSON.stringify(lead), { expirationTtl: TTL });
      // índice simples de pendentes
      const idx = JSON.parse((await env.LEADS.get('idx:pending')) || '[]');
      idx.push(id);
      await env.LEADS.put('idx:pending', JSON.stringify(idx), { expirationTtl: TTL });
      return json({ id });
    }

    // ---- Página do visitante consulta o andamento ----
    if (url.pathname === '/api/status' && req.method === 'GET') {
      const id = url.searchParams.get('id');
      const raw = await env.LEADS.get('lead:' + id);
      if (!raw) return json({ error: 'not_found' }, 404);
      const lead = JSON.parse(raw);
      return json({ id: lead.id, status: lead.status, result: lead.result });
    }

    // ---- Equipe lê a fila ----
    if (url.pathname === '/api/pending' && req.method === 'GET') {
      const idx = JSON.parse((await env.LEADS.get('idx:pending')) || '[]');
      const out = [];
      for (const id of idx) {
        const raw = await env.LEADS.get('lead:' + id);
        if (!raw) continue;
        const lead = JSON.parse(raw);
        if (lead.status === 'pending' || lead.status === 'buy_intent') out.push(lead);
      }
      return json({ leads: out });
    }

    // ---- Equipe devolve o resultado (cotação do TAAP) ----
    if (url.pathname === '/api/result' && req.method === 'POST') {
      const d = await req.json();
      const raw = await env.LEADS.get('lead:' + d.id);
      if (!raw) return json({ error: 'not_found' }, 404);
      const lead = JSON.parse(raw);
      lead.status = d.status === 'error' ? 'error' : 'done';
      lead.result = d.result || null;
      lead.respondido_em = new Date().toISOString();
      await env.LEADS.put('lead:' + d.id, JSON.stringify(lead), { expirationTtl: TTL });
      return json({ ok: true });
    }

    // ---- Visitante clicou "Quero comprar" ----
    if (url.pathname === '/api/buy' && req.method === 'POST') {
      const d = await req.json();
      const raw = await env.LEADS.get('lead:' + d.id);
      if (!raw) return json({ error: 'not_found' }, 404);
      const lead = JSON.parse(raw);
      lead.status = 'buy_intent';
      lead.comprou_em = new Date().toISOString();
      await env.LEADS.put('lead:' + d.id, JSON.stringify(lead), { expirationTtl: TTL });
      return json({ ok: true });
    }

    // ---- Equipe confirma que avisou o Michel ----
    if (url.pathname === '/api/ack' && req.method === 'POST') {
      const d = await req.json();
      const raw = await env.LEADS.get('lead:' + d.id);
      if (!raw) return json({ error: 'not_found' }, 404);
      const lead = JSON.parse(raw);
      lead.status = 'notified';
      await env.LEADS.put('lead:' + d.id, JSON.stringify(lead), { expirationTtl: TTL });
      return json({ ok: true });
    }

    // ---- Assinante de promoções (cadastro permanente, por cidade) ----
    if (url.pathname === '/api/subscribe' && req.method === 'POST') {
      const d = await req.json();
      const fone = String(d.whatsapp || '').replace(/\D/g, '');
      if (fone.length < 8) return json({ error: 'whatsapp_invalido' }, 400);
      const cidades = Array.isArray(d.cidades)
        ? d.cidades.map((c) => String(c).trim().slice(0, 40)).filter(Boolean).slice(0, 15)
        : [];
      if (!cidades.length) return json({ error: 'sem_cidades' }, 400);
      const id = 'sub:' + fone;
      const anterior = await env.LEADS.get(id);
      const sub = {
        id,
        nome: String(d.nome || '').trim().slice(0, 80),
        whatsapp: String(d.whatsapp || '').trim().slice(0, 30),
        cidades,
        criado_em: anterior ? JSON.parse(anterior).criado_em : new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };
      // SEM TTL: assinante fica até pedir pra sair
      await env.LEADS.put(id, JSON.stringify(sub));
      const idx = JSON.parse((await env.LEADS.get('idx:subs')) || '[]');
      if (!idx.includes(id)) {
        idx.push(id);
        await env.LEADS.put('idx:subs', JSON.stringify(idx));
      }
      return json({ ok: true });
    }

    // ---- Equipe lê os assinantes ----
    if (url.pathname === '/api/subscribers' && req.method === 'GET') {
      const idx = JSON.parse((await env.LEADS.get('idx:subs')) || '[]');
      const out = [];
      for (const id of idx) {
        const raw = await env.LEADS.get(id);
        if (raw) out.push(JSON.parse(raw));
      }
      return json({ subscribers: out });
    }

    // ---- Assinante pede pra sair ----
    if (url.pathname === '/api/unsubscribe' && req.method === 'POST') {
      const d = await req.json();
      const id = 'sub:' + String(d.whatsapp || '').replace(/\D/g, '');
      await env.LEADS.delete(id);
      const idx = JSON.parse((await env.LEADS.get('idx:subs')) || '[]');
      await env.LEADS.put('idx:subs', JSON.stringify(idx.filter((x) => x !== id)));
      return json({ ok: true });
    }

    return json({ error: 'not_found' }, 404);
  },
};

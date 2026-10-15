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

    return json({ error: 'not_found' }, 404);
  },
};

#!/usr/bin/env node
/* Detecta vagas do mata-mata já decididas (3ª rodada em diante) e ainda sem
   time real, pede à API do Claude (com web search) os times CONFIRMADOS, e
   grava em KO_TEAMS no index.html. Pensado para rodar no GitHub Action,
   logo após o fetch-scores. Requer env ANTHROPIC_API_KEY.
   Não faz git/commit — isso fica a cargo do workflow. */
const { getPendingKo } = require('./pending-ko');
const { applyKoTeam } = require('./apply-ko-team');

const MODEL = 'claude-sonnet-4-6';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';

async function askClaude(userText) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { console.error('ANTHROPIC_API_KEY ausente'); process.exit(1); }

  const headers = {
    'content-type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
  };
  const tools = [{ type: 'web_search_20260209', name: 'web_search' }];
  const messages = [{ role: 'user', content: userText }];

  for (let i = 0; i < 6; i++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: MODEL, max_tokens: 4096, tools, messages }),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    if (data.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: data.content });
      continue;
    }
    return text;
  }
  return '';
}

function parseArr(text) {
  const m = (text || '').match(/\[[\s\S]*\]/);
  if (!m) return [];
  try { return JSON.parse(m[0]); } catch (e) { return []; }
}

(async () => {
  const { slots, codes } = getPendingKo();
  if (!slots.length) { console.log('Nenhuma vaga do mata-mata pronta — encerrando.'); return; }

  const list = slots
    .map(s => `M${s.num}.${s.side} (${s.phase}): ${s.desc}`)
    .join('\n');

  const prompt =
`Você identifica os TIMES JÁ CLASSIFICADOS para vagas do mata-mata da Copa do Mundo FIFA 2026.
Cada item abaixo é uma vaga (lado "h" = mandante, "a" = visitante) cuja origem já está decidida.
Descubra, via web, qual seleção ocupa cada vaga.

Vagas:
${list}

Regras:
- Só inclua uma vaga se o time estiver OFICIALMENTE definido e pelo menos 2 fontes
  independentes e confiáveis (FIFA.com, ESPN, ge.globo, CNN Brasil, Sofascore) concordarem.
  Para "vencedor/perdedor de Mx", o jogo precisa ter ENCERRADO (inclusive pênaltis).
- Se ainda não estiver decidido ou as fontes divergirem, marque "confirmed": false.
- "team" DEVE ser exatamente um destes códigos (em inglês), não o nome em português:
${codes.join(', ')}

Responda APENAS com um array JSON, sem texto extra, no formato:
[{"num": <n>, "side": "h"|"a", "team": "<codigo>", "confirmed": <true|false>}]`;

  const text = await askClaude(prompt);
  const out = parseArr(text);
  const codeSet = new Set(codes);
  const pendingKey = new Set(slots.map(s => s.num + s.side));

  const applied = [];
  for (const r of out) {
    if (!r || r.confirmed !== true) continue;
    if (!Number.isInteger(r.num) || (r.side !== 'h' && r.side !== 'a')) continue;
    if (!pendingKey.has(r.num + r.side)) continue;       // só vagas que pedimos
    if (typeof r.team !== 'string' || !codeSet.has(r.team)) continue;
    applyKoTeam(r.num, r.side === 'h' ? r.team : '-', r.side === 'a' ? r.team : '-');
    applied.push(`M${r.num}.${r.side}=${r.team}`);
  }

  if (applied.length) console.log('Vagas preenchidas: ' + applied.join(' | '));
  else console.log('Nenhuma vaga confirmada neste ciclo.');
})().catch(err => { console.error(err); process.exit(1); });

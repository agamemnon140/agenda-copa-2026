#!/usr/bin/env node
/* Detecta jogos de grupo encerrados sem placar, pede à API do Claude (com web
   search) os placares finais confirmados, e grava no SCORES do index.html.
   Pensado para rodar num GitHub Action. Requer env ANTHROPIC_API_KEY.
   Não faz git/commit — isso fica a cargo do workflow. */
const { getPending } = require('./pending-scores');
const { applyScore } = require('./apply-score');

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

  // o web search roda server-side; pause_turn = limite de iterações, reenviar p/ continuar
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

function parseScores(text) {
  const m = (text || '').match(/\[[\s\S]*\]/); // primeiro array JSON no texto
  if (!m) return [];
  try { return JSON.parse(m[0]); } catch (e) { return []; }
}

(async () => {
  const pending = getPending();
  if (!pending.length) { console.log('Nada pendente — encerrando.'); return; }

  const list = pending
    .map(g => `M${g.num}: ${g.home} (mandante) x ${g.away} (visitante) — ${g.date} ${g.brt} BRT, Grupo ${g.group}`)
    .join('\n');

  const prompt =
`Você busca PLACARES FINAIS de jogos da Copa do Mundo FIFA 2026. Para cada jogo abaixo, pesquise na web o resultado final.

Jogos:
${list}

Regras:
- Só inclua um jogo se ele estiver ENCERRADO e pelo menos 2 fontes independentes e confiáveis (ESPN, FIFA.com, ge.globo, CNN Brasil, Sofascore, FOX Sports) concordarem no placar.
- "home_goals" = gols do MANDANTE (primeiro time listado); "away_goals" = gols do VISITANTE. Cuidado com a ordem.
- Se não houver confirmação clara (em andamento, sem resultado, fontes divergem), marque "confirmed": false.

Responda APENAS com um array JSON, sem texto extra, no formato:
[{"num": <n>, "home_goals": <int>, "away_goals": <int>, "confirmed": <true|false>}]`;

  const text = await askClaude(prompt);
  const scores = parseScores(text);
  const pendingNums = new Set(pending.map(p => p.num));

  const applied = [];
  for (const s of scores) {
    if (!s || s.confirmed !== true) continue;
    if (!Number.isInteger(s.num) || !pendingNums.has(s.num)) continue;
    if (!Number.isInteger(s.home_goals) || !Number.isInteger(s.away_goals)) continue;
    applyScore(s.num, s.home_goals, s.away_goals);
    const g = pending.find(p => p.num === s.num);
    applied.push(`M${s.num} ${g.home} ${s.home_goals}-${s.away_goals} ${g.away}`);
  }

  if (applied.length) console.log('Placares aplicados: ' + applied.join(' | '));
  else console.log('Nenhum placar confirmado neste ciclo.');
})().catch(err => { console.error(err); process.exit(1); });

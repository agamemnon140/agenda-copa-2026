#!/usr/bin/env node
/* Gera data/fixtures.json a partir dos dados embutidos no index.html.
   Rode com:  node scripts/gen-fixtures.js
   Saída: lista de jogos { num, ko, home, away, date, brt, endBrt, city, group/phase }.
   O agente de placares usa esse arquivo para saber quais jogos já terminaram
   e como preencher o objeto SCORES (chave = num do jogo). */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* extrai uma declaração "const NOME=...;" (uma linha) do index.html */
function grab(name) {
  const re = new RegExp('const ' + name + '=([\\s\\S]*?);\\s*\\n');
  const m = html.match(re);
  if (!m) throw new Error('não encontrei const ' + name);
  return m[1];
}

const PT      = eval('(' + grab('PT') + ')');
const PO      = eval('(' + grab('PO') + ')');
const GT      = eval('(' + grab('GT') + ')');
const GS      = eval('(' + grab('GS') + ')');
const GS_BRT  = eval('(' + grab('GS_BRT') + ')');
const KO_BRT  = eval('(' + grab('KO_BRT') + ')');
const KO_DATE = eval('(' + grab('KO_DATE') + ')');
const KO_CITY = eval('(' + grab('KO_CITY') + ')');
const KO_SPEC = eval('(' + grab('KO_SPEC') + ')');

/* resolve o 1º time de cada vaga de playoff, igual ao index.html */
const groups = {};
for (const [n, a] of Object.entries(GT)) groups[n] = a.map(s => (PO[s] ? PO[s].t[0] : s));
const nm = t => PT[t] || t;

const PHLONG = { R32:'16-avos de final', R16:'Oitavas de final', QF:'Quartas de final', SF:'Semifinal', '3rd':'Disputa do 3º lugar', FIN:'FINAL' };
function koSide(s) {
  if (s.t === 'pos')  return (s.p === 1 ? '1º ' : '2º ') + s.g;
  if (s.t === '3rd')  return '3º colocado';
  if (s.t === 'win')  return 'Vencedor M' + s.m;
  return 'Perdedor M' + s.m;
}

/* +N minutos sobre "HH:MM" -> "HH:MM" (sem rolar o dia; só p/ referência de fim) */
const addMin = (hhmm, n) => {
  const [h, m] = hhmm.split(':').map(Number);
  const t = (h * 60 + m + n) % 1440;
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
};

const fixtures = [];

GS.forEach((g, i) => {
  fixtures.push({
    num: i + 1,
    ko: false,
    group: g[0],
    home: nm(groups[g[0]][g[1]]),
    away: nm(groups[g[0]][g[2]]),
    date: g[3],            // data em horário de Brasília
    brt: GS_BRT[i],        // início (BRT)
    endBrt: addMin(GS_BRT[i], 120),
    city: g[4],
  });
});

for (let mn = 73; mn <= 104; mn++) {
  const sp = KO_SPEC[mn];
  fixtures.push({
    num: mn,
    ko: true,
    phase: sp.ph,
    phaseLabel: PHLONG[sp.ph],
    home: koSide(sp.h),    // rótulo da vaga (time real só após a classificação)
    away: koSide(sp.a),
    date: KO_DATE[mn],
    brt: KO_BRT[mn],
    endBrt: addMin(KO_BRT[mn], 180),
    city: KO_CITY[mn],
  });
}

const out = path.join(ROOT, 'data', 'fixtures.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(fixtures, null, 2) + '\n');
console.log('OK: ' + fixtures.length + ' jogos -> ' + path.relative(ROOT, out));

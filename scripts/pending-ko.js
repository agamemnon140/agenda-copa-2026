#!/usr/bin/env node
/* Lista as VAGAS do mata-mata que já podem ser preenchidas com o time real
   (a "3ª rodada" em diante) e ainda NÃO estão em KO_TEAMS no index.html.

   Uma vaga fica "pronta" quando sua origem está decidida:
   - pos (1º/2º de um grupo): quando todos os jogos daquele grupo têm placar;
   - 3rd (melhor terceiro): quando TODOS os grupos terminaram;
   - win/lose (vencedor/perdedor de Mx): quando os dois times de Mx já estão
     definidos em KO_TEAMS e o jogo Mx já passou do horário de término.

   Exporta getPendingKo() -> { slots:[{num,side,phase,desc}], codes:[...] }
   e roda como CLI: node scripts/pending-ko.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MONTHS = { Jun: 5, Jul: 6 };
const KO_DUR = 180; // mata-mata reserva 3h (prorrogação/pênaltis)

function grab(html, name) {
  const m = html.match(new RegExp('const ' + name + '=([\\s\\S]*?);\\s*\\n'));
  if (!m) throw new Error('não encontrei const ' + name + ' no index.html');
  return m[1];
}

function getPendingKo() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const fixtures = require(path.join(ROOT, 'data', 'fixtures.json'));
  const SCORES = eval('(' + grab(html, 'SCORES') + ')');
  const KO_TEAMS = eval('(' + grab(html, 'KO_TEAMS') + ')');
  const KO_SPEC = eval('(' + grab(html, 'KO_SPEC') + ')');
  const PT = eval('(' + grab(html, 'PT') + ')');
  const nm = t => PT[t] || t;

  // jogos da fase de grupos agrupados por grupo
  const groupGames = {};
  fixtures.filter(f => !f.ko).forEach(f => {
    (groupGames[f.group] = groupGames[f.group] || []).push(f.num);
  });
  const groupDone = g => (groupGames[g] || []).length > 0 && groupGames[g].every(n => n in SCORES);
  const allGroupsDone = Object.keys(groupGames).every(groupDone);

  // fim agendado (BRT) de um jogo do mata-mata, p/ saber se já foi disputado
  const nowBrt = Date.now() - 3 * 3600 * 1000;
  const koEndTs = mn => {
    const f = fixtures.find(x => x.num === mn);
    if (!f) return Infinity;
    const [dd, mo] = f.date.split('/');
    const [h, m] = f.brt.split(':').map(Number);
    return Date.UTC(2026, MONTHS[mo], +dd, h, m) + KO_DUR * 60000;
  };

  const describe = sp => {
    if (sp.t === 'pos') return (sp.p === 1 ? '1º colocado' : '2º colocado') + ' do Grupo ' + sp.g;
    if (sp.t === '3rd') return 'um 3º colocado (conforme a tabela de melhores terceiros da FIFA)';
    const src = KO_TEAMS[sp.m] || {};
    const matchup = (src.h && src.a) ? ` (${nm(src.h)} x ${nm(src.a)})` : '';
    return (sp.t === 'win' ? 'vencedor' : 'perdedor') + ' do jogo M' + sp.m + matchup;
  };
  const ready = sp => {
    if (sp.t === 'pos') return groupDone(sp.g);
    if (sp.t === '3rd') return allGroupsDone;
    const src = KO_TEAMS[sp.m] || {};
    return !!(src.h && src.a) && koEndTs(sp.m) <= nowBrt;
  };

  const slots = [];
  for (let mn = 73; mn <= 104; mn++) {
    const spec = KO_SPEC[mn];
    for (const side of ['h', 'a']) {
      if (KO_TEAMS[mn] && KO_TEAMS[mn][side]) continue; // já preenchida
      const sp = spec[side];
      if (!ready(sp)) continue;
      slots.push({ num: mn, side, phase: spec.ph, desc: describe(sp) });
    }
  }
  return { slots, codes: Object.keys(PT) };
}

module.exports = { getPendingKo };

if (require.main === module) {
  console.log(JSON.stringify(getPendingKo().slots, null, 1));
}

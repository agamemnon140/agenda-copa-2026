#!/usr/bin/env node
/* Lista os jogos da FASE DE GRUPOS que já terminaram (início + 2h, horário de
   Brasília) e ainda NÃO têm placar no objeto SCORES do index.html.
   Exporta getPending() e também roda como CLI: node scripts/pending-scores.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MONTHS = { Jun: 5, Jul: 6 };
const DUR = 120; // fase de grupos = 2h
const GRACE = 5; // min de folga após o fim

function getPending() {
  const fixtures = require(path.join(ROOT, 'data', 'fixtures.json'));
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = html.match(/const SCORES=(\{[^;]*\});/);
  const SCORES = m ? eval('(' + m[1] + ')') : {};

  const nowTs = Date.now() - 3 * 3600 * 1000; // agora em BRT (UTC-3)
  const endTs = f => {
    const [dd, mo] = f.date.split('/');
    const [h, mn] = f.brt.split(':').map(Number);
    return Date.UTC(2026, MONTHS[mo], +dd, h, mn) + DUR * 60000;
  };

  return fixtures
    .filter(f => !f.ko && !(f.num in SCORES) && endTs(f) + GRACE * 60000 <= nowTs)
    .map(f => ({ num: f.num, group: f.group, home: f.home, away: f.away, date: f.date, brt: f.brt }));
}

module.exports = { getPending };

if (require.main === module) {
  console.log(JSON.stringify(getPending(), null, 1));
}

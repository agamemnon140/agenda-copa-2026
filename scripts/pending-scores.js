#!/usr/bin/env node
/* Lista os jogos da FASE DE GRUPOS que já terminaram (início + 2h, horário de
   Brasília) e ainda NÃO têm placar no objeto SCORES do index.html.
   Saída: JSON (vazio = nada a fazer). Uso: node scripts/pending-scores.js
   É a checagem barata do passo 1 do agente — sem rede, encerra rápido. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const fixtures = require(path.join(ROOT, 'data', 'fixtures.json'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const m = html.match(/const SCORES=(\{[^;]*\});/);
const SCORES = m ? eval('(' + m[1] + ')') : {};

const MONTHS = { Jun: 5, Jul: 6 };
const DUR = 120; // fase de grupos = 2h
const GRACE = 5; // min de folga após o fim

/* "BRT wall clock" expresso como ms em espaço UTC, para comparar maçã com maçã */
const nowTs = Date.now() - 3 * 3600 * 1000;            // agora em BRT
function endTs(f) {
  const [dd, mo] = f.date.split('/');
  const [h, mn] = f.brt.split(':').map(Number);
  return Date.UTC(2026, MONTHS[mo], +dd, h, mn) + DUR * 60000;
}

const pending = fixtures.filter(f =>
  !f.ko && !(f.num in SCORES) && endTs(f) + GRACE * 60000 <= nowTs
);

console.log(JSON.stringify(
  pending.map(f => ({ num: f.num, group: f.group, home: f.home, away: f.away, date: f.date, brt: f.brt })),
  null, 1
));

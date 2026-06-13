#!/usr/bin/env node
/* Grava um placar no objeto SCORES do index.html, de forma determinística.
   Exporta applyScore(num, golsCasa, golsFora) e roda como CLI:
   node scripts/apply-score.js <num> <golsCasa> <golsFora>
   Preserva os placares existentes e reescreve a linha ordenada por nº do jogo. */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'index.html');

function applyScore(num, gh, ga) {
  let html = fs.readFileSync(FILE, 'utf8');
  const m = html.match(/const SCORES=(\{[^;]*\});/);
  if (!m) throw new Error('não achei o objeto SCORES no index.html');

  const SCORES = eval('(' + m[1] + ')');
  SCORES[num] = [gh, ga];

  const body = Object.keys(SCORES)
    .map(Number).sort((a, b) => a - b)
    .map(k => `${k}:[${SCORES[k][0]},${SCORES[k][1]}]`)
    .join(',');
  html = html.replace(m[0], `const SCORES={${body}};`);
  fs.writeFileSync(FILE, html);
  return Object.keys(SCORES).length;
}

module.exports = { applyScore };

if (require.main === module) {
  const [num, gh, ga] = process.argv.slice(2).map(Number);
  if (![num, gh, ga].every(Number.isInteger) || num < 1) {
    console.error('uso: node scripts/apply-score.js <num> <golsCasa> <golsFora>');
    process.exit(1);
  }
  const total = applyScore(num, gh, ga);
  console.log(`OK: M${num} = ${gh}-${ga}  ->  SCORES tem ${total} jogo(s)`);
}

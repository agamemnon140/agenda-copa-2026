#!/usr/bin/env node
/* Grava um placar no objeto SCORES do index.html, de forma determinística.
   Uso: node scripts/apply-score.js <num> <golsCasa> <golsFora>
   Ex.: node scripts/apply-score.js 3 1 1
   Preserva os placares existentes e reescreve a linha ordenada por nº do jogo. */
const fs = require('fs');
const path = require('path');

const [num, gh, ga] = process.argv.slice(2).map(Number);
if (![num, gh, ga].every(Number.isInteger) || num < 1) {
  console.error('uso: node scripts/apply-score.js <num> <golsCasa> <golsFora>');
  process.exit(1);
}

const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const m = html.match(/const SCORES=(\{[^;]*\});/);
if (!m) { console.error('não achei o objeto SCORES no index.html'); process.exit(1); }

const SCORES = eval('(' + m[1] + ')');
SCORES[num] = [gh, ga];

const body = Object.keys(SCORES)
  .map(Number).sort((a, b) => a - b)
  .map(k => `${k}:[${SCORES[k][0]},${SCORES[k][1]}]`)
  .join(',');
html = html.replace(m[0], `const SCORES={${body}};`);
fs.writeFileSync(file, html);
console.log(`OK: M${num} = ${gh}-${ga}  ->  SCORES tem ${Object.keys(SCORES).length} jogo(s)`);

#!/usr/bin/env node
/* Grava os times já classificados de uma vaga do mata-mata no objeto KO_TEAMS
   do index.html, de forma determinística.
   Exporta applyKoTeam(num, homeCode, awayCode) e roda como CLI:
   node scripts/apply-ko-team.js <num> <homeCode> <awayCode>
   - <num> é o número do jogo do mata-mata (73 a 104).
   - <homeCode>/<awayCode> são os CÓDIGOS do time (chaves de PT/FL no index.html,
     ex.: Colombia, Brazil, Italy), não o nome em português.
   Use '-' para preencher só um lado (mantém o outro como está / rótulo).
   Preserva as vagas já gravadas e reescreve a linha ordenada por nº do jogo. */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'index.html');

/* extrai uma declaração "const NOME=...;" (uma linha) do index.html */
function grab(html, name) {
  const m = html.match(new RegExp('const ' + name + '=([\\s\\S]*?);\\s*\\n'));
  if (!m) throw new Error('não encontrei const ' + name + ' no index.html');
  return m[1];
}

function applyKoTeam(num, homeCode, awayCode) {
  let html = fs.readFileSync(FILE, 'utf8');

  const PT = eval('(' + grab(html, 'PT') + ')');
  const valid = code => code === '-' || Object.prototype.hasOwnProperty.call(PT, code);
  for (const c of [homeCode, awayCode]) {
    if (!valid(c)) {
      throw new Error(`código de time desconhecido: "${c}" (use uma chave de PT, ex.: Colombia, Brazil, Italy)`);
    }
  }

  const m = html.match(/const KO_TEAMS=(\{[^;]*\});/);
  if (!m) throw new Error('não achei o objeto KO_TEAMS no index.html');
  const KO_TEAMS = eval('(' + m[1] + ')');

  const slot = KO_TEAMS[num] || {};
  if (homeCode !== '-') slot.h = homeCode;
  if (awayCode !== '-') slot.a = awayCode;
  KO_TEAMS[num] = slot;

  const body = Object.keys(KO_TEAMS)
    .map(Number).sort((a, b) => a - b)
    .map(k => {
      const s = KO_TEAMS[k];
      const parts = [];
      if (s.h) parts.push(`h:'${s.h}'`);
      if (s.a) parts.push(`a:'${s.a}'`);
      return `${k}:{${parts.join(',')}}`;
    })
    .join(',');
  html = html.replace(m[0], `const KO_TEAMS={${body}};`);
  fs.writeFileSync(FILE, html);
  return Object.keys(KO_TEAMS).length;
}

module.exports = { applyKoTeam };

if (require.main === module) {
  const [numRaw, homeCode, awayCode] = process.argv.slice(2);
  const num = Number(numRaw);
  if (!Number.isInteger(num) || num < 73 || num > 104 || !homeCode || !awayCode) {
    console.error('uso: node scripts/apply-ko-team.js <num 73-104> <homeCode> <awayCode>');
    console.error('     (use "-" para preencher só um lado, ex.: ... 89 Brazil -)');
    process.exit(1);
  }
  try {
    const total = applyKoTeam(num, homeCode, awayCode);
    console.log(`OK: M${num} = ${homeCode} x ${awayCode}  ->  KO_TEAMS tem ${total} vaga(s)`);
  } catch (e) {
    console.error('ERRO: ' + e.message);
    process.exit(1);
  }
}

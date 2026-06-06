const fs = require('fs');
const path = require('path');

const S = 512;                 // canvas
const CX = 256, CY = 232, R = 140;

const pentagon = (cx, cy, r, rot = 0) =>
  Array.from({ length: 5 }, (_, i) => {
    const a = (-90 + rot + i * 72) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

const poly = pts => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

const central = pentagon(CX, CY, 47);

const seamPts = [], outer = [];
for (let i = 0; i < 5; i++) {
  const a = (-90 + i * 72) * Math.PI / 180;
  seamPts.push([CX + 128 * Math.cos(a), CY + 128 * Math.sin(a)]);
  const ox = CX + 150 * Math.cos(a), oy = CY + 150 * Math.sin(a);
  outer.push(pentagon(ox, oy, 40, a * 180 / Math.PI + 90 + 36));
}

const seams = central.map(([cx, cy], i) => {
  const [sx, sy] = seamPts[i];
  return `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${sx.toFixed(1)}" y2="${sy.toFixed(1)}" stroke="#0b1f17" stroke-width="6" stroke-linecap="round"/>`;
}).join('');

const outerPolys = outer.map(p => `<polygon points="${poly(p)}" fill="#0b1f17"/>`).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0c3326"/>
      <stop offset="0.55" stop-color="#06140f"/>
      <stop offset="1" stop-color="#02080c"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#1ad97a" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#1ad97a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ball" cx="0.4" cy="0.34" r="0.75">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.7" stop-color="#eef3f1"/>
      <stop offset="1" stop-color="#c4d0cb"/>
    </radialGradient>
    <clipPath id="ballClip"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
  </defs>

  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <rect width="${S}" height="${S}" fill="url(#glow)"/>
  <rect x="14" y="14" width="${S - 28}" height="${S - 28}" rx="96" ry="96"
        fill="none" stroke="#f5c84a" stroke-opacity="0.22" stroke-width="3"/>

  <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#ball)" stroke="#0b1f17" stroke-width="5"/>
  <g clip-path="url(#ballClip)">
    ${outerPolys}
    ${seams}
    <polygon points="${poly(central)}" fill="#0b1f17"/>
  </g>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#ffffff" stroke-opacity="0.15" stroke-width="2"/>

  <text x="${CX}" y="466" text-anchor="middle"
        font-family="'Arial Black','Segoe UI',sans-serif" font-weight="900"
        font-size="92" letter-spacing="2"
        fill="#f5c84a" stroke="#7a5a10" stroke-width="1.5">2026</text>
</svg>`;

const out = path.join(__dirname, 'icon.svg');
fs.writeFileSync(out, svg);
console.log('wrote', out);

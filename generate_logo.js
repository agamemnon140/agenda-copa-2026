const fs = require('fs');
const path = require('path');

const S = 512;

// --- Calendar geometry -----------------------------------------------------
const CARD_X = 112, CARD_Y = 150, CARD_W = 288, CARD_H = 262, CARD_R = 30;
const CARD_RIGHT = CARD_X + CARD_W;          // 400
const HEADER_H = 60;
const HEADER_BOTTOM = CARD_Y + HEADER_H;     // 210

// Faint day-grid dots behind the trophy (reads as a calendar grid)
const cols = [150, 203, 256, 309, 362];
const rows = [240, 290, 340, 388];
const dots = rows
  .flatMap(y => cols.map(x => `<circle cx="${x}" cy="${y}" r="5" fill="#cfd8d3" fill-opacity="0.45"/>`))
  .join('\n    ');

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
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#e9efec"/>
    </linearGradient>
    <linearGradient id="header" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#13a85c"/>
      <stop offset="1" stop-color="#0a7a40"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe7a3"/>
      <stop offset="0.5" stop-color="#f5c84a"/>
      <stop offset="1" stop-color="#c5870f"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3d579"/>
      <stop offset="1" stop-color="#bd8e22"/>
    </linearGradient>
  </defs>

  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <rect width="${S}" height="${S}" fill="url(#glow)"/>
  <rect x="14" y="14" width="${S - 28}" height="${S - 28}" rx="96" ry="96"
        fill="none" stroke="#f5c84a" stroke-opacity="0.22" stroke-width="3"/>

  <!-- binder rings -->
  <rect x="172" y="136" width="16" height="34" rx="8" fill="none" stroke="url(#ring)" stroke-width="7"/>
  <rect x="324" y="136" width="16" height="34" rx="8" fill="none" stroke="url(#ring)" stroke-width="7"/>

  <!-- calendar card -->
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="${CARD_R}" ry="${CARD_R}"
        fill="url(#card)" stroke="#0b1f17" stroke-width="4"/>

  <!-- green header band (top corners rounded) -->
  <path d="M ${CARD_X},${HEADER_BOTTOM}
           L ${CARD_X},${CARD_Y + CARD_R}
           Q ${CARD_X},${CARD_Y} ${CARD_X + CARD_R},${CARD_Y}
           L ${CARD_RIGHT - CARD_R},${CARD_Y}
           Q ${CARD_RIGHT},${CARD_Y} ${CARD_RIGHT},${CARD_Y + CARD_R}
           L ${CARD_RIGHT},${HEADER_BOTTOM} Z"
        fill="url(#header)"/>
  <text x="256" y="${CARD_Y + 43}" text-anchor="middle"
        font-family="'Arial Black','Segoe UI',sans-serif" font-weight="900"
        font-size="40" letter-spacing="4" fill="#ffffff">2026</text>

  <!-- faint day grid -->
  <g>
    ${dots}
  </g>

  <!-- golden trophy -->
  <g stroke="#6e4e0c" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <!-- handles -->
    <path d="M212,244 C180,242 178,290 210,298" fill="none" stroke-width="9"/>
    <path d="M300,244 C332,242 334,290 302,298" fill="none" stroke-width="9"/>
    <!-- bowl -->
    <path d="M212,236 L300,236 C300,286 280,326 256,326 C232,326 212,286 212,236 Z" fill="url(#gold)"/>
    <!-- neck -->
    <polygon points="248,326 264,326 268,346 244,346" fill="url(#gold)"/>
    <!-- knob -->
    <ellipse cx="256" cy="348" rx="20" ry="7" fill="url(#gold)"/>
    <!-- pedestal -->
    <polygon points="240,352 272,352 286,378 226,378" fill="url(#gold)"/>
    <!-- base slab -->
    <rect x="220" y="378" width="72" height="14" rx="4" fill="url(#gold)"/>
  </g>
  <!-- bowl highlight -->
  <path d="M224,244 C226,272 236,300 252,312" fill="none"
        stroke="#fff6d8" stroke-opacity="0.6" stroke-width="5" stroke-linecap="round"/>
</svg>`;

const out = path.join(__dirname, 'icon.svg');
fs.writeFileSync(out, svg);
console.log('wrote', out);

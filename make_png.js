const fs = require('fs');
const svg = fs.readFileSync('icon.svg','utf8');
for (const px of [512,192,180]) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0}html,body{width:${px}px;height:${px}px;overflow:hidden}
svg{display:block;width:${px}px;height:${px}px}</style></head><body>${svg}</body></html>`;
  fs.writeFileSync(`_wrap_${px}.html`, html);
}
console.log('wrappers written');

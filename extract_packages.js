const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function extractTgz(tgzPath, destDir) {
  const buf = fs.readFileSync(tgzPath);
  const dec = zlib.gunzipSync(buf);

  let offset = 0;
  while (offset < dec.length - 512) {
    const hdr = dec.slice(offset, offset + 512);

    // Parse name
    let name = '';
    for (let i = 0; i < 100; i++) {
      if (hdr[i] === 0) break;
      name += String.fromCharCode(hdr[i]);
    }

    // Parse size (octal)
    let sizeStr = '';
    for (let i = 0; i < 12; i++) {
      const c = hdr[124 + i];
      if (c === 0 || c === 32) continue;
      sizeStr += String.fromCharCode(c);
    }
    const size = parseInt(sizeStr, 8) || 0;

    // Type flag
    const typeFlag = hdr[156];

    if (!name) break;

    const cleanName = name.replace(/^package\//, '');
    const fullPath = path.join(destDir, cleanName);

    if (typeFlag === 53) {
      // directory
      fs.mkdirSync(fullPath, { recursive: true });
    } else if (size > 0) {
      const dir = path.dirname(fullPath);
      fs.mkdirSync(dir, { recursive: true });
      const contentStart = offset + 512;
      fs.writeFileSync(fullPath, dec.slice(contentStart, contentStart + size));
    }

    // Advance to next entry
    const dataBlocks = Math.ceil(size / 512);
    offset = offset + 512 + dataBlocks * 512;
  }
}

const nmDir = 'F:/aigamejam/node_modules';
const packages = ['phaser', 'typescript', 'vite', 'esbuild', 'rollup', 'fsevents'];

for (const pkg of packages) {
  const pkgDir = path.join(nmDir, pkg);
  const tgzPath = path.join(pkgDir, pkg + '.tgz');
  if (!fs.existsSync(tgzPath)) {
    console.log('SKIP: ' + pkg);
    continue;
  }
  try {
    extractTgz(tgzPath, pkgDir);
    try { fs.unlinkSync(tgzPath); } catch(e) {}
    const pjPath = path.join(pkgDir, 'package.json');
    if (fs.existsSync(pjPath)) {
      const info = JSON.parse(fs.readFileSync(pjPath, 'utf8'));
      console.log('OK: ' + pkg + '@' + info.version);
    } else {
      console.log('WARN: ' + pkg + ' - no package.json');
    }
  } catch(e) {
    console.error('FAIL: ' + pkg + ' - ' + e.message);
  }
}
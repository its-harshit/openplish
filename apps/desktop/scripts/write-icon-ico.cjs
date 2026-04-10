/**
 * Writes resources/icon.ico from resources/icon.png using binary-safe I/O.
 * Do not use PowerShell `>` redirection — it UTF-16-encodes the file and breaks Electron.
 */
const fs = require('fs');
const path = require('path');

async function main() {
  const pngToIco = (await import('png-to-ico')).default;
  const resDir = path.join(__dirname, '../resources');
  const pngPath = path.join(resDir, 'icon.png');
  const icoPath = path.join(resDir, 'icon.ico');

  if (!fs.existsSync(pngPath)) {
    throw new Error(`Missing ${pngPath}`);
  }

  const buf = await pngToIco(fs.readFileSync(pngPath));
  fs.writeFileSync(icoPath, buf);
  const magic = buf.subarray(0, 4).toString('hex');
  if (magic !== '00000100') {
    throw new Error(`Unexpected ICO header: ${magic} (expected 00000100)`);
  }
  console.log(`[write-icon-ico] Wrote ${icoPath} (${buf.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  // In packaged desktop builds we execute the daemon via `node <entry>`.
  // On Windows in particular, we run it as CJS (no "type": "module" in the resources dir),
  // so we emit both ESM + CJS and let the desktop choose the correct entry.
  format: ['esm', 'cjs'],
  target: 'node20',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  // Native modules must stay external — they are compiled per-platform
  // and loaded from daemon/node_modules/ in the packaged app.
  external: [
    'better-sqlite3',
    'node-pty',
    // Optional private package — resolved at runtime via dynamic import, not bundled.
    // In OSS builds it's absent (noop fallback). In Free builds CI copies it into dist/.
    '@accomplish/llm-gateway-client',
  ],
  // gray-matter (CJS) uses require('fs') etc. — inject a require() shim ONLY for the ESM bundle.
  // Never inject this into the CJS output, or Node will crash on `import ...` at runtime.
  esbuildOptions(options) {
    if (options.format === 'esm') {
      options.banner ??= {};
      options.banner.js =
        (options.banner.js ? `${options.banner.js}\n` : '') +
        `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`;
    }
  },
  // Bundle all JS dependencies so the packaged daemon is self-contained.
  // Only native modules (above) remain as external imports.
  // Baileys + pino are bundled for WhatsApp integration in the daemon.
  noExternal: ['@somehow_ai/agent-core', 'zod', '@whiskeysockets/baileys', 'pino'],
});

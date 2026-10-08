// Bundles the API for production with esbuild.
//
// Runtime dependencies stay external and are installed next to the bundle.
// Workspace packages (@quoteflow/*) ship TypeScript source, so they are bundled.
import { readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/** Every runnable program. Each one is emitted at its path under dist/, e.g. dist/server.js. */
const ENTRY_POINTS = ['src/server.ts', 'src/scripts/sync-indexes.ts'];

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const external = Object.keys(packageJson.dependencies ?? {}).filter(
  (name) => !name.startsWith('@quoteflow/'),
);

await rm(new URL('../dist', import.meta.url), { recursive: true, force: true });

await build({
  absWorkingDir: packageRoot,
  entryPoints: ENTRY_POINTS,
  outbase: 'src',
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  keepNames: true,
  external,
  logLevel: 'info',
});

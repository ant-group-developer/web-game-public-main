// Build ZOZO SDK: dist/zozo-sdk.mjs (ESM) + dist/zozo-sdk.js (IIFE, window.ZOZO), kèm bản min và sourcemap.
//   npm run build:sdk
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const banner = { js: `/*! ZOZO SDK v${version} */` };
const common = { entryPoints: [join(root, 'src/index.ts')], bundle: true, target: 'es2019', banner, sourcemap: true, logLevel: 'info' };

await Promise.all([
  build({ ...common, format: 'esm', outfile: join(root, 'dist/zozo-sdk.mjs') }),
  build({ ...common, format: 'esm', minify: true, outfile: join(root, 'dist/zozo-sdk.min.mjs') }),
  build({ ...common, format: 'iife', globalName: 'ZOZO', outfile: join(root, 'dist/zozo-sdk.js') }),
  build({ ...common, format: 'iife', globalName: 'ZOZO', minify: true, outfile: join(root, 'dist/zozo-sdk.min.js') }),
]);

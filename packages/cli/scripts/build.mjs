#!/usr/bin/env node
/**
 * Bundle the CLI into a single executable file with esbuild.
 *
 * Why bundle at all: `@appe/core` deliberately exports TypeScript *source*
 * (its consumers are all behind a bundler, so there is no compiled artifact to
 * drift). Node cannot import that directly, so the CLI is the one place that
 * compiles it — esbuild inlines core, its deps and the models.dev JSON into
 * dist/appe.js. The published `appe` package is then a single dependency-free
 * file, and it is provably the same maths as the web app because it is the
 * same source.
 */

import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = resolve(here, "..");

const result = await build({
  entryPoints: [resolve(pkg, "src/index.ts")],
  outfile: resolve(pkg, "dist/appe.js"),
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  // The catalogue is ~3 MB of JSON; minifying it roughly halves the shipped
  // file and speeds up parse at startup.
  minify: true,
  sourcemap: false,
  legalComments: "none",
  banner: {
    js: [
      "#!/usr/bin/env node",
      // esbuild's ESM output can reference `require` from bundled CJS deps
      // (lodash). Give it one.
      "import { createRequire as __createRequire } from 'node:module';",
      "const require = __createRequire(import.meta.url);",
    ].join("\n"),
  },
  metafile: true,
});

const { outputs } = result.metafile;
const [file, meta] = Object.entries(outputs)[0];
const kb = (meta.bytes / 1024).toFixed(0);
console.log(`built ${file.replace(`${pkg}/`, "")} — ${kb} kB`);

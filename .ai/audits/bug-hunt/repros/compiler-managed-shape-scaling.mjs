import { pathToFileURL } from 'node:url'
import { performance } from 'node:perf_hooks'
const compilerDir = process.env.BH_COMPILER_PACKAGE_DIR || '/Users/aron/master/css/.ai/audits/bug-hunt/tmp/0244-global-resource-api/packages/compiler'
const api = await import(pathToFileURL(compilerDir + '/dist/stylesheet/index-public.js'))
const baseManifest = { version: 1, utilities: [] }
async function time(label, fn, n = 3) { const t = [];for (let i = 0; i < n; i++) { const s = performance.now();await fn();t.push(performance.now() - s) } t.sort((a, b) => a - b);console.log(label.padEnd(64), 'median', t[Math.floor(n / 2)].toFixed(1), 'ms') }
const shapes = {
  'rules with url() resources': n => Array.from({ length: n }, (_, i) => `.r${i}{background:url("./img${i}.svg");color:red}`).join(''),
  'rules with @compose directives': n => `@master entry;` + Array.from({ length: n }, (_, i) => `.r${i}{@compose p:${i % 9}px;color:red}`).join(''),
  '@components definitions': n => `@master entry;@components{` + Array.from({ length: n }, (_, i) => `c${i}{padding:${i % 9}px;color:red}`).join('') + `}`,
  '@components with @compose': n => `@master entry;@components{` + Array.from({ length: n }, (_, i) => `c${i}{@compose p:${i % 9}px;color:red}`).join('') + `}`,
  '@utilities definitions': n => `@master entry;@utilities{` + Array.from({ length: n }, (_, i) => `u${i}{padding:${i % 9}px}`).join('') + `}`,
  '@theme variables': n => `@master entry;@theme{` + Array.from({ length: n }, (_, i) => `--v${i}:${i}px`).join(';') + `}.a{color:var(--v1)}`
}
for (const [label, make] of Object.entries(shapes)) for (const n of [200, 400, 800]) {
  const css = make(n)
  try { await time(`${label} n=${n} rendered`, () => api.compileRenderedStylesheet('/audit/e.css', css, { baseManifest, preserveNativeCSS: true })) }
  catch (error) { console.log(label, n, 'THROWS', String(error.message).slice(0, 100)) }
}

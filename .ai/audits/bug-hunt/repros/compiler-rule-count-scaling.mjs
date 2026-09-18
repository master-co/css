// Batch 0250: scaling by stylesheet shape (plain rules, theme, var refs, single-rule declarations, @media wrapping). Demonstrates quadratic cost in rule count. See evidence/0250-shape-probe.log.
import { pathToFileURL } from 'node:url'
import { performance } from 'node:perf_hooks'
const compilerDir = process.env.BH_COMPILER_PACKAGE_DIR || '/Users/aron/master/css/.ai/audits/bug-hunt/tmp/0244-global-resource-api/packages/compiler'
const api = await import(pathToFileURL(compilerDir + '/dist/stylesheet/index-public.js'))
const baseManifest = { version: 1, utilities: [] }
async function time(label, fn, n = 3) { const t = [];for (let i = 0; i < n; i++) { const s = performance.now();await fn();t.push(performance.now() - s) } t.sort((a, b) => a - b);console.log(label.padEnd(60), 'median', t[Math.floor(n / 2)].toFixed(1), 'ms') }
const shapes = {
  'plain rules, no theme, no var': n => Array.from({ length: n }, (_, i) => `.r${i}{color:red;padding:${i % 9}px}`).join(''),
  'plain rules + theme, no var': n => `@theme{--a:#123}` + Array.from({ length: n }, (_, i) => `.r${i}{color:red;padding:${i % 9}px}`).join(''),
  'rules with var refs + theme': n => `@theme{--a:#123}` + Array.from({ length: n }, (_, i) => `.r${i}{color:var(--a);padding:${i % 9}px}`).join(''),
  'rules with unknown var refs': n => Array.from({ length: n }, (_, i) => `.r${i}{color:var(--zz);padding:${i % 9}px}`).join(''),
  'one rule, many declarations': n => `.r{` + Array.from({ length: n }, (_, i) => `--p${i}:${i}px`).join(';') + `}`,
  'many @media wrapped rules': n => Array.from({ length: n }, (_, i) => `@media (min-width:${i}px){.r${i}{color:red}}`).join('')
}
for (const [label, make] of Object.entries(shapes)) for (const n of [200, 400, 800]) {
  const css = make(n)
  await time(`${label} n=${n} rendered`, () => api.compileRenderedStylesheet('/audit/e.css', css, { baseManifest }))
  if (n === 400) await time(`${label} n=${n} compileStylesheet`, () => api.compileStylesheet('/audit/e.css', css, { baseManifest, preserveNativeCSS: true }))
}

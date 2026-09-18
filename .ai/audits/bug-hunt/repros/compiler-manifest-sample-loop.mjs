import { pathToFileURL } from 'node:url'
const compilerDir = process.env.BH_COMPILER_PACKAGE_DIR || '/Users/aron/master/css/.ai/audits/bug-hunt/tmp/0244-global-resource-api/packages/compiler'
const api = await import(pathToFileURL(compilerDir + '/dist/stylesheet/index-public.js'))
const baseManifest = { version: 1, utilities: [] }
const kind = process.env.SHAPE || 'components'
const n = Number(process.env.RULES || 1600)
const css = kind === 'components'
  ? `@master entry;@components{` + Array.from({ length: n }, (_, i) => `c${i}{padding:${i % 9}px;color:red}`).join('') + `}`
  : `@master entry;@theme{` + Array.from({ length: n }, (_, i) => `--v${i}:${i}px`).join(';') + `}.a{color:var(--v1)}`
const deadline = Date.now() + Number(process.env.SECONDS || 6) * 1000
let runs = 0
while (Date.now() < deadline) { await api.compileRenderedStylesheet('/audit/e.css', css, { baseManifest, preserveNativeCSS: true }); runs++ }
console.log(kind, n, 'runs', runs)

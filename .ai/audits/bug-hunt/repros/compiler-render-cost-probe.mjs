// Batch 0250: compileRenderedStylesheet / compileStylesheet cost by rule count on the 0244 compiler API (native binding via MASTER_CSS_NATIVE_BINDING_PATH), including the preserveNativeSource mode. See evidence/0250-render-cost-probe.log.
import { pathToFileURL } from 'node:url'
import { performance } from 'node:perf_hooks'
const compilerDir = process.env.BH_COMPILER_PACKAGE_DIR || '/Users/aron/master/css/.ai/audits/bug-hunt/tmp/0244-global-resource-api/packages/compiler'
const api = await import(pathToFileURL(compilerDir + '/dist/stylesheet/index-public.js'))
const baseManifest = { version: 1, utilities: [] }
function source(rules, theme, native = true) {
  const themeVars = Array.from({ length: theme }, (_, i) => `--c${i}:#${(i * 7919 % 0xffffff).toString(16).padStart(6, '0')}`).join(';')
  const body = Array.from({ length: rules }, (_, i) => `.r${i}{color:var(--c${i % theme});padding:${i % 9}px;margin:${i % 5}px}`).join('')
  return `@theme{${themeVars};--late-color:#abcdef}${body}`
}
async function time(label, fn, n = 5) {
  const t = []
  for (let i = 0; i < n; i++) { const s = performance.now();await fn();t.push(performance.now() - s) }
  t.sort((a, b) => a - b);console.log(label.padEnd(70), 'median', t[Math.floor(n / 2)].toFixed(1), 'ms')
}
for (const [rules, theme] of [[20, 10], [100, 60], [200, 60], [400, 60], [400, 10], [800, 60]]) {
  const css = source(rules, theme)
  // What the hook does today: rendered compile of the already-lowered root text (theme lowered to @layer theme{:root{...}} + rules)
  const first = await api.compileRenderedStylesheet('/audit/e.css', css, { baseManifest })
  const rootText = first.css
  const label = `rules=${rules} theme=${theme} bytes=${rootText.length}`
  await time(label + ' hook-style rendered(rootText)', () => api.compileRenderedStylesheet('/audit/e.css', rootText, { baseManifest: first.manifest, emittedGlobals: first.emittedGlobals }))
  await time(label + ' rendered(rootText, preserveNativeCSS)', () => api.compileRenderedStylesheet('/audit/e.css', rootText, { baseManifest: first.manifest, emittedGlobals: first.emittedGlobals, preserveNativeCSS: true }))
  await time(label + ' rendered(rootText, preserveNativeCSS+Source)', () => api.compileRenderedStylesheet('/audit/e.css', rootText, { baseManifest: first.manifest, emittedGlobals: first.emittedGlobals, preserveNativeCSS: true, preserveNativeSource: true }))
  await time(label + ' compileStylesheet(rootText, preserveNativeCSS)', () => api.compileStylesheet('/audit/e.css', rootText, { baseManifest: first.manifest, preserveNativeCSS: true }))
}

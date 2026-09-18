// Batch 0250: single-render CPU profile driver (node --cpu-prof). MODE=rendered|source RULES=n. Summarize with summarize-cpuprofile.mjs. See evidence/0250-render-profile.log.
import { pathToFileURL } from 'node:url'
import { performance } from 'node:perf_hooks'
const compilerDir = process.env.BH_COMPILER_PACKAGE_DIR || '/Users/aron/master/css/.ai/audits/bug-hunt/tmp/0244-global-resource-api/packages/compiler'
const api = await import(pathToFileURL(compilerDir + '/dist/stylesheet/index-public.js'))
const baseManifest = { version: 1, utilities: [] }
const rules = Number(process.env.RULES || 400), theme = 60
const themeVars = Array.from({ length: theme }, (_, i) => `--c${i}:#${(i * 7919 % 0xffffff).toString(16).padStart(6, '0')}`).join(';')
const body = Array.from({ length: rules }, (_, i) => `.r${i}{color:var(--c${i % theme});padding:${i % 9}px;margin:${i % 5}px}`).join('')
const css = `@theme{${themeVars};--late-color:#abcdef}${body}`
const first = await api.compileRenderedStylesheet('/audit/e.css', css, { baseManifest })
const mode = process.env.MODE || 'rendered'
const s = performance.now()
if (mode === 'rendered') await api.compileRenderedStylesheet('/audit/e.css', first.css, { baseManifest: first.manifest, emittedGlobals: first.emittedGlobals })
else await api.compileRenderedStylesheet('/audit/e.css', first.css, { baseManifest: first.manifest, emittedGlobals: first.emittedGlobals, preserveNativeCSS: true, preserveNativeSource: true })
console.log(mode, rules, 'ms', (performance.now() - s).toFixed(1))

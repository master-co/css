// Batch 0247 native control: the compiler alone reproduces theme emission beside authored definitions and cumulative authored keyframe counts when emittedGlobals is fed back. See evidence/0247-native-history-probes.log.
import { pathToFileURL } from 'node:url'
const compilerDir = process.env.BH_COMPILER_PACKAGE_DIR || '/Users/aron/master/css/.ai/audits/bug-hunt/tmp/0244-global-resource-api/packages/compiler'
const { compileRenderedStylesheet } = await import(pathToFileURL(compilerDir + '/dist/stylesheet/index-public.js'))
const baseManifest = { version: 1, utilities: [] }
// Native compiler: authored external definition + reference in the same source, no PostCSS involved.
const a = await compileRenderedStylesheet('/audit/entry.css', '@theme{--color-late:#abcdef}:root{--color-late:#000000}.card{color:var(--color-late)}', { baseManifest })
console.log('A native generated=', JSON.stringify(a.generatedCSS), 'emitted=', JSON.stringify(a.emittedGlobals))
// Native compiler: repeated renders of a source containing an authored @keyframes, feeding emittedGlobals back.
let emitted
const src = '@theme{--x:1}.card{color:var(--x)}@keyframes late{to{opacity:0}}'
for (let i = 0; i < 3; i++) {
  const r = await compileRenderedStylesheet('/audit/entry.css', src + (emitted ? '' : ''), { baseManifest, emittedGlobals: emitted })
  emitted = r.emittedGlobals
  console.log(`B pass ${i} generated=`, JSON.stringify(r.generatedCSS), 'emitted=', JSON.stringify(emitted))
}
// Same but feed back the rendered css (as the hook does: root.toString() includes previous generated globals)
let css = src, emitted2
for (let i = 0; i < 3; i++) {
  const r = await compileRenderedStylesheet('/audit/entry.css', css, { baseManifest, emittedGlobals: emitted2 })
  emitted2 = r.emittedGlobals; css = css + r.generatedCSS
  console.log(`C pass ${i} generated=`, JSON.stringify(r.generatedCSS), 'emitted=', JSON.stringify(emitted2))
}

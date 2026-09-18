// Batch 0247 review probes: authored external definitions, sibling root history, unknown late references and late animation references through the owned resource hook. Output is observational; see evidence/0247-history-probes.log.
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
const nextDir = process.env.BH_NEXT_PACKAGE_DIR || '/Users/aron/master/css/.ai/audits/bug-hunt/tmp/0247-postcss-resource-policy/packages/next'
const compilerDir = process.env.BH_COMPILER_PACKAGE_DIR || '/Users/aron/master/css/.ai/audits/bug-hunt/tmp/0244-global-resource-api/packages/compiler'
const { compileRenderedStylesheet } = await import(pathToFileURL(compilerDir + '/dist/stylesheet/index-public.js'))
const { createNextPostCSSResourceHook } = await import(pathToFileURL(nextDir + '/dist/postcss-resource-policy.js'))
const { createPostCSSRequestPlugins } = await import(pathToFileURL(nextDir + '/dist/postcss-request-plugins.js'))
const postcss = createRequire(createRequire(nextDir + '/package.json').resolve('next/package.json'))('postcss')
const baseManifest = { version: 1, utilities: [] }
const source = '@theme{--color-old:#111111;--color-late:#abcdef;--anim-late:1s}.card{color:var(--color-old)}@keyframes late{to{opacity:0}}'
const first = await compileRenderedStylesheet('/audit/entry.css', source, { baseManifest })
console.log('first.css=', JSON.stringify(first.css))
console.log('first.emittedGlobals=', JSON.stringify(first.emittedGlobals))
const policy = { file: '/audit/entry.css', projectDir: '/audit', manifest: first.manifest, processedGlobals: first.emittedGlobals, resourceFiles: [] }
async function run(label, css, plugins, extra = {}) {
  const root = postcss.parse(css)
  const result = await postcss(createPostCSSRequestPlugins(plugins, createNextPostCSSResourceHook({ ...policy, ...extra }))).process(root, { from: policy.file })
  console.log(`--- ${label}\n${result.css}\nhistory=${JSON.stringify(root.masterCSSProcessedGlobals)}\nwarnings=${result.warnings().length}`)
  return root
}
// A: authored external definition of --color-late already in the root, plugin adds a reference.
await run('A external authored definition', first.css + ':root{--color-late:#000000}', [{ postcssPlugin: 'ref', Once(root) { root.walkRules('.card', r => r.append({ prop: 'background', value: 'var(--color-late)' })) } }])
// B: two sibling roots sharing the entry history both add the same late reference.
const entryHistory = (await run('B0 entry', first.css, [])).masterCSSProcessedGlobals
await run('B1 sibling one', '.a{color:var(--color-late)}', [], { file: '/audit/a.css', processedGlobals: entryHistory })
await run('B2 sibling two', '.b{color:var(--color-late)}', [], { file: '/audit/b.css', processedGlobals: entryHistory })
// C: unknown late reference (no manifest definition) -> diagnostics?
const r = await compileRenderedStylesheet('/audit/entry.css', '.x{color:var(--missing)}', { baseManifest: first.manifest, emittedGlobals: first.emittedGlobals })
console.log('C unknown ref generated=', JSON.stringify(r.generatedCSS), 'diagnostics=', JSON.stringify(r.diagnostics))
// D: late animation reference via plugin to a keyframes defined in @keyframes (authored) vs theme-managed
await run('D late animation ref', first.css, [{ postcssPlugin: 'anim', Once(root) { root.walkRules('.card', r => r.append({ prop: 'animation', value: 'late var(--anim-late)' })) } }])

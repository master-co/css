// Isolates which nested shapes the directive lowering rejects; see batch 0263.
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
const compiler = await createCompiler({ binding: 'native' })
const baseManifest = { version: 1, utilities: [] }
const cases = {
  'plain nested': '@layer cards{.card{padding:2rem}}\n.after{margin:1px}',
  'utilities at top': '@utilities{paint{padding:2rem}}\n.card{padding:2rem}',
  'utilities in layer': '@layer cards{@utilities{paint{padding:2rem}}\n.card{padding:2rem}}',
  'utilities in media': '@media screen{@utilities{paint{padding:2rem}}\n.card{padding:2rem}}',
  'utilities in supports': '@supports (display: grid){@utilities{paint{padding:2rem}}\n.card{padding:2rem}}',
  'layer only, no utilities': '@layer cards{.card{padding:2rem}\n.card{padding:3rem}}\n.after{margin:1px}',
  'full flatten shape': '@supports (display: grid){@media screen{@layer cards{@utilities{paint{padding:2rem}}\n.card{padding:2rem}\n.card{padding:3rem}}}}\n.after{margin:1px}'
}
for (const [name, source] of Object.entries(cases)) {
  try {
    const result = compiler.compileManifest(source, { from: '/probe/entry.css', baseManifest, preserveNativeCSS: true })
    const utilities = (result.manifest?.utilities ?? []).map(utility => utility.name)
    console.log(`PASS  ${name}  -> utilities=${JSON.stringify(utilities)} css=${JSON.stringify(result.css).slice(0, 90)}`)
  } catch (error) {
    console.log(`FAIL  ${name}  -> ${error.code}: ${String(error.message || error).slice(0, 120)}`)
  }
}

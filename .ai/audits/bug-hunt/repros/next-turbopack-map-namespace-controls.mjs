import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
const pure = JSON.parse(readFileSync(process.env.BH_NEXT_PURE_MAP_EVIDENCE, 'utf8'))
const managed = JSON.parse(readFileSync(process.env.BH_NEXT_HOST_EVIDENCE, 'utf8'))
function sources(evidence) {
  const result = []
  function visit(map) { result.push(...(map.sources ?? []));for (const section of map.sections ?? []) visit(section.map) }
  for (const asset of evidence.stylesheets) if (asset.file.endsWith('.map')) visit(JSON.parse(asset.text))
  return result
}
const pureSources = sources(pure), managedSources = sources(managed)
const duplicated = list => list.filter(source => source.startsWith('turbopack:///turbopack:///') && source.endsWith('/app/card.module.css'))
assert(pure.pureNext && pure.pureLoaderMap, 'Control must disable Master CSS and use an identity map loader')
assert(pure.observations.every(x => x.pass), 'Pure control must render correctly')
assert(managed.observations.every(x => x.pass), 'Managed comparison must render correctly')
assert(duplicated(pureSources).length, 'Duplicated namespace reproduces without Master CSS')
assert(duplicated(managedSources).length, 'Managed path has matching host namespace failure')
const result = { scope: 'Classification control, NOT a passing source-URI contract or repaired host', classification: 'Pure Next Turbopack identity loader reproduces duplicate URI prefix; BH-0053 namespace requirement remains unfinished', pureSources, managedSources, pureBrowserChecks: pure.observations.length, managedBrowserChecks: managed.observations.length, reproducedWithoutMasterCSS: true, repaired: false }
if (process.env.BH_NEXT_NAMESPACE_EVIDENCE) writeFileSync(process.env.BH_NEXT_NAMESPACE_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))

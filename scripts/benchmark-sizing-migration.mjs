// Compare the removed preset dimensions with explicit grouped declarations.
// node scripts/benchmark-sizing-migration.mjs BASELINE_DIRECTORY OUTPUT.json
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync, brotliCompressSync } from 'node:zlib'

const require = createRequire(import.meta.url)
const [baseline, output] = process.argv.slice(2)
if (!baseline || !output) throw new Error('Expected BASELINE_DIRECTORY OUTPUT.json; preserve current-release.node there.')
const classes = ['size:20px', 'min-size:10px', 'max-size:40px', 'size-sm', 'min-size-md', 'max-size-lg']
const migrated = [
  '{width:20px;height:20px}', '{min-width:10px;min-height:10px}', '{max-width:40px;max-height:40px}',
  '{width-sm;height-sm}', '{min-width-md;min-height-md}', '{max-width-lg;max-height-lg}'
]
const sizes = value => {
  const bytes = Buffer.from(value)
  return { raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length, brotli: brotliCompressSync(bytes).length }
}
const results = []
for (const [label, bindingPath, manifestPath, names] of [
  ['before', resolve(baseline, 'mastercss.node'), resolve(baseline, 'preset.json'), classes],
  ['after', resolve(baseline, 'current-release.node'), resolve('packages/preset/src/default-manifest.json'), migrated]
]) {
  const binding = require(bindingPath)
  const renderer = new binding.RenderSession(readFileSync(manifestPath, 'utf8'))
  try {
    renderer.ensureClasses(names)
    const result = JSON.parse(renderer.snapshot())
    results.push({ label, classes: names, classCount: names.length, ruleCount: result.snapshot.rules.length,
      markup: sizes(names.join(' ')), css: sizes(result.snapshot.text), hydration: sizes(JSON.stringify(result.hydrationManifest)) })
  } finally {
    renderer.dispose()
  }
}
writeFileSync(output, JSON.stringify({
  note: 'Payload comparison for six independent examples; not proof of cascade equivalence for competing dimensions.', results
}, null, 2) + '\n')
console.log(results)

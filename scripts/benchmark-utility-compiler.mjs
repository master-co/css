// Compare complete-definition authoring stages using two explicit release artifacts.
// node scripts/benchmark-utility-compiler.mjs OLD_RELEASE_BINDING NEW_RELEASE_BINDING OUTPUT.json
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const [baseline, current, output] = process.argv.slice(2)
if (!output) throw new Error('Expected BASELINE_RELEASE_BINDING CURRENT_RELEASE_BINDING OUTPUT.json')
const sides = [['before', baseline], ['after', current]]
const report = {}

const pair = sides.map(([label, path]) => ({ label, binding: require(path) }))
for (const count of [100, 1000, 5000]) {
  const css = `@utilities{${Array.from({ length: count }, (_, index) => `u${index}{display:block}`).join('')}}`
  for (const side of pair) {
    const parsed = JSON.parse(side.binding.compileCssDirectivesJson(css, '{}'))
    side.request = JSON.stringify({ manifestInput: parsed.manifestInput, nativeOutput: parsed.nativeOutput,
      styleDefinitions: parsed.styleDefinitions ?? [], warnings: parsed.warnings, utilitySources: parsed.utilitySources ?? [] })
    side.samples = { parse: [], lower: [] }
  }
  for (let round = 0; round < 25; round++) {
    for (const side of round % 2 ? [...pair].reverse() : pair) {
      for (const operation of ['parse', 'lower']) {
        const start = performance.now()
        if (operation === 'parse') side.binding.compileCssDirectivesJson(css, '{}')
        else side.binding.lowerCssDirectivesJson(side.request, '{}')
        if (round >= 5) side.samples[operation].push(performance.now() - start)
      }
    }
  }
  for (const side of pair) {
    report[side.label] ??= {}
    report[side.label][count] = { directiveIRBytes: Buffer.byteLength(side.request),
      ...Object.fromEntries(Object.entries(side.samples).map(([operation, samples]) => {
        const ordered = [...samples].sort((a, b) => a - b)
        return [operation, { medianMs: ordered[Math.floor(ordered.length / 2)], p95Ms: ordered[Math.ceil(ordered.length * .95) - 1], samples }]
      })) }
  }
}
report.method = { rounds: 25, warmup: 5, alternatingOrder: true }
writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report))

// Compare complete-definition authoring stages using two explicit release artifacts.
// node scripts/benchmark-utility-compiler.mjs OLD_RELEASE_BINDING NEW_RELEASE_BINDING OUTPUT.json
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const [baseline, current, output] = process.argv.slice(2)
if (!output) throw new Error('Expected BASELINE_RELEASE_BINDING CURRENT_RELEASE_BINDING OUTPUT.json')
const sides = [['before', baseline], ['after', current]]
const report = {}

function measure(operation) {
  for (let index = 0; index < 3; index++) operation()
  const samples = []
  for (let index = 0; index < 9; index++) {
    const start = performance.now()
    operation()
    samples.push(performance.now() - start)
  }
  samples.sort((left, right) => left - right)
  return { medianMs: samples[4], p95Ms: samples[8] }
}

for (const [label, path] of sides) {
  const binding = require(path)
  report[label] = {}
  for (const count of [100, 1000, 5000]) {
    const css = `@utilities{${Array.from({ length: count }, (_, index) => `u${index}{display:block}`).join('')}}`
    const parsed = JSON.parse(binding.compileCssDirectivesJson(css, '{}'))
    const request = JSON.stringify({
      manifestInput: parsed.manifestInput,
      nativeOutput: parsed.nativeOutput,
      styleDefinitions: parsed.styleDefinitions ?? [],
      warnings: parsed.warnings,
      utilitySources: parsed.utilitySources ?? []
    })
    report[label][count] = {
      directiveIRBytes: Buffer.byteLength(request),
      parse: measure(() => binding.compileCssDirectivesJson(css, '{}')),
      lower: measure(() => binding.lowerCssDirectivesJson(request, '{}'))
    }
  }
}
writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report))

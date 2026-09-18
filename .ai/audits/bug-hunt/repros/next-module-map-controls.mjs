import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { SourceMap } from 'node:module'

const evidence = JSON.parse(readFileSync(process.env.BH_NEXT_HOST_EVIDENCE, 'utf8'))
const checks = []
const targets = evidence.moduleKind && !evidence.globalParent ? [['.direct', 'card_direct__', '/app/card.module.css'], ['.composed', 'card_composed__', '/app/card.module.css']] : evidence.globalParent ? [['.direct', 'direct', '/app/globals.css'], ['.composed', 'composed', '/app/globals.css']] : [['.direct', 'direct', '/app/globals.css'], ['.nested', 'nested', '/app/nested/child.css']]
if (evidence.moduleFeature === 'imports') {
  const file = evidence.authoredStylesheets.find(item => /\/imported(?:\.module)?\.css$/.test(item.file))
  const selector = evidence.observations.find(item => item.id === 'retained-import-scope')?.selector
  assert(file && selector, 'Retained child source and selector are required')
  targets.push(['.imported', selector.slice(1), '/' + file.file])
}
for (const [authored, fragment, expectedFile] of targets) {
  try {
    const output = evidence.stylesheets.find(item => item.file.endsWith('.css') && item.text.includes('.' + fragment))
    assert(output, 'scoped CSS must exist')
    const href = output.text.match(/sourceMappingURL=([^\s*]+)/)?.[1]
    assert(href, 'CSS must reference a map')
    const mapPath = new URL(href, 'https://audit.invalid/' + output.file).pathname.slice(1)
    const map = JSON.parse(evidence.stylesheets.find(item => item.file === mapPath).text)
    const before = output.text.slice(0, output.text.indexOf('.' + fragment)).split('\n')
    const position = new SourceMap(map).findEntry(before.length - 1, before.at(-1).length)
    assert(position.originalSource?.endsWith(expectedFile), JSON.stringify(position))
    function content(map) {
      const index = map.sources?.indexOf(position.originalSource)
      if (index >= 0) return map.sourcesContent[index]
      for (const section of map.sections ?? []) { const result = content(section.map); if (result !== undefined) return result }
    }
    const source = evidence.authoredStylesheets?.find(item => '/' + item.file === expectedFile)?.text
    assert(source?.includes(authored), 'independently captured authored input is required')
    assert.equal(content(map), source, 'final map must preserve the complete pre-build authored input')
    const original = source.slice(0, source.indexOf(authored)).split('\n')
    assert.equal(position.originalLine, original.length - 1)
    assert.equal(position.originalColumn, original.at(-1).length)
    checks.push({ authored, pass: true, position })
  } catch (error) { checks.push({ authored, pass: false, error: String(error) }) }
}
const result = { bundler: evidence.bundler, scope: 'Exact selector mappings to authored file, line, column and sourcesContent in actual Next exported CSS', checks, passed: checks.filter(x => x.pass).length, failed: checks.filter(x => !x.pass).length }
if (process.env.BH_NEXT_MAP_EVIDENCE) writeFileSync(process.env.BH_NEXT_MAP_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
process.exitCode = result.failed ? 1 : 0

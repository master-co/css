import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { summarizeDiagnostics } from './diagnostic-summary.mjs'
import { copyRepairInput, treeHashes, digest } from './trials/repair-inputs.mjs'
import { repairSchedule, compareRepairs } from './trials/repair-comparison.mjs'

const element = { tag: 'button', id: 'target', classes: ['h(10)'], values: { height: '10px', 'line-height': '19.2px' }, variables: { '--spacing': '4px' }, animations: [] }
const declaration = (name, value, authored = true) => ({ name, value, authored, parsed: true, disabled: false, important: false, location: authored ? { url: './output.css', line: 3, column: 5 } : null })
const rule = { selector: '#target', origin: 'regular', source: './output.css', layers: ['components'], declarations: [declaration('height', '15px'), declaration('height', '10px'), declaration('height', '10px', false), { ...declaration('font', '16px/1.2 Arial'), longhands: [{ name: 'line-height', value: '1.2' }] }] }
const side = { status: 'captured', element, rules: [rule], layerOrder: { name: '', subLayers: [{ name: 'components', order: 1 }, { name: 'utilities', order: 2 }] }, ancestors: [{ element: { ...element, id: null, tag: 'body' }, rules: [{ ...rule, selector: 'body' }] }] }
const acceptance = {
  checks: ['light-390-rest', 'dark-1280-rest'].map(id => ({ id, kind: 'styling', pass: false, actual: [{ node: 0, property: 'height', actual: '10px', expected: '40px' }, { node: 0, property: 'line-height', actual: '19.2px', expected: '24px' }] })),
  diagnostics: { version: 1, unresolvedClasses: [{ className: 'text-white', matchStatus: 'unmatched', occurrences: [{ id: 'target', selector: '#target' }], diagnostics: [] }], omittedGroups: 2,
    evidence: [{ check: 'light-390-rest', index: 0, selector: 'main *', state: 'rest', width: 390, colorScheme: 'light', source: { ...side, element: { ...element, values: { height: '40px', 'line-height': '24px' } } }, target: side }] }
}

test('summary groups checks, interns references and retains ordered authored declarations and inherited evidence', () => {
  const original = JSON.stringify(acceptance)
  const summary = summarizeDiagnostics(acceptance)
  assert.equal(JSON.stringify(acceptance), original)
  assert.equal(summary.properties.length, 2)
  for (const property of summary.properties) {
    assert.deepEqual(property.differences[0].checks, ['light-390-rest', 'dark-1280-rest'])
    const evidence = property.differences[0].evidence[0]
    assert.equal(evidence.target.rules[0], evidence.source.rules[0])
    assert.equal(summary.elements[evidence.target.element].id, 'target')
    assert.equal(summary.elements[evidence.target.ancestors[0].element].tag, 'body')
    assert.ok(summary.layers[evidence.target.layers])
    const candidate = summary.rules[evidence.target.rules[0]]
    assert.deepEqual(candidate.declarations.filter(item => item.name === 'height').map(item => item.value), ['15px', '10px'])
    assert.deepEqual(candidate.declarations[0].location, { line: 3, column: 5 })
    assert.ok(candidate.declarations.some(item => item.name === 'font' && item.longhands[0].name === 'line-height'))
  }
  assert.equal(Object.keys(summary.rules).length, 2)
  assert.equal(summary.unresolvedClasses[0].className, 'text-white')
  assert.equal(summary.omittedGroups, 2)
  assert.match(summary.limits, /not proven winners/)
})

test('missing and unavailable evidence remains explicit; non-property failures are preserved', () => {
  const input = structuredClone(acceptance)
  input.checks.push({ id: 'keyboard-focus', pass: false, actual: false })
  input.diagnostics.evidence = [{ check: 'light-390-rest', status: 'unavailable', error: 'CDP unavailable' }]
  const summary = summarizeDiagnostics(input)
  assert.deepEqual(summary.properties[0].differences[0].evidence, [])
  assert.equal(summary.unavailableEvidence[0].error, 'CDP unavailable')
  assert.equal(summary.otherChecks[0].id, 'keyboard-focus')
  assert.throws(() => summarizeDiagnostics({ checks: [] }), /version 1/)
})

test('paired copies differ only by their report; command output cannot overwrite an existing file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-repair-input-test-'))
  try {
    const template = join(root, 'seed', 'work')
    await mkdir(template, { recursive: true })
    await writeFile(join(template, 'index.html'), '<button>Unchanged</button>')
    await writeFile(join(template, 'diagnostics.json'), 'old report')
    await writeFile(join(template, 'acceptance.json'), 'old acceptance')
    await symlink('/unused-test-dependencies', join(template, 'node_modules'))
    const inputHashes = await treeHashes(template)
    delete inputHashes['diagnostics.json']; delete inputHashes['acceptance.json']
    const reportHashes = {}
    for (const arm of ['a', 'b']) {
      const text = JSON.stringify(arm === 'a' ? acceptance.diagnostics : summarizeDiagnostics(acceptance))
      await writeFile(join(template, '..', `report-${arm}.json`), text)
      reportHashes[arm] = digest(text)
    }
    const seed = { work: template, inputHash: digest(JSON.stringify(inputHashes)), reportHashes }
    const [a, b] = await Promise.all(['a', 'b'].map(arm => copyRepairInput(seed, join(root, arm), arm)))
    assert.equal(a.inputHash, b.inputHash)
    assert.notEqual(a.reportHash, b.reportHash)
    await assert.rejects(readFile(join(root, 'b', 'acceptance.json')), { code: 'ENOENT' })
    await writeFile(join(template, 'index.html'), 'Changed input')
    await assert.rejects(copyRepairInput(seed, join(root, 'changed'), 'a'), /differs/)
    const input = join(root, 'input.json'), output = join(root, 'summary.json')
    await writeFile(input, JSON.stringify(acceptance))
    execFileSync(process.execPath, ['scripts/ai-authoring/summarize-diagnostics.mjs', input, output])
    assert.equal(JSON.parse(await readFile(output, 'utf8')).format, 'property-summary')
    assert.throws(() => execFileSync(process.execPath, ['scripts/ai-authoring/summarize-diagnostics.mjs', input, output], { stdio: 'pipe' }), /EEXIST/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('repair comparison retains errors and missing usage; rejects incomplete, crossed and mixed pairs', () => {
  const seeds = [{ id: 'seed-01', inputHash: 'same', promptHash: 'prompt', reportHashes: { a: 'full', b: 'compact' } }, { id: 'seed-02', inputHash: 'same-2', promptHash: 'prompt', reportHashes: { a: 'full-2', b: 'compact-2' } }]
  const models = ['model-one', 'model-two'], schedule = repairSchedule(seeds, models)
  assert.equal(schedule.length, 8)
  assert.deepEqual(schedule.slice(0, 4).map(item => item.arm), ['a', 'b', 'b', 'a'])
  const protocol = { hash: 'protocol', schedule, seeds, models, mode: 'test', revision: 'test' }
  const rows = schedule.map(item => ({ ...item, protocolHash: protocol.hash, inputHash: seeds.find(seed => seed.id === item.seed).inputHash, promptHash: 'prompt',
    reportHash: seeds.find(seed => seed.id === item.seed).reportHashes[item.arm], passed: item.arm === 'b', inputTokens: item.arm === 'a' ? null : 100, cachedInputTokens: item.arm === 'a' ? null : 80, outputTokens: item.arm === 'a' ? null : 10, modelDurationMs: 1000, reportRead: true, invalidClasses: 0, cliSuggestions: 1, cliErrors: 0, execution: { failed: item.arm === 'a' } }))
  const report = compareRepairs(protocol, rows)
  assert.equal(report.pairs.compactWins, 4)
  assert.equal(report.arms.a.unmeasuredUsage, 4)
  assert.equal(report.arms.a.executionErrors, 4)
  assert.throws(() => compareRepairs(protocol, rows.slice(1)), /Incomplete/)
  assert.throws(() => compareRepairs(protocol, [...rows, rows[0]]), /duplicate/)
  for (const patch of [{ inputHash: 'other' }, { promptHash: 'other' }, { reportHash: 'other' }, { cachedInputTokens: 10 }]) assert.throws(() => compareRepairs(protocol, [{ ...rows[0], ...patch }, ...rows.slice(1)]))
})

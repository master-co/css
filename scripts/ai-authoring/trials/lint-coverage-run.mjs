import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, writeFile, readFile, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir, userInfo } from 'node:os'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createMasterCSSMCPServer } from '../../../packages/mcp/dist/index.js'
import { repository } from './control.mjs'
import { digest, treeHashes } from './repair-inputs.mjs'
import { invoke, modelArguments } from './invoke.mjs'
import { assessLintCoverage } from './lint-coverage.mjs'

const root = await realpath(await mkdtemp(join(tmpdir(), 'master-lint-coverage-')))
const fixtures = join(root, 'fixtures'), calls = join(root, 'calls'), cacheRoot = join(userInfo().homedir, '.cache/mastercss')
for (const folder of [fixtures, calls, cacheRoot]) await mkdir(folder, { recursive: true })
const sourceHashes = await treeHashes(join(repository, 'scripts/ai-authoring'))
const artifactHashes = {}
for (const owner of ['cli', 'mcp', 'tooling', 'compiler', 'binding', 'preset', 'css', 'schema', 'internal', 'engine-js', 'language-service']) {
  const directory = `packages/${owner}/${owner === 'preset' ? 'src' : 'dist'}`
  for (const [file, hash] of Object.entries(await treeHashes(join(repository, directory)))) artifactHashes[`${directory}/${file}`] = hash
}
for (const file of ['bun.lock', 'packages/binding/artifacts/mastercss.node', 'packages/css/src/index.css']) artifactHashes[file] = digest(await readFile(join(repository, file)))
const common = modelArguments.map(value => value === 'workspace-write' ? 'read-only' : value)
const protocol = { version: 1, revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), model: 'gpt-6-luna', modelArguments: common,
  client: execFileSync('codex', ['--version'], { encoding: 'utf8' }).trim(), timeoutMs: 120000, repeats: 2, concurrency: 1,
  sourceHashes, artifactHashes, design: 'Eight real CLI/MCP report scenarios, two fresh independent report-only interpretations each; no tools, hints, retries or repair feedback. Exact structured fields plus manual prose review. Not a repair benchmark or A/B improvement estimate.' }
async function verifyEnvironment() {
  if (JSON.stringify(await treeHashes(join(repository, 'scripts/ai-authoring'))) !== JSON.stringify(sourceHashes)) throw Error('Evaluation sources changed')
  for (const [file, hash] of Object.entries(artifactHashes)) if (digest(await readFile(join(repository, file))) !== hash) throw Error('Artifact changed: ' + file)
}
const cases = []
const expected = (checkedPaths, filesWithDiagnostics, sourceCheck = 'complete', hasErrors = false) => ({ checkedFiles: checkedPaths.length, filesWithDiagnostics, checkedPaths, sourceCheck, hasErrors, browserVerified: false, wholeProjectVerified: false })
async function fixture(name, files) {
  const work = join(fixtures, name)
  await mkdir(work)
  for (const [file, content] of Object.entries(files)) await writeFile(join(work, file), content)
  return work
}
function canonical(value, work) { return JSON.parse(JSON.stringify(value).replaceAll(work + '/', './').replaceAll(work, '.')) }
function cli(work, args, input) {
  const result = spawnSync(process.execPath, [join(repository, 'packages/cli/dist/bin/index.js'), 'lint', ...args], { cwd: work, encoding: 'utf8', input, maxBuffer: 8 * 1024 * 1024 })
  if (result.error || ![0, 1].includes(result.status)) throw Error('CLI execution failed: ' + result.stderr)
  return { command: ['master-css', 'lint', ...args], exitCode: result.status, report: canonical(JSON.parse(result.stdout), work) }
}
const clean = '<div class="block"></div>', bad = '<div class="(padding:red)"></div>'
for (const [id, files, args, input, want] of [
  ['clean', { 'clean.html': clean }, ['clean.html'], undefined, expected(['./clean.html'], 0)],
  ['mixed', { 'clean.html': clean, 'bad.html': bad }, ['*.html'], undefined, expected(['./clean.html', './bad.html'], 1, 'complete', true)],
  ['no-inputs', { 'clean.html': clean }, ['missing/*.html'], undefined, expected([], 0, 'no-inputs')],
  ['manifest-blocked', { 'clean.html': clean, 'index.css': '@import "@master/css"; .btn { @contents; }' }, ['clean.html'], undefined, expected([], 0, 'not-run', true)],
  ['stdin', {}, ['--stdin', '--stdin-filepath', 'unsaved.html'], clean, expected(['./unsaved.html'], 0)],
  ['fixed', { 'fixed.html': '<div class="fg-white (margin:0.5rem)"></div>' }, ['--fix', 'fixed.html'], undefined, expected(['./fixed.html'], 0)]
]) {
  const work = await fixture(id, files), observation = cli(work, args, input)
  cases.push({ id, observation, expected: want })
}
const mcpWork = await fixture('mcp', { 'clean.html': clean })
const server = createMasterCSSMCPServer({ root: mcpWork }), client = new Client({ name: 'lint-coverage-evaluation', version: '1' }, { capabilities: {} })
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
try {
  for (const [id, name, args, want] of [
    ['mcp-project', 'mastercss_lint_project', { context: 'preset', patterns: ['clean.html'] }, expected(['./clean.html'], 0)],
    ['mcp-buffer', 'mastercss_lint_content', { context: 'preset', filePath: 'unsaved.html', content: clean }, expected(['./unsaved.html'], 0)]
  ]) {
    const result = await client.callTool({ name, arguments: args })
    if (result.isError) throw Error('MCP fixture failed')
    const text = JSON.parse(result.content.find(block => block.type === 'text').text)
    if (JSON.stringify(text) !== JSON.stringify(result.structuredContent)) throw Error('MCP text/structured payload differs')
    cases.push({ id, observation: { tool: name, arguments: args, report: canonical(text, mcpWork) }, expected: want })
  }
} finally { await client.close(); await server.dispose() }
// Assert report fixtures against independently specified input coverage before spending model calls.
for (const item of cases) {
  const report = item.observation.report.result?.data ?? item.observation.report
  const actual = { ...item.expected, checkedFiles: report.summary.checkedFiles, filesWithDiagnostics: report.summary.filesWithDiagnostics,
    checkedPaths: report.coverage.checkedFiles, sourceCheck: report.coverage.status, hasErrors: report.summary.errors > 0, explanation: 'Fixture preflight' }
  if (!assessLintCoverage(JSON.stringify(actual), item.expected).passed) throw Error('Fixture mismatch: ' + item.id)
}
protocol.cases = cases.map(item => ({ id: item.id, observationHash: digest(JSON.stringify(item.observation)), expected: item.expected }))
protocol.hash = digest(JSON.stringify(protocol))
await writeFile(join(root, 'protocol.json'), JSON.stringify(protocol, null, 2))
await writeFile(join(root, 'cases.json'), JSON.stringify(cases, null, 2))
console.log(JSON.stringify({ root, cases: cases.length, calls: cases.length * protocol.repeats }))
if (process.argv.includes('--prepare-only')) process.exit(0)
const rows = []
try {
  campaign: for (let repeat = 0; repeat < protocol.repeats; repeat++) for (const item of cases) {
    await verifyEnvironment()
    const id = `${item.id}-${repeat}`, folder = join(calls, id), work = join(folder, 'work')
    await mkdir(work, { recursive: true })
    const prompt = 'Interpret the actual Master CSS lint output below. Do not use tools or inspect other files. Return only one JSON object with checkedFiles (number), filesWithDiagnostics (number), checkedPaths (array of paths as shown), sourceCheck (complete, no-inputs, not-run, or unknown), hasErrors (boolean), browserVerified (boolean), wholeProjectVerified (boolean), and explanation (a concise factual summary of what ran, any problems, and what this does or does not verify). Do not infer checks beyond the evidence.\n' + JSON.stringify(item.observation)
    const execution = await invoke({ work, model: protocol.model, prompt, folder, attempt: 0, arm: 'report-only', common, cacheRoot, repository, timeoutMs: protocol.timeoutMs })
    const events = (await readFile(join(folder, 'attempt-0.events.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse)
    const answer = events.findLast(event => event.type === 'item.completed' && event.item?.type === 'agent_message')?.item.text ?? ''
    const assessment = assessLintCoverage(answer, item.expected)
    const row = { id, repeat, case: item.id, protocolHash: protocol.hash, status: execution.failed || execution.hostSkillRead || execution.toolCalls ? 'unverified' : assessment.passed ? 'passed' : 'failed', assessment, execution }
    rows.push(row)
    await writeFile(join(folder, 'result.json'), JSON.stringify(row, null, 2))
    await verifyEnvironment()
    console.log(JSON.stringify({ completed: rows.length, id, status: row.status, failures: assessment.failures }))
    if (row.status === 'unverified') break campaign
  }
} finally {
  await writeFile(join(root, 'observations.jsonl'), rows.map(row => JSON.stringify(row)).join('\n') + '\n')
  const usage = rows.map(row => row.execution.usage)
  const summary = { expected: cases.length * protocol.repeats, completed: rows.length, passed: rows.filter(r => r.status === 'passed').length, failed: rows.filter(r => r.status === 'failed').length, unverified: rows.filter(r => r.status === 'unverified').length,
    inputTokens: usage.every(Boolean) ? usage.reduce((n,u) => n + u.input_tokens, 0) : null,
    cachedInputTokens: usage.every(Boolean) ? usage.reduce((n,u) => n + u.cached_input_tokens, 0) : null,
    outputTokens: usage.every(Boolean) ? usage.reduce((n,u) => n + u.output_tokens, 0) : null }
  await writeFile(join(root, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify({ root, ...summary }))
}

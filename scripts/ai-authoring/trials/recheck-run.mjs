import { parseArgs } from 'node:util'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, readdir, mkdir, mkdtemp, cp, symlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir, userInfo } from 'node:os'
import { chromium } from '@playwright/test'
import { repository } from './control.mjs'
import { digest, treeHashes } from './repair-inputs.mjs'
import { invoke, modelArguments } from './invoke.mjs'
import { repairCheckpoint, verifiedRepairLoop } from './repair-checkpoint.mjs'

const { values } = parseArgs({ options: { source: { type: 'string' }, attempts: { type: 'string', default: '2' } } })
if (!values.source) throw new Error('Usage: node --import tsx scripts/ai-authoring/trials/recheck-run.mjs --source NAVIGATION_RUN [--attempts 2]')
const source = resolve(values.source), maxAttempts = Number(values.attempts)
if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3) throw new Error('Expected 1 to 3 attempts')
const sourceProtocol = JSON.parse(await readFile(join(source, 'protocol.json'), 'utf8'))
if (sourceProtocol.presentation !== 'navigation' || sourceProtocol.mode !== 'formal') throw new Error('Expected completed formal navigation campaign')
const rows = await Promise.all((await readdir(source)).filter(f => f.endsWith('.result.json')).sort().map(async f => JSON.parse(await readFile(join(source, f), 'utf8'))))
if (rows.length !== sourceProtocol.schedule.length || new Set(rows.map(r => r.id)).size !== rows.length || rows.some(r => !sourceProtocol.schedule.some(s => s.id === r.id))) throw new Error('Incomplete source campaign')
const selected = []
for (const row of rows) {
  const bytes = await readFile(join(source, row.id, 'acceptance.json')), assessment = JSON.parse(bytes)
  const relevant = assessment.checks.filter(c => !c.pass && Array.isArray(c.actual) && c.actual.some(d => d.property === 'line-height' || /hover$/.test(c.id) && d.property === 'background-color'))
  if (row.passed || !relevant.length) continue
  if (row.execution.failed || row.violations.length) throw new Error('Source execution did not complete cleanly')
  selected.push({ id: row.id, task: row.task, model: row.model, seed: row.seed, sourceAssessmentHash: digest(bytes), failedChecks: relevant.map(c => c.id) })
}
if (!selected.length) throw new Error('No eligible hover/inheritance failures')
const root = await mkdtemp(join(tmpdir(), 'master-recheck-')), cacheRoot = join(userInfo().homedir, '.cache/mastercss')
await mkdir(cacheRoot, { recursive: true })
const sourceHashes = await treeHashes(join(repository, 'scripts/ai-authoring'))
const artifactHashes = sourceProtocol.artifactHashes
async function verifyEnvironment() {
  if (JSON.stringify(await treeHashes(join(repository, 'scripts/ai-authoring'))) !== JSON.stringify(sourceHashes)) throw new Error('Runner sources changed')
  for (const [file, hash] of Object.entries(artifactHashes)) if (digest(await readFile(join(repository, file))) !== hash) throw new Error('Tool artifact changed: ' + file)
}
await verifyEnvironment()
const browser = await chromium.launch(), results = []
const protocol = { version: 1, revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), source, sourceProtocolHash: digest(await readFile(join(source, 'protocol.json'))),
  sourceHashes, artifactHashes, client: execFileSync('codex', ['--version'], { encoding: 'utf8' }).trim(), browser: browser.version(), browserHash: digest(await readFile(chromium.executablePath())),
  selected, maxAttempts, timeoutMs: 120000, concurrency: 1, modelArguments,
  design: 'Every completed prior navigation trial failing line-height or hover background. Fresh host check before and after every repair, up to the fixed attempt budget. Same originating model, official skill and CLI. No model history. This is a failure-conditioned repair demonstration, not a causal A/B comparison. No old verdicts are modified.' }
protocol.hash = digest(JSON.stringify(protocol))
await writeFile(join(root, 'protocol.json'), JSON.stringify(protocol, null, 2))
console.log(JSON.stringify({ root, selected: selected.length, maxAttempts }))
try {
  for (const item of selected) {
    const folder = join(root, item.id), work = join(folder, 'work'), baseline = join(folder, 'baseline')
    await mkdir(work, { recursive: true })
    const original = join(source, item.id, 'final.work'), seed = JSON.parse(await readFile(join(source, 'seeds', item.seed, 'seed.json'), 'utf8'))
    await cp(join(source, 'seeds', item.seed, 'baseline'), baseline, { recursive: true })
    for (const file of ['index.html', 'app.css', 'app.js', 'build.mjs', 'package.json', 'master-css.mjs', ...(await readdir(baseline)).filter(f => f.startsWith('source'))]) await cp(join(original, file), join(work, file))
    await cp(join(original, '.agents'), join(work, '.agents'), { recursive: true })
    await symlink(join(repository, 'node_modules'), join(work, 'node_modules'), 'dir')
    const input = await treeHashes(work), baselineHashes = await treeHashes(baseline)
    const protectedFiles = Object.keys(input).filter(file => !['index.html', 'app.css', 'app.js'].includes(file))
    await writeFile(join(folder, 'input-hashes.json'), JSON.stringify(input, null, 2))
    let reportHashes = {}
    const result = await verifiedRepairLoop({ maxAttempts,
      checkpoint: options => repairCheckpoint({ work, task: item.task, browser, repository, baseline, answer: 'Retained reset CSS.', ...options }),
      repair: async ({ previous, attempt }) => {
        const prompt = seed.prompt + '\n\nHOST RECHECK WORKFLOW: This is a repair of a previously failed candidate. Read repair-feedback.json and diagnostics.json; both describe the current source hash below. Do not launch a browser: the host will rebuild and run the complete browser checks when you finish. Build/lint alone cannot confirm a repair. Fix the reported failures without weakening unaffected states, then return your changes and limitations. Do not edit feedback/evidence or protected files. There are at most ' + maxAttempts + ' fresh repair attempts; this is attempt ' + (attempt + 1) + '.\nCURRENT CHECKPOINT: ' + JSON.stringify({ ...previous, assessment: undefined })
        const run = await invoke({ work, model: item.model, prompt, folder, attempt, arm: 'skill-cli', common: modelArguments, cacheRoot, repository, timeoutMs: 120000 })
        const after = await treeHashes(work)
        run.violations = protectedFiles.filter(file => after[file] !== input[file])
        if (JSON.stringify(await treeHashes(baseline)) !== JSON.stringify(baselineHashes)) run.violations.push('../baseline')
        for (const [file, hash] of Object.entries(reportHashes)) if (after[file] !== hash) run.violations.push(file)
        await verifyEnvironment()
        return run
      },
      record: async ({ checkpoint, execution, attempt }) => {
        if (checkpoint.sequence === 0 && checkpoint.status !== 'failed') throw new Error('Prior failure did not reproduce: ' + item.id)
        await writeFile(join(folder, `checkpoint-${checkpoint.sequence}.json`), JSON.stringify(checkpoint, null, 2))
        // Keep source and generated output for each host verdict, not only the final answer.
        await cp(work, join(folder, `checkpoint-${checkpoint.sequence}.work`), { recursive: true, verbatimSymlinks: true })
        if (execution) await writeFile(join(folder, `attempt-${attempt}.execution.json`), JSON.stringify(execution, null, 2))
        reportHashes = Object.fromEntries(await Promise.all(['repair-feedback.json', 'diagnostics.json', '.diagnostic-evidence.json'].map(async file => [file, digest(await readFile(join(work, file)))])))
        console.log(JSON.stringify({ id: item.id, checkpoint: checkpoint.sequence, status: checkpoint.status, failures: checkpoint.failedChecks.length, newFailures: checkpoint.newFailingChecks }))
      }
    })
    const measured = result.attempts.every(a => a.usage)
    const row = { ...item, protocolHash: protocol.hash, status: result.status, exhausted: result.exhausted, attempts: result.attempts.length,
      inputTokens: measured ? result.attempts.reduce((n, a) => n + a.usage.input_tokens, 0) : null,
      cachedInputTokens: measured ? result.attempts.reduce((n, a) => n + a.usage.cached_input_tokens, 0) : null,
      outputTokens: measured ? result.attempts.reduce((n, a) => n + a.usage.output_tokens, 0) : null,
      checkpoints: result.checkpoints.map(c => ({ sequence: c.sequence, sourceHash: c.sourceHash, status: c.status, failedChecks: c.failedChecks.map(f => f.id), resolved: c.resolvedChecks, regressions: c.newFailingChecks })) }
    results.push(row)
    await writeFile(join(root, item.id + '.result.json'), JSON.stringify(row, null, 2))
  }
} finally {
  await browser.close()
  await writeFile(join(root, 'observations.jsonl'), results.map(r => JSON.stringify(r)).join('\n') + '\n')
  console.log(JSON.stringify({ root, completed: results.length, passed: results.filter(r => r.status === 'passed').length }))
}

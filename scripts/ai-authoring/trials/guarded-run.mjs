import { parseArgs } from 'node:util'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, readdir, mkdir, mkdtemp, cp, symlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir, userInfo } from 'node:os'
import { chromium } from '@playwright/test'
import { repository } from './control.mjs'
import { digest, treeHashes } from './repair-inputs.mjs'
import { repairCheckpoint } from './repair-checkpoint.mjs'
import { compareRepairCandidate, guardedRepairLoop } from './repair-regression.mjs'
import { invoke, modelArguments } from './invoke.mjs'

const { values } = parseArgs({ options: { source: { type: 'string' }, case: { type: 'string' }, attempts: { type: 'string', default: '2' }, 'replay-only': { type: 'boolean', default: false } } })
if (!values.source || !values.case) throw new Error('Usage: node --import tsx scripts/ai-authoring/trials/guarded-run.mjs --source RECHECK_RUN --case TRIAL_ID [--attempts 2] [--replay-only]')
const source = resolve(values.source), maxAttempts = values['replay-only'] ? 0 : Number(values.attempts)
if (!Number.isInteger(maxAttempts) || maxAttempts < 0 || maxAttempts > 3) throw new Error('Expected 0 to 3 attempts')
const oldProtocol = JSON.parse(await readFile(join(source, 'protocol.json'), 'utf8'))
const item = oldProtocol.selected?.find(row => row.id === values.case)
if (!item) throw new Error('Case is not in source protocol')
const oldResult = JSON.parse(await readFile(join(source, item.id + '.result.json'), 'utf8'))
if (oldResult.status !== 'failed' || !oldResult.exhausted) throw new Error('Expected an exhausted failed recheck case')
const root = await mkdtemp(join(tmpdir(), 'master-guarded-')), baseline = join(root, 'baseline'), cacheRoot = join(userInfo().homedir, '.cache/mastercss')
const oldFolder = join(source, item.id)
await cp(join(oldFolder, 'baseline'), baseline, { recursive: true })
await mkdir(cacheRoot, { recursive: true })
const baselineHashes = await treeHashes(baseline)
const sourceHashes = await treeHashes(join(repository, 'scripts/ai-authoring'))
const artifactHashes = Object.fromEntries(await Promise.all(Object.keys(oldProtocol.artifactHashes).map(async file => [file, digest(await readFile(join(repository, file)))])))
const artifactChanges = Object.keys(artifactHashes).filter(file => artifactHashes[file] !== oldProtocol.artifactHashes[file]).map(file => ({ file, previous: oldProtocol.artifactHashes[file], current: artifactHashes[file] }))
for (const file of ['trials/check.mjs', 'color-comparison.mjs']) if (sourceHashes[file] !== oldProtocol.sourceHashes[file]) throw new Error('Source scorer changed')
async function verifyEnvironment() {
  if (JSON.stringify(await treeHashes(join(repository, 'scripts/ai-authoring'))) !== JSON.stringify(sourceHashes)) throw new Error('Runner sources changed')
  for (const [file, hash] of Object.entries(artifactHashes)) if (digest(await readFile(join(repository, file))) !== hash) throw new Error('Tool artifact changed: ' + file)
  if (JSON.stringify(await treeHashes(baseline)) !== JSON.stringify(baselineHashes)) throw new Error('Baseline changed')
}
async function copyOriginal(sequence, work) {
  const original = join(oldFolder, `checkpoint-${sequence}.work`)
  await mkdir(work, { recursive: true })
  for (const file of ['index.html', 'app.css', 'app.js', 'build.mjs', 'package.json', 'master-css.mjs', ...(await readdir(baseline)).filter(f => f.startsWith('source'))]) await cp(join(original, file), join(work, file))
  await cp(join(original, '.agents'), join(work, '.agents'), { recursive: true })
  await symlink(join(repository, 'node_modules'), join(work, 'node_modules'), 'dir')
}
function sourceDiff(left, right) {
  let result = ''
  for (const file of ['index.html', 'app.css', 'app.js']) {
    try { result += execFileSync('git', ['diff', '--no-index', '--', join(left, file), join(right, file)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }
    catch (error) { if (error.status !== 1) throw error; result += error.stdout }
  }
  return result.split(left + '/').join('retained/').split(right + '/').join('candidate/')
}
const browser = await chromium.launch()
const protocol = { version: 1, mode: values['replay-only'] ? 'replay' : 'targeted', revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  source, case: item, sourceProtocolHash: digest(await readFile(join(source, 'protocol.json'))), sourceResultHash: digest(await readFile(join(source, item.id + '.result.json'))),
  sourceHashes, artifactHashes, artifactChanges, baselineHashes, maxAttempts, timeoutMs: 120000, model: item.model, modelArguments,
  client: execFileSync('codex', ['--version'], { encoding: 'utf8' }).trim(), browser: browser.version(), browserHash: digest(await readFile(chromium.executablePath())),
  design: 'Replay archived regressions and propose isolated repairs from the same original failed checkpoint. Adopt only a strict subset of measured failures with unchanged coverage/expectations and no new failures. Rejections retain source and evidence and are disclosed to the next attempt. Single targeted case; not an A/B benchmark.' }
protocol.hash = digest(JSON.stringify(protocol))
await writeFile(join(root, 'protocol.json'), JSON.stringify(protocol, null, 2))
console.log(JSON.stringify({ root, case: item.id, maxAttempts }))
try {
  await verifyEnvironment()
  const initialWork = join(root, 'initial.work')
  await copyOriginal(0, initialWork)
  const initialCheckpoint = await repairCheckpoint({ work: initialWork, task: item.task, browser, repository, baseline, answer: 'Retained reset CSS.', sequence: 0 })
  if (initialCheckpoint.status !== 'failed') throw new Error('Original failure did not reproduce')
  await writeFile(join(root, 'initial.json'), JSON.stringify(initialCheckpoint, null, 2))
  // Evaluate historical proposals against the retained original, not a worsening predecessor.
  const replays = []
  for (let sequence = 1; sequence < oldResult.checkpoints.length; sequence++) {
    const work = join(root, `replay-${sequence}.work`)
    await copyOriginal(sequence, work)
    const checkpoint = await repairCheckpoint({ work, task: item.task, browser, repository, baseline, answer: 'Retained reset CSS.', sequence, previous: initialCheckpoint })
    const decision = compareRepairCandidate(initialCheckpoint, checkpoint)
    replays.push({ sequence, checkpoint, decision })
    await writeFile(join(root, `replay-${sequence}.json`), JSON.stringify(replays.at(-1), null, 2))
    console.log(JSON.stringify({ replay: sequence, status: checkpoint.status, decision: decision.reason, regressions: decision.regressions.length }))
  }
  const seed = JSON.parse(await readFile(join(oldProtocol.source, 'seeds', item.seed, 'seed.json'), 'utf8'))
  const result = await guardedRepairLoop({ initial: { snapshot: initialWork, checkpoint: initialCheckpoint }, maxAttempts,
    propose: async ({ accepted, attempt, lastRejection }) => {
      const folder = join(root, `attempt-${attempt}`), work = join(folder, 'work')
      await mkdir(folder)
      const parentHashes = await treeHashes(accepted.snapshot)
      await cp(accepted.snapshot, work, { recursive: true, verbatimSymlinks: true })
      const input = await treeHashes(work)
      if (JSON.stringify(input) !== JSON.stringify(parentHashes)) throw new Error('Proposal copy differs from retained snapshot')
      await writeFile(join(folder, 'input-hashes.json'), JSON.stringify(input, null, 2))
      const rejection = lastRejection ? { ...lastRejection, diff: lastRejection.diff?.slice(0, 16000), diffTruncated: lastRejection.diff?.length > 16000 } : null
      const prompt = seed.prompt + '\n\nGUARDED REPAIR: You are editing an isolated proposal copied from the retained checkpoint, not from a rejected proposal. Make a small correction to the current implementation; source.html is a behavioral reference, not replacement markup. Preserve working utility spellings, reset, geometry and all passing states. A hover-only change must not replace the resting value or touch behavior. Do not clean up unrelated code. The host will rebuild and run all browser/class checks. Do not launch a browser or edit reports/protected files. Proposals introducing any new failing property, class or check are rejected even if other checks improve. Attempts without measured progress are also rejected. After rejection, the next attempt starts from retained sources. Read repair-feedback.json and diagnostics.json.\nRETAINED CHECKPOINT: ' + JSON.stringify({ ...accepted.checkpoint, assessment: undefined }) + '\nPREVIOUS REJECTION: ' + JSON.stringify(rejection)
      const execution = await invoke({ work, model: item.model, prompt, folder, attempt: 0, arm: 'skill-cli', common: modelArguments, cacheRoot, repository, timeoutMs: 120000 })
      const after = await treeHashes(work)
      execution.violations = Object.keys(input).filter(file => file === 'node_modules' || file.startsWith('.agents/') || file.startsWith('source') || ['build.mjs', 'package.json', 'master-css.mjs', 'diagnostics.json', '.diagnostic-evidence.json', 'repair-feedback.json'].includes(file)).filter(file => after[file] !== input[file])
      if (JSON.stringify(await treeHashes(accepted.snapshot)) !== JSON.stringify(parentHashes)) execution.violations.push('retained-snapshot')
      await verifyEnvironment()
      const diff = sourceDiff(accepted.snapshot, work)
      const checkpoint = await repairCheckpoint({ work, task: item.task, browser, repository, baseline, answer: execution.answer, previous: accepted.checkpoint, sequence: attempt + 1, execution })
      await writeFile(join(folder, 'source.diff'), diff)
      await writeFile(join(folder, 'checkpoint.json'), JSON.stringify(checkpoint, null, 2))
      await writeFile(join(folder, 'execution.json'), JSON.stringify(execution, null, 2))
      return { snapshot: work, checkpoint, diff, execution }
    },
    record: async proposal => {
      await writeFile(join(root, `attempt-${proposal.attempt}`, 'decision.json'), JSON.stringify({ parentSourceHash: proposal.parentSourceHash, candidateSourceHash: proposal.candidate.checkpoint.sourceHash, ...proposal.decision }, null, 2))
      console.log(JSON.stringify({ attempt: proposal.attempt, status: proposal.candidate.checkpoint.status, decision: proposal.decision.reason, adopted: proposal.decision.adopt, regressions: proposal.decision.regressions.length }))
    }
  })
  await verifyEnvironment()
  await cp(result.accepted.snapshot, join(root, 'retained.work'), { recursive: true, verbatimSymlinks: true })
  const runs = result.proposals.map(p => p.candidate.execution), measured = runs.every(r => r.usage)
  const report = { protocolHash: protocol.hash, status: result.status, retainedStatus: result.retainedStatus, exhausted: result.exhausted, retainedSourceHash: result.accepted.checkpoint.sourceHash,
    attempts: runs.length, rejected: result.proposals.filter(p => !p.decision.adopt).length, replays: replays.map(r => ({ sequence: r.sequence, decision: r.decision })),
    proposals: result.proposals.map(p => ({ attempt: p.attempt, parentSourceHash: p.parentSourceHash, candidateSourceHash: p.candidate.checkpoint.sourceHash, decision: p.decision })),
    inputTokens: measured ? runs.reduce((n, r) => n + r.usage.input_tokens, 0) : null, cachedInputTokens: measured ? runs.reduce((n, r) => n + r.usage.cached_input_tokens, 0) : null, outputTokens: measured ? runs.reduce((n, r) => n + r.usage.output_tokens, 0) : null }
  await writeFile(join(root, 'result.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ root, status: result.status, attempts: runs.length, rejected: report.rejected }))
} finally { await browser.close() }

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { check } from './check.mjs'
import { digest } from './repair-inputs.mjs'
import { repairCompletion } from './repair-completion.mjs'

export async function editableHashes(work) {
  return Object.fromEntries(await Promise.all(['index.html', 'app.css', 'app.js'].map(async file => [file, await readFile(join(work, file)).then(digest, error => { if (error.code === 'ENOENT') return null; throw error })])))
}

export function checkpointStatus(verdict) {
  if (!verdict || verdict.browser === 'not-checked' || verdict.colorComparison?.error || verdict.checks?.some(c => ['checker-error', 'browser-check'].includes(c.id))) return 'unverified'
  if (!Array.isArray(verdict.checks) || !verdict.checks.length) return 'unverified'
  return verdict.functional && verdict.styling && verdict.accessibility && verdict.browser === 'passed' && !verdict.buildError && verdict.checks.every(c => c.pass) ? 'passed' : 'failed'
}

/** Host-owned validation after each edit: refresh evidence, never infer success from a model answer. */
export async function repairCheckpoint({ work, task, browser, repository, baseline, answer = '', sequence = 0, previous, execution, checker = check }) {
  const before = await editableHashes(work)
  let assessment
  try { assessment = await checker(work, task, browser, repository, answer, baseline, { includeDiagnostics: true }) }
  catch (error) { assessment = { browser: 'not-checked', checks: [{ id: 'checker-error', pass: false, actual: error.message }] } }
  const after = await editableHashes(work)
  let status = checkpointStatus(assessment)
  const executionError = Boolean(execution?.failed || execution?.hostSkillRead || execution?.violations?.length)
  if (executionError || Object.values(before).includes(null) || Object.values(after).includes(null)) status = 'unverified'
  if (JSON.stringify(before) !== JSON.stringify(after)) status = 'unverified'
  const failed = assessment.checks.filter(c => !c.pass)
  const previousFailures = previous?.failedChecks ?? []
  const feedback = {
    version: 1, sequence, status, executionError, sourceHashes: after, sourceHash: digest(JSON.stringify(after)),
    generatedCSSHash: await readFile(join(work, 'output.css')).then(digest, () => null),
    failedChecks: failed,
    resolvedChecks: previousFailures.filter(c => assessment.checks.some(now => now.id === c.id && now.pass)).map(c => c.id),
    newFailingChecks: previous ? failed.filter(c => !previousFailures.some(old => old.id === c.id)).map(c => c.id) : [],
    focus: [
      ...(failed.some(c => /hover/.test(c.id)) ? ['Recheck hover in both viewports/themes and touch. Compare the hovered declaration with resting utilities and layer order; selector specificity alone does not cross layer priority. Preserve the hover capability condition.'] : []),
      ...(failed.some(c => Array.isArray(c.actual) && c.actual.some(d => d.property === 'line-height')) ? ['Trace computed line-height through the nearest ancestors and font shorthands. A declaration on html does not replace a value specified on body or a closer ancestor. Verify resulting geometry and form controls.'] : [])
    ],
    scope: 'Host rebuilt current source and ran the complete task checks, including unaffected checks. This result belongs only to sourceHash. Old reports, build/lint success and model claims do not verify subsequent edits.',
    ...(JSON.stringify(before) !== JSON.stringify(after) ? { error: 'Source changed during validation' } : {})
  }
  feedback.completion = repairCompletion({ ...feedback, assessment })
  // All entry points now describe this checkpoint, including optional expansions.
  let serialized = JSON.stringify(assessment)
  for (const directory of [work, baseline]) if (directory) for (const prefix of [pathToFileURL(directory).href + '/', directory + '/']) serialized = serialized.split(prefix).join('./')
  const canonical = JSON.parse(serialized)
  await writeFile(join(work, '.diagnostic-evidence.json'), JSON.stringify(canonical, null, 2) + '\n')
  await writeFile(join(work, 'diagnostics.json'), JSON.stringify(canonical.diagnostics ?? { version: 1, status: 'unavailable', evidence: [], reason: 'Checkpoint has no captured browser evidence' }, null, 2) + '\n')
  await writeFile(join(work, 'repair-feedback.json'), JSON.stringify(feedback, null, 2) + '\n')
  return { ...feedback, assessment }
}

export async function verifiedRepairLoop({ checkpoint, repair, record = async () => {}, maxAttempts = 2 }) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 0 || maxAttempts > 3) throw new Error('Expected 0 to 3 repair attempts')
  const checkpoints = [await checkpoint({ sequence: 0 })], attempts = []
  await record({ checkpoint: checkpoints[0] })
  while (checkpoints.at(-1).status === 'failed' && attempts.length < maxAttempts) {
    const previous = checkpoints.at(-1), attempt = attempts.length
    const execution = await repair({ previous, attempt })
    attempts.push(execution)
    const current = await checkpoint({ sequence: attempt + 1, previous, answer: execution.answer, execution })
    // A timed-out/failed model turn or guard violation cannot become a verified repair.
    if (execution.failed || execution.hostSkillRead || execution.violations?.length) {
      current.status = 'unverified'
      current.executionError = true
    }
    checkpoints.push(current)
    await record({ checkpoint: current, execution, attempt })
  }
  return { status: checkpoints.at(-1).status, attempts, checkpoints, exhausted: checkpoints.at(-1).status === 'failed' && attempts.length === maxAttempts }
}

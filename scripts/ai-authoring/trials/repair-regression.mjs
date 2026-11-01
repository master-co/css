/** Compare measured failures, not CSS semantics or numeric distance from a target. */
export function failureAtoms(checks) {
  const atoms = new Map()
  for (const check of checks.filter(c => !c.pass)) {
    if (Array.isArray(check.actual) && check.actual.length && check.actual.every(d => d && typeof d.property === 'string' && Number.isInteger(d.node))) {
      for (const d of check.actual) atoms.set(JSON.stringify([check.id, 'property', d.node, d.property]), { check: check.id, ...d })
    } else if (check.id === 'valid-classes' && Array.isArray(check.actual) && check.actual.length && check.actual.every(c => typeof c === 'string')) {
      for (const className of check.actual) atoms.set(JSON.stringify([check.id, 'class', className]), { check: check.id, className })
    } else atoms.set(JSON.stringify([check.id, 'check']), { check: check.id, actual: check.actual })
  }
  return atoms
}

export function compareRepairCandidate(accepted, candidate) {
  const left = accepted.assessment?.checks, right = candidate.assessment?.checks
  const valid = checks => Array.isArray(checks) && checks.length && checks.every(c => typeof c.id === 'string' && typeof c.pass === 'boolean') && new Set(checks.map(c => c.id)).size === checks.length
  const trusted = cp => ['passed', 'failed'].includes(cp.status) && !cp.executionError && !cp.assessment?.colorComparison?.error && (cp.status !== 'passed' || cp.assessment?.checks?.every(c => c.pass) && cp.assessment.browser === 'passed' && cp.assessment.functional && cp.assessment.styling && cp.assessment.accessibility && !cp.assessment.buildError)
  if (!trusted(accepted) || !trusted(candidate) || !valid(left) || !valid(right)) return { adopt: false, reason: 'unverified', regressions: [], resolved: [] }
  const coverage = checks => checks.map(c => [c.id, c.kind ?? null]).sort(([a], [b]) => a.localeCompare(b))
  if (JSON.stringify(coverage(left)) !== JSON.stringify(coverage(right))) return { adopt: false, reason: 'coverage-changed', regressions: [], resolved: [] }
  const before = failureAtoms(left), after = failureAtoms(right)
  for (const [key, value] of after) if (before.has(key) && 'property' in value && JSON.stringify(value.expected) !== JSON.stringify(before.get(key).expected)) return { adopt: false, reason: 'expectation-changed', regressions: [], resolved: [] }
  const regressions = [...after].filter(([key]) => !before.has(key)).map(([, value]) => value)
  const resolved = [...before].filter(([key]) => !after.has(key)).map(([, value]) => value)
  if (regressions.length) return { adopt: false, reason: 'regression', regressions, resolved }
  const complete = candidate.status === 'passed' && candidate.assessment.browser === 'passed' && candidate.assessment.functional && candidate.assessment.styling && candidate.assessment.accessibility && !candidate.assessment.buildError && !candidate.assessment.colorComparison?.error && !candidate.executionError
  if (!after.size && !complete) return { adopt: false, reason: 'unverified', regressions, resolved }
  if (complete && !after.size) return { adopt: true, reason: 'passed', regressions, resolved }
  return { adopt: resolved.length > 0, reason: resolved.length ? 'progress' : 'no-progress', regressions, resolved }
}

/** Proposals live in isolated snapshots; this module never rewrites the retained source. */
export async function guardedRepairLoop({ initial, propose, record = async () => {}, maxAttempts = 2 }) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 0 || maxAttempts > 3) throw new Error('Expected 0 to 3 repair attempts')
  let accepted = initial, lastRejection = null, unverified = initial.checkpoint.status === 'unverified'
  const proposals = []
  while (accepted.checkpoint.status === 'failed' && !unverified && proposals.length < maxAttempts) {
    const attempt = proposals.length, candidate = await propose({ accepted, attempt, lastRejection })
    const execution = candidate.execution
    const decision = execution?.failed || execution?.hostSkillRead || execution?.violations?.length
      ? { adopt: false, reason: 'unverified', regressions: [], resolved: [] }
      : compareRepairCandidate(accepted.checkpoint, candidate.checkpoint)
    const proposal = { attempt, parentSourceHash: accepted.checkpoint.sourceHash, candidate, decision }
    proposals.push(proposal)
    await record(proposal)
    if (decision.adopt) { accepted = candidate; lastRejection = null }
    else lastRejection = { sourceHash: candidate.checkpoint.sourceHash, decision, diff: candidate.diff }
    if (['unverified', 'coverage-changed', 'expectation-changed'].includes(decision.reason)) unverified = true
  }
  return { status: unverified ? 'unverified' : accepted.checkpoint.status, retainedStatus: accepted.checkpoint.status, accepted, proposals,
    exhausted: !unverified && accepted.checkpoint.status === 'failed' && proposals.length === maxAttempts }
}

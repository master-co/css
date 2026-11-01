/** Keep the original cohort, regardless of whether the prior repair passed. */
export function selectGuardedCohort(protocol, rows) {
  if (!Array.isArray(protocol.selected) || !protocol.selected.length || !protocol.sourceHashes || !protocol.artifactHashes) throw new Error('Expected a recheck protocol')
  const ids = new Set(protocol.selected.map(c => c.id))
  if (ids.size !== protocol.selected.length || rows.length !== ids.size || new Set(rows.map(r => r.id)).size !== rows.length || rows.some(r => !ids.has(r.id))) throw new Error('Incomplete or duplicate source cases')
  return protocol.selected.map(item => {
    const row = rows.find(row => row.id === item.id)
    if (row.model !== item.model || row.task !== item.task || row.protocolHash !== protocol.hash || !['passed', 'failed'].includes(row.status) || row.checkpoints?.[0]?.status !== 'failed') throw new Error('Ineligible or mixed source case')
    return { ...item, previousStatus: row.status, previousAttempts: row.attempts, initialSourceHash: row.checkpoints[0].sourceHash }
  })
}

export function summarizeGuardedCohort(protocol, rows) {
  const seen = new Set()
  for (const row of rows) {
    if (!protocol.selected.some(c => c.id === row.id) || seen.has(row.id)) throw new Error('Unexpected or duplicate observation')
    seen.add(row.id)
    if (row.protocolHash !== protocol.hash || !['passed', 'failed', 'unverified'].includes(row.status)) throw new Error('Mixed protocol or invalid status')
    for (const field of ['inputTokens', 'cachedInputTokens', 'outputTokens']) if (row[field] !== null && (!Number.isSafeInteger(row[field]) || row[field] < 0)) throw new Error('Invalid usage')
    if (row.cachedInputTokens !== null && (row.inputTokens === null || row.cachedInputTokens > row.inputTokens)) throw new Error('Invalid cache usage')
    for (const field of ['attempts', 'rejected', 'regressiveProposals', 'noProgressProposals']) if (row[field] !== null && (!Number.isSafeInteger(row[field]) || row[field] < 0)) throw new Error('Invalid proposal metric')
    if (row.status === 'passed' && (!row.finalVerified || row.retainedRegressions !== 0)) throw new Error('Unverified or regressed pass')
  }
  return { version: 1, expected: protocol.selected.length, completed: rows.length,
    missing: protocol.selected.filter(c => !seen.has(c.id)).map(c => c.id),
    passed: rows.filter(r => r.status === 'passed').length, failed: rows.filter(r => r.status === 'failed').length, unverified: rows.filter(r => r.status === 'unverified').length,
    attempts: rows.reduce((n, r) => n + (r.attempts ?? 0), 0), rejected: rows.reduce((n, r) => n + (r.rejected ?? 0), 0),
    regressiveProposals: rows.reduce((n, r) => n + (r.regressiveProposals ?? 0), 0), noProgressProposals: rows.reduce((n, r) => n + (r.noProgressProposals ?? 0), 0),
    unmeasuredAttempts: rows.filter(r => r.attempts === null).length,
    unmeasuredProposals: rows.filter(r => r.rejected === null || r.regressiveProposals === null || r.noProgressProposals === null).length,
    retainedRegressions: rows.some(r => r.retainedRegressions === null) ? null : rows.reduce((n, r) => n + r.retainedRegressions, 0),
    inputTokens: rows.reduce((n, r) => n + (r.inputTokens ?? 0), 0), cachedInputTokens: rows.reduce((n, r) => n + (r.cachedInputTokens ?? 0), 0), outputTokens: rows.reduce((n, r) => n + (r.outputTokens ?? 0), 0),
    unmeasuredUsage: rows.filter(r => r.inputTokens === null || r.cachedInputTokens === null || r.outputTokens === null).length,
    priorPassed: protocol.selected.filter(c => c.previousStatus === 'passed').length,
    outcomes: protocol.selected.map(c => ({ id: c.id, previous: c.previousStatus, current: rows.find(r => r.id === c.id)?.status ?? 'pending' })),
    limits: 'Same initial failed snapshots and fixed repair budget; fresh executions with guarded guidance. Historical comparison is descriptive, not a randomized A/B estimate. Counts retain failures, unverified outcomes and missing coverage. No guarantee beyond measured checks.' }
}

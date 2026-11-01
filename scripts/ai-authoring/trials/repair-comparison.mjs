export function repairSchedule(seeds, models) {
  return seeds.flatMap((seed, i) => (i % 2 ? [...models].reverse() : models).flatMap((model, j) =>
    ((i + j) % 2 ? ['b', 'a'] : ['a', 'b']).map(arm => ({ id: `${seed.id}-${model}-${arm}`, seed: seed.id, model, arm }))))
}

export function compareRepairs(protocol, rows) {
  const planned = protocol.schedule
  const seen = new Set()
  for (const row of rows) {
    const expected = planned.find(item => item.id === row.id)
    const seed = protocol.seeds.find(item => item.id === row.seed)
    if (!expected || seen.has(row.id)) throw new Error('Unexpected or duplicate trial')
    seen.add(row.id)
    if (row.seed !== expected.seed || row.model !== expected.model || row.arm !== expected.arm || row.inputHash !== seed.inputHash || row.reportHash !== seed.reportHashes[row.arm] || row.promptHash !== seed.promptHash || row.protocolHash !== protocol.hash) throw new Error('Mixed paired inputs or protocol')
    if (typeof row.passed !== 'boolean') throw new Error('Missing verdict')
    for (const field of ['inputTokens', 'cachedInputTokens', 'outputTokens']) if (row[field] !== null && (!Number.isSafeInteger(row[field]) || row[field] < 0)) throw new Error('Invalid usage')
    if (row.cachedInputTokens !== null && (row.inputTokens === null || row.cachedInputTokens > row.inputTokens)) throw new Error('Invalid cached usage')
  }
  if (rows.length !== planned.length) throw new Error('Incomplete repair comparison')
  const median = values => { const sorted = [...values].sort((a, b) => a - b), mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2 }
  const totals = selection => ({
    trials: selection.length, passed: selection.filter(row => row.passed).length,
    inputTokens: selection.reduce((sum, row) => sum + (row.inputTokens ?? 0), 0),
    cachedInputTokens: selection.reduce((sum, row) => sum + (row.cachedInputTokens ?? 0), 0),
    outputTokens: selection.reduce((sum, row) => sum + (row.outputTokens ?? 0), 0),
    unmeasuredUsage: selection.filter(row => row.inputTokens === null || row.cachedInputTokens === null || row.outputTokens === null).length,
    medianModelDurationMs: median(selection.map(row => row.modelDurationMs)),
    reportReads: selection.filter(row => row.reportRead).length,
    unmatched: selection.some(row => row.invalidClasses === null) ? null : selection.reduce((sum, row) => sum + row.invalidClasses, 0),
    cliSuggestions: selection.reduce((sum, row) => sum + row.cliSuggestions, 0), cliErrors: selection.reduce((sum, row) => sum + row.cliErrors, 0),
    expansionCalls: selection.reduce((sum, row) => sum + (row.expansionCalls ?? 0), 0),
    expansionTrials: selection.filter(row => row.expansionCalls > 0).length,
    expansionErrors: selection.reduce((sum, row) => sum + (row.expansionErrors ?? 0), 0),
    expansionBytes: selection.reduce((sum, row) => sum + (row.expansionBytes ?? 0), 0),
    executionErrors: selection.filter(row => row.execution.failed).length
  })
  const pairs = { fullWins: 0, compactWins: 0, bothPass: 0, bothFail: 0 }
  for (const left of rows.filter(row => row.arm === 'a')) {
    const right = rows.find(row => row.arm === 'b' && row.seed === left.seed && row.model === left.model)
    if (!right) throw new Error('Missing paired presentation')
    pairs[left.passed ? right.passed ? 'bothPass' : 'fullWins' : right.passed ? 'compactWins' : 'bothFail']++
  }
  if (protocol.presentation === 'navigation') { pairs.navigationWins = pairs.compactWins; delete pairs.compactWins }
  return { version: 1, presentation: protocol.presentation ?? 'compact', mode: protocol.mode, revision: protocol.revision, pairs,
    arms: Object.fromEntries(['a', 'b'].map(arm => [arm, totals(rows.filter(row => row.arm === arm))])),
    byModel: protocol.models.map(model => ({ model, arms: Object.fromEntries(['a', 'b'].map(arm => [arm, totals(rows.filter(row => row.model === model && row.arm === arm))])) })),
    failures: rows.filter(row => !row.passed).map(row => row.id),
    limitations: 'One 120-second repair per frozen failed first attempt; no conversation history. All initial failures from one small prior campaign, clustered within two tasks. Task inputs and prompt match within each seed/model pair; report presentation differs. Input tokens include cache hits, not billing. Unmeasured/error attempts remain in denominators. This does not establish general authoring or multi-repair performance.' }
}

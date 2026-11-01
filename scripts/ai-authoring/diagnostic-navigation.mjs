import { summarizeDiagnostics } from './diagnostic-summary.mjs'

export const expansionCommand = 'node .diagnostic-tools/expand-diagnostics.mjs .diagnostic-evidence.json --log diagnostic-reads.jsonl'

/** A navigation index over captured evidence; never infers cascade winners. */
export function navigateDiagnostics(acceptance) {
  const summary = summarizeDiagnostics(acceptance)
  return {
    version: 1, format: 'property-navigation', limits: summary.limits,
    unresolvedClasses: summary.unresolvedClasses, classCoverage: summary.classCoverage,
    properties: summary.properties.map(({ property, differences }) => ({ property,
      expand: `${expansionCommand} --property ${JSON.stringify(property)}`,
      differences: differences.map(({ evidence, ...difference }) => ({ ...difference, capturedGroups: evidence.length })) })),
    otherChecks: summary.otherChecks, unavailableEvidence: summary.unavailableEvidence, omittedGroups: summary.omittedGroups,
    navigation: { all: `${expansionCommand} --all`,
      filters: 'Add --check CHECK_ID and/or --node INDEX to a property request. Each response retains entire matching captured groups, including all source/target declarations, ancestors, layers, variables and capture limits. No current browser state is queried.',
      missing: 'A scored difference can have no captured group. Missing or unavailable evidence is explicit; --all returns the original complete capture, not new evidence.' },
    nextStep: 'Expand the properties you need, compare source and target candidates and inheritance, then rebuild and verify the affected states. Requests are optional. Unresolved spellings can be checked with the project CLI.'
  }
}

export function expandDiagnostics(acceptance, { property, check, node, all = false } = {}) {
  if (acceptance.diagnostics?.version !== 1) throw new Error('Expected version 1 browser diagnostics')
  if (all) {
    if (property !== undefined || check !== undefined || node !== undefined) throw new Error('--all cannot be combined with filters')
    return { version: 1, format: 'full-evidence', diagnostics: acceptance.diagnostics }
  }
  if (typeof property !== 'string' || !property) throw new Error('Specify --property or --all')
  if (node !== undefined && (!Number.isSafeInteger(node) || node < 0)) throw new Error('Invalid node index')
  const summary = summarizeDiagnostics(acceptance)
  const group = summary.properties.find(item => item.property === property)
  if (!group) throw new Error(`Unknown scored property: ${property}`)
  const differences = group.differences.flatMap(({ evidence: _evidence, ...difference }) => {
    const checks = difference.checks.filter(id => check === undefined || check === id)
    return checks.length && (node === undefined || node === difference.node) ? [{ ...difference, checks }] : []
  })
  if (!differences.length) throw new Error('No scored differences match these filters')
  const evidence = (acceptance.diagnostics.evidence ?? []).filter(item => differences.some(diff => diff.checks.includes(item.check) && (item.index === diff.node || item.status === 'unavailable')))
  return { version: 1, format: 'property-evidence', property, limits: summary.limits, differences,
    evidence, missing: differences.flatMap(diff => diff.checks.filter(id => !evidence.some(item => item.check === id && item.index === diff.node && item.status !== 'unavailable')).map(id => ({ check: id, node: diff.node }))),
    omittedGroups: acceptance.diagnostics.omittedGroups,
    coverage: 'Entire matching groups from the original capture, without filtering declarations or ancestors. May include other properties in the same group. Missing entries have no available captured group; no cascade winner is inferred.' }
}

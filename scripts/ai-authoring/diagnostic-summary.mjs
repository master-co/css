// A deterministic presentation of existing evidence, never a cascade resolver.
export function summarizeDiagnostics(acceptance) {
  const diagnostics = acceptance.diagnostics
  if (!diagnostics || diagnostics.version !== 1) throw new Error('Expected version 1 browser diagnostics')
  const tables = { rules: {}, elements: {}, layers: {} }
  const keys = { rules: new Map(), elements: new Map(), layers: new Map() }
  const intern = (table, value) => {
    const key = JSON.stringify(value)
    if (!keys[table].has(key)) {
      const id = `${table[0]}${keys[table].size}`
      keys[table].set(key, id)
      tables[table][id] = value
    }
    return keys[table].get(key)
  }
  const relevant = (declaration, property) => declaration.name === property || declaration.name === 'all' || declaration.longhands?.some(item => item.name === property)
  const rulesFor = (rules, property) => (rules ?? []).filter(rule => rule.declarations.some(item => relevant(item, property))).map(rule => {
    // CDP appends synthesized values to authored declarations. Keep authored
    // duplicates in order; keep unlocated UA/inline declarations when necessary.
    const declarations = rule.declarations.filter(item => item.authored || !rule.declarations.some(other => other.authored && other.name === item.name))
    return intern('rules', {
      selector: rule.selector, origin: rule.origin, source: rule.source, layers: rule.layers,
      ...(rule.media?.length ? { media: rule.media } : {}),
      ...(rule.supports?.length ? { supports: rule.supports } : {}),
      ...(rule.scopes?.length ? { scopes: rule.scopes } : {}),
      ...(rule.containerQueries?.length ? { containerQueries: rule.containerQueries } : {}),
      declarations: declarations.map(item => ({ name: item.name, value: item.value,
        ...(item.important ? { important: true } : {}), ...(item.parsed === false ? { parsed: false } : {}), ...(item.disabled ? { disabled: true } : {}),
        location: item.location ? { line: item.location.line, column: item.location.column, ...(item.location.url !== rule.source ? { url: item.location.url } : {}) } : null,
        ...(item.longhands?.length ? { longhands: item.longhands } : {}) }))
    })
  })
  const element = node => intern('elements', { tag: node.tag, id: node.id, classes: node.classes,
    ...(Object.keys(node.variables ?? {}).length ? { variables: node.variables } : {}),
    ...(node.animations?.length ? { animations: node.animations } : {}) })
  const side = (evidence, property) => {
    if (evidence?.status !== 'captured') return { status: evidence?.status ?? 'unavailable' }
    return {
      element: element(evidence.element), computed: evidence.element.values[property], rules: rulesFor(evidence.rules, property), layers: intern('layers', evidence.layerOrder),
      ancestors: evidence.ancestors.flatMap(ancestor => {
        const rules = rulesFor(ancestor.rules, property)
        return rules.length ? [{ element: element(ancestor.element), computed: ancestor.element.values[property], rules }] : []
      })
    }
  }
  const properties = new Map(), otherChecks = []
  for (const check of acceptance.checks.filter(check => !check.pass)) {
    const differences = Array.isArray(check.actual) && check.actual.length && check.actual.every(item => item && typeof item.property === 'string') ? check.actual : null
    if (!differences) { otherChecks.push(check); continue }
    for (const difference of differences) {
      if (!properties.has(difference.property)) properties.set(difference.property, [])
      const groups = properties.get(difference.property)
      let group = groups.find(group => group.node === difference.node && group.actual === difference.actual && group.expected === difference.expected)
      if (!group) { group = { node: difference.node, actual: difference.actual, expected: difference.expected, checks: [], evidence: [] }; groups.push(group) }
      group.checks.push(check.id)
      for (const evidence of diagnostics.evidence ?? []) {
        if (evidence.check !== check.id || evidence.index !== difference.node) continue
        group.evidence.push({ check: check.id, selector: evidence.selector, index: evidence.index,
          state: evidence.state, width: evidence.width, colorScheme: evidence.colorScheme,
          source: side(evidence.source, difference.property), target: side(evidence.target, difference.property) })
      }
    }
  }
  return {
    version: 1, format: 'property-summary',
    limits: 'Checks are scored samples; evidence comes from separate replays. Rules are candidates, not proven winners. Ancestor declarations do not prove inheritance. Empty evidence means no captured explanation, not no applicable rules. Grouped checks may have different cascade conditions. Rule/element/layer IDs refer to the tables below. Declaration locations use their rule source unless a URL is supplied. No automatic repair or causal diagnosis is inferred.',
    unresolvedClasses: diagnostics.unresolvedClasses?.map(item => ({ className: item.className, matchStatus: item.matchStatus, occurrences: item.occurrences, diagnostics: item.diagnostics })) ?? null,
    classCoverage: diagnostics.classCoverage,
    properties: [...properties].sort(([a], [b]) => a.localeCompare(b)).map(([property, differences]) => ({ property, differences })),
    ...tables, otherChecks,
    unavailableEvidence: (diagnostics.evidence ?? []).filter(item => item.status === 'unavailable').map(item => ({ check: item.check, error: item.error })),
    omittedGroups: diagnostics.omittedGroups,
    nextStep: 'Verify unresolved spellings with the project CLI. Compare source and target declarations, ancestors and layer order for each property; then rebuild and check the affected states.'
  }
}

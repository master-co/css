export function stable(value: unknown): string {
  if (!value || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  return `{${Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
    .join(',')}}`
}

export function equalDeclarations(a: unknown, b: unknown) {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return stable(a) === stable(b)
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()
  return stable(aKeys) === stable(bKeys)
}

export function equalVariants(
  a: { selectorText?: string, conditions?: unknown, layerName?: string, variantBranchKey?: string },
  b: { selectorText?: string, conditions?: unknown, layerName?: string, variantBranchKey?: string }
) {
  const branchA = a.variantBranchKey
  const branchB = b.variantBranchKey
  return (branchA !== undefined || branchB !== undefined ? branchA === branchB : a.selectorText === b.selectorText)
    && a.layerName === b.layerName
    && stable(a.conditions) === stable(b.conditions)
}

export function getDeclarationPropertySignature(rule: { declarations?: object }) {
  return Object.keys(rule.declarations || {}).sort().join('\0')
}

export function getDeclarationSignature(rule: { declarations?: object }) {
  return stable(rule.declarations || {})
}

export function getRulesSignature(rules: { declarations?: object }[]) {
  return rules.map(getDeclarationSignature).sort().join('\0')
}

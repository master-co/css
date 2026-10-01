import type { MasterCSSTokenFamily } from '@master/css-tooling/language'
import catalog from '../.generated/preset-token-families.json'

/** Build-time Rust analysis; client code only reads serializable display facts. */
export const tokenFamilies = (catalog.families as MasterCSSTokenFamily[]).map(family => ({
  ...family,
  property: family.properties.join(', '),
  namespaces: [family.namespace]
}))

export function getVariableNamespacePublicKeys(namespace: string) {
  return tokenFamilies.filter(family => family.namespace === namespace).map(family => family.prefix).sort()
}

export function getTokenNamespacePublicKeys(namespace: string) {
  return tokenFamilies.filter(family => family.argument === 'value' && family.namespace === namespace).map(family => family.prefix).sort()
}

/** Keep curated documentation groups aligned with the loaded namespace consumers. */
export function filterNamespaceKeys(group: { keys: string[], namespace?: string, namespaces?: string[] }) {
  const namespaces = group.namespaces || (group.namespace ? [group.namespace] : [])
  if (!namespaces.length) return group.keys
  const keys = new Set(namespaces.flatMap(getVariableNamespacePublicKeys))
  return group.keys.filter(key => keys.has(key))
}

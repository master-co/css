import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { builtinTokenFamilies } from '@master/css-tooling/builtins'

/** Read-only engine projection plus generic single-string mixin families. */
export const tokenFamilies = [
  ...builtinTokenFamilies,
  ...(defaultManifest.mixins ?? []).filter(mixin => mixin.parameters?.length === 1 && mixin.parameters[0].syntax === 'string')
    .map(mixin => ({ prefix: mixin.name.slice(2), property: '', namespaces: [mixin.name.slice(2)] }))
]

export function getVariableNamespacePublicKeys(namespace: string) {
  return Array.from(new Set(tokenFamilies.filter(family => family.namespaces.includes(namespace)).map(family => family.prefix))).sort()
}

export function getTokenNamespacePublicKeys(namespace: string) {
  return Array.from(new Set(builtinTokenFamilies.filter(family => family.namespaces.includes(namespace)).map(family => family.prefix))).sort()
}

/** Keep curated documentation groups aligned with the public namespace consumers. */
export function filterNamespaceKeys(group: { keys: string[], namespace?: string, namespaces?: string[] }) {
  const namespaces = group.namespaces || (group.namespace ? [group.namespace] : [])
  if (!namespaces.length) return group.keys
  const keys = new Set(namespaces.flatMap(getVariableNamespacePublicKeys))
  return group.keys.filter(key => keys.has(key))
}

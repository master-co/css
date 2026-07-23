import type { MasterCSSManifestUtility } from '@master/css'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { builtinKeyAliases, builtinNativeValueNamespaces } from '@master/css-tooling/builtins'

export const manifestUtilities = defaultManifest.utilities || []

export function getUtilityVariableNamespaces(utility: MasterCSSManifestUtility) {
  return [
    ...(utility.namespaces || []),
    ...(utility.variableAliasRefs || []).map((ref) => ref.replace(/^[=~]/, ''))
  ].filter((namespace, index, namespaces) => namespaces.indexOf(namespace) === index)
}

export function utilityUsesVariableNamespace(utility: MasterCSSManifestUtility, pattern: string) {
  return getUtilityVariableNamespaces(utility).some((namespace) => namespace.includes(pattern))
}

export function getVariableNamespacePublicKeys(namespace: string) {
  return normalizePublicKeys([
    ...getNativeValueNamespacePublicKeys(namespace),
    ...getManifestVariableNamespacePublicKeys(namespace)
  ])
}

export function getNativeValueNamespacePublicKeys(namespace: string) {
  const properties = new Set<string>()
  for (const eachNamespace of builtinNativeValueNamespaces) {
    if (!eachNamespace.variableAliasRefs.some((ref) => normalizeNamespaceRef(ref) === namespace)) continue
    for (const property of eachNamespace.properties) {
      if (property) properties.add(property)
    }
  }

  const keys = new Set<string>()
  for (const [alias, property] of Object.entries(builtinKeyAliases)) {
    if (properties.has(property)) keys.add(alias)
  }
  for (const property of properties) {
    keys.add(property)
  }

  return Array.from(keys)
    .filter(isPublicKey)
    .sort(sortKeys)
}

function getManifestVariableNamespacePublicKeys(namespace: string) {
  const keys = new Set<string>()
  for (const utility of manifestUtilities) {
    if (!getUtilityVariableNamespaces(utility).includes(namespace)) continue
    for (const key of getUtilityMatcherKeys(utility)) {
      keys.add(key)
    }
  }

  for (const [alias, key] of Object.entries(builtinKeyAliases)) {
    if (keys.has(key)) keys.add(alias)
  }

  return normalizePublicKeys(keys)
}

function getUtilityMatcherKeys(utility: MasterCSSManifestUtility) {
  const keys = new Set<string>()
  for (const matcher of utility.matchers || []) {
    const matcherKeys = (matcher as { keys?: readonly string[] }).keys
    if (!matcherKeys) continue
    for (const key of matcherKeys) {
      keys.add(key)
    }
  }
  return keys
}

function normalizePublicKeys(keys: Iterable<string>) {
  return Array.from(new Set(keys))
    .filter(isPublicKey)
    .sort(sortKeys)
}

function isPublicKey(key: string) {
  return Boolean(key) && !key.includes('<~')
}

function sortKeys(a: string, b: string) {
  return a.localeCompare(b)
}

function normalizeNamespaceRef(ref: string) {
  return ref.replace(/^[=~]/, '')
}

import { flattenMasterCSSManifestVariables } from '@master/css-schema/manifest'
import { tokenFamilies } from '../../utils/manifest-utilities'
import preset from '../../utils/preset-manifest'

/** Authored facts only: scope/dependency resolution remains owned by the engine. */
export const foundationTokens = flattenMasterCSSManifestVariables(preset.variables)
export const foundationFamilies = tokenFamilies
export function namespaceTokens(namespace: string) {
  return foundationTokens.filter(token => token.namespace === namespace)
}
export function namespaceFamilies(namespace: string) {
  return foundationFamilies.filter(family => family.namespaces.includes(namespace.startsWith('color-') ? 'color' : namespace))
}
export function selectFoundationTokens(namespace: string, keys: string[]) {
  const entries = namespaceTokens(namespace)
  return keys.map(key => {
    const token = entries.find(token => token.key === key)
    if (!token) throw new Error(`Unknown ${namespace} token: ${key}`)
    return token
  })
}

/** Presentation choices only; token values and output semantics remain source-owned. */
export const tokenSpecimenProperties: Record<string, string> = {
  radius: 'borderRadius', shadow: 'boxShadow', 'font-family': 'fontFamily',
  'font-size': 'fontSize', 'font-weight': 'fontWeight', leading: 'lineHeight', tracking: 'letterSpacing', text: 'fontSize',
}
export const hasTokenSpecimens = (namespace: string) => namespace.startsWith('color') || Object.hasOwn(tokenSpecimenProperties, namespace)
  || ['spacing', 'container', 'animate', 'duration', 'easing', 'order'].includes(namespace)

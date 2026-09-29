import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
  flattenMasterCSSManifestVariables,
  groupMasterCSSManifestVariables,
  type MasterCSSManifest,
  type MasterCSSManifestVariable
} from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

type PlanVariableDraft = MasterCSSManifestVariable
type PresetManifestInput = Partial<Omit<MasterCSSManifest, 'variables'>> & {
  variables?: PlanVariableDraft[]
}

function normalizeVariable(variable: PlanVariableDraft): PlanVariableDraft {
  if (variable.name && variable.type) return variable
  return {
    ...variable,
    name: variable.name || (variable.namespace ? `${variable.namespace}-${variable.key}` : variable.key),
    type: variable.type || 'string'
  }
}

export function createPresetManifest(manifest: PresetManifestInput | MasterCSSManifest = {}): MasterCSSManifest {
  if (manifest.version === 4) return manifest as MasterCSSManifest
  const variables = ((manifest as PresetManifestInput).variables || []).map(normalizeVariable)
  return {
    ...defaultManifest,
    ...manifest,
    theme: [
      ...(defaultManifest.theme || []), ...(manifest.theme || []),
      ...variables.flatMap(variable => variable.values.map(value => value.path.reduceRight<import('@master/css-schema/manifest').MasterCSSThemeNode>((children, prelude) => ({ type: 'rule' as const, prelude, children: [children] }), { type: 'declaration' as const, name: variable.name!, value: value.value })))
    ],
    variables: groupMasterCSSManifestVariables([
      ...flattenMasterCSSManifestVariables(defaultManifest.variables),
      ...variables
    ]),
    variants: [
      ...(defaultManifest.variants || []),
      ...(manifest.variants || [])
    ],
    mixins: [...(defaultManifest.mixins || []), ...(manifest.mixins || [])]
  }
}

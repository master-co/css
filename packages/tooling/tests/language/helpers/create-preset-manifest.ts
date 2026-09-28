import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { UtilityType } from '@master/css-schema/utility-type'
import {
  flattenMasterCSSManifestVariables,
  groupMasterCSSManifestVariables,
  type MasterCSSManifest,
  type MasterCSSManifestVariable
} from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

type PlanVariableDraft = MasterCSSManifestVariable
type ManifestUtilityDraft = Partial<NonNullable<MasterCSSManifest['utilities']>[number]> & {
  declarations?: Record<string, string | number>
  rules?: { selector?: string, declarations: Record<string, string | number> }[]
}
type PresetManifestInput = Partial<Omit<MasterCSSManifest, 'variables' | 'utilities'>> & {
  variables?: PlanVariableDraft[]
  utilities?: ManifestUtilityDraft[]
}

function normalizeVariable(variable: PlanVariableDraft): PlanVariableDraft {
  if (variable.name && variable.type) return variable
  return {
    ...variable,
    name: variable.name || (variable.namespace ? `${variable.namespace}-${variable.key}` : variable.key),
    type: variable.type || 'string'
  }
}

function normalizeUtility(utility: ManifestUtilityDraft, order: number): NonNullable<MasterCSSManifest['utilities']>[number] {
  if (utility.emit && utility.matchers) {
    return utility as NonNullable<MasterCSSManifest['utilities']>[number]
  }
  const name = utility.name || utility.id?.replace(/^\./, '') || ''
  const id = utility.id || (utility.type === UtilityType.Semantic || utility.layer === 'components' ? `.${name}` : name)
  return {
    id,
    name,
    type: utility.type ?? UtilityType.Semantic,
    order: utility.order ?? order,
    layer: utility.layer,
    emit: {
      type: 'static',
      rules: utility.rules || [
        {
          selector: '&',
          declarations: utility.declarations || {}
        }
      ]
    },
    matchers: [
      {
        type: 'static',
        name
      }
    ]
  }
}

export function createPresetManifest(manifest: PresetManifestInput = {}): MasterCSSManifest {
  if (manifest.version === 2) return manifest as MasterCSSManifest
  const defaultUtilities = defaultManifest.utilities || []
  const utilities = (manifest.utilities || []).map((utility, index) => normalizeUtility(utility as ManifestUtilityDraft, defaultUtilities.length + index))
  const variables = (manifest.variables || []).map(normalizeVariable)
  return {
    ...defaultManifest,
    ...manifest,
    theme: [
      ...(defaultManifest.theme || []), ...(manifest.theme || []),
      ...variables.flatMap(variable => variable.values.map(value => value.path.reduceRight<import('@master/css-schema/manifest').MasterCSSThemeNode>((children, prelude) => ({ type: 'rule', prelude, children: [children] }), { type: 'declaration', name: variable.name!, value: value.value })))
    ],
    variables: groupMasterCSSManifestVariables([
      ...flattenMasterCSSManifestVariables(defaultManifest.variables),
      ...variables
    ]),
    variants: [
      ...(defaultManifest.variants || []),
      ...(manifest.variants || [])
    ],
    utilities: [
      ...defaultUtilities,
      ...utilities
    ]
  }
}

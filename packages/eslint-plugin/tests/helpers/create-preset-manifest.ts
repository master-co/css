import type { MasterCSSManifest } from '@master/css'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import UtilityType from 'shared/utility-type'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

type PlanVariableDraft = NonNullable<MasterCSSManifest['variables']>[number]
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
    const value = variable.value
    return {
        ...variable,
        name: variable.name || (variable.namespace ? `${variable.namespace}-${variable.key}` : variable.key),
        type: variable.type || (typeof value === 'number' ? 'number' : 'string')
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
        matchers: [{ type: 'static', name }]
    }
}

function cloneUtilityBuckets(): NonNullable<MasterCSSManifest['utilityBuckets']> {
    return Object.fromEntries(
        Object.entries(defaultManifest.utilityBuckets || {}).map(([name, indexes]) => [name, [...indexes]])
    )
}

function addUtilityBucketIndexes(
    buckets: NonNullable<MasterCSSManifest['utilityBuckets']>,
    utilities: NonNullable<MasterCSSManifest['utilities']>,
    startIndex: number
) {
    utilities.forEach((utility, index) => {
        const utilityIndex = startIndex + index
        for (const matcher of utility.matchers) {
            switch (matcher.type) {
                case 'variable':
                    buckets.variable ??= []
                    if (!buckets.variable.includes(utilityIndex)) buckets.variable.push(utilityIndex)
                    break
                case 'value':
                    buckets.value ??= []
                    if (!buckets.value.includes(utilityIndex)) buckets.value.push(utilityIndex)
                    break
                case 'key':
                    buckets.key ??= []
                    if (!buckets.key.includes(utilityIndex)) buckets.key.push(utilityIndex)
                    break
                case 'pattern':
                    buckets.pattern ??= []
                    if (!buckets.pattern.includes(utilityIndex)) buckets.pattern.push(utilityIndex)
                    break
                default:
                    buckets.arbitrary ??= []
                    if (!buckets.arbitrary.includes(utilityIndex)) buckets.arbitrary.push(utilityIndex)
            }
        }
    })
}

export function createPresetManifest(manifest: PresetManifestInput = {}): MasterCSSManifest {
    if (manifest.version === 2) return manifest as MasterCSSManifest
    const defaultUtilities = defaultManifest.utilities || []
    const utilities = (manifest.utilities || []).map((utility, index) => normalizeUtility(utility, defaultUtilities.length + index))
    const utilityBuckets = cloneUtilityBuckets()
    addUtilityBucketIndexes(utilityBuckets, utilities, defaultUtilities.length)
    const variables = (manifest.variables || []).map(normalizeVariable)
    return {
        ...defaultManifest,
        ...manifest,
        variables: [
            ...(defaultManifest.variables || []),
            ...variables
        ],
        utilities: [
            ...defaultUtilities,
            ...utilities
        ],
        utilityBuckets
    }
}

import type { MasterCSSPlan } from '@master/css'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import UtilityType from 'shared/utility-type'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

type PlanVariableDraft = NonNullable<MasterCSSPlan['variables']>[number]
type PlanUtilityDraft = Partial<NonNullable<MasterCSSPlan['utilities']>[number]> & {
    declarations?: Record<string, string | number>
    rules?: { selector?: string, declarations: Record<string, string | number> }[]
}
type PresetPlanInput = Partial<Omit<MasterCSSPlan, 'variables' | 'utilities'>> & {
    variables?: PlanVariableDraft[]
    utilities?: PlanUtilityDraft[]
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

function normalizeUtility(utility: PlanUtilityDraft, order: number): NonNullable<MasterCSSPlan['utilities']>[number] {
    if (utility.emit && utility.matchers) {
        return utility as NonNullable<MasterCSSPlan['utilities']>[number]
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

function cloneUtilityBuckets(): NonNullable<MasterCSSPlan['utilityBuckets']> {
    return Object.fromEntries(
        Object.entries(defaultPlan.utilityBuckets || {}).map(([name, indexes]) => [name, [...indexes]])
    )
}

function addUtilityBucketIndexes(
    buckets: NonNullable<MasterCSSPlan['utilityBuckets']>,
    utilities: NonNullable<MasterCSSPlan['utilities']>,
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

export function createPresetPlan(plan: PresetPlanInput = {}): MasterCSSPlan {
    if (plan.version === 3) return plan as MasterCSSPlan
    const defaultUtilities = defaultPlan.utilities || []
    const utilities = (plan.utilities || []).map((utility, index) => normalizeUtility(utility as PlanUtilityDraft, defaultUtilities.length + index))
    const utilityBuckets = cloneUtilityBuckets()
    addUtilityBucketIndexes(utilityBuckets, utilities, defaultUtilities.length)
    const variables = (plan.variables || []).map(normalizeVariable)
    return {
        ...defaultPlan,
        ...plan,
        settings: {
            ...defaultPlan.settings,
            ...plan.settings
        },
        variables: [
            ...(defaultPlan.variables || []),
            ...variables
        ],
        animations: {
            ...(defaultPlan.animations || {}),
            ...(plan.animations || {})
        },
        variants: [
            ...(defaultPlan.variants || []),
            ...(plan.variants || [])
        ],
        utilities: [
            ...defaultUtilities,
            ...utilities
        ],
        utilityBuckets
    }
}

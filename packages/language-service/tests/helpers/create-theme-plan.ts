import { defaultPlan, type MasterCSSPlan } from '@master/css'

type LegacyVariable = NonNullable<MasterCSSPlan['variables']>[number]
type LegacyUtility = Partial<NonNullable<MasterCSSPlan['utilities']>[number]> & {
    declarations?: Record<string, string | number>
    rules?: { selector?: string, declarations: Record<string, string | number> }[]
}
type ThemePlanInput = Partial<Omit<MasterCSSPlan, 'variables' | 'utilities'>> & {
    variables?: LegacyVariable[]
    utilities?: LegacyUtility[]
}

function normalizeVariable(variable: LegacyVariable): LegacyVariable {
    if (variable.name && variable.type) return variable
    const value = variable.value
    return {
        ...variable,
        name: variable.name || (variable.namespace ? `${variable.namespace}-${variable.key}` : variable.key),
        type: variable.type || (typeof value === 'number' ? 'number' : 'string')
    }
}

function normalizeUtility(utility: LegacyUtility, order: number): NonNullable<MasterCSSPlan['utilities']>[number] {
    if (utility.emit && utility.matchers) {
        return utility as NonNullable<MasterCSSPlan['utilities']>[number]
    }
    const name = utility.name || utility.id || ''
    return {
        id: utility.id || name,
        name,
        type: utility.type ?? -4,
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

export function createThemePlan(plan: ThemePlanInput = {}): MasterCSSPlan {
    const defaultUtilities = defaultPlan.utilities || []
    const utilities = (plan.utilities || []).map((utility, index) => normalizeUtility(utility as LegacyUtility, defaultUtilities.length + index))
    return {
        ...defaultPlan,
        ...plan,
        settings: {
            ...defaultPlan.settings,
            ...plan.settings
        },
        variables: [
            ...(defaultPlan.variables || []),
            ...(plan.variables || []).map(normalizeVariable)
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
        ]
    }
}

import { defaultPlan, type MasterCSSPlan } from '@master/css'

type LegacyUtility = Partial<NonNullable<MasterCSSPlan['utilities']>[number]> & {
    declarations?: Record<string, string | number>
    rules?: { selector?: string, declarations: Record<string, string | number> }[]
}

type ThemePlanInput = Partial<Omit<MasterCSSPlan, 'utilities'>> & {
    utilities?: LegacyUtility[]
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
        matchers: [{ type: 'static', name }]
    }
}

export function createThemePlan(plan: ThemePlanInput = {}): MasterCSSPlan {
    const defaultUtilities = defaultPlan.utilities || []
    return {
        ...defaultPlan,
        ...plan,
        utilities: [
            ...defaultUtilities,
            ...(plan.utilities || []).map((utility, index) => normalizeUtility(utility, defaultUtilities.length + index))
        ]
    }
}

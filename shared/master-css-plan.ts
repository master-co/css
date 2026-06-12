import type {
    AnimationDefinitions,
    Config,
    FunctionDefinitions,
    ModeDefinitions,
    UtilityDefinitions,
    VariantDefinitions,
    VariableDefinitions
} from './css-config.js'

export interface MasterCSSPlanSettings {
    rootSize?: number
    baseUnit?: number
    defaultMode?: Config['defaultMode']
    scope?: string
    important?: boolean
    modeTrigger?: Config['modeTrigger']
    modes?: ModeDefinitions
}

export interface MasterCSSPlan {
    version: 1
    settings?: MasterCSSPlanSettings
    variables?: VariableDefinitions
    animations?: AnimationDefinitions
    variants?: VariantDefinitions
    utilities?: UtilityDefinitions
    functions?: FunctionDefinitions
    debug?: Record<string, unknown>
}

export function createMasterCSSPlan(config: Config = {}): MasterCSSPlan {
    const {
        rootSize,
        baseUnit,
        defaultMode,
        scope,
        important,
        modeTrigger,
        modes,
        variables,
        animations,
        variants,
        utilities,
        functions
    } = config
    return {
        version: 1,
        settings: {
            ...(rootSize !== undefined ? { rootSize } : {}),
            ...(baseUnit !== undefined ? { baseUnit } : {}),
            ...(defaultMode !== undefined ? { defaultMode } : {}),
            ...(scope !== undefined ? { scope } : {}),
            ...(important !== undefined ? { important } : {}),
            ...(modeTrigger !== undefined ? { modeTrigger } : {}),
            ...(modes?.length ? { modes: [...modes] } : {})
        },
        ...(variables?.length ? { variables: variables.map((variable) => ({ ...variable })) } : {}),
        ...(animations ? { animations: { ...animations } } : {}),
        ...(variants?.length ? { variants: variants.map((variant) => ({
            ...variant,
            branches: variant.branches.map((branch) => ({ ...branch }))
        })) } : {}),
        ...(utilities?.length ? { utilities: utilities.map((utility) => ({ ...utility })) } : {}),
        ...(functions ? { functions: { ...functions } } : {})
    }
}

export function createConfigFromMasterCSSPlan(plan: MasterCSSPlan): Config {
    const settings = plan.settings || {}
    return {
        ...(settings.rootSize !== undefined ? { rootSize: settings.rootSize } : {}),
        ...(settings.baseUnit !== undefined ? { baseUnit: settings.baseUnit } : {}),
        ...(settings.defaultMode !== undefined ? { defaultMode: settings.defaultMode } : {}),
        ...(settings.scope !== undefined ? { scope: settings.scope } : {}),
        ...(settings.important !== undefined ? { important: settings.important } : {}),
        ...(settings.modeTrigger !== undefined ? { modeTrigger: settings.modeTrigger } : {}),
        ...(settings.modes?.length ? { modes: [...settings.modes] } : {}),
        ...(plan.variables?.length ? { variables: plan.variables.map((variable) => ({ ...variable })) } : {}),
        ...(plan.animations ? { animations: { ...plan.animations } } : {}),
        ...(plan.variants?.length ? { variants: plan.variants.map((variant) => ({
            ...variant,
            branches: variant.branches.map((branch) => ({ ...branch }))
        })) } : {}),
        ...(plan.utilities?.length ? { utilities: plan.utilities.map((utility) => ({ ...utility })) } : {}),
        ...(plan.functions ? { functions: { ...plan.functions } } : {})
    }
}

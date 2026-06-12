import {
    CSSDirectiveError,
    readCSSDirectiveVariantReference,
    type CSSDirectiveConfig,
    type CSSDirectiveLayerName,
    type CSSDirectiveResult,
    type CSSDirectiveStyleDefinition,
    type CSSDirectiveUtilityDefinition,
    type CSSDirectiveUtilityRuleDefinition,
    type CSSDirectiveVariableDefinition
} from 'shared/css-directives'
import type { PropertiesHyphen } from 'csstype'
import coreConfig from '@master/css/config'
import {
    AT_IDENTIFIERS,
    createCSS,
    type MasterCSS,
    type Utility
} from '@master/css'
import UtilityType from 'shared/utility-type'
import type {
    Config,
    UtilityDefinition,
    UtilityLayerName,
    UtilityRuleDefinition,
    VariableDefinition,
    VariantDefinition
} from 'shared/css-config'
import {
    compareRulePriority,
    extendConfig,
    generateAt,
    generateSelector,
    parseAt,
    parseSelector,
    resolveVariableNamespace
} from '@master/css/utils'
import { combineStyleSelectors } from './utils/selectors'
import wrapAtRules from './utils/wrap-at-rules'

export interface ResolveCSSDirectiveConfigOptions {
    config?: Config
    onWarning?: (warning: string) => void
}

export interface CSSDirectiveConfigResolution {
    config: Config
    warnings: string[]
    generatedCSS: string
}

type CSSDirectiveInput = CSSDirectiveResult | CSSDirectiveConfig
type ConfigInput = CSSDirectiveInput | Config
type InputUtilityDefinition = CSSDirectiveUtilityDefinition | UtilityDefinition
type InputVariableDefinition = CSSDirectiveVariableDefinition | VariableDefinition

interface MergedStyleDefinition {
    selector: string
    declarations: PropertiesHyphen
    atRules?: string[]
    layer?: UtilityLayerName
}

interface ComposedStyleDefinition extends MergedStyleDefinition {
    utility: Utility
}

type StyleMergeEvent =
    | {
        type: 'compose'
        order: number
        utility: Utility
        declarations: PropertiesHyphen
    }
    | {
        type: 'native'
        order: number
        declarations: PropertiesHyphen
    }

interface StyleMergeBucket {
    selector: string
    atRules?: string[]
    layer?: UtilityLayerName
    order: number
    events: StyleMergeEvent[]
}

type StyleAtRuleFeature = [string, number, number]

const STYLE_AT_FEATURE_REGEX = /\(\s*(width|height|resolution)\s*(>=|<=|>|<)\s*(-?(?:\d+(?:\.\d+)?|\.\d+))([a-z%]*)\s*\)/g
const MEDIA_MODE_NAMES = new Set(['light', 'dark'])
const DEFAULT_MODE_NONE = 'none'
const CONDITION_VARIABLE_NAMESPACES = new Set(['breakpoint', 'container'])

function isCSSDirectiveResult(input: ConfigInput): input is CSSDirectiveResult {
    return 'config' in input
}

function getInputConfig(input: ConfigInput) {
    return isCSSDirectiveResult(input) ? input.config : input
}

function getDirectiveConfig(input: CSSDirectiveInput) {
    return isCSSDirectiveResult(input) ? input.config : input
}

function getDirectiveStyleDefinitions(input: CSSDirectiveInput) {
    return isCSSDirectiveResult(input) ? input.styleDefinitions : undefined
}

function warn(warnings: string[], options: ResolveCSSDirectiveConfigOptions, message: string) {
    warnings.push(message)
    options.onWarning?.(message)
}

function isNamedDefaultMode(defaultMode: Config['defaultMode']): defaultMode is string {
    return typeof defaultMode === 'string' && defaultMode !== DEFAULT_MODE_NONE
}

function collectModeNames(config: Config) {
    const modes = new Set(config.modes || [])
    const defaultMode = config.defaultMode
    if (isNamedDefaultMode(defaultMode)) modes.add(defaultMode)
    return modes
}

function isConditionVariableNamespace(namespace: string | undefined) {
    return namespace !== undefined && CONDITION_VARIABLE_NAMESPACES.has(namespace)
}

function assertConditionVariableIsGlobal(namespace: string | undefined, key: string, mode: string | undefined) {
    if (mode && isConditionVariableNamespace(namespace)) {
        throw new Error(`${namespace![0].toUpperCase()}${namespace!.slice(1)} variables cannot be mode-specific: ${namespace}-${key}@${mode}`)
    }
}

function assertInlineVariableIsGlobal(name: string, inline: boolean | undefined, mode: string | undefined) {
    if (inline && mode) {
        throw new Error(`Inline theme variables cannot be mode-specific: ${name}@${mode}`)
    }
}

function collectBreakpointNames(config: Config) {
    return new Set((config.variables || [])
        .filter((variable) => variable.namespace === 'breakpoint')
        .map((variable) => variable.key)
    )
}

function collectContainerNames(config: Config) {
    return new Set((config.variables || [])
        .filter((variable) => variable.namespace === 'container')
        .map((variable) => variable.key)
    )
}

function cloneUtilityRule(rule: CSSDirectiveUtilityRuleDefinition | UtilityRuleDefinition): UtilityRuleDefinition {
    return {
        declarations: { ...rule.declarations },
        ...(rule.selector ? { selector: rule.selector } : {}),
        ...(rule.atRules?.length ? { atRules: [...rule.atRules] } : {})
    }
}

function resolveUtilityType(type: InputUtilityDefinition['type']) {
    return type === 'static' ? UtilityType.Static : type
}

function cloneUtility(definition: InputUtilityDefinition): UtilityDefinition {
    const type = resolveUtilityType(definition.type)
    const utility = {
        ...definition,
        ...(type !== undefined ? { type } : {}),
        ...(definition.declarations
            ? {
                declarations: Array.isArray(definition.declarations)
                    ? [...definition.declarations]
                    : { ...definition.declarations }
            }
            : {}),
        ...(definition.atRules?.length ? { atRules: [...definition.atRules] } : {}),
        ...(definition.rules?.length ? { rules: definition.rules.map(cloneUtilityRule) } : {})
    } as UtilityDefinition
    if (utility.type === UtilityType.Static) {
        utility.unit ??= ''
        utility.separators ??= [',']
    }
    return utility
}

function cloneVariant(definition: VariantDefinition): VariantDefinition {
    return {
        ...definition,
        branches: definition.branches.map((branch) => ({
            ...branch,
            ...(branch.atRules?.length ? { atRules: [...branch.atRules] } : {})
        }))
    } as VariantDefinition
}

function addMode(config: Config, mode: string) {
    config.modes ??= []
    if (!config.modes.includes(mode)) config.modes.push(mode)
}

function resolveInputVariable(variable: InputVariableDefinition): VariableDefinition {
    if ('key' in variable && variable.key !== undefined) {
        assertConditionVariableIsGlobal(variable.namespace, variable.key, variable.mode)
        const name = variable.namespace
            ? `${variable.namespace}${variable.key ? '-' + variable.key : ''}`
            : variable.key
        assertInlineVariableIsGlobal(name, variable.inline, variable.mode)
        return {
            ...(variable.namespace ? { namespace: variable.namespace } : {}),
            key: variable.key,
            value: variable.value,
            ...(variable.mode ? { mode: variable.mode } : {}),
            ...(variable.inline ? { inline: true } : {})
        }
    }

    const directiveVariable = variable as CSSDirectiveVariableDefinition
    const resolved = resolveVariableNamespace(directiveVariable.name)
    assertConditionVariableIsGlobal(resolved.namespace, resolved.key, directiveVariable.mode)
    assertInlineVariableIsGlobal(resolved.name, directiveVariable.inline, directiveVariable.mode)
    return {
        ...(resolved.namespace ? { namespace: resolved.namespace } : {}),
        key: resolved.key,
        value: directiveVariable.value,
        ...(directiveVariable.mode ? { mode: directiveVariable.mode } : {}),
        ...(directiveVariable.inline ? { inline: true } : {})
    }
}

function variableSlot(variable: VariableDefinition) {
    return [
        variable.key,
        variable.namespace || '',
        variable.mode || ''
    ].join('\0')
}

function addVariable(config: Config, variable: InputVariableDefinition) {
    const definition = resolveInputVariable(variable)
    if (definition.mode) addMode(config, definition.mode)
    config.variables ??= []
    const foundIndex = config.variables.findIndex((existing) => variableSlot(existing) === variableSlot(definition))
    if (foundIndex !== -1) config.variables.splice(foundIndex, 1)
    config.variables.push(definition)
}

function normalizeConfig(input: ConfigInput = {}) {
    const inputConfig = getInputConfig(input)
    const config: Config = {}
    if (inputConfig.rootSize !== undefined) config.rootSize = inputConfig.rootSize
    if (inputConfig.baseUnit !== undefined) config.baseUnit = inputConfig.baseUnit
    if (inputConfig.defaultMode !== undefined) config.defaultMode = inputConfig.defaultMode
    if (inputConfig.modeTrigger !== undefined) config.modeTrigger = inputConfig.modeTrigger
    if (inputConfig.scope !== undefined) config.scope = inputConfig.scope
    if (inputConfig.important !== undefined) config.important = inputConfig.important
    if (inputConfig.variants?.length) config.variants = inputConfig.variants.map(cloneVariant)
    if (inputConfig.animations) config.animations = { ...inputConfig.animations }
    if (inputConfig.utilities?.length) config.utilities = inputConfig.utilities.map(cloneUtility)
    if ('functions' in inputConfig && inputConfig.functions) config.functions = { ...inputConfig.functions }

    for (const mode of inputConfig.modes || []) {
        addMode(config, mode)
    }
    for (const variable of inputConfig.variables || []) {
        addVariable(config, variable as InputVariableDefinition)
    }

    return config
}

function createSemanticConfig(config: Config, options: ResolveCSSDirectiveConfigOptions) {
    return extendConfig(options.config, config)
}

function validateTokenConflicts(config: Config, options: ResolveCSSDirectiveConfigOptions) {
    const mergedConfig = createSemanticConfig(config, options)
    const modes = collectModeNames(mergedConfig)
    const breakpoints = collectBreakpointNames(mergedConfig)
    const containers = collectContainerNames(mergedConfig)

    for (const mode of collectModeNames(config)) {
        if (breakpoints.has(mode)) {
            throw new Error(`Mode "${mode}" conflicts with breakpoint variable "--breakpoint-${mode}"`)
        }
    }

    for (const breakpoint of collectBreakpointNames(config)) {
        if (modes.has(breakpoint)) {
            throw new Error(`Breakpoint variable "--breakpoint-${breakpoint}" conflicts with mode "${breakpoint}"`)
        }
    }

    const variantNames = (config.variants || [])
        .filter((variant) => variant.token.startsWith('@'))
        .map((variant) => variant.token.slice(1))
    for (const token of variantNames) {
        if (modes.has(token)) {
            throw new Error(`Variant "${token}" conflicts with mode "${token}"`)
        }
        if (breakpoints.has(token)) {
            throw new Error(`Variant "${token}" conflicts with breakpoint variable "--breakpoint-${token}"`)
        }
        if (containers.has(token)) {
            throw new Error(`Variant "${token}" conflicts with container variable "--container-${token}"`)
        }
    }
}

function warnUnsupportedMediaModes(config: Config, options: ResolveCSSDirectiveConfigOptions, warnings: string[]) {
    const mergedConfig = createSemanticConfig(config, options)
    if (mergedConfig.modeTrigger !== 'media') return

    const customModes = new Set((mergedConfig.modes || []).filter((mode) => !MEDIA_MODE_NAMES.has(mode)))
    const defaultMode = mergedConfig.defaultMode
    if (isNamedDefaultMode(defaultMode) && !MEDIA_MODE_NAMES.has(defaultMode)) {
        customModes.add(defaultMode)
    }
    if (!customModes.size) return

    const modeList = [...customModes].map((mode) => `"${mode}"`).join(', ')
    const subject = customModes.size === 1 ? 'mode' : 'modes'
    warn(warnings, options, `Custom ${subject} ${modeList} will not work with mode-trigger: media. Browsers only support light and dark prefers-color-scheme values; use mode-trigger: class or host for custom modes.`)
}

function createDirectiveCSS(config: Config, options: ResolveCSSDirectiveConfigOptions) {
    return createCSS(createSemanticConfig(config, options))
}

function getUtilityAtRuleDefinitions(utility: Utility) {
    const atRules: string[] = []
    if (utility.atRules) {
        for (const id of AT_IDENTIFIERS) {
            const nodes = utility.atRules[id]
            if (!nodes) continue
            if (id === 'layer' && getComposedUtilityLayer(utility)) continue
            atRules.push(generateAt({ id, nodes }))
        }
    }
    return atRules
}

function getComposedUtilityLayer(utility: Utility) {
    return utility.explicitLayerName
}

function getComposedUtilitySelector(utility: Utility, css: MasterCSS) {
    let selector = utility.selectorTemplate
        ? '&'
        : utility.selectorNodes
        ? generateSelector(utility.selectorNodes, '&')
        : '&'
    if (utility.selectorTemplate) {
        selector = utility.selectorTemplate.replace(/&/g, selector)
    }
    if (utility.mode && css.config.modeTrigger !== 'media') {
        const modeSelector = css.getModeSelector(utility.mode)
        if (modeSelector) selector = `${modeSelector} ${selector}`
    }
    return selector
}

function cloneDeclarations(declarations: PropertiesHyphen, important?: boolean) {
    const result: PropertiesHyphen = {}
    for (const propertyName in declarations) {
        const propertyValue = declarations[propertyName as keyof PropertiesHyphen]
        const value = String(propertyValue)
        result[propertyName as keyof PropertiesHyphen] = (important && !value.endsWith('!important'))
            ? `${value}!important` as any
            : value as any
    }
    return result
}

function createStyleDefinitionsFromCompose(definition: Extract<CSSDirectiveStyleDefinition, { type: 'compose' }>, css: MasterCSS): ComposedStyleDefinition[] {
    const utilities = css.createAll(definition.className)
    if (!utilities.length) {
        throw new CSSDirectiveError(
            'invalid-compose-class',
            `Invalid @compose class: ${definition.className}`,
            definition.source || definition.directiveSource
        )
    }
    return utilities.flatMap((utility) => {
        const selector = getComposedUtilitySelector(utility, css)
        const layer = getComposedUtilityLayer(utility)
        const utilityAtRules = getUtilityAtRuleDefinitions(utility)
        const declarationRules = utility.declarationRules || (utility.declarations ? [{ declarations: utility.declarations }] : [])
        return declarationRules.map(({ declarations, atRules, selector: ruleSelector }) => ({
            utility,
            selector: ruleSelector ? combineStyleSelectors(selector, ruleSelector) : selector,
            declarations: cloneDeclarations(declarations, utility.important),
            ...(layer ? { layer } : {}),
            ...([...utilityAtRules, ...(atRules || [])].length
                ? { atRules: [...utilityAtRules, ...(atRules || [])] }
                : {})
        }))
    })
}

function combineSelectorWrapper(selector: string, wrapper: string) {
    return wrapper.replace(/&/g, selector)
}

type ResolvedStyleBranch = {
    selector: string
    atRules?: string[]
    layer?: UtilityLayerName
}

type ResolvedVariantReferenceBranch = {
    selector?: string
    atRules?: string[]
    layer?: UtilityLayerName
}

function mergeResolvedVariantReferenceBranch(
    branch: ResolvedVariantReferenceBranch,
    resolved: ResolvedVariantReferenceBranch,
    token: string
): ResolvedVariantReferenceBranch {
    const nextLayer = resolved.layer || branch.layer
    if (branch.layer && resolved.layer && branch.layer !== resolved.layer) {
        throw new Error(`@variant ${token} cannot assign multiple layers`)
    }
    return {
        selector: resolved.selector
            ? combineSelectorWrapper(branch.selector || '&', resolved.selector)
            : branch.selector,
        atRules: [...(branch.atRules || []), ...(resolved.atRules || [])],
        ...(nextLayer ? { layer: nextLayer } : {})
    }
}

function cloneConfiguredVariantBranches(token: string, css: MasterCSS): ResolvedVariantReferenceBranch[] | undefined {
    const configuredVariant = css.resolveVariant(token as any)
    if (configuredVariant) {
        return configuredVariant.map((branch) => ({
            ...(branch.selector ? { selector: branch.selector } : {}),
            ...(branch.atRules?.length ? { atRules: [...branch.atRules] } : {}),
            ...(branch.layer ? { layer: branch.layer } : {})
        }))
    }
}

function findClosingParen(value: string, start: number) {
    let depth = 0
    let quote = ''
    for (let index = start; index < value.length; index++) {
        const char = value[index]
        if (quote) {
            if (char === '\\') {
                index++
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            continue
        }
        if (char === '(') depth++
        if (char === ')') {
            depth--
            if (depth === 0) return index
        }
    }
    return -1
}

function resolveSelectorVariantStack(selectorStack: string, css: MasterCSS, token: string): ResolvedVariantReferenceBranch[] {
    let branches: ResolvedVariantReferenceBranch[] = [{}]
    const selectorVariantTokens = [...css.variants.keys()]
        .filter((variantToken) => variantToken.startsWith(':'))
        .sort((a, b) => b.length - a.length)

    let index = 0
    let raw = ''
    const flushRaw = () => {
        if (!raw) return
        const selector = generateSelector(parseSelector(raw, css), '&')
        branches = branches.map((branch) => mergeResolvedVariantReferenceBranch(branch, { selector }, token))
        raw = ''
    }

    while (index < selectorStack.length) {
        const matchedToken = selectorVariantTokens.find((variantToken) => {
            if (!selectorStack.startsWith(variantToken, index)) return false
            const next = selectorStack[index + variantToken.length]
            return next === undefined || next === '(' || !/[-_a-zA-Z0-9]/.test(next)
        })

        if (!matchedToken) {
            raw += selectorStack[index++]
            continue
        }

        const configuredBranches = cloneConfiguredVariantBranches(matchedToken, css)
        if (!configuredBranches) {
            raw += selectorStack[index++]
            continue
        }

        flushRaw()
        index += matchedToken.length
        let suffix = ''
        if (selectorStack[index] === '(') {
            const end = findClosingParen(selectorStack, index)
            if (end !== -1) {
                suffix = selectorStack.slice(index, end + 1)
                index = end + 1
            }
        }

        branches = branches.flatMap((branch) =>
            configuredBranches.map((configuredBranch) => {
                const selector = configuredBranch.selector && suffix
                    ? configuredBranch.selector + suffix
                    : configuredBranch.selector
                return mergeResolvedVariantReferenceBranch(
                    branch,
                    { ...configuredBranch, ...(selector ? { selector } : {}) },
                    token
                )
            })
        )
    }

    flushRaw()
    return branches
}

function resolveAtVariantReference(token: string, css: MasterCSS): ResolvedVariantReferenceBranch[] {
    const configuredVariant = cloneConfiguredVariantBranches(token, css)
    if (configuredVariant) return configuredVariant
    const atToken = token.slice(1)
    if (css.modes.includes(atToken)) {
        const modeSelector = css.getModeSelector(atToken)
        return modeSelector
            ? [{ selector: `${modeSelector} &` }]
            : [{ atRules: [`@media (prefers-color-scheme:${atToken})`] }]
    }

    if (/^-?[_a-zA-Z][-_a-zA-Z0-9]*$/.test(atToken) && !css.atRules.has(atToken)) {
        throw new Error(`Unknown @variant token: ${token}`)
    }

    return [{ atRules: [generateAt(parseAt(atToken, css))] }]
}

function resolveMasterVariantReference(token: string, css: MasterCSS): ResolvedVariantReferenceBranch[] {
    if (!token.startsWith(':') && !token.startsWith('@')) {
        throw new Error(`@variant requires a full variant token: ${token}`)
    }

    const [selectorStack = '', ...conditionStacks] = token.split('@')
    let branches = selectorStack
        ? resolveSelectorVariantStack(selectorStack, css, token)
        : [{}]

    for (const conditionStack of conditionStacks) {
        if (!conditionStack) continue
        const resolvedBranches = resolveAtVariantReference(`@${conditionStack}`, css)
        branches = branches.flatMap((branch) =>
            resolvedBranches.map((resolved) => mergeResolvedVariantReferenceBranch(branch, resolved, token))
        )
    }

    return branches
}

function resolveConfiguredBranches(atRules: string[] | undefined, css: MasterCSS, selector = '&', layer?: UtilityLayerName): ResolvedStyleBranch[] {
    let branches: ResolvedStyleBranch[] = [{ selector, ...(layer ? { layer } : {}) }]
    if (!atRules?.length) return branches

    for (const atRule of atRules) {
        const token = readCSSDirectiveVariantReference(atRule)
        if (!token) {
            branches = branches.map((branch) => ({
                ...branch,
                atRules: [...(branch.atRules || []), atRule]
            }))
            continue
        }

        const resolvedBranches = resolveMasterVariantReference(token, css)
        branches = branches.flatMap((branch) =>
            resolvedBranches.map((resolved) => {
                const nextLayer = resolved.layer || branch.layer
                if (branch.layer && resolved.layer && branch.layer !== resolved.layer) {
                    throw new Error(`@variant ${token} cannot assign multiple layers`)
                }
                return {
                    selector: resolved.selector
                        ? combineSelectorWrapper(branch.selector, resolved.selector)
                        : branch.selector,
                    atRules: [...(branch.atRules || []), ...(resolved.atRules || [])],
                    ...(nextLayer ? { layer: nextLayer } : {})
                }
            })
        )
    }

    return branches.map((branch) => ({
        selector: branch.selector,
        ...(branch.atRules?.length ? { atRules: branch.atRules } : {}),
        ...(branch.layer ? { layer: branch.layer } : {})
    }))
}

function ensureUtilityRules(definition: UtilityDefinition) {
    if (!definition.declarations) return
    const declarations = definition.declarations as PropertiesHyphen
    delete definition.declarations
    const atRules = definition.atRules
    delete definition.atRules
    definition.rules ??= []
    definition.rules.push({
        ...(atRules?.length ? { atRules: [...atRules] } : {}),
        declarations
    })
}

function finalizeUtilityDefinitions(config: Config, css: MasterCSS) {
    const utilities = config.utilities
    if (!utilities?.length) return

    for (const definition of utilities) {
        if (definition.atRules?.some(readCSSDirectiveVariantReference)) {
            const resolvedBranches = resolveConfiguredBranches(definition.atRules, css)
            delete definition.atRules
            if (definition.declarations) {
                definition.rules ??= []
                for (const resolved of resolvedBranches) {
                    definition.rules.push({
                        declarations: definition.declarations as PropertiesHyphen,
                        ...(resolved.selector !== '&' ? { selector: resolved.selector } : {}),
                        ...(resolved.atRules?.length ? { atRules: resolved.atRules } : {})
                    })
                }
                delete definition.declarations
            }
        }

        if (!definition.rules?.length) continue
        definition.rules = definition.rules.flatMap((rule) => {
            const resolvedBranches = resolveConfiguredBranches(rule.atRules, css, rule.selector || '&')
            return resolvedBranches.map((resolved) => ({
                declarations: rule.declarations,
                ...(resolved.selector !== '&' ? { selector: resolved.selector } : {}),
                ...(resolved.atRules?.length ? { atRules: resolved.atRules } : {})
            }))
        })
    }
}

function getStyleMergeBucketKey(selector: string, atRules: string[] | undefined, layer: UtilityLayerName | undefined) {
    return JSON.stringify([layer || '', selector, atRules || []])
}

function getStyleMergeBucket(
    buckets: Map<string, StyleMergeBucket>,
    selector: string,
    atRules: string[] | undefined,
    layer: UtilityLayerName | undefined,
    order: number
) {
    const key = getStyleMergeBucketKey(selector, atRules, layer)
    const existingBucket = buckets.get(key)
    if (existingBucket) {
        existingBucket.order = Math.min(existingBucket.order, order)
        return existingBucket
    }
    const bucket: StyleMergeBucket = {
        selector,
        ...(atRules?.length ? { atRules } : {}),
        ...(layer ? { layer } : {}),
        order,
        events: []
    }
    buckets.set(key, bucket)
    return bucket
}

function isImportantStyleDeclarationValue(value: unknown) {
    return String(value).trim().endsWith('!important')
}

function applyStyleDeclaration(declarations: PropertiesHyphen, propertyName: string, value: unknown) {
    const key = propertyName as keyof PropertiesHyphen
    const currentValue = declarations[key]
    if (currentValue !== undefined && isImportantStyleDeclarationValue(currentValue) && !isImportantStyleDeclarationValue(value)) {
        return
    }
    delete declarations[key]
    declarations[key] = value as any
}

function applyStyleDeclarations(declarations: PropertiesHyphen, incomingDeclarations: PropertiesHyphen) {
    for (const propertyName in incomingDeclarations) {
        applyStyleDeclaration(declarations, propertyName, incomingDeclarations[propertyName as keyof PropertiesHyphen])
    }
}

function createMergedStyleDefinition(bucket: StyleMergeBucket): MergedStyleDefinition | undefined {
    const declarations: PropertiesHyphen = {}
    const composeBatch: Extract<StyleMergeEvent, { type: 'compose' }>[] = []
    const flushComposeBatch = () => {
        composeBatch.sort((a, b) => compareRulePriority(a.utility, b.utility) || a.order - b.order)
        for (const event of composeBatch) {
            applyStyleDeclarations(declarations, event.declarations)
        }
        composeBatch.length = 0
    }

    for (const event of [...bucket.events].sort((a, b) => a.order - b.order)) {
        if (event.type === 'compose') {
            composeBatch.push(event)
            continue
        }
        flushComposeBatch()
        applyStyleDeclarations(declarations, event.declarations)
    }
    flushComposeBatch()

    if (!Object.keys(declarations).length) return
    return {
        selector: bucket.selector,
        declarations,
        ...(bucket.atRules?.length ? { atRules: bucket.atRules } : {}),
        ...(bucket.layer ? { layer: bucket.layer } : {})
    }
}

function pushStyleMergeEvent(
    buckets: Map<string, StyleMergeBucket>,
    selector: string,
    atRules: string[] | undefined,
    layer: UtilityLayerName | undefined,
    event: StyleMergeEvent
) {
    getStyleMergeBucket(buckets, selector, atRules, layer, event.order).events.push(event)
}

function normalizeStyleAtFeatureValue(value: number, unit: string, rootSize: number) {
    if (unit === 'px') return value / rootSize
    return value
}

function getStyleAtRuleFeatures(atRules: string[] | undefined, rootSize: number) {
    const featureMap = new Map<string, { min?: number, max?: number }>()
    for (const atRule of atRules || []) {
        for (const match of atRule.matchAll(STYLE_AT_FEATURE_REGEX)) {
            const [, name, operator, rawValue, unit] = match
            const value = normalizeStyleAtFeatureValue(Number(rawValue), unit, rootSize)
            const entry = featureMap.get(name) ?? {}
            switch (operator) {
                case '>':
                    entry.min = value + 0.02
                    break
                case '>=':
                    entry.min = value
                    break
                case '<':
                    entry.max = value - 0.02
                    break
                case '<=':
                    entry.max = value
                    break
            }
            featureMap.set(name, entry)
        }
    }
    return [...featureMap.entries()]
        .map(([name, entry]) => [
            name,
            entry.min ?? 0,
            entry.max ?? Number.MAX_SAFE_INTEGER
        ] as StyleAtRuleFeature)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
}

function compareStyleAtRuleFeatures(
    a: StyleAtRuleFeature[],
    b: StyleAtRuleFeature[]
) {
    const len = Math.max(a.length, b.length)
    for (let index = 0; index < len; index++) {
        const left = a[index]
        const right = b[index]
        if (!left) return -1
        if (!right) return 1
        const [nameA, minA, maxA] = left
        const [nameB, minB, maxB] = right
        const nameCompare = nameA.localeCompare(nameB, undefined, { numeric: true })
        if (nameCompare !== 0) return nameCompare
        const rangeA = maxA - minA
        const rangeB = maxB - minB
        if (rangeA !== rangeB) return rangeB - rangeA
        if (minA !== minB) return minB - minA
        if (maxA !== maxB) return maxB - maxA
    }
    return 0
}

function compareStyleMergeBuckets(a: StyleMergeBucket, b: StyleMergeBucket, rootSize: number) {
    const layerA = a.layer || 'components'
    const layerB = b.layer || 'components'
    if (layerA === layerB && a.selector === b.selector) {
        const atRuleStateA = a.atRules?.length ? 1 : 0
        const atRuleStateB = b.atRules?.length ? 1 : 0
        if (atRuleStateA !== atRuleStateB) return atRuleStateA - atRuleStateB
        if (atRuleStateA && atRuleStateB) {
            const featuresA = getStyleAtRuleFeatures(a.atRules, rootSize)
            const featuresB = getStyleAtRuleFeatures(b.atRules, rootSize)
            if (featuresA.length && featuresB.length) {
                const featureCompare = compareStyleAtRuleFeatures(featuresA, featuresB)
                if (featureCompare !== 0) return featureCompare
            }
        }
    }
    return a.order - b.order
}

function getStaticUtilityDefinition(config: Config, name: string, layer: UtilityLayerName) {
    config.utilities ??= []
    const existingDefinition = config.utilities.find((definition) =>
        definition.name === name
        && (definition.type ?? UtilityType.Static) === UtilityType.Static
        && (definition.layer || 'utilities') === layer
    )
    if (existingDefinition) {
        existingDefinition.type = UtilityType.Static
        existingDefinition.layer = layer
        return existingDefinition
    }
    const definition = {
        name,
        type: UtilityType.Static,
        layer,
        unit: '',
        separators: [',']
    } satisfies UtilityDefinition
    config.utilities.push(definition)
    return definition
}

function pushStaticUtilityStyleRule(definition: UtilityDefinition, styleDefinition: MergedStyleDefinition) {
    const rule = {
        declarations: styleDefinition.declarations,
        ...(styleDefinition.selector !== '&' ? { selector: styleDefinition.selector } : {}),
        ...(styleDefinition.atRules?.length ? { atRules: styleDefinition.atRules } : {})
    } satisfies UtilityRuleDefinition
    if (!definition.declarations && !definition.rules?.length && !rule.selector && !rule.atRules?.length) {
        definition.declarations = rule.declarations
        return
    }
    ensureUtilityRules(definition)
    definition.rules ??= []
    definition.rules.push(rule)
}

function toUtilityLayerName(layer?: CSSDirectiveLayerName) {
    return layer as UtilityLayerName | undefined
}

type ManagedStyleDefinition = CSSDirectiveStyleDefinition & { name: string }
type ManagedComposeStyleDefinition = Extract<CSSDirectiveStyleDefinition, { type: 'compose' }> & { name: string }

function getManagedStyleDefinitionLayer(definition: ManagedStyleDefinition): UtilityLayerName {
    return toUtilityLayerName(definition.layer) || 'components'
}

function getManagedStyleDefinitionKey(definition: ManagedStyleDefinition) {
    return `${definition.name}\0${getManagedStyleDefinitionLayer(definition)}`
}

function splitManagedStyleDefinitionKey(key: string) {
    const [name, layer] = key.split('\0')
    return {
        name,
        layer: layer as UtilityLayerName
    }
}

function isManagedStyleDefinition(definition: CSSDirectiveStyleDefinition): definition is ManagedStyleDefinition {
    return Boolean(definition.name)
}

function createMergedStyleDefinitions(
    definitions: CSSDirectiveStyleDefinition[],
    css: MasterCSS,
    targetLayer?: UtilityLayerName
) {
    const buckets = new Map<string, StyleMergeBucket>()
    for (const definition of definitions) {
        if (definition.type === 'compose') {
            const composedDefinitions = createStyleDefinitionsFromCompose(definition, css)
            for (const composedDefinition of composedDefinitions) {
                const { atRules: composedAtRules, ...composedDefinitionWithoutAtRules } = composedDefinition
                const selector = combineStyleSelectors(definition.selector, composedDefinition.selector)
                const resolvedBranches = resolveConfiguredBranches([
                    ...(definition.atRules || []),
                    ...(composedAtRules || [])
                ], css, selector, targetLayer || composedDefinitionWithoutAtRules.layer)
                for (const resolved of resolvedBranches) {
                    pushStyleMergeEvent(buckets, resolved.selector, resolved.atRules, resolved.layer, {
                        type: 'compose',
                        order: definition.order,
                        utility: composedDefinitionWithoutAtRules.utility,
                        declarations: composedDefinitionWithoutAtRules.declarations
                    })
                }
            }
        } else {
            const resolvedBranches = resolveConfiguredBranches(definition.atRules, css, definition.selector, targetLayer || toUtilityLayerName(definition.layer))
            for (const resolved of resolvedBranches) {
                pushStyleMergeEvent(buckets, resolved.selector, resolved.atRules, resolved.layer, {
                    type: 'native',
                    order: definition.order,
                    declarations: definition.declarations
                })
            }
        }
    }

    const rootSize = css.config.rootSize || 16
    return [...buckets.values()]
        .sort((a, b) => compareStyleMergeBuckets(a, b, rootSize))
        .flatMap((bucket) => {
            const definition = createMergedStyleDefinition(bucket)
            return definition ? [definition] : []
        })
}

function getManagedComposeDependencyName(className: string, names: Set<string>) {
    const sortedNames = [...names].sort((a, b) => b.length - a.length)
    for (const name of sortedNames) {
        if (className === name) return name
        const next = className[name.length]
        if (className.startsWith(name) && (next === ':' || next === '@' || next === '!')) {
            return name
        }
    }
}

function sortManagedStyleDefinitionKeys(
    groups: Map<string, ManagedStyleDefinition[]>,
    keysByName: Map<string, Set<string>>
) {
    const names = new Set(keysByName.keys())
    const dependencies = new Map<string, Set<string>>()
    const dependencyDefinitions = new Map<string, ManagedComposeStyleDefinition>()
    for (const [key, definitions] of groups) {
        const keyDependencies = new Set<string>()
        for (const definition of definitions) {
            if (definition.type !== 'compose') continue
            const dependencyName = getManagedComposeDependencyName(definition.className, names)
            if (!dependencyName) continue
            for (const dependencyKey of keysByName.get(dependencyName) || []) {
                keyDependencies.add(dependencyKey)
                dependencyDefinitions.set(`${key}\0${dependencyKey}`, definition)
            }
        }
        dependencies.set(key, keyDependencies)
    }

    const sorted: string[] = []
    const seen = new Set<string>()
    const visiting = new Set<string>()
    const path: string[] = []

    function visit(key: string) {
        if (seen.has(key)) return
        if (visiting.has(key)) {
            const cycleKeys = [...path.slice(path.indexOf(key)), key]
            const cycle = cycleKeys
                .map((cycleKey) => splitManagedStyleDefinitionKey(cycleKey).name)
                .join(' -> ')
            const related = cycleKeys.slice(0, -1).flatMap((cycleKey, index) => {
                const nextKey = cycleKeys[index + 1]
                const definition = dependencyDefinitions.get(`${cycleKey}\0${nextKey}`)
                const source = definition?.source || definition?.directiveSource
                return source
                    ? [{
                        message: `${splitManagedStyleDefinitionKey(cycleKey).name} composes ${definition.className}`,
                        source
                    }]
                    : []
            })
            throw new CSSDirectiveError(
                'circular-compose-dependency',
                `Circular @compose dependency detected: ${cycle}`,
                related[0]?.source,
                related
            )
        }
        visiting.add(key)
        path.push(key)
        for (const dependency of dependencies.get(key) || []) {
            visit(dependency)
        }
        path.pop()
        visiting.delete(key)
        seen.add(key)
        sorted.push(key)
    }

    for (const key of groups.keys()) {
        visit(key)
    }
    return sorted
}

function renderStyleDefinitions(definitions: MergedStyleDefinition[]) {
    return definitions.map((definition) => {
        const body = Object.entries(definition.declarations)
            .map(([propertyName, value]) => `${propertyName}:${value}`)
            .join(';')
        return wrapAtRules(`${definition.selector}{${body}}`, definition.atRules)
    }).join('')
}

function finalizeStyleDefinitions(
    config: Config,
    styleDefinitions: CSSDirectiveStyleDefinition[] | undefined,
    css: MasterCSS,
    options: ResolveCSSDirectiveConfigOptions
) {
    if (!styleDefinitions?.length) return ''

    const managedGroups = new Map<string, ManagedStyleDefinition[]>()
    const keysByName = new Map<string, Set<string>>()
    const nativeDefinitions: CSSDirectiveStyleDefinition[] = []

    for (const definition of styleDefinitions) {
        if (!isManagedStyleDefinition(definition)) {
            nativeDefinitions.push(definition)
            continue
        }
        const key = getManagedStyleDefinitionKey(definition)
        const group = managedGroups.get(key)
        if (group) {
            group.push(definition)
        } else {
            managedGroups.set(key, [definition])
        }
        const nameKeys = keysByName.get(definition.name)
        if (nameKeys) {
            nameKeys.add(key)
        } else {
            keysByName.set(definition.name, new Set([key]))
        }
    }

    for (const key of sortManagedStyleDefinitionKeys(managedGroups, keysByName)) {
        const definitions = managedGroups.get(key)!
        const { name, layer } = splitManagedStyleDefinitionKey(key)
        const mergedDefinitions = createMergedStyleDefinitions(definitions, css, layer)
        for (const definition of mergedDefinitions) {
            const utilityDefinition = getStaticUtilityDefinition(config, name, layer)
            pushStaticUtilityStyleRule(utilityDefinition, definition)
        }
        css.refresh(createSemanticConfig(config, options))
    }

    if (!nativeDefinitions.length) return ''
    return renderStyleDefinitions(createMergedStyleDefinitions(nativeDefinitions, css))
}

function resolveCSSDirectiveConfigInput(input: CSSDirectiveInput, options: ResolveCSSDirectiveConfigOptions = {}): CSSDirectiveConfigResolution {
    const config = normalizeConfig(getDirectiveConfig(input))
    const warnings = isCSSDirectiveResult(input) ? [...input.warnings] : []

    validateTokenConflicts(config, options)
    warnUnsupportedMediaModes(config, options, warnings)

    const css = createDirectiveCSS(config, options)
    finalizeUtilityDefinitions(config, css)
    css.refresh(createSemanticConfig(config, options))
    const generatedCSS = finalizeStyleDefinitions(config, getDirectiveStyleDefinitions(input), css, options)

    return {
        config,
        warnings,
        generatedCSS
    }
}

export default function resolveCSSDirectiveConfig(input: CSSDirectiveInput, options: ResolveCSSDirectiveConfigOptions = {}): CSSDirectiveConfigResolution {
    return resolveCSSDirectiveConfigInput(input, {
        ...options,
        config: extendConfig(coreConfig, options.config)
    })
}

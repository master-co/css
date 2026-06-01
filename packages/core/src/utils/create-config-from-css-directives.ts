import {
    readCSSDirectiveAtRuleReference,
    type CSSDirectiveComponentDefinition,
    type CSSDirectiveConfig,
    type CSSDirectiveLayerName,
    type CSSDirectiveResult,
    type CSSDirectiveUtilityDefinition,
    type CSSDirectiveUtilityRuleDefinition,
    type CSSDirectiveVariableDefinition
} from 'shared/css-directives'
import type { PropertiesHyphen } from 'csstype'
import { AT_IDENTIFIERS } from '../common'
import MasterCSS from '../core'
import UtilityType from 'shared/utility-type'
import defaultAnimations from '../config/animations'
import defaultAtTokens from '../config/at-tokens'
import defaultFunctions from '../config/functions'
import defaultSelectorTokens from '../config/selector-tokens'
import defaultUtilities from '../config/utilities'
import defaultVariables, { modes as defaultModes, screens as defaultScreens } from '../config/variables'
import type { Config, UtilityDefinition, UtilityLayerName, UtilityRuleDefinition, VariableDefinition } from 'shared/css-config'
import type { Utility } from '../utility'
import compareRulePriority from './compare-rule-priority'
import extendConfig from './extend-config'
import generateAt from './generate-at'
import generateSelector from './generate-selector'
import parseAt from './parse-at'
import resolveSelectorTokens from './resolve-selector-tokens'
import resolveVariableNamespace from './resolve-variable-namespace'

export interface CreateConfigFromCSSDirectivesOptions {
    config?: Config
    baseConfig?: Config
    onWarning?: (warning: string) => void
}

export interface CSSDirectiveConfigResult {
    config: Config
    warnings: string[]
}

type CSSDirectiveInput = CSSDirectiveResult | CSSDirectiveConfig

interface MergedStyleDefinition {
    selector: string
    declarations: PropertiesHyphen
    atRules?: string[]
    layer?: UtilityLayerName
}

interface ComposedComponentDefinition extends MergedStyleDefinition {
    utility: Utility
}

type ComponentMergeEvent =
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

interface ComponentMergeBucket {
    selector: string
    atRules?: string[]
    layer?: UtilityLayerName
    order: number
    events: ComponentMergeEvent[]
}

type ComponentAtRuleFeature = [string, number, number]

const COMPONENT_AT_FEATURE_REGEX = /\(\s*(width|height|resolution)\s*(>=|<=|>|<)\s*(-?(?:\d+(?:\.\d+)?|\.\d+))([a-z%]*)\s*\)/g
const DEFAULT_MODE_NAMES = new Set(defaultModes)
const DEFAULT_SCREEN_NAMES = new Set(Object.keys(defaultScreens))

function isCSSDirectiveResult(input: CSSDirectiveInput): input is CSSDirectiveResult {
    return 'config' in input
}

function getDirectiveConfig(input: CSSDirectiveInput) {
    return isCSSDirectiveResult(input) ? input.config : input
}

function getDirectiveComponents(input: CSSDirectiveInput) {
    return isCSSDirectiveResult(input) ? input.componentDefinitions : undefined
}

function createDefaultBaseConfig(): Config {
    return {
        atTokens: defaultAtTokens,
        selectorTokens: defaultSelectorTokens,
        utilities: defaultUtilities,
        functions: defaultFunctions,
        animations: defaultAnimations,
        variables: defaultVariables,
        modes: defaultModes,
        scope: '',
        rootSize: 16,
        baseUnit: 4,
        important: false,
        defaultMode: 'light',
        modeTrigger: 'media'
    }
}

function cloneUtilityRule(rule: CSSDirectiveUtilityRuleDefinition): UtilityRuleDefinition {
    return {
        declarations: { ...rule.declarations },
        ...(rule.selector ? { selector: rule.selector } : {}),
        ...(rule.atRules?.length ? { atRules: [...rule.atRules] } : {})
    }
}

function cloneUtility(definition: CSSDirectiveUtilityDefinition): UtilityDefinition {
    return {
        name: definition.name,
        type: UtilityType.Static,
        ...(definition.layer ? { layer: definition.layer } : {}),
        ...(definition.declarations ? { declarations: { ...definition.declarations } } : {}),
        ...(definition.atRules?.length ? { atRules: [...definition.atRules] } : {}),
        ...(definition.rules?.length ? { rules: definition.rules.map(cloneUtilityRule) } : {})
    }
}

function addMode(config: Config, mode: string) {
    if (DEFAULT_MODE_NAMES.has(mode)) return
    config.modes ??= []
    if (!config.modes.includes(mode)) config.modes.push(mode)
}

function resolveDirectiveVariable(variable: CSSDirectiveVariableDefinition): VariableDefinition {
    const resolved = variable.key
        ? {
            name: variable.name,
            namespace: variable.namespace,
            key: variable.key
        }
        : resolveVariableNamespace(variable.name)
    if (variable.mode && resolved.namespace === 'screen') {
        throw new Error(`Screen variables cannot be mode-specific: screen-${resolved.key}@${variable.mode}`)
    }
    return {
        ...(resolved.namespace ? { namespace: resolved.namespace } : {}),
        key: resolved.key,
        value: variable.value,
        ...(variable.mode ? { mode: variable.mode } : {})
    }
}

function variableSlot(variable: VariableDefinition) {
    return [
        variable.key,
        variable.namespace || '',
        variable.mode || ''
    ].join('\0')
}

function addVariable(config: Config, variable: CSSDirectiveVariableDefinition) {
    const definition = resolveDirectiveVariable(variable)
    if (definition.mode) addMode(config, definition.mode)
    config.variables ??= []
    const foundIndex = config.variables.findIndex((existing) => variableSlot(existing) === variableSlot(definition))
    if (foundIndex !== -1) config.variables.splice(foundIndex, 1)
    config.variables.push(definition)
}

function createConfig(input: CSSDirectiveConfig) {
    const config: Config = {}
    if (input.rootSize !== undefined) config.rootSize = input.rootSize
    if (input.baseUnit !== undefined) config.baseUnit = input.baseUnit
    if (input.defaultMode !== undefined) config.defaultMode = input.defaultMode
    if (input.modeTrigger !== undefined) config.modeTrigger = input.modeTrigger
    if (input.scope !== undefined) config.scope = input.scope
    if (input.important !== undefined) config.important = input.important
    if (input.atTokens) config.atTokens = { ...input.atTokens }
    if (input.selectorTokens) config.selectorTokens = { ...input.selectorTokens }
    if (input.animations) config.animations = { ...input.animations }
    if (input.utilities?.length) config.utilities = input.utilities.map(cloneUtility)

    for (const mode of input.modes || []) {
        addMode(config, mode)
    }
    for (const variable of input.variables || []) {
        addVariable(config, variable)
    }

    return config
}

function warn(warnings: string[], options: CreateConfigFromCSSDirectivesOptions, message: string) {
    warnings.push(message)
    options.onWarning?.(message)
}

function validateTokenConflicts(config: Config) {
    const modes = new Set([...DEFAULT_MODE_NAMES, ...(config.modes || [])])
    const customScreens = (config.variables || [])
        .filter((variable) => variable.namespace === 'screen')
        .map((variable) => variable.key)
    const screens = new Set([...DEFAULT_SCREEN_NAMES, ...customScreens])

    for (const mode of config.modes || []) {
        if (screens.has(mode)) {
            throw new Error(`Mode "${mode}" conflicts with screen variable "--screen-${mode}"`)
        }
    }

    for (const screen of screens) {
        if (modes.has(screen)) {
            throw new Error(`Screen variable "--screen-${screen}" conflicts with mode "${screen}"`)
        }
    }

    const atTokens = config.atTokens
    if (!atTokens) return
    for (const token of Object.keys(atTokens)) {
        if (modes.has(token)) {
            throw new Error(`@custom-at "${token}" conflicts with mode "${token}"`)
        }
        if (screens.has(token)) {
            throw new Error(`@custom-at "${token}" conflicts with screen variable "--screen-${token}"`)
        }
    }
}

function warnUnsupportedMediaModes(config: Config, options: CreateConfigFromCSSDirectivesOptions, warnings: string[]) {
    const mergedConfig = extendConfig(createDefaultBaseConfig(), options.config, config)
    if (mergedConfig.modeTrigger !== 'media') return

    const customModes = new Set((mergedConfig.modes || []).filter((mode) => !DEFAULT_MODE_NAMES.has(mode)))
    if (typeof mergedConfig.defaultMode === 'string' && !DEFAULT_MODE_NAMES.has(mergedConfig.defaultMode)) {
        customModes.add(mergedConfig.defaultMode)
    }
    if (!customModes.size) return

    const modeList = [...customModes].map((mode) => `"${mode}"`).join(', ')
    const subject = customModes.size === 1 ? 'mode' : 'modes'
    warn(warnings, options, `Custom ${subject} ${modeList} will not work with mode-trigger: media. Browsers only support light and dark prefers-color-scheme values; use mode-trigger: class or host for custom modes.`)
}

function createDirectiveCSS(config: Config, options: CreateConfigFromCSSDirectivesOptions) {
    return new MasterCSS(options.baseConfig || createDefaultBaseConfig(), extendConfig(options.config, config))
}

function getUtilityAtRuleDefinitions(utility: Utility) {
    const atRules: string[] = []
    if (utility.atRules) {
        for (const id of AT_IDENTIFIERS) {
            const nodes = utility.atRules[id]
            if (!nodes) continue
            if (id === 'layer' && getUtilityComponentLayer(utility)) continue
            atRules.push(generateAt({ id, nodes }))
        }
    }
    return atRules
}

function getUtilityComponentLayer(utility: Utility) {
    return utility.explicitLayerName
}

function getUtilityComponentSelector(utility: Utility, css: MasterCSS) {
    let selector = utility.selectorNodes
        ? generateSelector(utility.selectorNodes, '&')
        : '&'
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

function splitSelectorList(selectorText: string) {
    const selectors: string[] = []
    let current = ''
    let depth = 0
    let quote = ''

    for (let index = 0; index < selectorText.length; index++) {
        const char = selectorText[index]
        if (quote) {
            current += char
            if (char === '\\') {
                current += selectorText[++index] || ''
            } else if (char === quote) {
                quote = ''
            }
            continue
        }
        if (char === '"' || char === '\'') {
            quote = char
            current += char
            continue
        }
        if (char === '(' || char === '[') {
            depth++
            current += char
            continue
        }
        if (char === ')' || char === ']') {
            depth--
            current += char
            continue
        }
        if (char === ',' && depth === 0) {
            selectors.push(current.trim())
            current = ''
            continue
        }
        current += char
    }

    if (current.trim()) selectors.push(current.trim())
    return selectors
}

function combineComponentSelectors(parentSelector: string, childSelector: string) {
    const parentSelectors = splitSelectorList(parentSelector)
    const childSelectors = splitSelectorList(childSelector)
    const selectors: string[] = []

    for (const child of childSelectors) {
        for (const parent of parentSelectors) {
            selectors.push(child.includes('&')
                ? child.replace(/&/g, parent)
                : `${parent} ${child}`
            )
        }
    }

    return selectors.join(',')
}

function createComponentDefinitionsFromCompose(className: string, css: MasterCSS): ComposedComponentDefinition[] {
    const utility = css.create(className)
    if (!utility?.valid) {
        throw new Error(`Invalid @compose class: ${className}`)
    }
    const selector = getUtilityComponentSelector(utility, css)
    const layer = getUtilityComponentLayer(utility)
    const utilityAtRules = getUtilityAtRuleDefinitions(utility)
    const declarationRules = utility.declarationRules || (utility.declarations ? [{ declarations: utility.declarations }] : [])
    return declarationRules.map(({ declarations, atRules, selector: ruleSelector }) => ({
        utility,
        selector: ruleSelector ? combineComponentSelectors(selector, ruleSelector) : selector,
        declarations: cloneDeclarations(declarations, utility.important),
        ...(layer ? { layer } : {}),
        ...([...utilityAtRules, ...(atRules || [])].length
            ? { atRules: [...utilityAtRules, ...(atRules || [])] }
            : {})
    }))
}

function combineSelectorWrapper(selector: string, wrapper: string) {
    return wrapper.replace(/&/g, selector)
}

function resolveMasterAtRuleReference(token: string, css: MasterCSS) {
    if (css.modes.includes(token)) {
        const modeSelector = css.getModeSelector(token)
        return modeSelector
            ? { selector: `${modeSelector} &` }
            : { atRules: [`@media (prefers-color-scheme:${token})`] }
    }

    return {
        atRules: [generateAt(parseAt(token, css))]
    }
}

function resolveConfiguredAtRules(atRules: string[] | undefined, css: MasterCSS, selector = '&') {
    if (!atRules?.length) return { selector, atRules: undefined }

    const resolvedAtRules: string[] = []
    let resolvedSelector = selector

    for (const atRule of atRules) {
        const token = readCSSDirectiveAtRuleReference(atRule)
        if (!token) {
            resolvedAtRules.push(atRule)
            continue
        }
        const resolved = resolveMasterAtRuleReference(token, css)
        if (resolved.selector) {
            resolvedSelector = combineSelectorWrapper(resolvedSelector, resolved.selector)
        }
        if (resolved.atRules?.length) {
            resolvedAtRules.push(...resolved.atRules)
        }
    }

    return {
        selector: resolvedSelector,
        atRules: resolvedAtRules.length ? resolvedAtRules : undefined
    }
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
        if (definition.atRules?.some(readCSSDirectiveAtRuleReference)) {
            const resolved = resolveConfiguredAtRules(definition.atRules, css)
            delete definition.atRules
            if (definition.declarations) {
                definition.rules ??= []
                definition.rules.push({
                    declarations: definition.declarations as PropertiesHyphen,
                    ...(resolved.selector !== '&' ? { selector: resolved.selector } : {}),
                    ...(resolved.atRules?.length ? { atRules: resolved.atRules } : {})
                })
                delete definition.declarations
            }
        }

        if (!definition.rules?.length) continue
        definition.rules = definition.rules.map((rule) => {
            const resolved = resolveConfiguredAtRules(rule.atRules, css, rule.selector || '&')
            return {
                declarations: rule.declarations,
                ...(resolved.selector !== '&' ? { selector: resolved.selector } : {}),
                ...(resolved.atRules?.length ? { atRules: resolved.atRules } : {})
            }
        })
    }
}

function resolveComponentSelector(selector: string, css: MasterCSS) {
    return css.config.selectorTokens
        ? resolveSelectorTokens(selector, css.config.selectorTokens)
        : selector
}

function getComponentMergeBucketKey(selector: string, atRules: string[] | undefined, layer: UtilityLayerName | undefined) {
    return JSON.stringify([layer || '', selector, atRules || []])
}

function getComponentMergeBucket(
    buckets: Map<string, ComponentMergeBucket>,
    selector: string,
    atRules: string[] | undefined,
    layer: UtilityLayerName | undefined,
    order: number
) {
    const key = getComponentMergeBucketKey(selector, atRules, layer)
    const existingBucket = buckets.get(key)
    if (existingBucket) {
        existingBucket.order = Math.min(existingBucket.order, order)
        return existingBucket
    }
    const bucket: ComponentMergeBucket = {
        selector,
        ...(atRules?.length ? { atRules } : {}),
        ...(layer ? { layer } : {}),
        order,
        events: []
    }
    buckets.set(key, bucket)
    return bucket
}

function isImportantDeclarationValue(value: unknown) {
    return String(value).trim().endsWith('!important')
}

function applyComponentDeclaration(declarations: PropertiesHyphen, propertyName: string, value: unknown) {
    const key = propertyName as keyof PropertiesHyphen
    const currentValue = declarations[key]
    if (currentValue !== undefined && isImportantDeclarationValue(currentValue) && !isImportantDeclarationValue(value)) {
        return
    }
    delete declarations[key]
    declarations[key] = value as any
}

function applyComponentDeclarations(declarations: PropertiesHyphen, incomingDeclarations: PropertiesHyphen) {
    for (const propertyName in incomingDeclarations) {
        applyComponentDeclaration(declarations, propertyName, incomingDeclarations[propertyName as keyof PropertiesHyphen])
    }
}

function createMergedComponentDefinition(bucket: ComponentMergeBucket): MergedStyleDefinition | undefined {
    const declarations: PropertiesHyphen = {}
    const composeBatch: Extract<ComponentMergeEvent, { type: 'compose' }>[] = []
    const flushComposeBatch = () => {
        composeBatch.sort((a, b) => compareRulePriority(a.utility, b.utility) || a.order - b.order)
        for (const event of composeBatch) {
            applyComponentDeclarations(declarations, event.declarations)
        }
        composeBatch.length = 0
    }

    for (const event of [...bucket.events].sort((a, b) => a.order - b.order)) {
        if (event.type === 'compose') {
            composeBatch.push(event)
            continue
        }
        flushComposeBatch()
        applyComponentDeclarations(declarations, event.declarations)
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

function pushComponentMergeEvent(
    buckets: Map<string, ComponentMergeBucket>,
    selector: string,
    atRules: string[] | undefined,
    layer: UtilityLayerName | undefined,
    event: ComponentMergeEvent
) {
    getComponentMergeBucket(buckets, selector, atRules, layer, event.order).events.push(event)
}

function normalizeComponentAtFeatureValue(value: number, unit: string, rootSize: number) {
    if (unit === 'px') return value / rootSize
    return value
}

function getComponentAtRuleFeatures(atRules: string[] | undefined, rootSize: number) {
    const featureMap = new Map<string, { min?: number, max?: number }>()
    for (const atRule of atRules || []) {
        for (const match of atRule.matchAll(COMPONENT_AT_FEATURE_REGEX)) {
            const [, name, operator, rawValue, unit] = match
            const value = normalizeComponentAtFeatureValue(Number(rawValue), unit, rootSize)
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
        ] as ComponentAtRuleFeature)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
}

function compareComponentAtRuleFeatures(
    a: ComponentAtRuleFeature[],
    b: ComponentAtRuleFeature[]
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

function compareComponentMergeBuckets(a: ComponentMergeBucket, b: ComponentMergeBucket, rootSize: number) {
    const layerA = a.layer || 'main'
    const layerB = b.layer || 'main'
    if (layerA === layerB && a.selector === b.selector) {
        const atRuleStateA = a.atRules?.length ? 1 : 0
        const atRuleStateB = b.atRules?.length ? 1 : 0
        if (atRuleStateA !== atRuleStateB) return atRuleStateA - atRuleStateB
        if (atRuleStateA && atRuleStateB) {
            const featuresA = getComponentAtRuleFeatures(a.atRules, rootSize)
            const featuresB = getComponentAtRuleFeatures(b.atRules, rootSize)
            if (featuresA.length && featuresB.length) {
                const featureCompare = compareComponentAtRuleFeatures(featuresA, featuresB)
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
        && (definition.layer || 'general') === layer
    )
    if (existingDefinition) {
        existingDefinition.type = UtilityType.Static
        existingDefinition.layer = layer
        return existingDefinition
    }
    const definition = {
        name,
        type: UtilityType.Static,
        layer
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

function finalizeComponentDefinitions(config: Config, componentDefinitions: Record<string, CSSDirectiveComponentDefinition[]> | undefined, css: MasterCSS) {
    if (!componentDefinitions) return
    for (const name in componentDefinitions) {
        const buckets = new Map<string, ComponentMergeBucket>()
        for (const definition of componentDefinitions[name]) {
            if (definition.type === 'compose') {
                const composedDefinitions = createComponentDefinitionsFromCompose(definition.className, css)
                for (const composedDefinition of composedDefinitions) {
                    const { atRules: _composedAtRules, ...composedDefinitionWithoutAtRules } = composedDefinition
                    const resolved = resolveConfiguredAtRules([
                        ...(definition.atRules || []),
                        ...(_composedAtRules || [])
                    ], css, composedDefinition.selector)
                    pushComponentMergeEvent(buckets, resolveComponentSelector(resolved.selector, css), resolved.atRules, toUtilityLayerName(definition.layer) || composedDefinitionWithoutAtRules.layer, {
                        type: 'compose',
                        order: definition.order,
                        utility: composedDefinitionWithoutAtRules.utility,
                        declarations: composedDefinitionWithoutAtRules.declarations
                    })
                }
            } else {
                const resolved = resolveConfiguredAtRules(definition.atRules, css, definition.selector)
                pushComponentMergeEvent(buckets, resolveComponentSelector(resolved.selector, css), resolved.atRules, toUtilityLayerName(definition.layer), {
                    type: 'native',
                    order: definition.order,
                    declarations: definition.declarations
                })
            }
        }
        const rootSize = css.config.rootSize || 16
        const definitions = [...buckets.values()]
            .sort((a, b) => compareComponentMergeBuckets(a, b, rootSize))
            .flatMap((bucket) => {
                const definition = createMergedComponentDefinition(bucket)
                return definition ? [definition] : []
            })
        for (const definition of definitions) {
            const layer = definition.layer || 'main'
            const utilityDefinition = getStaticUtilityDefinition(config, name, layer)
            pushStaticUtilityStyleRule(utilityDefinition, definition)
        }
    }
}

export default function createConfigFromCSSDirectives(input: CSSDirectiveInput, options: CreateConfigFromCSSDirectivesOptions = {}): CSSDirectiveConfigResult {
    const config = createConfig(getDirectiveConfig(input))
    const warnings = isCSSDirectiveResult(input) ? [...input.warnings] : []

    validateTokenConflicts(config)
    warnUnsupportedMediaModes(config, options, warnings)

    const css = createDirectiveCSS(config, options)
    finalizeUtilityDefinitions(config, css)
    finalizeComponentDefinitions(config, getDirectiveComponents(input), css)

    createDirectiveCSS(config, options)

    return {
        config,
        warnings
    }
}

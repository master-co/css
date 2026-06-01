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
import type {
    Config,
    UtilityDefinition,
    UtilityLayerName,
    UtilityRuleDefinition,
    VariableDefinition
} from 'shared/css-config'
import type { Utility } from '../utility'
import compareRulePriority from './compare-rule-priority'
import extendConfig from './extend-config'
import generateAt from './generate-at'
import generateSelector from './generate-selector'
import parseAt from './parse-at'
import resolveVariableNamespace from './resolve-variable-namespace'
import resolveSelectorTokens from './resolve-selector-tokens'

export interface CreateConfigFromCSSDirectivesOptions {
    config?: Config
    onWarning?: (warning: string) => void
}

export interface CSSDirectiveConfigResult {
    config: Config
    warnings: string[]
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
const MEDIA_MODE_NAMES = new Set(['light', 'dark'])

function isCSSDirectiveResult(input: ConfigInput): input is CSSDirectiveResult {
    return 'config' in input
}

function getInputConfig(input: ConfigInput) {
    return isCSSDirectiveResult(input) ? input.config : input
}

function getDirectiveConfig(input: CSSDirectiveInput) {
    return isCSSDirectiveResult(input) ? input.config : input
}

function getDirectiveComponents(input: CSSDirectiveInput) {
    return isCSSDirectiveResult(input) ? input.componentDefinitions : undefined
}

function warn(warnings: string[], options: CreateConfigFromCSSDirectivesOptions, message: string) {
    warnings.push(message)
    options.onWarning?.(message)
}

function collectModeNames(config: Config) {
    const modes = new Set(config.modes || [])
    if (typeof config.defaultMode === 'string') {
        modes.add(config.defaultMode)
    }
    return modes
}

function collectScreenNames(config: Config) {
    return new Set((config.variables || [])
        .filter((variable) => variable.namespace === 'screen')
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

function addMode(config: Config, mode: string) {
    config.modes ??= []
    if (!config.modes.includes(mode)) config.modes.push(mode)
}

function resolveInputVariable(variable: InputVariableDefinition): VariableDefinition {
    if ('key' in variable && variable.key !== undefined) {
        return {
            ...(variable.namespace ? { namespace: variable.namespace } : {}),
            key: variable.key,
            value: variable.value,
            ...(variable.mode ? { mode: variable.mode } : {})
        }
    }

    const directiveVariable = variable as CSSDirectiveVariableDefinition
    const resolved = resolveVariableNamespace(directiveVariable.name)
    if (directiveVariable.mode && resolved.namespace === 'screen') {
        throw new Error(`Screen variables cannot be mode-specific: screen-${resolved.key}@${directiveVariable.mode}`)
    }
    return {
        ...(resolved.namespace ? { namespace: resolved.namespace } : {}),
        key: resolved.key,
        value: directiveVariable.value,
        ...(directiveVariable.mode ? { mode: directiveVariable.mode } : {})
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
    if (inputConfig.atTokens) config.atTokens = { ...inputConfig.atTokens }
    if (inputConfig.selectorTokens) config.selectorTokens = { ...inputConfig.selectorTokens }
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

function createSemanticConfig(config: Config, options: CreateConfigFromCSSDirectivesOptions) {
    return extendConfig(options.config, config)
}

function validateTokenConflicts(config: Config, options: CreateConfigFromCSSDirectivesOptions) {
    const mergedConfig = createSemanticConfig(config, options)
    const modes = collectModeNames(mergedConfig)
    const screens = collectScreenNames(mergedConfig)

    for (const mode of collectModeNames(config)) {
        if (screens.has(mode)) {
            throw new Error(`Mode "${mode}" conflicts with screen variable "--screen-${mode}"`)
        }
    }

    for (const screen of collectScreenNames(config)) {
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
    const mergedConfig = createSemanticConfig(config, options)
    if (mergedConfig.modeTrigger !== 'media') return

    const customModes = new Set((mergedConfig.modes || []).filter((mode) => !MEDIA_MODE_NAMES.has(mode)))
    if (typeof mergedConfig.defaultMode === 'string' && !MEDIA_MODE_NAMES.has(mergedConfig.defaultMode)) {
        customModes.add(mergedConfig.defaultMode)
    }
    if (!customModes.size) return

    const modeList = [...customModes].map((mode) => `"${mode}"`).join(', ')
    const subject = customModes.size === 1 ? 'mode' : 'modes'
    warn(warnings, options, `Custom ${subject} ${modeList} will not work with mode-trigger: media. Browsers only support light and dark prefers-color-scheme values; use mode-trigger: class or host for custom modes.`)
}

function createDirectiveCSS(config: Config, options: CreateConfigFromCSSDirectivesOptions) {
    return new MasterCSS(createSemanticConfig(config, options))
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

function isBareAtRuleReference(token: string) {
    return /^-?[_a-zA-Z][-_a-zA-Z0-9]*$/.test(token)
}

function resolveMasterAtRuleReference(token: string, css: MasterCSS) {
    if (css.modes.includes(token)) {
        const modeSelector = css.getModeSelector(token)
        return modeSelector
            ? { selector: `${modeSelector} &` }
            : { atRules: [`@media (prefers-color-scheme:${token})`] }
    }

    if (isBareAtRuleReference(token) && !css.atRules.has(token)) {
        throw new Error(`Unknown @at token: ${token}`)
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
    const config = normalizeConfig(getDirectiveConfig(input))
    const warnings = isCSSDirectiveResult(input) ? [...input.warnings] : []

    validateTokenConflicts(config, options)
    warnUnsupportedMediaModes(config, options, warnings)

    const css = createDirectiveCSS(config, options)
    finalizeUtilityDefinitions(config, css)
    finalizeComponentDefinitions(config, getDirectiveComponents(input), css)

    return {
        config,
        warnings
    }
}

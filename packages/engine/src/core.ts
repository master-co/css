/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Utility } from './utility'
import type { Rule } from './rule'
import Layer from './layer'
import ThemeLayer from './theme-layer'
import UtilityLayer from './utility-layer'
import NonLayer from './non-layer'
import VariableRule from './variable-rule'
import AnimationRule from './animation-rule'
import type { Variable } from 'shared/css-syntax'
import UtilityType from 'shared/utility-type'
import type { AtRule } from './utils/parse-at'
import parseValue from './utils/parse-value'
import type { SelectorNode } from './utils/parse-selector'
import type { MasterCSSEmittedGlobals } from './emitted-globals'
import { isNativeCSSShorthandProperty } from 'shared/native-css-shorthand'
import type {
    MasterCSSManifest,
    MasterCSSManifestAnimations,
    MasterCSSManifestUtilityLayerName,
    MasterCSSManifestUtilityMatcher,
    MasterCSSManifestVariantBranch,
    MasterCSSManifestVariantToken
} from 'shared/master-css-manifest'
import {
    cloneCompiledSettings,
    getCompiledManifest,
    isPureNativeDeclarationUtilityDefinition,
    type CompiledUtility,
    type EngineSettings
} from './compile-manifest'
import { MATCH_NAME_BOUNDARY } from './common'

export type { CompiledUtility } from './compile-manifest'

export interface NativeCSSDeclaration {
    property: string
    value: string
}

export type NativeCSSDeclarationMatcher = (declaration: NativeCSSDeclaration) => boolean

export interface MasterCSSOptions {
    nativeDeclarationMatcher?: NativeCSSDeclarationMatcher
}

const builtinGroupUtility = {
    id: 'group',
    name: 'group',
    type: UtilityType.Shorthand,
    order: 0,
    emit: {
        type: 'group'
    },
    matchers: []
} satisfies CompiledUtility

function isNameBoundary(char: string | undefined) {
    return char === undefined || !/[a-zA-Z0-9-]/.test(char)
}

function getKeyedValue(className: string, keys: string[]) {
    for (const key of keys) {
        const prefix = key + ':'
        if (className.startsWith(prefix) && className.length > prefix.length) {
            return className.slice(prefix.length)
        }
    }
}

function matchesStaticUtility(className: string, name: string) {
    if (!className.startsWith(name)) return false
    const next = className[name.length]
    return next === undefined || next === '!' || next === '*' || next === '>' || next === '+'
        || next === '~' || next === ':' || next === '[' || next === '@' || next === '_' || next === '.'
}

function getFunctionValueName(value: string) {
    return /^-{0,2}([_a-zA-Z][-_a-zA-Z0-9]*)\(/.exec(value)?.[1]
}

function matchesNumericFunctionValue(value: string) {
    const name = getFunctionValueName(value)
    return name === 'calc' || name === 'clamp' || name === 'min' || name === 'max'
}

function matchesImageFunctionValue(value: string) {
    const name = getFunctionValueName(value)
    if (!name) return false
    return name === 'url'
        || name === 'element'
        || name === 'paint'
        || name === 'cross-fade'
        || name.endsWith('-gradient')
        || name.includes('image')
}

function matchesColorFunctionValue(value: string) {
    const name = getFunctionValueName(value)
    return Boolean(name)
        && !matchesNumericFunctionValue(value)
        && !matchesImageFunctionValue(value)
}

function hasTopLevelValueSeparator(value: string) {
    let depth = 0
    let quote = ''
    for (let index = 0; index < value.length; index++) {
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
        if (char === '(' || char === '[' || char === '{') {
            depth++
            continue
        }
        if (char === ')' || char === ']' || char === '}') {
            if (depth > 0) depth--
            continue
        }
        if (char === '|' && depth === 0) return true
    }
    return false
}

function matchesValueSegmentPolicy(value: string, matcher: MasterCSSManifestUtilityMatcher) {
    return (matcher.type !== 'variable' && matcher.type !== 'value')
        || matcher.segments === 'multiple'
        || !hasTopLevelValueSeparator(value)
}

function getClassKey(className: string) {
    if (className[0] === '{') return

    const indexOfColon = className.indexOf(':')
    if (indexOfColon <= 0) return

    return className.slice(0, indexOfColon)
}

function getMatchName(className: string) {
    for (let index = 0; index < className.length; index++) {
        if (MATCH_NAME_BOUNDARY.has(className[index])) {
            return index ? className.slice(0, index) : className
        }
    }
    return className
}

export default class MasterCSS {
    definedUtilities: CompiledUtility[] = []
    protected variableMatcherUtilities: CompiledUtility[] = []
    protected valueMatcherUtilities: CompiledUtility[] = []
    protected keyMatcherUtilities: CompiledUtility[] = []
    protected patternMatcherUtilities: CompiledUtility[] = []
    protected arbitraryMatcherUtilities: CompiledUtility[] = []
    protected variableMatcherIndex = new Map<string, CompiledUtility[]>()
    protected valueMatcherIndex = new Map<string, CompiledUtility[]>()
    protected keyMatcherIndex = new Map<string, CompiledUtility[]>()
    protected patternMatcherIndex?: Map<string, CompiledUtility[]>
    protected arbitraryStaticMatcherIndex?: Map<string, CompiledUtility[]>
    settings!: EngineSettings
    readonly rules: (Layer | Rule)[] = []
    readonly classUtilities = new Map<string, Utility[]>()
    readonly animationsNonLayer = new NonLayer(this)
    readonly baseLayer = new UtilityLayer('base', this)
    readonly themeLayer = new ThemeLayer('theme', this)
    readonly defaultsLayer = new UtilityLayer('defaults', this)
    readonly componentsLayer = new UtilityLayer('components', this)
    readonly utilitiesLayer = new UtilityLayer('utilities', this)
    selectors = new Map<string, SelectorNode[]>()
    variables = new Map<string, Variable>()
    modes: string[] = []
    atRules = new Map<string, AtRule>()
    variants = new Map<MasterCSSManifestVariantToken, MasterCSSManifestVariantBranch[]>()
    breakpointAtRules = new Map<string, AtRule>()
    containerAtRules = new Map<string, AtRule>()
    animations = new Map<string, MasterCSSManifestAnimations[string]>()
    protected readonly staticVariableTokens = new Set<string>()
    protected readonly staticAnimationTokens = new Set<string>()
    readonly emittedGlobals: Required<MasterCSSEmittedGlobals> = {
        variables: {},
        animations: {}
    }
    protected nativeDeclarationFastPathBlockedProperties = new Set<string>()
    protected readonly nativeDeclarationMatches = new Map<string, boolean>()
    protected readonly nativeDeclarationUtilities = new Map<string, CompiledUtility>()
    protected nativeValueNamespaceUtilities = new Map<string, CompiledUtility>()
    protected keyAliases = new Map<string, string>()

    manifest!: MasterCSSManifest

    constructor(
        manifest: MasterCSSManifest,
        emittedGlobals?: MasterCSSEmittedGlobals,
        protected readonly options: MasterCSSOptions = {}
    ) {
        this.loadManifest(manifest)
        this.registerEmittedGlobals(emittedGlobals)
        if (new.target === MasterCSS) {
            this.insertStaticResources()
        }
    }

    get text() {
        return this.rules
            .sort((a, b) => {
                const order = ['theme', 'base', 'defaults', 'components', 'utilities']
                const indexA = order.indexOf(a.name) === -1 ? Infinity : order.indexOf(a.name)
                const indexB = order.indexOf(b.name) === -1 ? Infinity : order.indexOf(b.name)
                return indexA - indexB
            })
            .map(({ text }) => text).join('')
    }

    getUtilityLayer(layerName: MasterCSSManifestUtilityLayerName = 'utilities') {
        switch (layerName) {
            case 'base':
                return this.baseLayer
            case 'defaults':
                return this.defaultsLayer
            case 'components':
                return this.componentsLayer
            case 'utilities':
                return this.utilitiesLayer
            default:
                throw new Error(`Unsupported utility layer: ${layerName}`)
        }
    }

    getUtilityLayers() {
        return [this.baseLayer, this.defaultsLayer, this.componentsLayer, this.utilitiesLayer]
    }

    loadManifest(manifest: MasterCSSManifest) {
        const compiledManifest = getCompiledManifest(manifest)
        this.manifest = compiledManifest.manifest
        this.settings = cloneCompiledSettings(compiledManifest.settings)
        this.definedUtilities = compiledManifest.definedUtilities
        this.variableMatcherUtilities = compiledManifest.variableMatcherUtilities
        this.valueMatcherUtilities = compiledManifest.valueMatcherUtilities
        this.keyMatcherUtilities = compiledManifest.keyMatcherUtilities
        this.patternMatcherUtilities = compiledManifest.patternMatcherUtilities
        this.arbitraryMatcherUtilities = compiledManifest.arbitraryMatcherUtilities
        this.variableMatcherIndex = compiledManifest.variableMatcherIndex
        this.valueMatcherIndex = compiledManifest.valueMatcherIndex
        this.keyMatcherIndex = compiledManifest.keyMatcherIndex
        this.patternMatcherIndex = compiledManifest.patternMatcherIndex
        this.arbitraryStaticMatcherIndex = compiledManifest.arbitraryStaticMatcherIndex
        this.selectors = compiledManifest.selectors
        this.variables = compiledManifest.variables
        this.modes = [...compiledManifest.modes]
        this.atRules = compiledManifest.atRules
        this.variants = compiledManifest.variants
        this.breakpointAtRules = compiledManifest.breakpointAtRules
        this.containerAtRules = compiledManifest.containerAtRules
        this.animations = compiledManifest.animations
        this.nativeDeclarationFastPathBlockedProperties = compiledManifest.nativeDeclarationFastPathBlockedProperties
        this.nativeValueNamespaceUtilities = compiledManifest.nativeValueNamespaceUtilities
        this.keyAliases = compiledManifest.keyAliases
    }

    protected applyEmittedGlobalsCounts(emittedGlobals: MasterCSSEmittedGlobals) {
        for (const [name, count] of Object.entries(emittedGlobals.variables || {})) {
            if (!count) continue
            this.themeLayer.tokenCounts.set(name, (this.themeLayer.tokenCounts.get(name) || 0) + count)
        }
        for (const [name, count] of Object.entries(emittedGlobals.animations || {})) {
            if (!count) continue
            this.animationsNonLayer.tokenCounts.set(name, (this.animationsNonLayer.tokenCounts.get(name) || 0) + count)
        }
    }

    registerEmittedGlobals(emittedGlobals?: MasterCSSEmittedGlobals) {
        if (!emittedGlobals) return
        for (const [name, count] of Object.entries(emittedGlobals.variables || {})) {
            if (!count) continue
            this.emittedGlobals.variables[name] = (this.emittedGlobals.variables[name] || 0) + count
        }
        for (const [name, count] of Object.entries(emittedGlobals.animations || {})) {
            if (!count) continue
            this.emittedGlobals.animations[name] = (this.emittedGlobals.animations[name] || 0) + count
        }
        this.applyEmittedGlobalsCounts(emittedGlobals)
    }

    isEmittedGlobalsVariable(name: string) {
        return Boolean(this.emittedGlobals.variables[name])
    }

    isEmittedGlobalsAnimation(name: string) {
        return Boolean(this.emittedGlobals.animations[name])
    }

    protected insertStaticVariable(name: string, visited = new Set<string>()) {
        if (visited.has(name)) return
        visited.add(name)
        const variable = this.variables.get(name)
        if (!variable || variable.inline) return

        if (!this.staticVariableTokens.has(name)) {
            if (!this.isEmittedGlobalsVariable(name)) {
                if (!this.themeLayer.get(name)) {
                    this.themeLayer.insert(new VariableRule(name, variable, this))
                }
                const count = this.themeLayer.tokenCounts.get(name) || 0
                this.themeLayer.tokenCounts.set(name, count + 1)
            }
            this.staticVariableTokens.add(name)
        }

        variable.dependencies?.forEach((dependency) => this.insertStaticVariable(dependency, visited))
    }

    protected insertStaticAnimation(name: string) {
        if (this.staticAnimationTokens.has(name)) return
        const keyframes = this.animations.get(name)
        if (!keyframes) return

        let rule = this.animationsNonLayer.rules.find((eachRule) => eachRule.name === name) as AnimationRule | undefined
        if (!this.isEmittedGlobalsAnimation(name)) {
            if (!rule) {
                rule = new AnimationRule(name, keyframes, this)
                this.animationsNonLayer.insert(rule)
            }
            const count = this.animationsNonLayer.tokenCounts.get(name) || 0
            this.animationsNonLayer.tokenCounts.set(name, count + 1)
        } else if (!rule) {
            rule = new AnimationRule(name, keyframes, this)
        }

        this.staticAnimationTokens.add(name)
        rule.variableNames?.forEach((variableName) => this.insertStaticVariable(variableName))
    }

    insertStaticResources() {
        for (const [name, variable] of this.variables) {
            if (variable.static) this.insertStaticVariable(name)
        }
        for (const name of this.animations.keys()) {
            if (this.manifest.animationOptions?.[name]?.static) this.insertStaticAnimation(name)
        }
        return this
    }

    resolveVariant(token: MasterCSSManifestVariantToken) {
        return this.variants.get(token)
    }

    parseValue(token: string | number, unit = '') {
        return parseValue(token, unit, this.settings.rootSize)
    }

    /**
     * Match check if Master CSS utility
     * @param className
     * @returns css text
     */
    private matchesMatcher(className: string, utility: CompiledUtility, matcher: MasterCSSManifestUtilityMatcher) {
        switch (matcher.type) {
            case 'static':
                return matchesStaticUtility(className, matcher.name)
            case 'key':
                return getKeyedValue(className, matcher.keys) !== undefined
            case 'variable': {
                const value = getKeyedValue(className, matcher.keys)
                if (value === undefined || !utility.variables?.size) return false
                if (!matchesValueSegmentPolicy(value, matcher)) return false
                for (const [variableKey, variable] of utility.variables) {
                    if (value.startsWith(variableKey) && isNameBoundary(value[variableKey.length])) return true
                    const negativeVariableKey = '-' + variableKey
                    if (
                        variableKey[0] !== '-'
                        && variable.type === 'number'
                        && value.startsWith(negativeVariableKey)
                        && isNameBoundary(value[negativeVariableKey.length])
                    ) return true
                }
                return false
            }
            case 'value': {
                const value = getKeyedValue(className, matcher.keys)
                if (value === undefined) return false
                if (!matchesValueSegmentPolicy(value, matcher)) return false
                switch (utility.kind) {
                    case 'color':
                        return value[0] === '#'
                            || matchesColorFunctionValue(value)
                            || (value.startsWith('currentColor') && isNameBoundary(value[12]))
                            || (value.startsWith('transparent') && isNameBoundary(value[11]))
                    case 'number':
                        return /[\d.]/.test(value[0]) || matchesNumericFunctionValue(value)
                    case 'image':
                        return matchesImageFunctionValue(value)
                    default:
                        return false
                }
            }
            case 'pattern':
                return matcher.values.some((value) => matchesStaticUtility(className, matcher.prefix + value))
        }
    }

    private matchesUtility(className: string, utility: CompiledUtility, matcherType?: MasterCSSManifestUtilityMatcher['type']) {
        return utility.matchers.some((matcher) =>
            (!matcherType || matcher.type === matcherType) && this.matchesMatcher(className, utility, matcher)
        )
    }

    private matchesExactUtilityDefinition(className: string, utility: CompiledUtility) {
        return utility.matchers.some((matcher) =>
            matcher.type === 'static' && matchesStaticUtility(className, matcher.name)
        )
    }

    private hasClassKey(className: string) {
        const key = getClassKey(className)
        return Boolean(key && !key.startsWith('--'))
    }

    private isGroupClassName(className: string) {
        return className[0] === '{' && className.includes('}')
    }

    private getClassKeyAlias(className: string) {
        const key = getClassKey(className)
        if (!key) return
        if (key.startsWith('--')) return

        const canonicalKey = this.keyAliases.get(key)
        if (!canonicalKey) return

        return {
            canonicalKey,
            indexOfColon: key.length,
            key
        }
    }

    private canonicalizeClassName(className: string, fixedClass?: string) {
        const keyAlias = this.getClassKeyAlias(className)
        if (!keyAlias) return { className, fixedClass }

        return {
            className: keyAlias.canonicalKey + className.slice(keyAlias.indexOfColon),
            fixedClass
        }
    }

    private matchResolvedClassName(className: string): CompiledUtility | undefined {
        const classKey = getClassKey(className)

        for (const eachUtility of classKey ? this.variableMatcherIndex.get(classKey) || [] : []) {
            if (this.matchesUtility(className, eachUtility, 'variable')) return eachUtility
        }

        for (const eachUtility of classKey ? this.valueMatcherIndex.get(classKey) || [] : []) {
            if (this.matchesUtility(className, eachUtility, 'value')) return eachUtility
        }

        for (const eachUtility of classKey ? this.keyMatcherIndex.get(classKey) || [] : []) {
            if (this.matchesUtility(className, eachUtility, 'key')) return eachUtility
        }

        if (this.arbitraryStaticMatcherIndex) {
            for (const eachUtility of this.arbitraryStaticMatcherIndex.get(getMatchName(className)) || []) {
                if (this.matchesUtility(className, eachUtility)) return eachUtility
            }
        } else {
            for (const eachUtility of this.arbitraryMatcherUtilities) {
                if (this.matchesUtility(className, eachUtility)) return eachUtility
            }
        }

        if (this.patternMatcherIndex) {
            for (const eachUtility of this.patternMatcherIndex.get(getMatchName(className)) || []) {
                if (this.matchesUtility(className, eachUtility, 'pattern')) return eachUtility
            }
        } else {
            for (const eachUtility of this.patternMatcherUtilities) {
                if (this.matchesUtility(className, eachUtility, 'pattern')) return eachUtility
            }
        }
    }

    private createGroupUtility(className: string, fixedClass?: string, mode?: string, branchIndex = 0): Utility | undefined {
        if (!this.isGroupClassName(className)) return
        return this.createWithDefinition(className, builtinGroupUtility, fixedClass, mode, branchIndex)
    }

    private createAllGroupUtilities(className: string, fixedClass?: string, mode?: string): Utility[] {
        const utility = this.createGroupUtility(className, fixedClass, mode)
        if (!utility?.valid) return []
        const utilities = [utility]
        for (let branchIndex = 1; branchIndex < utility.branchCount; branchIndex++) {
            const branchUtility = this.createGroupUtility(className, fixedClass, mode, branchIndex)
            if (branchUtility?.valid) utilities.push(branchUtility)
        }
        return utilities
    }

    private matchRawManagedClassName(className: string): CompiledUtility | undefined {
        const classKey = getClassKey(className)
        if (!classKey) return

        for (const eachUtility of this.variableMatcherIndex.get(classKey) || []) {
            if (this.matchesUtility(className, eachUtility, 'variable')) return eachUtility
        }

        for (const eachUtility of this.valueMatcherIndex.get(classKey) || []) {
            if (this.matchesUtility(className, eachUtility, 'value')) return eachUtility
        }

        for (const eachUtility of this.keyMatcherIndex.get(classKey) || []) {
            if (this.matchesUtility(className, eachUtility, 'key')) return eachUtility
        }

        if (this.patternMatcherIndex) {
            for (const eachUtility of this.patternMatcherIndex.get(getMatchName(className)) || []) {
                if (this.matchesUtility(className, eachUtility, 'pattern')) return eachUtility
            }
        } else {
            for (const eachUtility of this.patternMatcherUtilities) {
                if (this.matchesUtility(className, eachUtility, 'pattern')) return eachUtility
            }
        }
    }

    match(className: string): CompiledUtility | undefined {
        if (this.isGroupClassName(className)) return builtinGroupUtility
        if (this.hasClassKey(className)) {
            const rawRegisteredUtility = this.matchRawManagedClassName(className)
            if (rawRegisteredUtility) return rawRegisteredUtility
        }
        return this.matchResolvedClassName(this.canonicalizeClassName(className).className)
    }

    private matchAllResolvedClassName(className: string): CompiledUtility[] {
        const classKey = getClassKey(className)

        /**
         * 1. variable
         * @example fg:primary bg:blue
         */
        for (const eachUtility of classKey ? this.variableMatcherIndex.get(classKey) || [] : []) {
            if (this.matchesUtility(className, eachUtility, 'variable')) return [eachUtility]
        }

        /**
         * 2. value (ambiguous key with raw color/number/image)
         * @example bg:#fff font:.75rem
         */
        for (const eachUtility of classKey ? this.valueMatcherIndex.get(classKey) || [] : []) {
            if (this.matchesUtility(className, eachUtility, 'value')) return [eachUtility]
        }

        /**
         * 3. full key
         * @example text-align:center color:blue-40
         */
        for (const eachUtility of classKey ? this.keyMatcherIndex.get(classKey) || [] : []) {
            if (this.matchesUtility(className, eachUtility, 'key')) return [eachUtility]
        }

        /**
         * 4. arbitrary
         * @example custom RegExp, utility
         */
        const staticUtilities: CompiledUtility[] = []
        if (this.arbitraryStaticMatcherIndex) {
            for (const eachUtility of this.arbitraryStaticMatcherIndex.get(getMatchName(className)) || []) {
                if (this.matchesUtility(className, eachUtility)) staticUtilities.push(eachUtility)
            }
        } else {
            for (const eachUtility of this.arbitraryMatcherUtilities) {
                if (!this.matchesUtility(className, eachUtility)) continue
                if (eachUtility.matchers.some((matcher) => matcher.type === 'static')) {
                    staticUtilities.push(eachUtility)
                    continue
                }
                return [eachUtility]
            }
        }
        if (staticUtilities.length) return staticUtilities

        /**
         * 5. enum pattern
         * @example text-center bg-cover
         */
        if (this.patternMatcherIndex) {
            for (const eachUtility of this.patternMatcherIndex.get(getMatchName(className)) || []) {
                if (this.matchesUtility(className, eachUtility, 'pattern')) return [eachUtility]
            }
        } else {
            for (const eachUtility of this.patternMatcherUtilities) {
                if (this.matchesUtility(className, eachUtility, 'pattern')) return [eachUtility]
            }
        }
        return []
    }

    private matchAllRawManagedClassName(className: string): CompiledUtility[] {
        const classKey = getClassKey(className)
        if (!classKey) return []

        for (const eachUtility of this.variableMatcherIndex.get(classKey) || []) {
            if (this.matchesUtility(className, eachUtility, 'variable')) return [eachUtility]
        }

        for (const eachUtility of this.valueMatcherIndex.get(classKey) || []) {
            if (this.matchesUtility(className, eachUtility, 'value')) return [eachUtility]
        }

        for (const eachUtility of this.keyMatcherIndex.get(classKey) || []) {
            if (this.matchesUtility(className, eachUtility, 'key')) return [eachUtility]
        }

        if (this.patternMatcherIndex) {
            for (const eachUtility of this.patternMatcherIndex.get(getMatchName(className)) || []) {
                if (this.matchesUtility(className, eachUtility, 'pattern')) return [eachUtility]
            }
        } else {
            for (const eachUtility of this.patternMatcherUtilities) {
                if (this.matchesUtility(className, eachUtility, 'pattern')) return [eachUtility]
            }
        }

        return []
    }

    matchAll(className: string): CompiledUtility[] {
        if (this.isGroupClassName(className)) return [builtinGroupUtility]
        if (this.hasClassKey(className)) {
            const rawRegisteredUtilities = this.matchAllRawManagedClassName(className)
            if (rawRegisteredUtilities.length) return rawRegisteredUtilities
        }
        return this.matchAllResolvedClassName(this.canonicalizeClassName(className).className)
    }

    private parseNativeDeclarationProperty(className: string) {
        const indexOfColon = className.indexOf(':')
        if (indexOfColon <= 0) return

        const property = className.slice(0, indexOfColon)
        if (!/^(?:--[-_a-zA-Z0-9]+|-?[_a-zA-Z][-_a-zA-Z0-9]*)$/.test(property)) return

        return property
    }

    private getNativeDeclarationUtility(property: string): CompiledUtility {
        const cached = this.nativeDeclarationUtilities.get(property)
        if (cached) return cached

        const utility = {
            id: property,
            name: property,
            type: isNativeCSSShorthandProperty(property)
                ? UtilityType.Shorthand
                : UtilityType.Normal,
            order: 0,
            emit: {
                type: 'property',
                property
            },
            matchers: [{
                type: 'key',
                keys: [property]
            }]
        } satisfies CompiledUtility

        this.nativeDeclarationUtilities.set(property, utility)
        return utility
    }

    private matchNativeDeclaration(declaration: NativeCSSDeclaration) {
        if (declaration.property.startsWith('--')) return true
        const matcher = this.options.nativeDeclarationMatcher
        if (!matcher) return false
        const cacheKey = declaration.property + '\0' + declaration.value
        const cached = this.nativeDeclarationMatches.get(cacheKey)
        if (cached !== undefined) return cached
        const matched = matcher(declaration)
        this.nativeDeclarationMatches.set(cacheKey, matched)
        return matched
    }

    private isNativeDeclarationUtility(utility: Utility) {
        const entries = Object.entries(utility.declarations || {})
        if (entries.length !== 1) return false
        const [[property, value]] = entries
        return this.matchNativeDeclaration({
            property,
            value: String(value)
        })
    }

    private shouldValidateNativeDeclarationUtility(utility: CompiledUtility) {
        if (!this.options.nativeDeclarationMatcher) return false
        return isPureNativeDeclarationUtilityDefinition(utility)
            && utility.matchers.every((matcher) => matcher.type === 'key')
    }

    private createNativeDeclarationFallback(className: string, fixedClass?: string, mode?: string, sourceClassName = className): Utility[] {
        if (!this.options.nativeDeclarationMatcher) return []
        const property = this.parseNativeDeclarationProperty(className)
        if (!property) return []

        const registeredUtility = this.getNativeDeclarationUtility(property)
        const utility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode)
        if (!utility?.valid || !this.isNativeDeclarationUtility(utility)) return []

        const utilities = [utility]
        for (let branchIndex = 1; branchIndex < utility.branchCount; branchIndex++) {
            const branchUtility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode, branchIndex)
            if (branchUtility?.valid && this.isNativeDeclarationUtility(branchUtility)) utilities.push(branchUtility)
        }
        return utilities
    }

    private createNativeValueNamespaceFallback(className: string, fixedClass?: string, mode?: string, sourceClassName = className): Utility[] {
        const property = this.parseNativeDeclarationProperty(className)
        if (!property) return []

        const registeredUtility = this.nativeValueNamespaceUtilities.get(property)
        if (!registeredUtility) return []

        const utility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode)
        if (!utility?.valid || this.options.nativeDeclarationMatcher && !this.isNativeDeclarationUtility(utility)) return []

        const utilities = [utility]
        for (let branchIndex = 1; branchIndex < utility.branchCount; branchIndex++) {
            const branchUtility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode, branchIndex)
            if (
                branchUtility?.valid
                && (!this.options.nativeDeclarationMatcher || this.isNativeDeclarationUtility(branchUtility))
            ) {
                utilities.push(branchUtility)
            }
        }
        return utilities
    }

    private createNativeValueNamespaceFastPath(className: string, fixedClass?: string, mode?: string, sourceClassName = className): Utility[] {
        const property = this.parseNativeDeclarationProperty(className)
        if (!property) return []
        if (this.nativeDeclarationFastPathBlockedProperties.has(property)) return []
        return this.createNativeValueNamespaceFallback(className, fixedClass, mode, sourceClassName)
    }

    private createNativeDeclarationFastPath(className: string, fixedClass?: string, mode?: string, sourceClassName = className): Utility[] {
        const property = this.parseNativeDeclarationProperty(className)
        if (!property) return []
        if (!property.startsWith('--') && this.nativeDeclarationFastPathBlockedProperties.has(property)) return []
        return this.createNativeDeclarationFallback(className, fixedClass, mode, sourceClassName)
    }

    /**
     * Generate utilities from class name
     * @param className
     * @returns Utility[]
     */
    generate(className: string, mode?: string): Utility[] {
        return this.createAll(className, undefined, mode)
    }

    /**
     * Create utility from given class name
     * @param className
     * @returns Utility
     */
    create(className: string, fixedClass?: string, mode?: string): Utility | undefined {
        const groupUtility = this.createGroupUtility(className, fixedClass, mode)
        if (groupUtility) return groupUtility

        const sourceClassName = className
        if (this.hasClassKey(className)) {
            const rawRegisteredUtility = this.matchRawManagedClassName(className)
            if (rawRegisteredUtility) {
                const utility = this.createWithDefinition(sourceClassName, rawRegisteredUtility, fixedClass, mode)
                if (utility?.valid) return utility
            }
        }

        const canonicalClass = this.canonicalizeClassName(className, fixedClass)
        className = canonicalClass.className
        fixedClass = canonicalClass.fixedClass
        const fastPathNativeValueNamespaceUtilities = this.createNativeValueNamespaceFastPath(className, fixedClass, mode, sourceClassName)
        if (fastPathNativeValueNamespaceUtilities.length) return fastPathNativeValueNamespaceUtilities[0]

        const fastPathNativeUtilities = this.createNativeDeclarationFastPath(className, fixedClass, mode, sourceClassName)
        if (fastPathNativeUtilities.length) return fastPathNativeUtilities[0]

        const registeredUtility = this.matchResolvedClassName(className)
        if (registeredUtility && this.matchesExactUtilityDefinition(className, registeredUtility)) {
            const nativeValueNamespaceUtilities = this.createNativeValueNamespaceFallback(className, fixedClass, mode, sourceClassName)
            if (nativeValueNamespaceUtilities.length) return nativeValueNamespaceUtilities[0]

            const nativeUtilities = this.createNativeDeclarationFallback(className, fixedClass, mode, sourceClassName)
            if (nativeUtilities.length) return nativeUtilities[0]
        }
        if (registeredUtility) return this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode)
        return (
            this.createNativeValueNamespaceFallback(className, fixedClass, mode, sourceClassName)[0]
            || this.createNativeDeclarationFallback(className, fixedClass, mode, sourceClassName)[0]
        )
    }

    createAll(className: string, fixedClass?: string, mode?: string): Utility[] {
        const groupUtilities = this.createAllGroupUtilities(className, fixedClass, mode)
        if (groupUtilities.length) return groupUtilities

        const sourceClassName = className
        if (this.hasClassKey(className)) {
            const rawRegisteredUtilities = this.matchAllRawManagedClassName(className)
            const rawUtilities: Utility[] = []
            for (const registeredUtility of rawRegisteredUtilities) {
                const utility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode)
                if (utility && utility.valid) {
                    rawUtilities.push(utility)
                    for (let branchIndex = 1; branchIndex < utility.branchCount; branchIndex++) {
                        const branchUtility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode, branchIndex)
                        if (branchUtility?.valid) rawUtilities.push(branchUtility)
                    }
                }
            }
            if (rawUtilities.length) return rawUtilities
        }

        const canonicalClass = this.canonicalizeClassName(className, fixedClass)
        className = canonicalClass.className
        fixedClass = canonicalClass.fixedClass
        const fastPathNativeValueNamespaceUtilities = this.createNativeValueNamespaceFastPath(className, fixedClass, mode, sourceClassName)
        if (fastPathNativeValueNamespaceUtilities.length) return fastPathNativeValueNamespaceUtilities

        const fastPathNativeUtilities = this.createNativeDeclarationFastPath(className, fixedClass, mode, sourceClassName)
        if (fastPathNativeUtilities.length) return fastPathNativeUtilities

        const registeredUtilities = this.matchAllResolvedClassName(className)
        if (registeredUtilities.length && registeredUtilities.every((utility) => this.matchesExactUtilityDefinition(className, utility))) {
            const nativeValueNamespaceUtilities = this.createNativeValueNamespaceFallback(className, fixedClass, mode, sourceClassName)
            if (nativeValueNamespaceUtilities.length) return nativeValueNamespaceUtilities

            const nativeUtilities = this.createNativeDeclarationFallback(className, fixedClass, mode, sourceClassName)
            if (nativeUtilities.length) return nativeUtilities
        }

        const utilities: Utility[] = []
        for (const registeredUtility of registeredUtilities) {
            const utility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode)
            if (utility && utility.valid) {
                utilities.push(utility)
                for (let branchIndex = 1; branchIndex < utility.branchCount; branchIndex++) {
                    const branchUtility = this.createWithDefinition(sourceClassName, registeredUtility, fixedClass, mode, branchIndex)
                    if (branchUtility?.valid) utilities.push(branchUtility)
                }
            }
        }
        if (utilities.length) return utilities
        const nativeValueNamespaceUtilities = this.createNativeValueNamespaceFallback(className, fixedClass, mode, sourceClassName)
        return nativeValueNamespaceUtilities.length
            ? nativeValueNamespaceUtilities
            : this.createNativeDeclarationFallback(className, fixedClass, mode, sourceClassName)
    }

    createWithDefinition(className: string, registeredUtility: CompiledUtility, fixedClass?: string, mode?: string, branchIndex = 0): Utility | undefined {
        const candidate = new Utility(className, this, registeredUtility, fixedClass, mode, branchIndex)
        if (
            candidate.valid
            && this.shouldValidateNativeDeclarationUtility(registeredUtility)
            && !this.isNativeDeclarationUtility(candidate)
        ) return
        for (const layer of this.getUtilityLayers()) {
            const rule = layer.get(candidate.key)
            const utility = rule instanceof Utility && rule.registeredUtility === registeredUtility
                ? rule
                : undefined
            if (utility) return utility
        }
        return candidate
    }

    /**
     * Create utility from given selector text
     * @param selectorText
     */
    createFromSelectorText(selectorText: string, layerName?: MasterCSSManifestUtilityLayerName) {
        const selectorTextSplits = selectorText.split(' ')
        const stopChars = /[.#\[!\*>+~:,\s]/
        for (let i = 0; i < selectorTextSplits.length; i++) {
            const eachField = selectorTextSplits[i]
            const modeSelector = this.getModeSelector(eachField)
            if (
                i === 0 && (eachField === modeSelector) ||
                (i === 0 || i === 1) && (eachField === this.settings.scope)
            ) continue
            if (eachField.startsWith('.')) {
                const eachFieldName = eachField.slice(1)
                let className = ''
                let l = 0
                while (l < eachFieldName.length) {
                    const char = eachFieldName[l]
                    const nextChar = eachFieldName[l + 1]
                    if (char === '\\' && nextChar) {
                        className += nextChar
                        l += 2
                        continue
                    }
                    if (stopChars.test(char)) break
                    className += char
                    l++
                }
                const utilities = this.generate(className)
                    .filter((utility) => !layerName || utility.layerName === layerName)
                if (utilities.length) return utilities
            }
        }
    }

    /**
     * 根據蒐集到的所有 DOM class 重新 create
     */
    refresh(manifest: MasterCSSManifest = this.manifest) {
        this.reset()
        this.loadManifest(manifest)
        this.applyEmittedGlobalsCounts(this.emittedGlobals)
        this.insertStaticResources()
        return this
    }

    reset() {
        this.classUtilities.clear()
        this.staticVariableTokens.clear()
        this.staticAnimationTokens.clear()
        this.baseLayer.reset()
        this.themeLayer.reset()
        this.defaultsLayer.reset()
        this.componentsLayer.reset()
        this.utilitiesLayer.reset()
        this.animationsNonLayer.reset()
        return this
    }

    destroy() {
        this.reset()
        return this
    }

    add(...classNames: string[]) {
        for (const className of classNames) {
            const rules = this.classUtilities.get(className)
            if (rules) continue
            const newRules = this.generate(className)
            if (newRules.length) {
                newRules.forEach((eachUtility) => eachUtility.layer.insert(eachUtility))
                this.classUtilities.set(className, newRules)
            }
        }
        return this
    }

    remove(...classNames: string[]) {
        /**
         * class name 從 DOM tree 中被移除，
         * 匹配並刪除對應的 rule
         */
        for (const className of classNames) {
            const rules = this.classUtilities.get(className)
            if (rules) {
                rules.forEach((rule) => rule.layer.delete(rule.key))
                this.classUtilities.delete(className)
            }
        }
    }

    getModeSelector(modeName: string) {
        switch (this.settings.modeTrigger) {
            case 'class':
                return '.' + modeName
            case 'host':
                return ':host(.' + modeName + ')'
        }
    }
}

export default interface MasterCSS {
    style: HTMLStyleElement | null
    Native: typeof CSS
}

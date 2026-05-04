import { createCSS } from '@master/css'
import postcss, { type AtRule, type ChildNode, type PluginCreator, type Root, type Rule } from 'postcss'
import type { PropertiesHyphen } from 'csstype'
import type { AnimationDefinitions, Config, VariableDefinitions, VariableDefinition, VariableValue } from '@master/css'
import normalizeDefinitionName from './utils/normalize-definition-name'
import unquote from './utils/unquote'
import resolveVariableNamespace from './utils/variable-namespace'

export interface PluginOptions {
    config?: Parameters<typeof createCSS>[0]
    classes?: string[]
}

export interface CompileCSSOptions extends PluginOptions {
    from?: string
}

export interface CompileCSSResult {
    config: Config
    componentNames: string[]
    css: string
    generatedCSS: string
}

type ParsedDirectives = Pick<CompileCSSResult, 'config' | 'componentNames'>

function normalizeClassNames(classNames: string[]) {
    return classNames.join(' ').replace(/(?:\n\s*)+/g, ' ').trim().split(' ').filter(Boolean)
}

function parseBoolean(value: string) {
    if (value === 'true') return true
    if (value === 'false') return false
}

function parseNumber(value: string) {
    const numberValue = Number(value)
    if (!Number.isNaN(numberValue) && String(numberValue) === value) return numberValue
}

function parseVariableValue(value: string): VariableValue {
    const trimmed = value.trim()
    const numberValue = parseNumber(trimmed)
    return numberValue === undefined ? trimmed : numberValue
}

function setNestedVariable(target: VariableDefinitions, namespace: string | undefined, key: string, value: VariableDefinition) {
    if (!namespace) {
        target[key] = value
        return
    }
    const variables = target as Record<string, any>
    variables[namespace] ??= {}
    variables[namespace][key] = value
}

function defineMasterVariable(config: Config, property: string, rawValue: string, mode?: string) {
    const variable = resolveVariableNamespace(property)
    const value = parseVariableValue(rawValue)
    if (!mode && variable.namespace === 'screen') {
        const screen = typeof value === 'number' ? value : Number(value)
        if (!Number.isNaN(screen)) {
            config.screens ??= {}
            config.screens[variable.key] = screen
        }
        return
    }

    if (mode) {
        config.modes ??= {}
        config.modes[mode] ??= {}
        setNestedVariable(config.modes[mode], variable.namespace, variable.key, value)
    } else {
        config.variables ??= {}
        setNestedVariable(config.variables, variable.namespace, variable.key, value)
    }
}

function parseMasterOption(config: Config, node: ChildNode) {
    if (node.type !== 'decl') return false
    const value = node.value.trim()
    switch (node.prop) {
        case 'root-size': {
            const rootSize = parseNumber(value)
            if (rootSize === undefined) throw node.error('root-size must be a number')
            config.rootSize = rootSize
            return true
        }
        case 'base-unit': {
            const baseUnit = parseNumber(value)
            if (baseUnit === undefined) throw node.error('base-unit must be a number')
            config.baseUnit = baseUnit
            return true
        }
        case 'default-mode':
            config.defaultMode = parseBoolean(value) === false ? false : value as Config['defaultMode']
            return true
        case 'mode-trigger':
            if (value !== 'class' && value !== 'media' && value !== 'host') {
                throw node.error('mode-trigger must be class, media, or host')
            }
            config.modeTrigger = value
            return true
        case 'important': {
            const important = parseBoolean(value)
            if (important === undefined) throw node.error('important must be true or false')
            config.important = important
            return true
        }
        default:
            return false
    }
}

function parseMaster(atRule: AtRule, config: Config) {
    atRule.each((node: ChildNode) => {
        if (node.type === 'decl' && node.prop.startsWith('--')) {
            defineMasterVariable(config, node.prop, node.value)
            return
        }
        if (parseMasterOption(config, node)) return
        if (node.type === 'atrule') {
            throw node.error(`Unsupported @${node.name} inside @master`)
        }
        if (node.type !== 'comment') {
            throw node.error('@master only accepts options and custom property declarations')
        }
    })
}

function parseMode(atRule: AtRule, config: Config) {
    const mode = atRule.params.trim()
    if (!mode) {
        throw atRule.error('@mode requires a mode name')
    }
    atRule.each((node) => {
        if (node.type === 'decl' && node.prop.startsWith('--')) {
            defineMasterVariable(config, node.prop, node.value, mode)
            return
        }
        throw node.error('@mode only accepts custom property declarations')
    })
}

function normalizeAtValue(value: string) {
    const rawAtRule = /^@(media|supports|container|layer)\s*(.*)$/.exec(value.trim())
    if (!rawAtRule) return value
    return rawAtRule[1] + rawAtRule[2].trim().replace(/\s*:\s*/g, ':')
}

function parseAtDefinition(atRule: AtRule, config: Config) {
    const match = /^(\S+)\s+(.+)$/.exec(atRule.params.trim())
    if (!match) {
        throw atRule.error('@at requires a name and at-rule value')
    }
    config.at ??= {}
    config.at[match[1]] = normalizeAtValue(match[2])
}

function parseSelectorDefinition(atRule: AtRule, config: Config) {
    const match = /^(\S+)\s+(.+)$/.exec(atRule.params.trim())
    if (!match) {
        throw atRule.error('@selector requires a name and selector value')
    }
    config.selectors ??= {}
    config.selectors[match[1]] = match[2]
}

function parseUtilityRule(rule: Rule, config: Config) {
    const name = normalizeDefinitionName(rule.selector)
    if (!name) {
        throw rule.error('Utility rule requires a name')
    }
    const declarations: Record<string, string> = {}
    rule.each((node) => {
        if (node.type === 'decl') {
            declarations[node.prop] = node.value
            return
        }
        throw node.error('Utilities only accept declarations')
    })
    config.utilities ??= {}
    config.utilities[name] = declarations as PropertiesHyphen
}

function parseUtility(atRule: AtRule, config: Config) {
    const name = normalizeDefinitionName(atRule.params)
    if (!name) {
        throw atRule.error('@utility requires a name')
    }
    const declarations: Record<string, string> = {}
    atRule.each((node) => {
        if (node.type === 'decl') {
            declarations[node.prop] = node.value
            return
        }
        throw node.error('Utilities only accept declarations')
    })
    config.utilities ??= {}
    config.utilities[name] = declarations as PropertiesHyphen
}

function parseKeyframes(atRule: AtRule, config: Config) {
    const name = atRule.params.trim()
    if (!name) {
        throw atRule.error('@keyframes requires a name')
    }
    const keyframes: AnimationDefinitions[string] = {}
    atRule.each((node) => {
        if (node.type !== 'rule') return
        const declarations: Record<string, string> = {}
        node.each((child) => {
            if (child.type === 'decl') {
                declarations[child.prop] = child.value
            }
        })
        keyframes[node.selector] = declarations as PropertiesHyphen
    })
    config.animations ??= {}
    config.animations[name] = keyframes
}

function parseComponent(rule: Rule, parsed: ParsedDirectives) {
    const name = normalizeDefinitionName(rule.selector)
    if (!name) {
        throw rule.error('Component rule requires a name')
    }
    const classNames: string[] = []
    const declarations: Record<string, string> = {}
    rule.each((child) => {
        if (child.type === 'decl') {
            declarations[child.prop] = child.value
            return
        }
        if (child.type === 'atrule' && child.name === 'apply') {
            classNames.push(unquote(child.params))
            return
        }
        throw child.error('Components only accept declarations and @apply')
    })
    parsed.config.components ??= {}
    parsed.config.components[name] = {
        classNames: normalizeClassNames(classNames),
        declarations: Object.keys(declarations).length ? declarations as PropertiesHyphen : undefined
    }
    parsed.componentNames.push(name)
}

function parseLayer(atRule: AtRule, parsed: ParsedDirectives) {
    const layerName = atRule.params.trim()
    if (layerName === 'components') {
        atRule.each((node) => {
            if (node.type === 'rule') {
                parseComponent(node, parsed)
                return
            }
            if (node.type !== 'comment') {
                throw node.error('@layer components only accepts component rules')
            }
        })
        atRule.remove()
        return
    }
    if (layerName === 'utilities') {
        atRule.each((node) => {
            if (node.type === 'rule') {
                parseUtilityRule(node, parsed.config)
                return
            }
            if (node.type !== 'comment') {
                throw node.error('@layer utilities only accepts utility rules')
            }
        })
        atRule.remove()
    }
}

export function parseDirectives(root: Root): ParsedDirectives {
    const parsed: ParsedDirectives = {
        config: {},
        componentNames: []
    }

    root.walkAtRules('master', (atRule) => {
        parseMaster(atRule, parsed.config)
        atRule.remove()
    })
    root.walkAtRules('mode', (atRule) => {
        if (atRule.parent !== root) return
        parseMode(atRule, parsed.config)
        atRule.remove()
    })
    root.walkAtRules('at', (atRule) => {
        if (atRule.parent !== root) return
        parseAtDefinition(atRule, parsed.config)
        atRule.remove()
    })
    root.walkAtRules('selector', (atRule) => {
        if (atRule.parent !== root) return
        parseSelectorDefinition(atRule, parsed.config)
        atRule.remove()
    })
    root.walkAtRules('utility', (atRule) => {
        if (atRule.parent !== root) return
        parseUtility(atRule, parsed.config)
        atRule.remove()
    })
    root.walkAtRules('keyframes', (atRule) => {
        if (atRule.parent !== root) return
        parseKeyframes(atRule, parsed.config)
        atRule.remove()
    })
    root.walkAtRules('layer', (atRule) => {
        if (atRule.parent !== root) return
        parseLayer(atRule, parsed)
    })

    return parsed
}

function createDirectiveCSS(parsed: ParsedDirectives, options: PluginOptions) {
    const css = createCSS(options.config
        ? { extends: [options.config, parsed.config] }
        : parsed.config
    )
    const classes = [...parsed.componentNames, ...(options.classes || [])]
    for (const className of classes) {
        css.add(className)
    }
    return css
}

export function compileCSS(source: string, options: CompileCSSOptions = {}): CompileCSSResult {
    const root = postcss.parse(source, { from: options.from })
    const parsed = parseDirectives(root)
    const css = createDirectiveCSS(parsed, options)
    const generatedCSS = css.text

    if (generatedCSS) {
        root.append(postcss.parse(generatedCSS, { from: options.from }))
    }

    return {
        ...parsed,
        css: root.toString(),
        generatedCSS
    }
}

const masterCSSPostCSS: PluginCreator<PluginOptions> = (options = {}) => {
    return {
        postcssPlugin: '@master/postcss',
        Once(root, { postcss }) {
            const parsed = parseDirectives(root)
            const css = createDirectiveCSS(parsed, options)

            if (css.text) {
                root.append(postcss.parse(css.text, { from: root.source?.input.file || undefined }))
            }
        }
    }
}

masterCSSPostCSS.postcss = true

export default masterCSSPostCSS

import { generateValidRules } from '@master/css-validator'
import type { MasterCSS } from '@master/css'
import { splitClassName } from './suggest-canonical-class-name'

export interface RawValuePolicyOptions {
    allowRawValues?: boolean
    allowProperties?: string[]
    allowedPatterns?: string[]
}

export interface UnapprovedRawValueClass {
    className: string
    key: string
    value: string
    properties: string[]
}

function isVariableBackedRule(rule: ReturnType<typeof generateValidRules>[number]) {
    const variables = (rule as any).registeredUtility?.variables
    return variables instanceof Map && variables.size > 0
}

function getVariableKeys(rule: ReturnType<typeof generateValidRules>[number]) {
    const variables = (rule as any).registeredUtility?.variables
    if (!(variables instanceof Map)) return []
    return [...variables.keys()]
}

function getDeclarationProperties(rules: ReturnType<typeof generateValidRules>) {
    return [...new Set(rules.flatMap((rule) => Object.keys(rule.declarations || {})))].sort()
}

function splitTopLevelValueSegments(value: string) {
    let quote = ''
    let depth = 0
    let lastIndex = 0
    const segments: string[] = []
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
        if (depth !== 0 || char !== '|') continue
        segments.push(value.slice(lastIndex, index))
        lastIndex = index + 1
    }
    if (!segments.length) return [value]
    segments.push(value.slice(lastIndex))
    return segments
}

function isTokenValue(value: string, variableKeys: Set<string>) {
    return splitTopLevelValueSegments(value).every((segment) => variableKeys.has(segment))
}

function matchesAllowedPattern(value: string, patterns: string[]) {
    return patterns.some((pattern) => new RegExp(pattern).test(value))
}

function isAllowedProperty(key: string, properties: string[], allowProperties: string[]) {
    return allowProperties.includes(key) || properties.some((property) => allowProperties.includes(property))
}

export default function findUnapprovedRawValueClasses(
    classNames: string[],
    css: MasterCSS,
    options: RawValuePolicyOptions = {}
): UnapprovedRawValueClass[] {
    if (options.allowRawValues) return []

    const allowProperties = options.allowProperties || []
    const allowedPatterns = options.allowedPatterns || []
    const issues: UnapprovedRawValueClass[] = []

    for (const className of classNames) {
        const parts = splitClassName(className)
        if (!parts.key || !parts.value) continue
        if (matchesAllowedPattern(parts.value, allowedPatterns)) continue

        const rules = generateValidRules(className, css)
        if (!rules.length || !rules.some(isVariableBackedRule)) continue

        const properties = getDeclarationProperties(rules)
        if (isAllowedProperty(parts.key, properties, allowProperties)) continue

        const variableKeys = new Set(rules.flatMap(getVariableKeys))
        if (isTokenValue(parts.value, variableKeys)) continue

        issues.push({
            className,
            key: parts.key,
            value: parts.value,
            properties
        })
    }

    return issues
}

import { generateValidRules } from '@master/css-validator'
import type { MasterCSS } from '@master/css-engine'
import { inspectMasterCSSClass } from '@master/css-engine/inspect'
import { splitMasterCSSTopLevel } from '@master/css-lexer'

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

function getDeclarationProperties(rules: ReturnType<typeof generateValidRules>) {
    return [...new Set(rules.flatMap((rule) => Object.keys(rule.declarations || {})))].sort()
}

function splitTopLevelValueSegments(value: string) {
    return splitMasterCSSTopLevel(value, '|').map(({ start, end }) => value.slice(start, end))
}

function matchesAllowedPattern(value: string, patterns: string[]) {
    return patterns.some((pattern) => new RegExp(pattern).test(value))
}

function getUnapprovedRawValueSegments(value: string, variableKeys: Set<string>, allowedPatterns: string[]) {
    return splitTopLevelValueSegments(value).filter((segment) =>
        !variableKeys.has(segment)
        && !matchesAllowedPattern(segment, allowedPatterns)
    )
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
        const parts = inspectMasterCSSClass(css, className)
        if (!parts.key || !parts.value) continue

        const rules = generateValidRules(className, css)
        if (!rules.length || !parts.variables.size) continue

        const properties = getDeclarationProperties(rules)
        if (isAllowedProperty(parts.key, properties, allowProperties)) continue

        const variableKeys = new Set(parts.variableEntries.map(({ key }) => key))
        const unapprovedSegments = getUnapprovedRawValueSegments(parts.value, variableKeys, allowedPatterns)
        if (!unapprovedSegments.length) continue

        issues.push({
            className,
            key: parts.key,
            value: unapprovedSegments.join('|'),
            properties
        })
    }

    return issues
}

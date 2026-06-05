import type { PropertiesHyphen } from 'csstype'
import type { Variable } from 'shared/css-syntax'
import { normalizeVariableValue } from './css-variables'

export interface CollectAnimationNamesOptions {
    animationNames: Iterable<string>
    variables?: Map<string, Variable>
    variableNames?: Iterable<string>
}

function isAnimationDeclaration(propertyName: string) {
    return propertyName === 'animation' || propertyName === 'animation-name'
}

function addAnimationName(references: Set<string>, animationNames: Set<string>, animationName: string) {
    if (animationNames.has(animationName)) {
        references.add(animationName)
    }
}

export function collectAnimationNamesFromValue(value: string | number | undefined, animationNames: Iterable<string>) {
    const references = new Set<string>()
    if (value === undefined) return references
    const names = new Set(animationNames)
    if (!names.size) return references
    const normalizedValue = normalizeVariableValue(value).value
    for (const rawValue of normalizedValue.split(/[\s,]+/)) {
        addAnimationName(references, names, rawValue)
    }
    return references
}

function collectAnimationNamesFromVariable(
    references: Set<string>,
    variable: Variable | undefined,
    animationNames: Set<string>,
    variables: Map<string, Variable> | undefined,
    visited = new Set<string>()
) {
    if (!variable || visited.has(variable.name)) return
    visited.add(variable.name)
    for (const animationName of collectAnimationNamesFromValue(variable.value, animationNames)) {
        references.add(animationName)
    }
    for (const modeVariable of Object.values(variable.modes || {})) {
        for (const animationName of collectAnimationNamesFromValue(modeVariable.value, animationNames)) {
            references.add(animationName)
        }
    }
    variable.dependencies?.forEach((dependency) => {
        collectAnimationNamesFromVariable(references, variables?.get(dependency), animationNames, variables, visited)
    })
}

export function collectAnimationNamesFromDeclaration(
    propertyName: string,
    value: string | number | undefined,
    options: CollectAnimationNamesOptions
) {
    const references = new Set<string>()
    if (!isAnimationDeclaration(propertyName)) return references
    const animationNames = new Set(options.animationNames)
    if (!animationNames.size) return references
    for (const animationName of collectAnimationNamesFromValue(value, animationNames)) {
        references.add(animationName)
    }
    for (const variableName of options.variableNames || []) {
        collectAnimationNamesFromVariable(
            references,
            options.variables?.get(variableName),
            animationNames,
            options.variables
        )
    }
    return references
}

export default function collectAnimationNames(
    declarations: PropertiesHyphen,
    options: CollectAnimationNamesOptions
) {
    const references = new Set<string>()
    for (const propertyName in declarations) {
        const propertyValue = declarations[propertyName as keyof PropertiesHyphen] as string | number | undefined
        for (const animationName of collectAnimationNamesFromDeclaration(propertyName, propertyValue, options)) {
            references.add(animationName)
        }
    }
    return references.size ? references : undefined
}

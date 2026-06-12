import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileCSSPlanFile } from '@master/css-compiler'
import type {
    MasterCSSPlan,
    MasterCSSPlanVariable,
    MasterCSSPlanVariableAliasSet
} from 'shared/master-css-plan'
import defaultPlan from '../src/default-plan'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const outputFile = resolve(packageRoot, 'src/default-plan.ts')
const { plan: cssPlan } = compileCSSPlanFile(sourceFile)
const variableNamespaceRefs = new Set([
    ...Object.keys(defaultPlan.variableNamespaces || {}),
    ...(defaultPlan.utilities || []).flatMap((utility) => utility.variableAliasRefs || [])
])

function getVariableKeyByNamespace(variableName: string, namespace: string) {
    const negative = variableName.startsWith('-')
    const positiveName = negative ? variableName.slice(1) : variableName
    if (positiveName !== namespace && !positiveName.startsWith(namespace + '-')) return
    const key = positiveName === namespace ? '' : positiveName.slice(namespace.length + 1)
    return negative ? '-' + key : key
}

function createVariableNamespaces(variables: MasterCSSPlanVariable[] = []) {
    const variableNamespaces: Record<string, MasterCSSPlanVariableAliasSet> = {}
    for (const ref of variableNamespaceRefs) {
        const namespace = ref.slice(1)
        const aliases: MasterCSSPlanVariableAliasSet = []
        const usedKeys = new Set<string>()
        for (const variable of variables) {
            if (!variable.name) continue
            const key = getVariableKeyByNamespace(variable.name, namespace)
            if (key === undefined || usedKeys.has(key)) continue
            usedKeys.add(key)
            aliases.push([key, variable.name])
        }
        if (aliases.length) variableNamespaces[ref] = aliases
    }
    return Object.keys(variableNamespaces).length ? variableNamespaces : undefined
}

const plan: MasterCSSPlan = {
    version: 1,
    settings: { ...defaultPlan.settings, ...cssPlan.settings },
    variables: cssPlan.variables,
    animations: cssPlan.animations,
    variants: cssPlan.variants,
    atRules: cssPlan.atRules,
    breakpointAtRules: cssPlan.breakpointAtRules,
    containerAtRules: cssPlan.containerAtRules,
    selectors: cssPlan.selectors,
    variableNamespaces: createVariableNamespaces(cssPlan.variables),
    variableAliasSets: defaultPlan.variableAliasSets,
    utilities: defaultPlan.utilities,
    utilityBuckets: defaultPlan.utilityBuckets,
    functions: defaultPlan.functions,
    ...(defaultPlan.debug != null ? { debug: defaultPlan.debug } : {})
}
type PlanUtility = NonNullable<MasterCSSPlan['utilities']>[number]

function normalizeTemplateDeclarations(declarations: Record<string, unknown>) {
    const normalized: Record<string, unknown> = {}
    for (const propertyName in declarations) {
        const value = declarations[propertyName]
        normalized[propertyName] = Array.isArray(value)
            ? value.map((part) => part === undefined ? null : part)
            : value === undefined
                ? null
                : value
    }
    return normalized
}

function normalizeUtilityForJSON(utility: PlanUtility): PlanUtility {
    if (utility.emit.type !== 'template') return utility
    return {
        ...utility,
        emit: {
            ...utility.emit,
            declarations: normalizeTemplateDeclarations(utility.emit.declarations as Record<string, unknown>)
        }
    }
}

function stringifyPlan(plan: MasterCSSPlan) {
    return JSON.stringify(plan.utilities?.length
        ? { ...plan, utilities: plan.utilities.map(normalizeUtilityForJSON) }
        : plan)
}

const code = [
    '// @ts-nocheck',
    "import type { MasterCSSPlan } from 'shared/master-css-plan'",
    '',
    `const defaultPlan: MasterCSSPlan = ${stringifyPlan(plan)}`,
    '',
    'export default defaultPlan',
    ''
].join('\n')

writeFileSync(outputFile, code)

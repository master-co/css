import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileCSSPlanFile } from '@master/css-compiler'
import functions from '../src/functions'
import { settings, variableNamespaceRefs } from '../src/settings'
import sourceUtilities from '../src/utilities'
import type {
    MasterCSSPlan,
    MasterCSSPlanFunctions,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityBuckets,
    MasterCSSPlanVariable,
    MasterCSSPlanVariableAliasSet
} from 'shared/master-css-plan'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const outputFile = resolve(packageRoot, 'src/default-plan.ts')

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

function createUtilities(): MasterCSSPlanUtility[] {
    return sourceUtilities
        .map((utility, order) => {
            const { id, name, type, ...rest } = clone(utility)
            return {
                id,
                name,
                type,
                order,
                ...rest
            } as MasterCSSPlanUtility
        })
        .reverse()
}

function addBucketIndex(bucket: number[] | undefined, index: number) {
    if (bucket?.includes(index)) return bucket
    const nextBucket = bucket || []
    nextBucket.push(index)
    return nextBucket
}

function createUtilityBuckets(utilities: MasterCSSPlanUtility[] | undefined): MasterCSSPlanUtilityBuckets | undefined {
    const buckets: MasterCSSPlanUtilityBuckets = {}
    utilities?.forEach((utility, index) => {
        for (const matcher of utility.matchers) {
            switch (matcher.type) {
                case 'variable':
                    if (utility.variableAliases?.length || utility.variableAliasSet !== undefined || utility.variableAliasRefs?.length) {
                        buckets.variable = addBucketIndex(buckets.variable, index)
                    }
                    break
                case 'value':
                    if (utility.values?.length || utility.kind) buckets.value = addBucketIndex(buckets.value, index)
                    break
                case 'key':
                    buckets.key = addBucketIndex(buckets.key, index)
                    break
                default:
                    buckets.arbitrary = addBucketIndex(buckets.arbitrary, index)
                    break
            }
        }
    })
    return Object.keys(buckets).length ? buckets : undefined
}

function collectVariableNamespaceRefs(utilities: MasterCSSPlanUtility[]) {
    const refs = new Set<string>(variableNamespaceRefs)
    for (const utility of utilities) {
        for (const ref of utility.variableAliasRefs || []) {
            refs.add(ref)
        }
    }
    return refs
}

function getVariableKeyByNamespace(variableName: string, namespace: string) {
    const negative = variableName.startsWith('-')
    const positiveName = negative ? variableName.slice(1) : variableName
    if (positiveName !== namespace && !positiveName.startsWith(namespace + '-')) return
    const key = positiveName === namespace ? '' : positiveName.slice(namespace.length + 1)
    return negative ? '-' + key : key
}

function createVariableNamespaces(variables: MasterCSSPlanVariable[] = [], refs: Iterable<string>) {
    const variableNamespaces: Record<string, MasterCSSPlanVariableAliasSet> = {}
    for (const ref of refs) {
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

export function createDefaultPlan(cssPlan: MasterCSSPlan): MasterCSSPlan {
    const utilities = createUtilities()
    return {
        version: 1,
        settings: { ...settings, ...cssPlan.settings },
        variables: cssPlan.variables,
        animations: cssPlan.animations,
        variants: cssPlan.variants,
        atRules: cssPlan.atRules,
        breakpointAtRules: cssPlan.breakpointAtRules,
        containerAtRules: cssPlan.containerAtRules,
        selectors: cssPlan.selectors,
        variableNamespaces: createVariableNamespaces(cssPlan.variables, collectVariableNamespaceRefs(utilities)),
        variableAliasSets: null as unknown as MasterCSSPlan['variableAliasSets'],
        utilities,
        utilityBuckets: createUtilityBuckets(utilities),
        functions: clone(functions) as MasterCSSPlanFunctions
    }
}

export function createDefaultPlanFromSourceFile(file = sourceFile) {
    return createDefaultPlan(compileCSSPlanFile(file).plan)
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

export function createDefaultPlanModule(plan: MasterCSSPlan) {
    return [
        '// @ts-nocheck',
        "import type { MasterCSSPlan } from 'shared/master-css-plan'",
        '',
        `const defaultPlan: MasterCSSPlan = ${stringifyPlan(plan)}`,
        '',
        'export default defaultPlan',
        ''
    ].join('\n')
}

export function writeDefaultPlan(file = outputFile) {
    writeFileSync(file, createDefaultPlanModule(createDefaultPlanFromSourceFile()))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    writeDefaultPlan()
}

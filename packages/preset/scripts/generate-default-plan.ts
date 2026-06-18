import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileCSSPlanFile } from '@master/css-compiler'
import { stringifyMasterCSSPlanJSON } from 'shared/master-css-plan-json'
import UtilityType from 'shared/utility-type'
import functions from '../src/functions'
import keyAliases from '../src/key-aliases'
import nativeValueNamespaces from '../src/native-value-namespaces'
import { settings } from '../src/settings'
import sourceUtilities from '../src/utilities'
import type {
    MasterCSSPlan,
    MasterCSSPlanFunctions,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityBuckets
} from 'shared/master-css-plan'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const outputFile = resolve(packageRoot, 'src/default-plan.json')
function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

function createSourceUtilities(): MasterCSSPlanUtility[] {
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

function normalizeUtilityOrders(utilities: MasterCSSPlanUtility[] = []): MasterCSSPlanUtility[] {
    return utilities.map((utility, index) => ({
        ...clone(utility),
        order: utilities.length - index - 1
    }))
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
                    if (utility.variableAliases?.length || utility.variableAliasRefs?.length) {
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

export function createDefaultPlan(cssPlan: MasterCSSPlan): MasterCSSPlan {
    const utilities = normalizeUtilityOrders(cssPlan.utilities || createSourceUtilities())
    return {
        version: 2,
        settings: { ...settings, ...cssPlan.settings },
        variables: cssPlan.variables,
        animations: cssPlan.animations,
        variants: cssPlan.variants,
        atRules: cssPlan.atRules,
        breakpointAtRules: cssPlan.breakpointAtRules,
        containerAtRules: cssPlan.containerAtRules,
        selectors: cssPlan.selectors,
        utilities,
        utilityBuckets: createUtilityBuckets(utilities),
        functions: clone(functions) as MasterCSSPlanFunctions,
        keyAliases: clone(keyAliases),
        nativeValueNamespaces: clone(nativeValueNamespaces)
    }
}

export function createDefaultPlanFromSourceFile(file = sourceFile) {
    const utilities = createSourceUtilities()
    return createDefaultPlan(compileCSSPlanFile(file, {
        basePlan: {
            version: 2,
            utilities,
            utilityBuckets: createUtilityBuckets(utilities),
            nativeValueNamespaces: clone(nativeValueNamespaces)
        }
    }).plan)
}

export function createDefaultPlanJSON(plan: MasterCSSPlan) {
    return stringifyMasterCSSPlanJSON(plan)
}

export function writeDefaultPlan(file = outputFile) {
    writeFileSync(file, createDefaultPlanJSON(createDefaultPlanFromSourceFile()))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    writeDefaultPlan()
}

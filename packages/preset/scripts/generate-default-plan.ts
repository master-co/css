import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCSS } from '@master/css-engine'
import { stringifyMasterCSSPlanJSON } from 'shared/master-css-plan-json'
import type {
    MasterCSSPlan,
    MasterCSSPlanUtility,
    MasterCSSPlanUtilityBuckets
} from 'shared/master-css-plan'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const outputFile = resolve(packageRoot, 'src/default-plan.json')
const defaultEngineSettings = createCSS({ version: 3 }).settings
const { compileCSSPlanFile } = await import(new URL('../../compiler/src/index.ts', import.meta.url).href) as typeof import('@master/css-compiler')
function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

function isDefaultSettingValue(value: unknown, defaultValue: unknown) {
    if (Array.isArray(value) && Array.isArray(defaultValue)) {
        return value.length === defaultValue.length
            && value.every((item, index) => item === defaultValue[index])
    }
    return value === defaultValue
}

function createDefaultPlanSettings(settings: MasterCSSPlan['settings']): MasterCSSPlan['settings'] {
    if (!settings) return
    const entries = Object.entries(settings).filter(([key, value]) =>
        !isDefaultSettingValue(value, defaultEngineSettings[key as keyof typeof defaultEngineSettings])
    )
    return entries.length ? Object.fromEntries(entries) as MasterCSSPlan['settings'] : undefined
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
                    if (utility.kind) buckets.value = addBucketIndex(buckets.value, index)
                    break
                case 'key':
                    buckets.key = addBucketIndex(buckets.key, index)
                    break
                case 'pattern':
                    buckets.pattern = addBucketIndex(buckets.pattern, index)
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
    const utilities = normalizeUtilityOrders(cssPlan.utilities || [])
    const settings = createDefaultPlanSettings(cssPlan.settings)
    return {
        version: 3,
        ...(settings ? { settings } : {}),
        variables: cssPlan.variables,
        animations: cssPlan.animations,
        variants: cssPlan.variants,
        atRules: cssPlan.atRules,
        breakpointAtRules: cssPlan.breakpointAtRules,
        containerAtRules: cssPlan.containerAtRules,
        selectors: cssPlan.selectors,
        utilities,
        utilityBuckets: createUtilityBuckets(utilities)
    }
}

export function createDefaultPlanFromSourceFile(file = sourceFile) {
    return createDefaultPlan(compileCSSPlanFile(file).plan)
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

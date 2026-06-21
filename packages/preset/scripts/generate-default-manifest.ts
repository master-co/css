import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCSS } from '@master/css-engine'
import { stringifyMasterCSSManifestJSON } from 'shared/master-css-manifest-json'
import type {
    MasterCSSManifest,
    MasterCSSManifestUtility,
    MasterCSSManifestUtilityBuckets
} from 'shared/master-css-manifest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const outputFile = resolve(packageRoot, 'src/default-manifest.json')
const defaultEngineSettings = createCSS({ version: 1 }).settings
const { compileCSSManifestFile } = await import(new URL('../../compiler/src/index.ts', import.meta.url).href) as typeof import('@master/css-compiler')
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

function createDefaultManifestSettings(settings: MasterCSSManifest['settings']): MasterCSSManifest['settings'] {
    if (!settings) return
    const entries = Object.entries(settings).filter(([key, value]) =>
        !isDefaultSettingValue(value, defaultEngineSettings[key as keyof typeof defaultEngineSettings])
    )
    return entries.length ? Object.fromEntries(entries) as MasterCSSManifest['settings'] : undefined
}

function normalizeUtilityOrders(utilities: MasterCSSManifestUtility[] = []): MasterCSSManifestUtility[] {
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

function createUtilityBuckets(utilities: MasterCSSManifestUtility[] | undefined): MasterCSSManifestUtilityBuckets | undefined {
    const buckets: MasterCSSManifestUtilityBuckets = {}
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

export function createDefaultManifest(cssManifest: MasterCSSManifest): MasterCSSManifest {
    const utilities = normalizeUtilityOrders(cssManifest.utilities || [])
    const settings = createDefaultManifestSettings(cssManifest.settings)
    return {
        version: 1,
        ...(settings ? { settings } : {}),
        variables: cssManifest.variables,
        animations: cssManifest.animations,
        variants: cssManifest.variants,
        atRules: cssManifest.atRules,
        breakpointAtRules: cssManifest.breakpointAtRules,
        containerAtRules: cssManifest.containerAtRules,
        selectors: cssManifest.selectors,
        utilities,
        utilityBuckets: createUtilityBuckets(utilities)
    }
}

export function createDefaultManifestFromSourceFile(file = sourceFile) {
    return createDefaultManifest(compileCSSManifestFile(file).manifest)
}

export function createDefaultManifestJSON(manifest: MasterCSSManifest) {
    return stringifyMasterCSSManifestJSON(manifest)
}

export function writeDefaultManifest(file = outputFile) {
    writeFileSync(file, createDefaultManifestJSON(createDefaultManifestFromSourceFile()))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    writeDefaultManifest()
}

import { Page } from '@playwright/test'
import { createCSS, createHydrationManifest, type MasterCSSManifest } from '@master/css'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
    MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
    type MasterCSSHydrationManifest
} from 'shared/master-css-hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from 'shared/master-css-runtime-style'
import UtilityType from 'shared/utility-type'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createServer, type ViteDevServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')
const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
let runtimeServerPromise: Promise<ViteDevServer> | undefined

type RuntimeProjectManifestUtilityInput = Partial<NonNullable<MasterCSSManifest['utilities']>[number]> & {
    declarations?: Record<string, string | number>
    rules?: { selector?: string, declarations: Record<string, string | number> }[]
}

type RuntimeManifestVariableInput = NonNullable<MasterCSSManifest['variables']>[number]
type RuntimeManifestVariable = NonNullable<MasterCSSManifest['variables']>[number]

type RuntimeProjectManifestInput = Partial<Omit<MasterCSSManifest, 'utilities'>> & {
    rootSize?: number
    baseUnit?: number
    defaultMode?: string
    modeTrigger?: NonNullable<MasterCSSManifest['settings']>['modeTrigger']
    modes?: string[]
    variables?: RuntimeManifestVariableInput[]
    utilities?: RuntimeProjectManifestUtilityInput[]
}

function getDefaultVariableName(key: string, namespace?: string) {
    const negative = key.startsWith('-')
    const positiveKey = negative ? key.slice(1) : key
    const name = namespace
        ? `${namespace}${positiveKey ? '-' + positiveKey : ''}`
        : positiveKey
    return negative ? '-' + name : name
}

function normalizeVariableValue(value: RuntimeManifestVariable['value'] | undefined) {
    if (typeof value !== 'string') {
        return { value, dependencies: undefined }
    }
    const dependencies = new Set<string>()
    const normalized = value
        .replace(/\|/g, ' ')
        .replace(/\$([-_a-zA-Z0-9]+)/g, (_text, name: string) => {
            dependencies.add(name)
            return `var(--${name})`
        })
    return {
        value: normalized,
        dependencies: dependencies.size ? [...dependencies] : undefined
    }
}

function inferVariableType(value: RuntimeManifestVariable['value'] | undefined, modes?: RuntimeManifestVariable['modes']) {
    if (typeof value === 'number') return 'number'
    const firstMode = modes && Object.values(modes)[0]
    return firstMode?.type || 'string'
}

function normalizeVariable(variable: RuntimeManifestVariableInput): RuntimeManifestVariable {
    const value = variable.value
    const name = variable.name || getDefaultVariableName(variable.key, variable.namespace)
    const normalizedValue = normalizeVariableValue(value)
    return {
        ...variable,
        name,
        type: variable.type || inferVariableType(value, variable.modes),
        ...(normalizedValue.value !== undefined ? { value: normalizedValue.value } : {}),
        ...(normalizedValue.dependencies?.length ? {
            dependencies: [...new Set([...(variable.dependencies || []), ...normalizedValue.dependencies])]
        } : variable.dependencies?.length ? { dependencies: [...variable.dependencies] } : {})
    }
}

function createRuntimeVariables(defaultVariables: RuntimeManifestVariable[], inputVariables: RuntimeManifestVariableInput[] | undefined) {
    const variables = new Map<string, RuntimeManifestVariable>()
    for (const variable of defaultVariables) {
        if (!variable.name) continue
        variables.set(variable.name, {
            ...variable,
            ...(variable.modes ? { modes: { ...variable.modes } } : {}),
            ...(variable.dependencies?.length ? { dependencies: [...variable.dependencies] } : {})
        })
    }

    for (const inputVariable of inputVariables || []) {
        const normalized = normalizeVariable(inputVariable)
        const current = variables.get(normalized.name!) || {
            name: normalized.name,
            key: normalized.key,
            ...(normalized.namespace ? { namespace: normalized.namespace } : {}),
            type: normalized.type
        }
        if (normalized.mode) {
            current.modes = {
                ...(current.modes || {}),
                [normalized.mode]: {
                    type: normalized.type!,
                    value: normalized.value as string | number
                }
            }
        } else {
            Object.assign(current, {
                key: normalized.key,
                ...(normalized.namespace ? { namespace: normalized.namespace } : {}),
                type: normalized.type,
                ...(normalized.value !== undefined ? { value: normalized.value } : {}),
                ...(normalized.dependencies?.length ? { dependencies: normalized.dependencies } : {}),
                ...(normalized.inline ? { inline: true } : {}),
                ...(normalized.static ? { static: true } : {})
            })
        }
        variables.set(normalized.name!, current)
    }

    return [...variables.values()]
}

function normalizeUtility(utility: RuntimeProjectManifestUtilityInput, order: number): NonNullable<MasterCSSManifest['utilities']>[number] {
    if (utility.emit && utility.matchers) return utility as NonNullable<MasterCSSManifest['utilities']>[number]
    const name = utility.name || utility.id || ''
    const isSemantic = utility.type === UtilityType.Semantic || utility.type === undefined
    return {
        id: utility.id || (isSemantic ? `.${name}` : name),
        name,
        type: utility.type ?? UtilityType.Semantic,
        order: utility.order ?? order,
        layer: utility.layer,
        emit: {
            type: 'static',
            rules: utility.rules || [
                {
                    selector: '&',
                    declarations: utility.declarations || {}
                }
            ]
        },
        matchers: [{ type: 'static', name }]
    }
}

function addBucketIndex(bucket: number[] | undefined, index: number) {
    if (bucket?.includes(index)) return bucket
    const nextBucket = bucket || []
    nextBucket.push(index)
    return nextBucket
}

function createRuntimeUtilityBuckets(
    defaultBuckets: MasterCSSManifest['utilityBuckets'],
    utilities: NonNullable<MasterCSSManifest['utilities']>,
    startIndex: number
) {
    const utilityBuckets: NonNullable<MasterCSSManifest['utilityBuckets']> = {
        ...(defaultBuckets?.variable?.length ? { variable: [...defaultBuckets.variable] } : {}),
        ...(defaultBuckets?.value?.length ? { value: [...defaultBuckets.value] } : {}),
        ...(defaultBuckets?.key?.length ? { key: [...defaultBuckets.key] } : {}),
        ...(defaultBuckets?.pattern?.length ? { pattern: [...defaultBuckets.pattern] } : {}),
        ...(defaultBuckets?.arbitrary?.length ? { arbitrary: [...defaultBuckets.arbitrary] } : {})
    }
    utilities.forEach((utility, relativeIndex) => {
        const index = startIndex + relativeIndex
        for (const matcher of utility.matchers) {
            switch (matcher.type) {
                case 'variable':
                    if (utility.variableAliases?.length || utility.variableAliasRefs?.length) {
                        utilityBuckets.variable = addBucketIndex(utilityBuckets.variable, index)
                    }
                    break
                case 'value':
                    if (utility.kind) utilityBuckets.value = addBucketIndex(utilityBuckets.value, index)
                    break
                case 'key':
                    utilityBuckets.key = addBucketIndex(utilityBuckets.key, index)
                    break
                case 'pattern':
                    utilityBuckets.pattern = addBucketIndex(utilityBuckets.pattern, index)
                    break
                default:
                    utilityBuckets.arbitrary = addBucketIndex(utilityBuckets.arbitrary, index)
                    break
            }
        }
    })
    return Object.keys(utilityBuckets).length ? utilityBuckets : undefined
}

function createRuntimeProjectManifest(manifest: RuntimeProjectManifestInput) {
    const defaultUtilities = defaultManifest.utilities || []
    const { rootSize, baseUnit, defaultMode, modeTrigger, modes, ...rest } = manifest
    const variables = createRuntimeVariables(defaultManifest.variables || [], rest.variables)
    const customUtilities = (rest.utilities || []).map((utility, index) => normalizeUtility(utility, defaultUtilities.length + index))
    return {
        ...defaultManifest,
        ...rest,
        version: 1,
        settings: {
            ...defaultManifest.settings,
            ...rest.settings,
            ...(rootSize !== undefined ? { rootSize } : {}),
            ...(baseUnit !== undefined ? { baseUnit } : {}),
            ...(defaultMode !== undefined ? { defaultMode } : {}),
            ...(modeTrigger !== undefined ? { modeTrigger } : {}),
            ...(modes !== undefined ? { modes } : {})
        },
        variables,
        animations: {
            ...(defaultManifest.animations || {}),
            ...(rest.animations || {})
        },
        variants: [
            ...(defaultManifest.variants || []),
            ...(rest.variants || [])
        ],
        utilities: [
            ...defaultUtilities,
            ...customUtilities
        ],
        utilityBuckets: createRuntimeUtilityBuckets(defaultManifest.utilityBuckets, customUtilities, defaultUtilities.length)
    } satisfies MasterCSSManifest
}

async function createHydrationManifestForPage(page: Page, manifest: MasterCSSManifest) {
    const classNames = await page.evaluate(() => {
        const classNames = new Set<string>()
        for (const element of document.querySelectorAll('[class]')) {
            element.classList.forEach((className) => classNames.add(className))
        }
        return [...classNames]
    })
    const css = createCSS(manifest)
    css.add(...classNames)
    return createHydrationManifest(css)
}

async function getRuntimeLoaderURL() {
    runtimeServerPromise ??= (async () => {
        const server = await createServer({
            appType: 'custom',
            configFile: false,
            define: {
                'process.env.NODE_ENV': JSON.stringify('production')
            },
            logLevel: 'error',
            root: packageRoot,
            server: {
                cors: true,
                host: '127.0.0.1',
                port: 0
            }
        })
        await server.listen()
        return server
    })()
    const server = await runtimeServerPromise
    const localURL = server.resolvedUrls?.local[0]
    if (!localURL) throw new Error('Cannot resolve runtime e2e Vite server URL.')
    return new URL('/e2e/runtime-loader.ts', localURL).href
}

export default async function init(
    page: Page,
    text?: string,
    manifestInput?: RuntimeProjectManifestInput,
    hydrationManifestInput?: MasterCSSHydrationManifest | 'auto'
) {
    const manifest = manifestInput ? createRuntimeProjectManifest(manifestInput) : undefined
    const hydrationManifest = hydrationManifestInput === 'auto'
        ? await createHydrationManifestForPage(page, manifest || defaultManifest)
        : hydrationManifestInput
    await page.evaluate(({ hydrationManifest, text, manifestScriptId, runtimeStyleId }) => {
        if (text) {
            const style = document.createElement('style')
            style.id = runtimeStyleId
            style.textContent = text
            document.head.appendChild(style)
        }
        if (hydrationManifest) {
            const script = document.createElement('script')
            script.type = 'application/json'
            script.id = manifestScriptId
            script.textContent = JSON.stringify(hydrationManifest)
            document.head.appendChild(script)
        }
    }, {
        hydrationManifest,
        text,
        manifestScriptId: MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
        runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID
    })
    await page.evaluate(async ({ loaderURL, manifest }) => {
        const { startCSSRuntime } = await import(loaderURL)
        startCSSRuntime({ manifest })
    }, { loaderURL: await getRuntimeLoaderURL(), manifest })
    await page.waitForFunction(() => !!globalThis.masterCSSRuntime)
}

import { Page } from '@playwright/test'
import { createCSS, createRuntimeManifest, type MasterCSSPlan } from '@master/css'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import {
    MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID,
    type MasterCSSRuntimeManifest
} from 'shared/master-css-runtime-manifest'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const RUNTIME_ASSET_BASE_URL = 'http://master-css-runtime.test'
const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

type RuntimePlanUtilityInput = Partial<NonNullable<MasterCSSPlan['utilities']>[number]> & {
    declarations?: Record<string, string | number>
    rules?: { selector?: string, declarations: Record<string, string | number> }[]
}

type RuntimePlanVariableInput = NonNullable<MasterCSSPlan['variables']>[number]
type RuntimePlanVariable = NonNullable<MasterCSSPlan['variables']>[number]

type RuntimePlanInput = Partial<Omit<MasterCSSPlan, 'utilities'>> & {
    rootSize?: number
    baseUnit?: number
    defaultMode?: string
    modeTrigger?: NonNullable<MasterCSSPlan['settings']>['modeTrigger']
    modes?: string[]
    variables?: RuntimePlanVariableInput[]
    utilities?: RuntimePlanUtilityInput[]
}

function getDefaultVariableName(key: string, namespace?: string) {
    const negative = key.startsWith('-')
    const positiveKey = negative ? key.slice(1) : key
    const name = namespace
        ? `${namespace}${positiveKey ? '-' + positiveKey : ''}`
        : positiveKey
    return negative ? '-' + name : name
}

function normalizeVariableValue(value: RuntimePlanVariable['value'] | undefined) {
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

function inferVariableType(value: RuntimePlanVariable['value'] | undefined, modes?: RuntimePlanVariable['modes']) {
    if (typeof value === 'number') return 'number'
    const firstMode = modes && Object.values(modes)[0]
    return firstMode?.type || 'string'
}

function normalizeVariable(variable: RuntimePlanVariableInput): RuntimePlanVariable {
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

function createRuntimeVariables(defaultVariables: RuntimePlanVariable[], inputVariables: RuntimePlanVariableInput[] | undefined) {
    const variables = new Map<string, RuntimePlanVariable>()
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

function normalizeUtility(utility: RuntimePlanUtilityInput, order: number): NonNullable<MasterCSSPlan['utilities']>[number] {
    if (utility.emit && utility.matchers) return utility as NonNullable<MasterCSSPlan['utilities']>[number]
    const name = utility.name || utility.id || ''
    const isStatic = utility.type === -2 || utility.type === undefined
    return {
        id: utility.id || (isStatic ? `.${name}` : name),
        name,
        type: utility.type ?? -2,
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
    defaultBuckets: MasterCSSPlan['utilityBuckets'],
    utilities: NonNullable<MasterCSSPlan['utilities']>,
    startIndex: number
) {
    const utilityBuckets: NonNullable<MasterCSSPlan['utilityBuckets']> = {
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

function createRuntimePlan(plan: RuntimePlanInput) {
    const defaultUtilities = defaultPlan.utilities || []
    const { rootSize, baseUnit, defaultMode, modeTrigger, modes, ...rest } = plan
    const variables = createRuntimeVariables(defaultPlan.variables || [], rest.variables)
    const customUtilities = (rest.utilities || []).map((utility, index) => normalizeUtility(utility, defaultUtilities.length + index))
    return {
        ...defaultPlan,
        ...rest,
        version: 2,
        settings: {
            ...defaultPlan.settings,
            ...rest.settings,
            ...(rootSize !== undefined ? { rootSize } : {}),
            ...(baseUnit !== undefined ? { baseUnit } : {}),
            ...(defaultMode !== undefined ? { defaultMode } : {}),
            ...(modeTrigger !== undefined ? { modeTrigger } : {}),
            ...(modes !== undefined ? { modes } : {})
        },
        variables,
        animations: {
            ...(defaultPlan.animations || {}),
            ...(rest.animations || {})
        },
        variants: [
            ...(defaultPlan.variants || []),
            ...(rest.variants || [])
        ],
        utilities: [
            ...defaultUtilities,
            ...customUtilities
        ],
        utilityBuckets: createRuntimeUtilityBuckets(defaultPlan.utilityBuckets, customUtilities, defaultUtilities.length)
    } satisfies MasterCSSPlan
}

async function createRuntimeManifestForPage(page: Page, plan: MasterCSSPlan) {
    const classNames = await page.evaluate(() => {
        const classNames = new Set<string>()
        for (const element of document.querySelectorAll('[class]')) {
            element.classList.forEach((className) => classNames.add(className))
        }
        return [...classNames]
    })
    const css = createCSS(plan)
    css.add(...classNames)
    return createRuntimeManifest(css)
}

async function routeRuntimeAssets(page: Page) {
    await page.route(`${RUNTIME_ASSET_BASE_URL}/global.min.js`, (route) => {
        route.fulfill({
            contentType: 'text/javascript',
            body: readFileSync(resolve(__dirname, '../dist/global.min.js'), 'utf8')
        })
    })
    await page.route(`${RUNTIME_ASSET_BASE_URL}/default-plan.json`, (route) => {
        route.fulfill({
            contentType: 'application/json',
            body: readFileSync(resolve(__dirname, '../dist/default-plan.json'), 'utf8')
        })
    })
}

export default async function init(
    page: Page,
    text?: string,
    planInput?: RuntimePlanInput,
    manifest?: MasterCSSRuntimeManifest | 'auto'
) {
    const plan = planInput ? createRuntimePlan(planInput) : undefined
    const runtimeManifest = manifest === 'auto'
        ? await createRuntimeManifestForPage(page, plan || defaultPlan)
        : manifest
    await page.evaluate(({ manifest, plan, text, manifestScriptId }) => {
        if (plan) window.masterCSSPlan = plan
        if (text) {
            const style = document.createElement('style')
            style.id = 'master'
            style.textContent = text
            document.head.appendChild(style)
        }
        if (manifest) {
            const script = document.createElement('script')
            script.type = 'application/json'
            script.id = manifestScriptId
            script.textContent = JSON.stringify(manifest)
            document.head.appendChild(script)
        }
    }, { manifest: runtimeManifest, plan, text, manifestScriptId: MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID })
    await routeRuntimeAssets(page)
    await page.addScriptTag({ type: 'module', url: `${RUNTIME_ASSET_BASE_URL}/global.min.js` })
    await page.waitForFunction(() => !!globalThis.cssRuntime)
}

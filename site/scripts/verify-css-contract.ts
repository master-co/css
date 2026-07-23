import { createHash } from 'node:crypto'
import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectCSSVariableReferences } from './css-variable-references'

type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue }

type HydrationRule = {
    className: string
    key: string
    layer: string
    type: number
    sortTier: number
    priority: JSONValue
    text: string
    nodes?: { text: string }[]
    selectorText?: string
    variableNames?: string[]
    animationNames?: string[]
}

type HydrationManifest = {
    version: number
    rules: HydrationRule[]
    resourceOrder: string[]
}

type CSSContract = {
    cssBytes: number
    cssSha256: string
    cssSegments: string[]
    hydrationBytes: number
    hydrationSha256: string
    hydrationVersion: number
    rules: string[]
    resourceOrder: string[]
    classNames: string[]
}

type SiteCSSContractSnapshot = {
    version: 1
    semanticBaseline: 'ef1a7c851'
    publicBaseline: 'v2.0.0-rc.87'
    approval?: {
        reference: string
    }
    globalManifest: {
        bytes: number
        sha256: string
        value: JSONValue
    }
    cssSegments: Record<string, string>
    rules: Record<string, HydrationRule>
    contracts: Record<string, CSSContract>
    routes: Record<string, string | null>
}

const siteDir = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const outDir = path.join(siteDir, 'out')
const snapshotFile = path.join(siteDir, 'tests', 'css-contract.snapshot.json')
const args = process.argv.slice(2)
const update = args.includes('--update')
const dryRun = args.includes('--dry-run')
const qaReferenceIndex = args.indexOf('--qa-reference')
const qaReference = qaReferenceIndex === -1 ? undefined : args[qaReferenceIndex + 1]

if (update && !dryRun && !qaReference?.trim()) {
    throw new Error(
        'Updating the site CSS contract requires --qa-reference with the reviewed CSS diff or QA decision.'
    )
}

const actual = await createSiteCSSContractSnapshot()
const expected = await readExpectedSnapshot()

if (update && !dryRun) {
    actual.approval = { reference: qaReference!.trim() }
    await writeFile(snapshotFile, `${JSON.stringify(actual, null, 2)}\n`, 'utf8')
    console.log(summary(`Updated ${path.relative(siteDir, snapshotFile)}`, actual))
    process.exit(0)
}

if (!expected) {
    console.error(summary('No approved site CSS contract snapshot exists', actual))
    console.error(
        'Review the generated CSS diff and browser QA, then run '
        + '`pnpm --filter site update:css-contract -- --qa-reference "<approval>"`.'
    )
    process.exitCode = 1
} else {
    actual.approval = expected.approval
    const difference = firstSnapshotDifference(expected, actual)
    if (difference) {
        console.error('Site CSS contract mismatch.')
        console.error(difference)
        console.error(summary('Actual production output', actual))
        process.exitCode = 1
    } else {
        console.log(summary('Site CSS contract verified', actual))
    }
}

async function createSiteCSSContractSnapshot(): Promise<SiteCSSContractSnapshot> {
    if (!await exists(outDir)) {
        throw new Error(`Missing ${outDir}. Run \`pnpm build:site\` first.`)
    }

    const files = await listFiles(outDir)
    const manifestFiles = files.filter((file) =>
        /[/\\]_next[/\\]static[/\\]media[/\\]master-css-manifest\.[^/\\]+\.json$/.test(file)
    )
    if (manifestFiles.length !== 1) {
        throw new Error(`Expected one production Master CSS manifest, found ${manifestFiles.length}.`)
    }

    const globalManifestText = await readFile(manifestFiles[0], 'utf8')
    const globalManifest = JSON.parse(globalManifestText) as JSONValue
    const inlineVariableNames = collectInlineVariableNames(globalManifest)
    const cssSegments: Record<string, string> = {}
    const rules: Record<string, HydrationRule> = {}
    const contracts: Record<string, CSSContract> = {}
    const routes: Record<string, string | null> = {}

    for (const htmlFile of files.filter((file) => file.endsWith('.html')).sort()) {
        const html = await readFile(htmlFile, 'utf8')
        const route = routeFromHTMLFile(htmlFile)
        const style = findMasterCSSStyle(html)
        if (!style) {
            routes[route] = null
            continue
        }
        assertNoInlineVariableReferences(route, 'generated CSS', style.css, inlineVariableNames)

        const hydrationReference = attributeValue(
            style.attributes,
            'data-master-css-hydration-manifest'
        )
        if (!hydrationReference) {
            throw new Error(`${route} has style#master-css without hydration metadata.`)
        }
        const hydrationFile = publicOutputPath(hydrationReference)
        const hydrationText = await readFile(hydrationFile, 'utf8')
        const hydration = JSON.parse(hydrationText) as HydrationManifest
        if (
            hydration.version !== 1
            || !Array.isArray(hydration.rules)
            || !Array.isArray(hydration.resourceOrder)
        ) {
            throw new Error(`${route} references an invalid Master CSS hydration manifest.`)
        }
        for (const rule of hydration.rules) {
            assertNoInlineVariableReferences(
                route,
                `hydration rule ${rule.className}`,
                rule.text,
                inlineVariableNames
            )
        }

        let segments: string[]
        try {
            segments = splitCSSSegments(style.css)
        } catch (error) {
            throw new Error(`${route} cannot split exact CSS segments: ${(error as Error).message}`)
        }
        const segmentIds = segments.map((segment) => addCatalogValue(cssSegments, segment))
        const reconstructedCSS = segmentIds.map((id) => cssSegments[id]).join('')
        if (reconstructedCSS !== style.css) {
            throw new Error(`${route} CSS segment catalog did not preserve exact bytes.`)
        }
        const ruleIds = hydration.rules.map((rule) => addCatalogValue(rules, rule))
        const contract: CSSContract = {
            cssBytes: Buffer.byteLength(style.css),
            cssSha256: sha256(style.css),
            cssSegments: segmentIds,
            hydrationBytes: Buffer.byteLength(hydrationText),
            hydrationSha256: sha256(hydrationText),
            hydrationVersion: hydration.version,
            rules: ruleIds,
            resourceOrder: hydration.resourceOrder,
            classNames: [...new Set(hydration.rules.map((rule) => rule.className))].sort()
        }
        const contractId = addCatalogValue(contracts, contract)
        routes[route] = contractId
    }

    return {
        version: 1,
        semanticBaseline: 'ef1a7c851',
        publicBaseline: 'v2.0.0-rc.87',
        globalManifest: {
            bytes: Buffer.byteLength(globalManifestText),
            sha256: sha256(globalManifestText),
            value: globalManifest
        },
        cssSegments: sortRecord(cssSegments),
        rules: sortRecord(rules),
        contracts: sortRecord(contracts),
        routes: sortRecord(routes)
    }
}

function collectInlineVariableNames(manifest: JSONValue) {
    const names = new Set<string>()
    if (!isJSONObject(manifest) || !isJSONObject(manifest.variables)) return names
    for (const [namespace, definitions] of Object.entries(manifest.variables)) {
        if (!Array.isArray(definitions)) continue
        for (const definition of definitions) {
            if (!isJSONObject(definition) || definition.inline !== true) continue
            const key = typeof definition.key === 'string' ? definition.key : ''
            const name = typeof definition.name === 'string'
                ? definition.name
                : namespace && key
                    ? `${namespace}-${key}`
                    : namespace || key
            if (name) names.add(name)
        }
    }
    return names
}

function assertNoInlineVariableReferences(
    route: string,
    sourceName: string,
    source: string,
    inlineVariableNames: Set<string>
) {
    const reference = collectCSSVariableReferences(source)
        .find((name) => inlineVariableNames.has(name))
    if (reference) {
        throw new Error(
            `${route} ${sourceName} references inline variable --${reference}; `
            + 'inline variables must be resolved before CSS emission.'
        )
    }
}

function isJSONObject(value: JSONValue): value is { [key: string]: JSONValue } {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

async function readExpectedSnapshot() {
    if (!await exists(snapshotFile)) return undefined
    return JSON.parse(await readFile(snapshotFile, 'utf8')) as SiteCSSContractSnapshot
}

function findMasterCSSStyle(html: string) {
    const matches = [...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)]
        .filter((match) => attributeValue(match[1], 'id') === 'master-css')
    if (matches.length > 1) {
        throw new Error('Static HTML contains more than one style#master-css element.')
    }
    const match = matches[0]
    return match && {
        attributes: match[1],
        css: match[2]
    }
}

function attributeValue(attributes: string, name: string) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return attributes.match(new RegExp(`\\b${escapedName}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2]
}

function publicOutputPath(reference: string) {
    const pathname = decodeURIComponent(new URL(reference, 'https://css-contract.invalid').pathname)
    const output = path.join(outDir, ...pathname.split('/').filter(Boolean))
    const relative = path.relative(outDir, output)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Hydration manifest reference escapes site/out: ${reference}`)
    }
    return output
}

function routeFromHTMLFile(file: string) {
    const relative = path.relative(outDir, file).split(path.sep).join('/')
    if (relative === 'index.html') return '/'
    if (relative.endsWith('/index.html')) {
        return `/${relative.slice(0, -'/index.html'.length)}`
    }
    return `/${relative.slice(0, -'.html'.length)}`
}

export function splitCSSSegments(css: string) {
    const output: string[] = []
    for (const rule of splitRuleList(css)) {
        const openBrace = firstOpenBrace(rule)
        if (openBrace !== -1 && /^\s*@layer\s+[-\w]+\s*\{/.test(rule)) {
            output.push(rule.slice(0, openBrace + 1))
            output.push(...splitRuleList(rule.slice(openBrace + 1, -1)))
            output.push(rule.slice(-1))
        } else {
            output.push(rule)
        }
    }
    return output.filter(Boolean)
}

function splitRuleList(css: string) {
    const output: string[] = []
    let start = 0
    let depth = 0
    let quote: string | undefined
    let escaped = false
    let comment = false

    for (let index = 0; index < css.length; index++) {
        const character = css[index]
        const next = css[index + 1]
        if (comment) {
            if (character === '*' && next === '/') {
                comment = false
                index++
            }
            continue
        }
        if (quote) {
            if (escaped) escaped = false
            else if (character === '\\') escaped = true
            else if (character === quote) quote = undefined
            continue
        }
        if (character === '\\') {
            index++
        } else if (character === '/' && next === '*') {
            comment = true
            index++
        } else if (character === '"' || character === '\'') {
            quote = character
        } else if (character === '{') {
            depth++
        } else if (character === '}') {
            depth--
            if (depth < 0) throw new Error('Generated CSS contains an unmatched closing brace.')
            if (depth === 0) {
                output.push(css.slice(start, index + 1))
                start = index + 1
            }
        } else if (character === ';' && depth === 0) {
            output.push(css.slice(start, index + 1))
            start = index + 1
        }
    }
    if (depth !== 0 || quote || comment) {
        throw new Error('Generated CSS contains an unclosed block, string, or comment.')
    }
    if (start < css.length) output.push(css.slice(start))
    return output
}

function firstOpenBrace(css: string) {
    let quote: string | undefined
    let escaped = false
    for (let index = 0; index < css.length; index++) {
        const character = css[index]
        if (quote) {
            if (escaped) escaped = false
            else if (character === '\\') escaped = true
            else if (character === quote) quote = undefined
        } else if (character === '\\') {
            index++
        } else if (character === '"' || character === '\'') {
            quote = character
        } else if (character === '{') {
            return index
        }
    }
    return -1
}

function addCatalogValue<T>(catalog: Record<string, T>, value: T) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    const id = sha256(serialized).slice(0, 16)
    const existing = catalog[id]
    if (existing !== undefined && JSON.stringify(existing) !== JSON.stringify(value)) {
        throw new Error(`SHA-256 catalog collision for ${id}.`)
    }
    catalog[id] = value
    return id
}

function firstSnapshotDifference(
    expected: SiteCSSContractSnapshot,
    actual: SiteCSSContractSnapshot
) {
    if (
        expected.version !== actual.version
        || expected.semanticBaseline !== actual.semanticBaseline
        || expected.publicBaseline !== actual.publicBaseline
    ) {
        return 'Snapshot version or historical baseline changed.'
    }
    if (expected.globalManifest.sha256 !== actual.globalManifest.sha256) {
        const valueDifference = firstJSONDifference(
            expected.globalManifest.value,
            actual.globalManifest.value,
            'globalManifest.value'
        )
        return [
            `Global Manifest v1 bytes changed: ${expected.globalManifest.sha256} → ${actual.globalManifest.sha256}.`,
            valueDifference || 'Parsed Manifest JSON is equal; only exact serialization bytes changed.'
        ].join('\n')
    }

    const routeDifference = firstRecordDifference(expected.routes, actual.routes)
    if (routeDifference) {
        const route = routeDifference.key
        if (routeDifference.kind !== 'changed') {
            return `Static route ${route} was ${routeDifference.kind}.`
        }
        const expectedId = expected.routes[route]
        const actualId = actual.routes[route]
        if (expectedId === null || actualId === null) {
            return `Static route ${route} changed CSS presence: ${expectedId} → ${actualId}.`
        }
        return `Static route ${route} changed contract.\n${contractDifference(
            expected.contracts[expectedId],
            actual.contracts[actualId],
            expected,
            actual
        )}`
    }
    return firstJSONDifference(expected, actual, 'snapshot')
}

function contractDifference(
    expected: CSSContract,
    actual: CSSContract,
    expectedSnapshot: SiteCSSContractSnapshot,
    actualSnapshot: SiteCSSContractSnapshot
) {
    if (expected.cssSha256 !== actual.cssSha256) {
        const length = Math.max(expected.cssSegments.length, actual.cssSegments.length)
        for (let index = 0; index < length; index++) {
            const expectedId = expected.cssSegments[index]
            const actualId = actual.cssSegments[index]
            if (expectedId === actualId) continue
            const expectedText = expectedSnapshot.cssSegments[expectedId] || ''
            const actualText = actualSnapshot.cssSegments[actualId] || ''
            return [
                `Inline CSS bytes changed: ${expected.cssSha256} → ${actual.cssSha256}.`,
                `First changed CSS segment: ${index} (${expectedId || '<missing>'} → ${actualId || '<missing>'}).`,
                firstByteDifference(expectedText, actualText)
            ].join('\n')
        }
        return `Inline CSS bytes changed: ${expected.cssSha256} → ${actual.cssSha256}.`
    }
    if (expected.hydrationSha256 !== actual.hydrationSha256) {
        const length = Math.max(expected.rules.length, actual.rules.length)
        for (let index = 0; index < length; index++) {
            const expectedId = expected.rules[index]
            const actualId = actual.rules[index]
            if (expectedId === actualId) continue
            const expectedRule = expectedSnapshot.rules[expectedId]
            const actualRule = actualSnapshot.rules[actualId]
            return [
                `Hydration bytes changed: ${expected.hydrationSha256} → ${actual.hydrationSha256}.`,
                `First changed hydration rule: ${index} (${expectedId || '<missing>'} → ${actualId || '<missing>'}).`,
                firstJSONDifference(expectedRule as unknown as JSONValue, actualRule as unknown as JSONValue, 'rule')
                || 'Only rule serialization changed.'
            ].join('\n')
        }
        return [
            `Hydration bytes changed: ${expected.hydrationSha256} → ${actual.hydrationSha256}.`,
            firstJSONDifference(
                expected.resourceOrder as unknown as JSONValue,
                actual.resourceOrder as unknown as JSONValue,
                'resourceOrder'
            ) || 'Parsed hydration metadata is equal; only exact serialization bytes changed.'
        ].join('\n')
    }
    return firstJSONDifference(
        expected as unknown as JSONValue,
        actual as unknown as JSONValue,
        'contract'
    ) || 'Contract id changed without a readable field difference.'
}

function firstRecordDifference<T>(
    expected: Record<string, T>,
    actual: Record<string, T>
): { key: string, kind: 'added' | 'removed' | 'changed' } | undefined {
    for (const key of [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort()) {
        if (!(key in expected)) return { key, kind: 'added' }
        if (!(key in actual)) return { key, kind: 'removed' }
        if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) {
            return { key, kind: 'changed' }
        }
    }
}

function firstJSONDifference(expected: JSONValue, actual: JSONValue, location: string): string {
    if (Object.is(expected, actual)) return ''
    if (
        expected === null
        || actual === null
        || typeof expected !== 'object'
        || typeof actual !== 'object'
    ) {
        return `${location}: ${JSON.stringify(expected)} → ${JSON.stringify(actual)}`
    }
    if (Array.isArray(expected) || Array.isArray(actual)) {
        if (!Array.isArray(expected) || !Array.isArray(actual)) {
            return `${location}: value type changed.`
        }
        for (let index = 0; index < Math.max(expected.length, actual.length); index++) {
            if (index >= expected.length) return `${location}[${index}]: added ${JSON.stringify(actual[index])}`
            if (index >= actual.length) return `${location}[${index}]: removed ${JSON.stringify(expected[index])}`
            const difference = firstJSONDifference(expected[index], actual[index], `${location}[${index}]`)
            if (difference) return difference
        }
        return ''
    }
    const expectedRecord = expected as Record<string, JSONValue>
    const actualRecord = actual as Record<string, JSONValue>
    for (const key of [...new Set([...Object.keys(expectedRecord), ...Object.keys(actualRecord)])]) {
        if (!(key in expectedRecord)) return `${location}.${key}: added ${JSON.stringify(actualRecord[key])}`
        if (!(key in actualRecord)) return `${location}.${key}: removed ${JSON.stringify(expectedRecord[key])}`
        const difference = firstJSONDifference(
            expectedRecord[key],
            actualRecord[key],
            `${location}.${key}`
        )
        if (difference) return difference
    }
    return ''
}

function firstByteDifference(expected: string, actual: string) {
    const expectedBytes = Buffer.from(expected)
    const actualBytes = Buffer.from(actual)
    let index = 0
    while (
        index < expectedBytes.length
        && index < actualBytes.length
        && expectedBytes[index] === actualBytes[index]
    ) {
        index++
    }
    const contextStart = Math.max(0, index - 60)
    const contextEnd = index + 120
    return [
        `First changed byte: ${index}.`,
        `expected: ${JSON.stringify(expectedBytes.subarray(contextStart, contextEnd).toString())}`,
        `actual:   ${JSON.stringify(actualBytes.subarray(contextStart, contextEnd).toString())}`
    ].join('\n')
}

function sortRecord<T>(record: Record<string, T>) {
    return Object.fromEntries(Object.entries(record).sort(([left], [right]) =>
        left.localeCompare(right)
    ))
}

function sha256(value: string) {
    return createHash('sha256').update(value).digest('hex')
}

function summary(label: string, snapshot: SiteCSSContractSnapshot) {
    return [
        `${label}:`,
        `  ${Object.keys(snapshot.routes).length} static HTML routes`,
        `  ${Object.keys(snapshot.contracts).length} deduplicated hydration contracts`,
        `  ${Object.keys(snapshot.rules).length} deduplicated generated rules`,
        `  ${Object.keys(snapshot.cssSegments).length} deduplicated exact CSS segments`
    ].join('\n')
}

async function listFiles(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
        const file = path.join(directory, entry.name)
        if (entry.isDirectory()) files.push(...await listFiles(file))
        else if (entry.isFile()) files.push(file)
    }
    return files
}

async function exists(file: string) {
    try {
        await stat(file)
        return true
    } catch {
        return false
    }
}

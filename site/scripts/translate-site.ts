import ts from 'typescript'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

type SegmentKind = 'dictionary' | 'metadata' | 'mdx' | 'ui'

interface TranslationSegment {
    id: string
    kind: SegmentKind
    file: string
    locale: string
    source: string
    sourceHash: string
    context?: string
}

interface TranslationRecord {
    id: string
    translation: string
}

interface EnvValue {
    value?: string
    source?: 'process.env' | '.env.local'
}

interface OpenAIConfig {
    apiKey: string
    projectId?: string
    organizationId?: string
}

const siteRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const repoRoot = resolve(siteRoot, '..')
const rootEnvFile = resolve(repoRoot, '.env.local')
const appLocaleRoot = resolve(siteRoot, 'app/[locale]')
const translationsRoot = resolve(siteRoot, '.translations')
const defaultLocale = 'en'
const defaultTargetLocale = 'tw'
const defaultModel = process.env.TRANSLATE_MODEL || 'gpt-5.5'
let rootEnvValues: Record<string, string> | undefined

const uiRoots = [
    resolve(siteRoot, 'app'),
    resolve(siteRoot, 'components'),
    resolve(siteRoot, '../internal/components'),
    resolve(siteRoot, '../internal/layouts'),
    resolve(siteRoot, '../internal/contexts')
]

const translatableAttributes = new Set(['alt', 'aria-label', 'title', 'placeholder'])
const translatablePropertyNames = new Set(['title', 'description', 'caption', 'detail', 'label'])
const nonTranslatableNames = new Set([
    'Master CSS',
    'Tailwind CSS',
    'Material UI',
    'Styled Components',
    'Visual Studio Code',
    'Open Collective',
    'GitHub Sponsors',
    'NPM'
])

async function main() {
    const [command = 'help', ...args] = process.argv.slice(2)
    const options = parseArgs(args)
    const locale = options.locale || defaultTargetLocale

    switch (command) {
        case 'collect': {
            const segments = collectSegments(locale)
            const filename = options.out || resolve(translationsRoot, `${locale}.source.jsonl`)
            writeJsonl(filename, segments)
            console.log(`wrote ${segments.length} translation segments to ${filename}`)
            return
        }
        case 'batch': {
            const segments = readSourceSegments(options.input || resolve(translationsRoot, `${locale}.source.jsonl`), locale)
            const filename = options.out || resolve(translationsRoot, `${locale}.batch.jsonl`)
            writeJsonl(filename, createBatchRequests(segments, locale, options.model || defaultModel))
            console.log(`wrote ${filename}`)
            return
        }
        case 'apply': {
            const input = options.input
            if (!input) throw new Error('apply requires --input <responses.jsonl>')
            applyTranslations(locale, input)
            return
        }
        case 'submit': {
            const input = options.input || resolve(translationsRoot, `${locale}.batch.jsonl`)
            const batch = await submitBatch(input)
            console.log(JSON.stringify(batch, null, 4))
            return
        }
        case 'download': {
            const batchId = options.batch
            if (!batchId) throw new Error('download requires --batch <batch_id>')
            const filename = options.out || resolve(translationsRoot, `${locale}.responses.jsonl`)
            await downloadBatchOutput(batchId, filename)
            console.log(`wrote ${filename}`)
            return
        }
        case 'doctor':
            printOpenAIEnvStatus()
            return
        default:
            printHelp()
    }
}

function collectSegments(locale: string): TranslationSegment[] {
    const segments = [
        ...collectDictionarySegments(locale),
        ...collectMetadataSegments(locale),
        ...collectMdxSegments(locale),
        ...collectUiSegments(locale)
    ]
    const seen = new Set<string>()
    return segments.filter((segment) => {
        const key = `${segment.kind}:${segment.file}:${segment.sourceHash}:${segment.context || ''}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

function collectDictionarySegments(locale: string): TranslationSegment[] {
    const filename = resolve(siteRoot, `public/dictionaries/${locale}.json`)
    if (!existsSync(filename)) return []
    const translations = JSON.parse(readFileSync(filename, 'utf8')) as Record<string, string>
    return Object.keys(translations)
        .filter(isTranslatableText)
        .map((source) => createSegment('dictionary', filename, locale, source))
}

function collectMetadataSegments(locale: string): TranslationSegment[] {
    return walk(appLocaleRoot, (file) => file.endsWith('metadata.ts')).flatMap((file) => {
        const source = readFileSync(file, 'utf8')
        const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
        const segments: TranslationSegment[] = []

        visit(sourceFile, (node) => {
            if (!ts.isPropertyAssignment(node)) return
            const name = propertyName(node.name)
            if (!name || !translatablePropertyNames.has(name)) return
            if (!ts.isStringLiteralLike(node.initializer)) return
            const text = node.initializer.text
            if (!isTranslatableText(text)) return
            segments.push(createSegment('metadata', file, locale, text, name))
        })

        return segments
    })
}

function collectMdxSegments(locale: string): TranslationSegment[] {
    return walk(appLocaleRoot, (file) => file.endsWith('content.mdx')).flatMap((file) => {
        const source = readFileSync(file, 'utf8')
        return splitMdxBlocks(source)
            .filter(isTranslatableText)
            .map((block, index) => createSegment('mdx', file, locale, block, `block:${index}`))
    })
}

function collectUiSegments(locale: string): TranslationSegment[] {
    return uiRoots.flatMap((root) =>
        walk(root, (file) => file.endsWith('.tsx') && isAuditableSourceFile(file)).flatMap((file) => {
            const source = readFileSync(file, 'utf8')
            const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
            const segments: TranslationSegment[] = []

            visit(sourceFile, (node) => {
                if (ts.isJsxText(node)) {
                    const text = normalizeText(node.getText(sourceFile))
                    if (isTranslatableText(text)) segments.push(createSegment('ui', file, locale, text, 'jsx'))
                    return
                }

                if (ts.isJsxAttribute(node) && translatableAttributes.has(node.name.getText(sourceFile)) && node.initializer && ts.isStringLiteral(node.initializer)) {
                    const text = node.initializer.text
                    if (isTranslatableText(text)) segments.push(createSegment('ui', file, locale, text, node.name.getText(sourceFile)))
                    return
                }

                if (!ts.isPropertyAssignment(node)) return
                const name = propertyName(node.name)
                if (!name || !translatablePropertyNames.has(name)) return
                if (!ts.isStringLiteralLike(node.initializer)) return
                const text = node.initializer.text
                if (isTranslatableText(text)) segments.push(createSegment('ui', file, locale, text, name))
            })

            return segments
        })
    )
}

function splitMdxBlocks(source: string): string[] {
    const blocks: string[] = []
    let current: string[] = []
    let inFence = false

    const flush = () => {
        const block = current.join('\n').trim()
        current = []
        if (block) blocks.push(block)
    }

    for (const line of source.split('\n')) {
        if (/^\s*```/.test(line)) {
            flush()
            inFence = !inFence
            continue
        }
        if (inFence) continue
        if (/^\s*$/.test(line)) {
            flush()
            continue
        }
        if (/^\s*(import|export)\s/.test(line)) {
            flush()
            continue
        }
        if (/^\s*<[\w.]+(?:\s[^>]*)?\/?>\s*$/.test(line)) {
            flush()
            continue
        }
        current.push(line)
    }

    flush()
    return blocks
}

function createBatchRequests(segments: TranslationSegment[], locale: string, model: string) {
    const chunks = chunk(segments, 20)
    return chunks.map((segments, index) => ({
        custom_id: `mcss-${locale}-${String(index + 1).padStart(5, '0')}`,
        method: 'POST',
        url: '/v1/responses',
        body: {
            model,
            input: [
                {
                    role: 'system',
                    content: [
                        'Translate Master CSS documentation from English to Traditional Chinese used in Taiwan.',
                        'Preserve Markdown, MDX, JSX, code spans, code fences, URLs, anchors, package names, CSS properties, and Master CSS class syntax exactly.',
                        'Use Taiwan terminology and concise technical writing. Return only JSON matching the schema.'
                    ].join('\n')
                },
                {
                    role: 'user',
                    content: JSON.stringify({
                        locale,
                        glossary: {
                            'build': '建置',
                            'runtime': '執行階段',
                            'stylesheet': '樣式表',
                            'selector': '選擇器',
                            'breakpoint': '斷點'
                        },
                        segments: segments.map(({ id, source, context }) => ({ id, source, context }))
                    })
                }
            ],
            text: {
                format: {
                    type: 'json_schema',
                    name: 'master_css_translation_batch',
                    strict: true,
                    schema: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['segments'],
                        properties: {
                            segments: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    additionalProperties: false,
                                    required: ['id', 'translation'],
                                    properties: {
                                        id: { type: 'string' },
                                        translation: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }))
}

function applyTranslations(locale: string, responseFile: string) {
    const segments = collectSegments(locale)
    const segmentById = new Map(segments.map((segment) => [segment.id, segment]))
    const translations = readTranslationRecords(responseFile)
    const translationById = new Map(translations.map((record) => [record.id, record.translation]))
    const dictionaryPath = resolve(siteRoot, `public/dictionaries/${locale}.json`)
    const dictionary = existsSync(dictionaryPath)
        ? JSON.parse(readFileSync(dictionaryPath, 'utf8')) as Record<string, string>
        : {}
    const mdxFiles = new Map<string, string>()
    const manifest: Record<string, any> = {}

    for (const [id, translation] of translationById) {
        const segment = segmentById.get(id)
        if (!segment || !translation) continue

        if (segment.kind === 'mdx') {
            const existing = mdxFiles.get(segment.file) ?? readFileSync(segment.file, 'utf8')
            mdxFiles.set(segment.file, replaceOnce(existing, segment.source, translation))
        } else {
            dictionary[segment.source] = translation
        }

        manifest[id] = {
            file: relative(siteRoot, segment.file),
            kind: segment.kind,
            sourceHash: segment.sourceHash,
            status: 'machine',
            updatedAt: new Date().toISOString()
        }
    }

    mkdirSync(dirname(dictionaryPath), { recursive: true })
    writeFileSync(dictionaryPath, `${JSON.stringify(sortObject(dictionary), null, 4)}\n`)

    for (const [sourceFile, translatedSource] of mdxFiles) {
        const translatedPath = sourceFile.replace(/content\.mdx$/, `content.${locale}.mdx`)
        writeFileSync(translatedPath, translatedSource)
    }

    const manifestPath = resolve(translationsRoot, `${locale}.manifest.json`)
    mkdirSync(dirname(manifestPath), { recursive: true })
    writeFileSync(manifestPath, `${JSON.stringify(sortObject(manifest), null, 4)}\n`)
    console.log(`applied ${translationById.size} translations for ${locale}`)
}

async function submitBatch(inputFile: string) {
    const openaiConfig = resolveOpenAIConfig()

    const form = new FormData()
    form.append('purpose', 'batch')
    form.append('file', new Blob([readFileSync(inputFile)]), inputFile.split(sep).pop())

    const uploaded = await openai('/v1/files', {
        method: 'POST',
        body: form
    }, openaiConfig)

    return await openai('/v1/batches', {
        method: 'POST',
        body: JSON.stringify({
            input_file_id: uploaded.id,
            endpoint: '/v1/responses',
            completion_window: '24h'
        })
    }, openaiConfig)
}

async function downloadBatchOutput(batchId: string, outputFile: string) {
    const openaiConfig = resolveOpenAIConfig()
    const batch = await openai(`/v1/batches/${batchId}`, { method: 'GET' }, openaiConfig)
    if (!batch.output_file_id) throw new Error(`Batch ${batchId} has no output_file_id`)
    const response = await fetch(`https://api.openai.com/v1/files/${batch.output_file_id}/content`, {
        headers: createOpenAIHeaders(openaiConfig)
    })
    if (!response.ok) throw new Error(`OpenAI file content request failed: ${response.status} ${await response.text()}`)
    mkdirSync(dirname(outputFile), { recursive: true })
    writeFileSync(outputFile, await response.text())
}

async function openai(pathname: string, init: RequestInit, config: OpenAIConfig) {
    const headers = createOpenAIHeaders(config, init.headers)
    if (!(init.body instanceof FormData)) headers.set('content-type', 'application/json')
    const response = await fetch(`https://api.openai.com${pathname}`, { ...init, headers })
    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`)
    return await response.json() as any
}

function createOpenAIHeaders(config: OpenAIConfig, init?: HeadersInit) {
    const headers = new Headers(init)
    headers.set('authorization', `Bearer ${config.apiKey}`)
    if (config.organizationId) headers.set('OpenAI-Organization', config.organizationId)
    if (config.projectId) headers.set('OpenAI-Project', config.projectId)
    return headers
}

function resolveOpenAIConfig(): OpenAIConfig {
    const apiKey = getEnvValue('OPENAI_API_KEY')
    if (!apiKey.value) throw new Error(`OPENAI_API_KEY is required. Set it in process.env or ${rootEnvFile}.`)

    return {
        apiKey: apiKey.value,
        projectId: getEnvValue('OPENAI_PROJECT_ID').value,
        organizationId: getEnvValue('OPENAI_ORG_ID').value
    }
}

function printOpenAIEnvStatus() {
    const envFileStatus = existsSync(rootEnvFile) ? 'found' : 'not found'
    console.log([
        'OpenAI translation env:',
        `  env file: ${rootEnvFile} (${envFileStatus})`,
        `  OPENAI_API_KEY: ${formatEnvStatus(getEnvValue('OPENAI_API_KEY'))}`,
        `  OPENAI_PROJECT_ID: ${formatEnvStatus(getEnvValue('OPENAI_PROJECT_ID'))}`,
        `  OPENAI_ORG_ID: ${formatEnvStatus(getEnvValue('OPENAI_ORG_ID'))}`
    ].join('\n'))
}

function formatEnvStatus(envValue: EnvValue) {
    return envValue.value ? `set via ${envValue.source}` : 'missing'
}

function getEnvValue(name: string): EnvValue {
    const processValue = process.env[name]
    if (processValue) return { value: processValue, source: 'process.env' }

    const fileValue = readRootEnvFile()[name]
    if (fileValue) return { value: fileValue, source: '.env.local' }

    return {}
}

function readRootEnvFile() {
    if (rootEnvValues) return rootEnvValues
    if (!existsSync(rootEnvFile)) {
        rootEnvValues = {}
        return rootEnvValues
    }

    rootEnvValues = {}
    for (const line of readFileSync(rootEnvFile, 'utf8').split(/\r?\n/)) {
        const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line.trim())
        if (!match) continue
        rootEnvValues[match[1]] = parseEnvValue(match[2])
    }
    return rootEnvValues
}

function parseEnvValue(value: string) {
    const trimmed = value.trim()
    const quote = trimmed[0]
    if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
        const unquoted = trimmed.slice(1, -1)
        return quote === '"' ? unquoted.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\') : unquoted
    }

    const commentIndex = trimmed.search(/\s+#/)
    return (commentIndex === -1 ? trimmed : trimmed.slice(0, commentIndex)).trim()
}

function readSourceSegments(filename: string, locale: string): TranslationSegment[] {
    if (!existsSync(filename)) return collectSegments(locale)
    return readJsonl(filename) as TranslationSegment[]
}

function readTranslationRecords(filename: string): TranslationRecord[] {
    return readJsonl(filename).flatMap((entry: any) => {
        if (entry.id && entry.translation) return [{ id: entry.id, translation: entry.translation }]

        const customBody = entry.response?.body
        const text = customBody?.output_text
            ?? customBody?.output?.flatMap((item: any) => item.content ?? []).find((content: any) => content.type === 'output_text')?.text
        if (!text) return []

        const parsed = JSON.parse(text)
        return Array.isArray(parsed.segments) ? parsed.segments : []
    })
}

function createSegment(kind: SegmentKind, file: string, locale: string, source: string, context?: string): TranslationSegment {
    const normalizedSource = source.trim()
    const sourceHash = hash(normalizedSource)
    return {
        id: `${kind}:${hash(`${relative(siteRoot, file)}:${context || ''}:${sourceHash}`)}`,
        kind,
        file,
        locale,
        source: normalizedSource,
        sourceHash,
        ...(context ? { context } : {})
    }
}

function isTranslatableText(value: string) {
    const text = normalizeText(value)
    if (!text || text.length < 2) return false
    if (!/[A-Za-z]/.test(text)) return false
    if (nonTranslatableNames.has(text)) return false
    if (/^https?:\/\//.test(text)) return false
    if (/^[-\w:/.#@|()[\]{}%]+$/.test(text)) return false
    if (/^import\s|^export\s/.test(text)) return false
    return true
}

function normalizeText(value: string) {
    return value.replace(/\s+/g, ' ').trim()
}

function propertyName(name: ts.PropertyName) {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
}

function visit(node: ts.Node, callback: (node: ts.Node) => void) {
    callback(node)
    ts.forEachChild(node, (child) => visit(child, callback))
}

function walk(root: string, filter: (file: string) => boolean): string[] {
    if (!existsSync(root)) return []
    const files: string[] = []
    for (const entry of readdirSync(root)) {
        const file = resolve(root, entry)
        const stat = statSync(file)
        if (stat.isDirectory()) {
            files.push(...walk(file, filter))
        } else if (stat.isFile() && filter(file)) {
            files.push(file)
        }
    }
    return files
}

function isAuditableSourceFile(file: string) {
    return !/(\.test\.tsx?$|\/api\/|\/\.next\/|\/\.wrangler\/|\/public\/|\/svgs\/|\/node_modules\/)/.test(toPosix(file))
}

function hash(value: string) {
    return createHash('sha256').update(value).digest('hex').slice(0, 16)
}

function chunk<T>(items: T[], size: number) {
    const chunks: T[][] = []
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size))
    }
    return chunks
}

function replaceOnce(source: string, search: string, replacement: string) {
    const index = source.indexOf(search)
    if (index === -1) return source
    return source.slice(0, index) + replacement + source.slice(index + search.length)
}

function sortObject<T>(input: Record<string, T>) {
    return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)))
}

function readJsonl(filename: string) {
    return readFileSync(filename, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line))
}

function writeJsonl(filename: string, records: unknown[]) {
    mkdirSync(dirname(filename), { recursive: true })
    writeFileSync(filename, records.map((record) => JSON.stringify(record)).join('\n') + '\n')
}

function parseArgs(args: string[]) {
    const options: Record<string, string> = {}
    for (let index = 0; index < args.length; index++) {
        const arg = args[index]
        if (!arg.startsWith('--')) continue
        options[arg.slice(2)] = args[index + 1]
        index++
    }
    return options
}

function printHelp() {
    console.log(`Usage:
  pnpm --filter site exec tsx scripts/translate-site.ts collect --locale tw
  pnpm --filter site exec tsx scripts/translate-site.ts batch --locale tw
  pnpm --filter site exec tsx scripts/translate-site.ts submit --locale tw
  pnpm --filter site exec tsx scripts/translate-site.ts download --locale tw --batch <batch_id>
  pnpm --filter site exec tsx scripts/translate-site.ts apply --locale tw --input .translations/tw.responses.jsonl
  pnpm --filter site exec tsx scripts/translate-site.ts doctor`)
}

function toPosix(pathname: string) {
    return pathname.split(sep).join('/')
}

await main()

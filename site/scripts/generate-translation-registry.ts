import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const siteRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const appLocaleRoot = resolve(siteRoot, 'app/[locale]')
const registryPath = resolve(siteRoot, '.translations/content-registry.ts')

interface TranslatedContentEntry {
    locale: string
    routeKey: string
    importPath: string
}

export async function generateTranslatedContentRegistry() {
    const entries = await collectTranslatedContentEntries(appLocaleRoot)
    await mkdir(dirname(registryPath), { recursive: true })
    await writeFile(registryPath, renderRegistry(entries))
    console.log(`產生 ${registryPath} (${entries.length} translated content modules)`)
}

async function collectTranslatedContentEntries(root: string): Promise<TranslatedContentEntry[]> {
    const entries: TranslatedContentEntry[] = []
    await walk(root, async (file) => {
        const filename = file.split(sep).pop() || ''
        const match = filename.match(/^content\.([a-z][\w-]*)\.mdx$/)
        if (!match) return

        const locale = match[1]
        const routeKey = toPosix(relative(root, dirname(file)))
        const importPath = toPosix(relative(dirname(registryPath), file))
        entries.push({
            locale,
            routeKey,
            importPath: importPath.startsWith('.') ? importPath : `./${importPath}`
        })
    })
    return entries.sort((a, b) => `${a.locale}/${a.routeKey}`.localeCompare(`${b.locale}/${b.routeKey}`))
}

async function walk(dir: string, visit: (file: string) => Promise<void>) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = resolve(dir, entry.name)
        if (entry.isDirectory()) {
            await walk(fullPath, visit)
        } else if (entry.isFile()) {
            await visit(fullPath)
        }
    }
}

function renderRegistry(entries: TranslatedContentEntry[]) {
    const lines: string[] = [
        "import type { ComponentType } from 'react'",
        '',
        'export type TranslatedContentModule = {',
        '    default: ComponentType<any>',
        '    toc?: unknown',
        '}',
        '',
        'export type TranslatedContentLoader = () => Promise<TranslatedContentModule>',
        '',
        'const translatedContentRegistry = {'
    ]

    const locales = new Map<string, TranslatedContentEntry[]>()
    for (const entry of entries) {
        const localeEntries = locales.get(entry.locale) || []
        localeEntries.push(entry)
        locales.set(entry.locale, localeEntries)
    }

    for (const [locale, localeEntries] of locales) {
        lines.push(`    ${JSON.stringify(locale)}: {`)
        for (const entry of localeEntries) {
            lines.push(`        ${JSON.stringify(entry.routeKey)}: () => import(${JSON.stringify(entry.importPath)}),`)
        }
        lines.push('    },')
    }

    lines.push(
        '} satisfies Record<string, Record<string, TranslatedContentLoader>>',
        '',
        'export default translatedContentRegistry',
        ''
    )

    return lines.join('\n')
}

function toPosix(pathname: string) {
    return pathname.split(sep).join('/')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await generateTranslatedContentRegistry()
}

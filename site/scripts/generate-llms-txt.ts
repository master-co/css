import { readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_LOCALE = 'en'
const SITE_URL = 'https://rc.css.master.co'
const PROJECT_NAME = 'Master CSS'
const PROJECT_DESC =
    'A CSS language and framework for rapidly building beautiful websites and design systems with rule-based CSS-in-class.'

export type Page = {
    /** Filesystem path of the .mdx file. */
    file: string
    /** Top-level URL section, e.g. "guide". */
    section: string
    /** Public URL path, e.g. "/en/guide/colors". */
    url: string
    /** Display title (from first H1/H2 or last route segment). */
    title: string
    /** Raw MDX body. */
    body: string
}

const TITLE_FROM_HEADING = /^#{1,2}\s+(.+?)\s*$/m
const HEADING_TRAILING_TAG = /\s*[\[\{][^\]\}]*[\]\}]\s*$/

export function deriveTitle(body: string, fallbackSegment: string): string {
    const m = body.match(TITLE_FROM_HEADING)
    if (m) return m[1].replace(HEADING_TRAILING_TAG, '').trim()
    return fallbackSegment
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ')
}

/** Convert filesystem path under app/[locale]/ into a public URL path. */
export function pageUrl(relPath: string, locale = DEFAULT_LOCALE): string {
    // relPath is like "guide/colors/content.mdx"
    const dir = relPath.replace(/\/content\.mdx$/, '')
    return `/${locale}${dir ? '/' + dir : ''}`
}

export function topSection(relPath: string): string {
    return relPath.split('/')[0] ?? ''
}

export function renderLlmsIndex(pages: Page[], siteUrl = SITE_URL): string {
    const bySection = new Map<string, Page[]>()
    for (const p of pages) {
        if (!bySection.has(p.section)) bySection.set(p.section, [])
        bySection.get(p.section)!.push(p)
    }
    const sortedSections = [...bySection.keys()].sort()

    const lines: string[] = []
    lines.push(`# ${PROJECT_NAME}`, '')
    lines.push(`> ${PROJECT_DESC}`, '')
    for (const sec of sortedSections) {
        const items = bySection.get(sec)!.sort((a, b) => a.url.localeCompare(b.url))
        lines.push(`## ${sec.charAt(0).toUpperCase() + sec.slice(1)}`)
        for (const p of items) {
            lines.push(`- [${p.title}](${siteUrl}${p.url})`)
        }
        lines.push('')
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

export function renderLlmsFull(pages: Page[], siteUrl = SITE_URL): string {
    const sorted = [...pages].sort((a, b) => a.url.localeCompare(b.url))
    const out: string[] = [`# ${PROJECT_NAME}`, '', `> ${PROJECT_DESC}`, '']
    for (const p of sorted) {
        out.push('---', '')
        out.push(`# ${p.title}`, '')
        out.push(`Source: ${siteUrl}${p.url}`, '')
        out.push(p.body.trim(), '')
    }
    return out.join('\n').trimEnd() + '\n'
}

async function listMdx(root: string): Promise<string[]> {
    const out: string[] = []
    async function walk(dir: string) {
        const entries = await readdir(dir, { withFileTypes: true })
        for (const e of entries) {
            const full = path.join(dir, e.name)
            if (e.isDirectory()) await walk(full)
            else if (e.isFile() && e.name === 'content.mdx') out.push(full)
        }
    }
    await walk(root)
    return out
}

export async function loadPages(localeRoot: string): Promise<Page[]> {
    const files = await listMdx(localeRoot)
    const pages: Page[] = []
    for (const file of files) {
        const rel = path.relative(localeRoot, file).split(path.sep).join('/')
        const body = await readFile(file, 'utf8')
        const segments = rel.replace(/\/content\.mdx$/, '').split('/')
        const lastSegment = segments[segments.length - 1] ?? ''
        pages.push({
            file,
            section: topSection(rel),
            url: pageUrl(rel),
            title: deriveTitle(body, lastSegment),
            body
        })
    }
    return pages
}

export async function generate(siteRoot: string): Promise<{ index: string; full: string }> {
    const localeRoot = path.join(siteRoot, 'app', `[${'locale'}]`)
    const pages = await loadPages(localeRoot)
    const index = renderLlmsIndex(pages)
    const full = renderLlmsFull(pages)
    const publicDir = path.join(siteRoot, 'public')
    await writeFile(path.join(publicDir, 'llms.txt'), index, 'utf8')
    await writeFile(path.join(publicDir, 'llms-full.txt'), full, 'utf8')
    return { index, full }
}

const isMain = (() => {
    if (typeof process === 'undefined' || !process.argv[1]) return false
    try {
        return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
    } catch {
        return false
    }
})()

if (isMain) {
    const siteRoot = path.resolve(fileURLToPath(import.meta.url), '..', '..')
    const { index } = await generate(siteRoot)
    const lineCount = index.split('\n').length
    console.log(`[llms.txt] generated index (${lineCount} lines) + full at ${path.join(siteRoot, 'public')}`)
}

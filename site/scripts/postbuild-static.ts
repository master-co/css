import { generateStaticSocialImages } from '@master/internal-site/build/static-social.ts'
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPublicEnv } from '../utils/public-env.js'
import { organizationRedirects } from './organization-redirects'

type PageMetadata = {
    pathname: string
}

const siteDir = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const outDir = path.join(siteDir, 'out')
const publicEnv = readPublicEnv({ input: '.generated/public-env.json' })
Object.assign(process.env, publicEnv)
process.chdir(siteDir)

await generateSitemap()
await generateStaticSocialImages({ siteDir, outDir, origin: publicEnv.PUBLIC_URL, logo: new URL('../public/images/css-logotype@light.png', import.meta.url), locales: ['en', 'tw'] })
await writeHeaders()
await writeRedirects()
await validateHydrationManifestReferences()
await validateInlineScripts()

async function generateSitemap() {
    const pages = JSON.parse(await readFile(path.join(siteDir, '.pages.json'), 'utf8')) as PageMetadata[]
    const baseUrl = publicEnv.PUBLIC_URL.replace(/\/$/, '')
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map((page) => {
        const pathname = page.pathname === '/' ? '' : page.pathname
        return `  <url>
    <loc>${baseUrl}${pathname}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${pathname}"/>
    <xhtml:link rel="alternate" hreflang="zh-TW" href="${baseUrl}/tw${pathname}"/>
  </url>`
    }).join('\n')}
</urlset>
`
    await writeFile(path.join(outDir, 'sitemap.xml'), xml, 'utf8')
}

async function writeHeaders() {
    await writeFile(path.join(outDir, '_headers'), [
        '/_astro/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        '/og/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        '/fonts/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        ''
    ].join('\n'), 'utf8')
}

async function writeRedirects() {
    await writeFile(path.join(outDir, '_redirects'), [
        ...organizationRedirects(),
        '/en/* /:splat 301',
        '/en / 301',
        '/cdn/* https://cdn.jsdelivr.net/npm/@master/:splat 200',
        ''
    ].join('\n'), 'utf8')
}

async function validateInlineScripts() {
    const htmlFiles = (await listFiles(outDir)).filter((file) => file.endsWith('.html'))

    for (const file of htmlFiles) {
        const content = await readFile(file, 'utf8')
        const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
        let index = 0

        for (const match of content.matchAll(scriptPattern)) {
            index++
            const [, attributes, script] = match
            if (!script.trim() || /\bsrc\s*=/.test(attributes) || !isClassicScript(attributes)) {
                continue
            }

            try {
                new Function(script)
            } catch (error) {
                throw new Error(`Invalid inline script ${index} in ${path.relative(siteDir, file)}: ${(error as Error).message}`)
            }
        }
    }
}

function isClassicScript(attributes: string) {
    const type = attributes.match(/\btype=(["'])(.*?)\1/i)?.[2]
    return !type || /^(?:text|application)\/(?:javascript|ecmascript)$/i.test(type)
}

async function validateHydrationManifestReferences() {
    const htmlFiles = (await listFiles(outDir)).filter((file) => file.endsWith('.html'))

    for (const file of htmlFiles) {
        const content = await readFile(file, 'utf8')
        const pattern = /\bdata-master-css-hydration-manifest=(["'])(.*?)\1/g

        for (const match of content.matchAll(pattern)) {
            const source = match[2]
            const outputPath = toPublicOutputPath(source)
            if (!outputPath) continue

            if (!await exists(outputPath)) {
                throw new Error(`Missing Master CSS hydration manifest ${source} referenced by ${path.relative(siteDir, file)}`)
            }
        }
    }
}

function toPublicOutputPath(source: string) {
    const url = new URL(source, publicEnv.PUBLIC_URL)
    const baseUrl = new URL(publicEnv.PUBLIC_URL)

    if (url.origin !== baseUrl.origin && /^https?:\/\//.test(source)) {
        return undefined
    }

    const pathname = decodeURIComponent(url.pathname)
    if (!pathname.startsWith('/')) return undefined

    const outputPath = path.join(outDir, ...pathname.split('/').filter(Boolean))
    const relativePath = path.relative(outDir, outputPath)
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) return undefined

    return outputPath
}

async function listFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...await listFiles(fullPath))
        } else if (entry.isFile()) {
            files.push(fullPath)
        }
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

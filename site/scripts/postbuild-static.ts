import { generateStaticSocialImages } from '@master/internal-site/build/static-social.ts'
import { readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPublicEnv } from '../utils/public-env.js'
import { organizationRedirects, legacyDesignAssets } from './organization-redirects'
import { legacyDocsRedirects } from './legacy-docs-redirects'
import { finalizeSeo, markdownCanonicalHeaders } from './static-seo'
import { stabilizeIslandIds } from './stable-island-ids'
import { locales } from '@master/internal-site/common/locales.js'

const siteDir = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const outDir = path.join(siteDir, 'out')
const publicEnv = readPublicEnv({ input: '.generated/public-env.json' })
Object.assign(process.env, publicEnv)
process.chdir(siteDir)

await writeStableIslandIds()
const origin = new URL(publicEnv.PUBLIC_URL).origin
await finalizeSeo(outDir, origin, await listFiles(outDir))
await generateStaticSocialImages({ siteDir, outDir, origin: publicEnv.PUBLIC_URL, logo: new URL('../public/images/css-logotype@light.png', import.meta.url), locales })
await writeHeaders()
await writeRedirects()
await validateHydrationManifestReferences()
await validateInlineScripts()

async function writeStableIslandIds() {
    for (const file of (await listFiles(outDir)).filter(file => file.endsWith('.html'))) {
        const html = await readFile(file, 'utf8')
        const stable = stabilizeIslandIds(html)
        if (stable !== html) await writeFile(file, stable, 'utf8')
    }
}

async function writeHeaders() {
    await writeFile(path.join(outDir, '_headers'), [
        // Demo previews are same-origin srcdoc frames, so framing stays limited to this origin.
        '/*',
        '  Strict-Transport-Security: max-age=31536000',
        '  X-Content-Type-Options: nosniff',
        '  X-Frame-Options: SAMEORIGIN',
        '  Referrer-Policy: strict-origin-when-cross-origin',
        '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
        '  Content-Security-Policy: frame-ancestors \'self\'; base-uri \'self\'; object-src \'none\'; form-action \'self\'',
        '/_astro/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        '/og/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        '/fonts/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        ...markdownCanonicalHeaders(origin),
        // Production aliases and immutable Pages URLs share canonical product content.
        // Keep both provider host shapes out of indexes without affecting custom domains.
        'https://:project.pages.dev/*',
        '  X-Robots-Tag: noindex',
        'https://:deployment.:project.pages.dev/*',
        '  X-Robots-Tag: noindex',
        ''
    ].join('\n'), 'utf8')
}

async function writeRedirects() {
    await writeFile(path.join(outDir, '_redirects'), [
        ...organizationRedirects(),
        ...legacyDocsRedirects(),
        '/en/* /:splat 301',
        '/en / 301',
        // Pages cannot proxy another origin; redirect so CDN files are never served from this origin.
        '/cdn/* https://cdn.jsdelivr.net/npm/@master/:splat 302',
        ''
    ].join('\n'), 'utf8')
    const legacy = legacyDesignAssets()
    if (legacy) {
        await writeFile(path.join(outDir, '_worker.js'), legacy.worker, 'utf8')
        await writeFile(path.join(outDir, '_routes.json'), JSON.stringify(legacy.routes, null, 2) + '\n', 'utf8')
    } else {
        // A rebuild without the deployment flag must not retain a previous cutover worker.
        await rm(path.join(outDir, '_worker.js'), { force: true })
        await rm(path.join(outDir, '_routes.json'), { force: true })
    }
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

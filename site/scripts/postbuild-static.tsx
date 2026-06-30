/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ImageResponse } from 'next/og'
import React from 'react'
import { readPublicEnv } from '../utils/public-env.js'

type PageMetadata = {
    pathname: string
}

type StaticOgImageOptions = {
    title: string
    description: string
    category: string
    authors: string[]
    locale: string
}

const siteDir = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const outDir = path.join(siteDir, 'out')
const publicEnv = readPublicEnv({ input: '.generated/public-env.json' })
const authorImageFiles: Record<string, string> = {
    Aron: 'aron.jpg',
    Joy: 'joy.jpg',
    BenSeage: 'benseage.jpg',
    Miles: 'miles.jpg',
    Lola: 'lola.jpg'
}

Object.assign(process.env, publicEnv)
process.chdir(siteDir)

await copyDefaultLocaleToRoot()
await generateSitemap()
await generateStaticOgImages()
await writeHeaders()
await writeRedirects()

async function copyDefaultLocaleToRoot() {
    const localeDir = path.join(outDir, 'en')
    const localeIndexHtml = path.join(outDir, 'en.html')
    const localeIndexText = path.join(outDir, 'en.txt')

    if (await exists(localeIndexHtml)) {
        await copyFile(localeIndexHtml, path.join(outDir, 'index.html'))
    }

    if (await exists(localeIndexText)) {
        await copyFile(localeIndexText, path.join(outDir, 'index.txt'))
    }

    if (!await exists(localeDir)) return

    const files = await listFiles(localeDir)
    for (const source of files) {
        const relativePath = path.relative(localeDir, source)
        const target = path.join(outDir, relativePath)
        await mkdir(path.dirname(target), { recursive: true })
        await copyFile(source, target)
    }
}

async function generateSitemap() {
    const pages = JSON.parse(await readFile(path.join(siteDir, '.pages.json'), 'utf8')) as PageMetadata[]
    const baseUrl = publicEnv.NEXT_PUBLIC_URL.replace(/\/$/, '')
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

async function generateStaticOgImages() {
    const textFiles = (await listFiles(outDir)).filter((file) => /\.(html|txt)$/.test(file))
    const filesWithMatches: { file: string, content: string, matches: string[] }[] = []

    for (const file of textFiles) {
        const content = await readFile(file, 'utf8')
        const matches = findOgImageUrls(content)
        if (matches.length) {
            filesWithMatches.push({ file, content, matches })
        }
    }

    if (!filesWithMatches.length) return

    await rm(path.join(outDir, 'og'), { recursive: true, force: true })

    const generated = new Map<string, string>()

    for (const { file, matches, content: originalContent } of filesWithMatches) {
        let content = originalContent

        for (const rawUrl of matches) {
            const normalizedUrl = normalizeOgImageUrl(rawUrl)
            const cacheKey = getOgImageCacheKey(normalizedUrl)
            let staticPath = generated.get(cacheKey)
            if (!staticPath) {
                staticPath = await writeOgImage(normalizedUrl, cacheKey)
                generated.set(cacheKey, staticPath)
            }
            content = content.split(rawUrl).join(staticPath)
        }

        if (content.includes('/api/og-image')) {
            throw new Error(`Static postbuild left dynamic OG image URL in ${path.relative(siteDir, file)}`)
        }

        await writeFile(file, content, 'utf8')
    }
}

function findOgImageUrls(html: string) {
    const matches = new Set<string>()
    const pattern = /(?:https?:\/\/[^"'<>\s]+)?\/api\/og-image\?[^"'<>\s]+/g
    for (const match of html.matchAll(pattern)) {
        matches.add(match[0])
    }
    return [...matches]
}

function normalizeOgImageUrl(rawUrl: string) {
    return rawUrl
        .replaceAll('&amp;', '&')
        .replaceAll('\\u0026', '&')
        .replaceAll('\\u003d', '=')
        .replaceAll('\\u002f', '/')
}

function getOgImageCacheKey(rawUrl: string) {
    const url = new URL(rawUrl, publicEnv.NEXT_PUBLIC_URL)
    const params = url.searchParams
    return JSON.stringify({
        locale: normalizeLocale(params.get('locale')),
        title: params.get('title') || '',
        description: params.get('description') || '',
        category: params.get('category') || '',
        authors: parseAuthors(params.get('authors'))
    })
}

async function writeOgImage(rawUrl: string, cacheKey: string) {
    const url = new URL(rawUrl, publicEnv.NEXT_PUBLIC_URL)
    const params = url.searchParams
    const locale = normalizeLocale(params.get('locale'))
    const dictionary = await readDictionary(locale)
    const response = await createStaticOgImage({
        locale,
        title: translate(params.get('title'), dictionary),
        description: translate(params.get('description'), dictionary),
        category: translate(params.get('category'), dictionary),
        authors: parseAuthors(params.get('authors'))
    })
    const contentType = response.headers.get('content-type') || 'image/png'
    const extension = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png'
    const filename = `${createHash('sha1').update(cacheKey).digest('hex').slice(0, 16)}.${extension}`
    const publicPath = `/og/${filename}`
    const outputPath = path.join(outDir, publicPath.slice(1))

    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, Buffer.from(await response.arrayBuffer()))

    return publicPath
}

async function createStaticOgImage({ title, description, category, authors }: StaticOgImageOptions) {
    const size = { width: 1200, height: 630 }
    const coverBgURL = await readPublicDataURL('images/cover-bg.jpg')
    const cssLogotypeURL = await readPublicDataURL('images/css-logotype@light.png')
    const authorProfiles = await Promise.all(authors.map(async (name) => ({
        name,
        image: await readOptionalPublicDataURL(`images/authors/${authorImageFiles[name]}`)
    })))
    const fontRegular = await readPublicAsset('fonts/Inter-Regular.ttf')
    const fontMedium = await readPublicAsset('fonts/Inter-Medium.ttf')
    const titleFontSize = title.length > 72 ? 40 : title.length > 46 ? 48 : 56
    const displayDescription = truncateText(description, 150)

    return new ImageResponse(
        (
            <div style={{
                display: 'flex',
                position: 'relative',
                width: size.width,
                height: size.height,
                overflow: 'hidden',
                backgroundColor: '#fff',
                color: '#111827',
                fontFamily: 'Inter Regular'
            }}>
                <img src={coverBgURL} width={size.width} height={size.height} style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                }} />
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    padding: '70px 95px'
                }}>
                    <img src={cssLogotypeURL} width={340} />
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 24
                    }}>
                        {category && <div style={{
                            display: 'flex',
                            color: '#64748b',
                            fontSize: 24,
                            fontFamily: 'Inter Medium'
                        }}>
                            {category}
                        </div>}
                        <div style={{
                            display: 'flex',
                            maxWidth: 900,
                            fontFamily: 'Inter Medium',
                            fontSize: titleFontSize,
                            lineHeight: 1.22
                        }}>
                            {title}
                        </div>
                        {displayDescription && <div style={{
                            display: 'flex',
                            maxWidth: 930,
                            color: '#64748b',
                            fontSize: 28,
                            lineHeight: 1.45
                        }}>
                            {displayDescription}
                        </div>}
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: 70
                    }}>
                        {authorProfiles.map(({ name, image }) => (
                            <div key={name} style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginRight: 32
                            }}>
                                {image && <img src={image} width={58} height={58} style={{
                                    borderRadius: 999,
                                    objectFit: 'cover'
                                }} />}
                                <div style={{
                                    display: 'flex',
                                    marginLeft: image ? 14 : 0,
                                    color: '#334155',
                                    fontSize: 24
                                }}>
                                    {name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'Inter Regular',
                    data: fontRegular
                },
                {
                    name: 'Inter Medium',
                    data: fontMedium
                }
            ]
        }
    )
}

async function readPublicAsset(publicPath: string) {
    return await readFile(path.join(siteDir, 'public', publicPath))
}

async function readOptionalPublicDataURL(publicPath: string | undefined) {
    if (!publicPath) return undefined
    try {
        return await readPublicDataURL(publicPath)
    } catch {
        return undefined
    }
}

async function readPublicDataURL(publicPath: string) {
    const data = await readPublicAsset(publicPath)
    return `data:${mimeTypeForPath(publicPath)};base64,${data.toString('base64')}`
}

async function readDictionary(locale: string) {
    try {
        return JSON.parse(await readFile(path.join(siteDir, 'public', 'dictionaries', `${locale}.json`), 'utf8')) as Record<string, string>
    } catch {
        return {}
    }
}

function translate(value: string | null, dictionary: Record<string, string>) {
    if (!value) return ''
    return dictionary[value] || value
}

function normalizeLocale(locale: string | null) {
    return locale === 'tw' ? 'tw' : 'en'
}

function parseAuthors(value: string | null) {
    if (!value) return []
    try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
            return parsed
                .map((author) => typeof author === 'string' ? author : author?.name)
                .filter(Boolean)
        }
    } catch {
        return value.split(',').map((author) => author.trim()).filter(Boolean)
    }
    return []
}

function truncateText(value: string, maxLength: number) {
    if (value.length <= maxLength) return value
    return value.slice(0, maxLength - 3).replace(/[,.;]?\s[\w']*$|.$/, '...')
}

function mimeTypeForPath(publicPath: string) {
    if (publicPath.endsWith('.jpg') || publicPath.endsWith('.jpeg')) return 'image/jpeg'
    if (publicPath.endsWith('.png')) return 'image/png'
    if (publicPath.endsWith('.svg')) return 'image/svg+xml'
    if (publicPath.endsWith('.ttf')) return 'font/ttf'
    return 'application/octet-stream'
}

async function writeHeaders() {
    await writeFile(path.join(outDir, '_headers'), [
        '/_next/static/*',
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
        '/en/play/:shareId /play/:shareId 301',
        '/en/* /:splat 301',
        '/en / 301',
        '/play/:shareId /play 200',
        '/tw/play/:shareId /tw/play 200',
        '/cdn/* https://cdn.jsdelivr.net/npm/@master/:splat 200',
        ''
    ].join('\n'), 'utf8')
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

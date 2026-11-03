// Assembles a static site in `out/` from the prerendered `next build` output.
// `next export` does not support i18n, but every page here is SSG, so the
// prerendered HTML and data JSON under `.next/server/pages` are complete.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import nextI18nConfig from './next-i18next.config.js'

const { defaultLocale, locales } = nextI18nConfig.i18n
const pagesDir = '.next/server/pages'
const outDir = 'out'
const buildId = readFileSync('.next/BUILD_ID', 'utf8').trim()
const dataDir = join(outDir, '_next/data', buildId)

function walk(dir) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name)
        return statSync(path).isDirectory() ? walk(path) : [path]
    })
}

function copy(from, to) {
    mkdirSync(dirname(to), { recursive: true })
    cpSync(from, to)
}

rmSync(outDir, { recursive: true, force: true })
cpSync('public', outDir, { recursive: true })
cpSync('.next/static', join(outDir, '_next/static'), { recursive: true })

let pages = 0
for (const locale of locales) {
    const localeRoot = locale === defaultLocale ? outDir : join(outDir, locale)
    // `/en` and `/tw` index pages are emitted next to the locale folders
    copy(join(pagesDir, `${locale}.html`), locale === defaultLocale ? join(outDir, 'index.html') : `${localeRoot}.html`)
    copy(join(pagesDir, `${locale}.json`), join(dataDir, `${locale}.json`))
    for (const file of walk(join(pagesDir, locale))) {
        const path = relative(join(pagesDir, locale), file)
        // each locale's 404.html becomes the not-found page of its folder
        if (path === '500.html') continue
        if (file.endsWith('.html')) {
            copy(file, join(localeRoot, path))
            pages++
        } else if (file.endsWith('.json')) {
            copy(file, join(dataDir, locale, path))
            // the router requests default-locale data without the locale prefix as well
            if (locale === defaultLocale) copy(file, join(dataDir, path))
        }
    }
}

const localized = locales.filter((locale) => locale !== defaultLocale)
writeFileSync(join(outDir, '_redirects'), [
    '/docs /docs/setup 308',
    '/docs/sponsor / 301',
    '/docs/donate / 301',
    ...localized.flatMap((locale) => [
        `/${locale}/docs /${locale}/docs/setup 308`,
        `/${locale}/docs/sponsor /${locale} 301`,
        `/${locale}/docs/donate /${locale} 301`,
    ]),
    `/${defaultLocale} / 301`,
    `/${defaultLocale}/* /:splat 301`,
    '',
].join('\n'))

writeFileSync(join(outDir, '_headers'), [
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  X-Frame-Options: SAMEORIGIN',
    '/_next/static/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
].join('\n'))

for (const file of ['index.html', '404.html']) {
    if (!existsSync(join(outDir, file))) throw new Error(`Missing ${file}`)
}
console.log(`Exported ${pages} pages for ${locales.join(', ')} to ${outDir}/ (build ${buildId})`)

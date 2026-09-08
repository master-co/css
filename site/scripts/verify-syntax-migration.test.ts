import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { syntaxTutorialContent } from '../utils/syntax-tutorial'
import { configuredExampleHTML } from '../reference/configured-example'
import { legacySyntaxPages, localizeSyntaxURL } from '../utils/legacy-syntax'

// Run after the static site build, including postbuild canonical route copies.
test('retired static routes have noindex, tutorial canonical and usable no-JavaScript links', async () => {
  for (const locale of ['', 'en', 'tw']) for (const [slug, page] of Object.entries(legacySyntaxPages)) {
    const html = await readFile(new URL(`../out/${locale ? `${locale}/` : ''}guide/${slug}.html`, import.meta.url), 'utf8')
    assert.match(html, /<meta name="robots" content="noindex, follow"/)
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    assert.equal(new URL(canonical!).pathname, localizeSyntaxURL('/guide/syntax-tutorial', locale === 'tw' ? 'tw' : ''))
    const body = html.replace(/<script[\s\S]*?<\/script>/g, '')
    assert.ok(body.includes(`href="${localizeSyntaxURL(page.tutorial, locale || 'en')}"`))
    assert.ok(body.includes(`href="${localizeSyntaxURL(page.reference, locale || 'en')}"`))
    assert.doesNotMatch(body, /Look up a rule/)
  }
})

test('page registry and sitemap publish only the new tutorial', async () => {
  const pages = JSON.parse(await readFile(new URL('../.pages.json', import.meta.url), 'utf8'))
  const sitemap = await readFile(new URL('../out/sitemap.xml', import.meta.url), 'utf8')
  assert.ok(pages.some((page: { pathname: string }) => page.pathname === '/guide/syntax-tutorial'))
  assert.match(sitemap, /\/guide\/syntax-tutorial</)
  for (const slug of Object.keys(legacySyntaxPages)) {
    assert.ok(!pages.some((page: { pathname: string }) => page.pathname === `/guide/${slug}`))
    assert.ok(!sitemap.includes(`/guide/${slug}<`))
  }
})


test('static tutorial HTML retains the same complete example and CSS as its text export', async () => {
  const tutorial = await syntaxTutorialContent(fileURLToPath(new URL('../', import.meta.url)))
  const example = tutorial.examples.find(example => example.configuration)!
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
  const normalizeCSS = (css: string) => css.replace(/\s/g, '').replace(/;}/g, '}')
  for (const locale of ['', 'en', 'tw']) {
    const html = await readFile(new URL(`../out/${locale ? `${locale}/` : ''}guide/syntax-tutorial.html`, import.meta.url), 'utf8')
    for (const id of ['declarations', 'states', 'conditions', 'composition', 'project-settings', 'complete-button']) assert.ok(html.includes(`id="${id}"`))
    const blocks = [...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(match => match[1].replace(/<[^>]+>/g, '').replace(/&#x([\da-f]+);|&#(\d+);|&(amp|lt|gt|quot|apos);/gi, (_, hex, decimal, named) => hex ? String.fromCodePoint(parseInt(hex, 16)) : decimal ? String.fromCodePoint(Number(decimal)) : entities[named]))
    assert.ok(blocks.includes(configuredExampleHTML(example.classes, 'button', 'Save')))
    assert.ok(blocks.some(block => normalizeCSS(block) === normalizeCSS(example.css)))
  }
})

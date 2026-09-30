import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { syntaxTutorialContent } from '../utils/syntax-tutorial'
import { markdownTree } from '../docs-shell/utils/markdown-tree'
import { extractSearchNodesFromMdx } from '../docs-shell/utils/search-pages'
import { legacySyntaxPages, localizeSyntaxURL } from '../utils/legacy-syntax'
import { documentationHygieneIssues } from '../tests/document-hygiene'

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
  const examples = markdownTree(tutorial.markdown).children.filter(node => node.type === 'code').filter(node => node.lang === 'html' || node.meta?.includes('disclosure=generated-css'))
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
  const normalizeCSS = (css: string) => css.replace(/\s/g, '').replace(/;}/g, '}')
  for (const locale of ['', 'en', 'tw']) {
    const html = await readFile(new URL(`../out/${locale ? `${locale}/` : ''}guide/syntax-tutorial.html`, import.meta.url), 'utf8')
    for (const id of ['declarations', 'states', 'conditions', 'composition', 'project-settings', 'complete-button']) assert.ok(html.includes(`id="${id}"`))
    for (const node of extractSearchNodesFromMdx(tutorial.searchMarkdown)) if (node.id) assert.ok(html.includes(`id="${node.id}"`), `${locale}: search target ${node.id}`)
    const blocks = [...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(match => match[1].replace(/<[^>]+>/g, '').replace(/&#x([\da-f]+);|&#(\d+);|&(amp|lt|gt|quot|apos);/gi, (_, hex, decimal, named) => hex ? String.fromCodePoint(parseInt(hex, 16)) : decimal ? String.fromCodePoint(Number(decimal)) : entities[named]))
    for (const example of examples) assert.ok(blocks.some(block => normalizeCSS(block) === normalizeCSS(example.value!)), `${locale}: ${example.value!.slice(0, 120)}`)
  }
})


test('retired Reference content is absent from navigation and machine indexes', async () => {
  const pages = JSON.parse(await readFile(new URL('../.pages.json', import.meta.url), 'utf8')) as { pathname: string }[]
  const sitemap = await readFile(new URL('../out/sitemap.xml', import.meta.url), 'utf8')
  const llms = await readFile(new URL('../out/llms.txt', import.meta.url), 'utf8')
  const search = JSON.parse(await readFile(new URL('../out/search/en.json', import.meta.url), 'utf8')) as { url: string }[]
  assert.ok(!llms.includes('/blog/v2'), 'Unpublished blog drafts stay out of the machine index')
  for (const slug of ['display', 'padding', 'opacity', 'tokens/containers', 'directives/settings', 'directives/compose', 'tools/cli/migrate']) {
    assert.ok(!pages.some(page => page.pathname === `/reference/${slug}`), slug)
    assert.ok(!sitemap.includes(`/reference/${slug}<`), slug)
    assert.ok(!llms.includes(`/reference/${slug}.md`), slug)
    assert.ok(!search.some(page => page.url === `/reference/${slug}`), slug)
  }
})

test('published static articles keep the same migration boundary as text and search exports', async () => {
  const pages = JSON.parse(await readFile(new URL('../.pages.json', import.meta.url), 'utf8')) as { pathname: string }[]
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
  const failures: string[] = []
  for (const { pathname } of pages) {
    if (!/^\/(?:guide|reference|blog)\//.test(pathname) || /^\/guide\/migration(?:\/|$)/.test(pathname)) continue
    for (const locale of ['', 'en', 'tw']) {
      const html = await readFile(new URL(`../out/${locale}${pathname}.html`, import.meta.url), 'utf8')
      const start = html.indexOf('<article ')
      assert.ok(start >= 0, `${locale}${pathname}: article`)
      let article = html.slice(start, html.lastIndexOf('</article>'))
      // PageNavs belongs to document navigation, outside the editorial body.
      article = article.replace(/<hr class="hr"\/?><div class="display:flex gap:2\.5rem[\s\S]*$/, '')
      article = article.replace(/<script\b[\s\S]*?<\/script>/g, '')
      if (pathname === '/guide/mcp-server') article = article.replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/g, row => row.includes('migrate-to-mastercss') ? '' : row)
      article = article.replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) => `[${text}](${href})`)
      article = article.replace(/<pre\b[^>]*>/g, '\n```\n').replace(/<\/pre>/g, '\n```\n')
      const text = article.replace(/<\/(?:p|h[1-6]|pre|tr|li)>/g, '\n\n').replace(/<[^>]+>/g, '')
        .replace(/&#x([\da-f]+);|&#(\d+);|&(amp|lt|gt|quot|apos|nbsp);/gi, (_, hex, decimal, named) => hex ? String.fromCodePoint(parseInt(hex, 16)) : decimal ? String.fromCodePoint(Number(decimal)) : entities[named])
      failures.push(...documentationHygieneIssues(text).map(issue => `${locale}${pathname}: ${issue}`))
    }
  }
  assert.deepEqual(failures, [])
})


test('all published generated outputs are native closed disclosures with one summary', async () => {
  const pages = JSON.parse(await readFile(new URL('../.pages.json', import.meta.url), 'utf8')) as { pathname: string }[]
  let count = 0
  for (const { pathname } of pages) {
    if (!/^\/(?:guide|reference|design-system)(?:\/|$)/.test(pathname)) continue
    const html = (await readFile(new URL(`../out${pathname}.html`, import.meta.url), 'utf8')).replace(/<script\b[\s\S]*?<\/script>/g, '')
    for (const match of html.matchAll(/<details([^>]*)><summary>Generated CSS<\/summary>([\s\S]*?)<\/details>/g)) {
      count++
      assert.doesNotMatch(match[1], /\bopen(?:=|\s|$)/, pathname)
      assert.doesNotMatch(match[2], /<details|<summary>Generated CSS/, pathname)
      assert.match(match[2], /<pre\b/, pathname)
    }
  }
  assert.ok(count > 100, `Only ${count} generated output disclosures were found`)
})

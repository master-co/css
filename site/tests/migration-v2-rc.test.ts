import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { migrationGuides, migrationGuidesMarkdown } from '../utils/migration-guides'
import { migrationGuideContent } from '../utils/migration-content'
import { configuredExampleCSS } from '../reference/configured-example'

const root = fileURLToPath(new URL('../', import.meta.url))

test('v2 RC is integrated before v1 in the migration framework and generated search', async () => {
  const index = migrationGuides.findIndex(guide => guide.slug === 'v2-rc')
  assert.ok(index >= 0)
  assert.equal(migrationGuides[index].title, 'Master CSS v2 RC')
  assert.equal(migrationGuides[index].brand, 'mastercss')
  assert.equal(migrationGuides[index + 1].slug, 'v1')
  assert.match(migrationGuidesMarkdown(), /Master CSS v2 RC.*\/guide\/migration\/v2-rc/)
  const pages = JSON.parse(await readFile(new URL('../.pages.json', import.meta.url), 'utf8'))
  assert.ok(pages.some((page: { pathname: string }) => page.pathname === '/guide/migration/v2-rc'))
  for (const locale of ['en', 'tw']) {
    const search = JSON.parse(await readFile(new URL(`../public/search/${locale}.json`, import.meta.url), 'utf8'))
    assert.ok(search.some((page: { url: string }) => page.url.endsWith('/guide/migration/v2-rc')))
  }
})

test('the portable guide preserves the upgrade workflow and labels historical syntax', async () => {
  const { markdown } = await migrationGuideContent(root, 'v2-rc')
  assert.match(markdown, /exact installed RC versions/)
  assert.match(markdown, /\/guide\/migration#frameworks/)
  assert.match(markdown, /RC reference — not executed/)
  assert.match(markdown, /master-css migrate src app.css --from rc-legacy --source-version YOUR_ACTUAL_RC_VERSION --manifest master.rc.manifest.json --write/)
  assert.match(markdown, /Do not initialize the old and new Master runtimes/)
  assert.match(markdown, /root-size/)
  assert.match(markdown, /image-set/)
  assert.match(markdown, /binding ABI 11/)
  for (const profile of ['rc-legacy', 'rc-named', 'rc-native']) assert.ok(markdown.includes(profile))
  assert.match(markdown, /MASTER_QUERY_REQUIRES_CSS/)
  assert.match(markdown, /color-mix/)
  assert.match(markdown, /cssSyntaxStatus/)
})

test('new guide examples follow the native and named-token contract', () => {
  const source = '@theme { --color-brand: #4f46e5; }'
  const cases = [
    ['font-mono', 'font-family:var(--font-family-mono)'],
    ['font-bold', 'font-weight:var(--font-weight-bold)'],
    ['p-md', 'padding:var(--spacing-md)'],
    ['fg-brand', 'color:var(--color-brand)'],
    ['font-family:mono', 'font-family:mono'],
    ['fg:red', 'color:red'],
    ['bg:#fff', 'background:#fff'],
    ['b:2px', 'border:2px'],
    ['stroke-width:2px', 'stroke-width:2px'],
    ['line-clamp:3', 'line-clamp:3'],
    ['background-image:image-set(url(a.png)|1x,url(b.png)|2x)', 'image-set(url(a.png) 1x,url(b.png) 2x)']
  ]
  for (const [className, declaration] of cases) {
    assert.ok(configuredExampleCSS(source, [className]).includes(declaration), className)
  }
})

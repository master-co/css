/** Navigation, legacy anchors and disclosure contents in the packed production site. */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, webkit } from 'playwright'
const base = process.env.CSS_SITE_URL
assert.ok(base, 'CSS_SITE_URL must select the built packed consumer')
const output = process.env.GUIDE_OWNERSHIP_EVIDENCE ?? '/tmp/master-guide-reorganization/browser'
await mkdir(output, { recursive: true })
const records = []
const slugs = ['route-level-styles', 'scanning-and-pruning', 'optimizing-css-delivery']
const anchors = {
  'prune-native-css': 'native-pruning',
  'preserve-native-css': 'keep-external-and-uncertain-sources-safe',
  'verify-pruning': 'verify-the-pruning-step-independently'
}
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch()
  try {
    for (const locale of ['', '/tw']) {
      for (const slug of slugs) {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        const response = await page.goto(`${base}${locale}/guide/${slug}`, { waitUntil: 'networkidle' })
        assert.equal(response.status(), 200)
        if (slug === 'scanning-and-pruning') {
          assert.equal(await page.locator('h1').innerText(), locale ? '掃描 class 名稱' : 'Scanning class names')
          for (const [oldAnchor, target] of Object.entries(anchors)) {
            const anchor = page.locator(`[id="${oldAnchor}"]`)
            assert.equal(await anchor.count(), 1)
            const href = `${locale}/guide/optimizing-css-delivery#${target}`
            const link = page.locator(`main a[href="${href}"]`).first()
            assert.ok(await link.count(), href)
            await link.click()
            await page.waitForURL(`**#${target}`)
            assert.equal(await page.locator(`[id="${target}"]`).count(), 1)
            await page.goBack({ waitUntil: 'networkidle' })
          }
        }
        if (slug === 'optimizing-css-delivery') {
          for (const title of ['Complete two-page project', 'Reproduce native pruning with the CLI']) {
            const summary = page.locator('summary').filter({ hasText: title })
            const details = summary.locator('..')
            assert.equal(await details.getAttribute('open'), null)
            await summary.click()
            assert.notEqual(await details.getAttribute('open'), null)
            assert.ok(await details.locator('pre').count() >= (title.startsWith('Complete') ? 8 : 3))
          }
        }
        const links = await page.locator('main a[href]').evaluateAll(nodes => [...new Set(nodes.map(node => node.getAttribute('href')).filter(href => href.startsWith('/') || href.startsWith('#')))])
        for (const href of links) {
          const url = new URL(href, page.url()), response = await page.request.get(url.href)
          assert.equal(response.status(), 200, href)
          if (url.hash) assert.ok((await response.text()).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), href)
        }
        assert.deepEqual(errors, [])
        await page.screenshot({ path: `${output}/${name}-${locale ? 'tw' : 'en'}-${slug}.png`, fullPage: true })
        records.push({ engine: name, locale: locale || '/en', slug, links: links.length })
        await page.close()
      }
      const page = await browser.newPage()
      await page.goto(`${base}${locale}/guide`, { waitUntil: 'networkidle' })
      const authoring = page.locator('section[aria-labelledby="authoring"]')
      assert.ok(await authoring.locator(`a[href="${locale}/guide/scanning-and-pruning"]`).count())
      assert.ok(await authoring.locator(`a[href="${locale}/guide/route-level-styles"]`).count())
      assert.equal(await authoring.locator(`a[href="${locale}/guide/optimizing-css-delivery"]`).count(), 0)
      await page.close()
    }
  } finally { await browser.close() }
}
await writeFile(`${output}/results.json`, JSON.stringify(records, null, 2))
console.log(`${records.length} engine/locale/article checks passed; legacy anchors, disclosures, Guide categories and links verified`)

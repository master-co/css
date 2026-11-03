/** Article figure geometry, theme switching, portable meaning and links.
 * CSS_SITE_URL must point at the built packed consumer.
 */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, webkit } from 'playwright'
const base = process.env.CSS_SITE_URL, output = process.env.DELIVERY_SCREENSHOTS ?? '/tmp/master-delivery-guide/screenshots'
await mkdir(output, { recursive: true })
const records = []
for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch()
  try {
    for (const width of engineName === 'chromium' ? [390, 768, 1440] : [390, 1440]) for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce' }), errors=[]
      page.on('pageerror', e => errors.push(e.message))
      const response = await page.goto(base + '/guide/optimizing-css-delivery', { waitUntil: 'networkidle' }); assert.equal(response.status(), 200)
      await page.evaluate(() => document.fonts.ready)
      const figures = page.locator('main figure').filter({ has: page.locator('.document-illustration') })
      assert.equal(await figures.count(), 4)
      for (let index = 0; index < 4; index++) {
        const figure = figures.nth(index), image=figure.locator(`img[data-scheme="${theme}"]`)
        await figure.scrollIntoViewIfNeeded(); await image.evaluate(e => e.decode())
        assert.ok(await image.isVisible()); assert.ok(!await figure.locator(`img[data-scheme="${theme==='light'?'dark':'light'}"]`).isVisible())
        const bounds=await image.boundingBox(); assert.ok(Math.abs(bounds.width / bounds.height - 1.5) < .01)
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1)
        await figure.locator('summary').click(); assert.ok(await figure.locator('.ui-disclosure-body').innerText())
        await figure.screenshot({ path: `${output}/${engineName}-${width}-${theme}-${index}.png`, animations: 'disabled' })
      }
      // Exercise the existing preference handler independently of OS preference.
      // This checks image selection, not control reachability (the docs footer can be hidden).
      const opposite=theme==='light'?'dark':'light'
      await page.locator('select:has(option[value="system"])').first().selectOption(opposite, { force: true })
      await page.waitForFunction(value => document.documentElement.classList.contains(value), opposite)
      for (const figure of await figures.all()) assert.ok(await figure.locator(`img[data-scheme="${opposite}"]`).isVisible())
      await page.locator('select:has(option[value="system"])').first().selectOption(theme, { force: true })
      // Open the setup code; inspect document-level overflow and enlarged readable descriptions.
      const setup=page.locator('summary').filter({ hasText:'Project setup and page markup' }); await setup.click()
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1))
      await page.evaluate(() => document.documentElement.style.fontSize='200%')
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1))
      assert.deepEqual(errors, []); records.push({ engine:engineName,width,theme,figures:4 }); await page.close()
    }
    if (engineName==='chromium') {
      const page=await browser.newPage(); await page.goto(base+'/guide/optimizing-css-delivery', {waitUntil:'networkidle'})
      const links=await page.locator('main a[href]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.getAttribute('href')).filter(h=>h.startsWith('/')||h.startsWith('#')))])
      for (const href of links) {
        const url=new URL(href,base+'/guide/optimizing-css-delivery'); const response=await page.request.get(url.href);assert.equal(response.status(),200,href)
        if(url.hash){const text=await response.text();assert.ok(text.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`anchor ${href}`)}
      }
      await page.goto(base+'/tw/guide/optimizing-css-delivery',{waitUntil:'networkidle'});assert.equal(await page.locator('h1').innerText(),'最佳化 CSS 交付')
      await page.close()
    }
  } finally { await browser.close() }
}
await writeFile(output+'/results.json',JSON.stringify(records,null,2));console.log(`${records.length} browser/theme/width profiles, four figures each; links and locale title verified`)

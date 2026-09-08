import { chromium } from '@playwright/test'
import { renderHTML } from '../../../../packages/server/src/index.ts'
import manifest from '../../../../packages/preset/src/default-manifest.json' with { type: 'json' }
const inputs = [
  ['BH-0005', '<div class="block&#32;hidden"></div>'],
  ['BH-0006', '<div class="content:\'&lt;/style&gt;&lt;script&gt;globalThis.__audit=1&lt;/script&gt;\'"></div>']
]
const browser = await chromium.launch({ headless: true })
try {
  for (const [id, html] of inputs) {
    const before = await browser.newPage()
    await before.setContent(html)
    const original = await before.evaluate(() => ({ classes: [...document.querySelector('div').classList], scriptRan: globalThis.__audit === 1 }))
    const rendered = renderHTML(html, { manifest })
    const after = await browser.newPage()
    await after.setContent(rendered.html)
    const actual = await after.evaluate(() => ({ classes: [...document.querySelector('div').classList], scriptRan: globalThis.__audit === 1, scriptCount: document.scripts.length }))
    console.log(JSON.stringify({ id, original, serverClasses: rendered.classNames, cssText: rendered.cssText, actual }))
    await before.close(); await after.close()
  }
} finally { await browser.close() }

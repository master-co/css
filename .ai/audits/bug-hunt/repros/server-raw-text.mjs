import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { renderHTML } from '../../../../packages/server/src/index.ts'
import manifest from '../../../../packages/preset/src/default-manifest.json' with { type: 'json' }

const require = createRequire(fileURLToPath(new URL('../../../../packages/runtime/package.json', import.meta.url)))
const browserTypes = require('@playwright/test')
const modes = ['return', 'inject', false, { type: 'external', source: '/manifest.json' }]
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browserTypes[name].launch()
  let cases = 0
  try {
    for (const slashes of ['', '\\', '\\\\']) {
      for (const existing of [false, true]) {
        for (const hydrationManifest of modes) {
          const className = "content:'" + slashes + '</StYLe><script>globalThis.__audit=1</script>' + "'"
          const attribute = className.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
          const html = '<html><head>' + (existing ? '<style id="master-css">old</style>' : '')
            + '</head><body><div class="' + attribute + '"></div></body></html>'
          const rendered = renderHTML(html, { manifest, hydrationManifest })
          assert(rendered.cssText.includes('content:'), 'test class must generate CSS')
          const before = await browser.newPage()
          const after = await browser.newPage()
          try {
            await before.setContent(html)
            // The DOM/CSSOM control never passes CSS through the HTML tokenizer.
            await before.evaluate(css => {
              const style = document.createElement('style')
              style.textContent = css
              document.head.append(style)
            }, rendered.cssText)
            const expected = await before.locator('div').evaluate(el => getComputedStyle(el).content)
            assert.notEqual(expected, 'normal')
            await after.setContent(rendered.html)
            const actual = await after.evaluate(() => ({
              content: getComputedStyle(document.querySelector('div')).content,
              ran: globalThis.__audit === 1,
              scripts: [...document.scripts].filter(script => script.type !== 'application/json').length,
              styles: document.querySelectorAll('style#master-css').length
            }))
            assert.deepEqual(actual, { content: expected, ran: false, scripts: 0, styles: 1 })
            cases++
          } finally {
            await before.close()
            await after.close()
          }
        }
      }
    }
    console.log(JSON.stringify({ browser: name, version: browser.version(), cases, safeHTMLAndIdenticalCSSValue: true }))
  } finally {
    await browser.close()
  }
}

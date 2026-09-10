import { createRequire } from 'node:module'
import { compileRenderedStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test')
const cases = {
  nested: '@utilities{paint{padding:2rem}}.card{@media(min-width:1px){@compose paint;}}',
  outer: '@utilities{paint{padding:2rem}}@media(min-width:1px){.card{@compose paint;}}'
}
const results = Object.fromEntries(await Promise.all(Object.entries(cases).map(async ([name, css]) => [name, await compileRenderedStylesheet('/project/' + name + '.css', css, { baseManifest: { version: 1, utilities: [] }, preserveNativeCSS: true })])))
console.log(JSON.stringify({ css: Object.fromEntries(Object.entries(results).map(([name, result]) => [name, result.css])) }))
let failures = 0
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    const page = await browser.newPage()
    for (const [kind, result] of Object.entries(results)) {
      await page.setContent(`<style>${result.css}</style><div class="card">Probe</div>`)
      const padding = await page.locator('.card').evaluate(element => getComputedStyle(element).paddingTop)
      const pass = padding === '32px'
      if (!pass) failures++
      console.log(JSON.stringify({ browser: name, kind, padding, expected: '32px', pass }))
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ observations: 6, failures }))
process.exitCode = failures ? 1 : 0

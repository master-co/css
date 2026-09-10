import { createRequire } from 'node:module'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const source = '@utilities{paint{padding:2rem!important}low{padding:1rem!important}}.card{margin:5rem}@media print{@layer{.card{@compose paint;}.low{@compose low;}}}'
const outputs = { authored: '@media print{@layer{.card{padding:2rem!important}.low{padding:1rem!important}}}' }
for (const binding of ['native', 'wasm']) {
  using compiler = await createCompiler({ binding })
  outputs[binding] = compiler.compileStylesheets({ graph: { entry: '/entry.css', files: { '/entry.css': source }, edges: [] }, urls: { '/entry.css': '/entry.css' }, baseManifest: { version: 1, utilities: [] }, options: { preserveNativeCSS: false } }).css
}
console.log(JSON.stringify({ source, outputs }))
let failures = 0
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    const page = await browser.newPage()
    for (const media of ['screen', 'print']) {
      await page.emulateMedia({ media })
      for (const [path, css] of Object.entries(outputs)) {
        await page.setContent(`<style>html{font-size:16px}${css}</style><div class="card low">Probe</div>`)
        const actual = await page.locator('.card').evaluate(element => ({ padding: getComputedStyle(element).paddingTop, margin: getComputedStyle(element).marginTop }))
        const pass = actual.padding === (media === 'print' ? '16px' : '0px') && actual.margin === '0px'
        if (!pass) failures++
        console.log(JSON.stringify({ browser: name, media, path, actual, pass }))
      }
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ observations: 18, failures }))
process.exitCode = failures ? 1 : 0

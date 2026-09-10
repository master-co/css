import { createRequire } from 'node:module'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const baseManifest = { version: 1, utilities: [] }
const marker = '@--master-css-compose-slot-0;'
const native = `.label::before{content:"${marker}"}.card{padding:2rem}`
const source = `@utilities{paint{padding:2rem}}.label::before{content:"${marker}"}.card{@compose paint;}`
const css = { authored: native }
for (const binding of ['native', 'wasm']) {
  using compiler = await createCompiler({ binding })
  css[`direct-${binding}`] = compiler.compileManifest(source, { baseManifest, preserveNativeCSS: true }).css
  css[`graph-${binding}`] = compiler.compileStylesheets({ graph: { entry: '/entry.css', files: { '/entry.css': source }, edges: [] }, urls: { '/entry.css': '/entry.css' }, baseManifest }).stylesheets[0].css
}
console.log(JSON.stringify({ source, css }))
let failures = 0
for (const browserName of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[browserName].launch()
  try {
    const page = await browser.newPage()
    for (const [path, text] of Object.entries(css)) {
      await page.setContent(`<style>html{font-size:16px}${text}</style><div class="label"></div><div class="card">test</div>`)
      const actual = await page.evaluate(() => ({ content: getComputedStyle(document.querySelector('.label'), '::before').content, padding: getComputedStyle(document.querySelector('.card')).paddingTop }))
      const pass = actual.content === JSON.stringify(marker) && actual.padding === '32px'
      if (!pass) failures++
      console.log(JSON.stringify({ browser: browserName, path, actual, pass }))
    }
  } finally { await browser.close() }
}
console.log(JSON.stringify({ observations: 15, failures }))
process.exitCode = failures ? 1 : 0

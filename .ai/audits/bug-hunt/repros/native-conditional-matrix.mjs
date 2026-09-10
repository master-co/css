import { createRequire } from 'node:module'
import { createCompiler } from '../../../../packages/compiler/dist/index.js'
import { compileRenderedStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test')
const baseManifest = { version: 1, utilities: [] }
const definitions = '@utilities{paint{padding:2rem}}'
const wrappers = ['@media(min-width:1px)', '@supports(display:grid)', '@container card (min-width:1px)', '@layer cards', '@layer']
const cases = wrappers.map((wrapper, index) => ({ name: `simple-${index}`, wrapper, body: '.card{@compose paint;}', expected: '32px' }))
for (const [name, wrapper] of [['media', wrappers[0]], ['named-layer', wrappers[3]], ['anonymous-layer', wrappers[4]]]) {
  cases.push({ name: `order-${name}`, wrapper, body: '.card{@compose paint;}.card{padding:3rem}', expected: '48px' })
}
cases.push(
  { name: 'important-order', wrapper: '@layer', body: '.card{@compose paint;padding:2rem!important}.card{padding:4rem!important}', expected: '64px' },
  { name: 'repeated-selectors', wrapper: '@media(min-width:1px)', body: '.card{@compose paint;}.card.other{padding:1rem}.card.other{@compose paint;}.card{padding:3rem}', expected: '32px' }
)
const compilers = { native: await createCompiler({ binding: 'native' }), wasm: await createCompiler({ binding: 'wasm' }) }
const outputs = []
try {
  for (const item of cases) {
    const source = `${definitions}${item.wrapper}{${item.body}}`
    const request = { graph: { entry: '/entry.css', files: { '/entry.css': source }, edges: [] }, urls: { '/entry.css': '/entry.css' }, baseManifest }
    const css = {
      authored: `${item.wrapper}{${item.body.replaceAll('@compose paint;', 'padding:2rem;')}}`,
      direct: (await compileRenderedStylesheet('/entry.css', source, { baseManifest, preserveNativeCSS: true })).css,
      universalNative: compilers.native.compileManifest(source, { baseManifest, preserveNativeCSS: true }).css,
      universalWasm: compilers.wasm.compileManifest(source, { baseManifest, preserveNativeCSS: true }).css,
      native: compilers.native.compileStylesheets(request).stylesheets[0].css,
      wasm: compilers.wasm.compileStylesheets(request).stylesheets[0].css
    }
    if (css.native !== css.wasm) throw new Error(`Native/Wasm difference: ${item.name}`)
    outputs.push({ ...item, css })
  }
} finally { Object.values(compilers).forEach(compiler => compiler.dispose()) }
console.log(JSON.stringify({ outputs }))
let failures = 0, observations = 0
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    const page = await browser.newPage()
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    for (const item of outputs) for (const [path, css] of Object.entries(item.css)) {
      await page.setContent(`<style>html{font-size:16px}.shell{container-type:inline-size;container-name:card;width:100px}${css}</style><div class="shell"><div class="card other">Probe</div></div>`)
      const actual = await page.locator('.card').evaluate(element => getComputedStyle(element).paddingTop)
      const pass = actual === item.expected
      observations++
      if (!pass) failures++
      console.log(JSON.stringify({ browser: name, case: item.name, path, actual, expected: item.expected, pass }))
    }
    console.log(JSON.stringify({ browser: name, pageErrors }))
    failures += pageErrors.length
  } finally { await browser.close() }
}
console.log(JSON.stringify({ observations, failures }))
process.exitCode = failures ? 1 : 0

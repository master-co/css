import { createRequire } from 'node:module'
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
// Does prepending an authored-order @layer statement restore the authored cascade
// after expansion hoists the external @import? One case per remaining failure shape.
const cases = [
  { id: 'different-layers', authored: 'blue',
    expandedNow: `@import "https://remote.test/external.css" layer(b);\n@layer a{.example{color:red}}`,
    expandedWithStatement: `@layer a,b;\n@import "https://remote.test/external.css" layer(b);\n@layer a{.example{color:red}}` },
  { id: 'same-layer', authored: 'blue',
    expandedNow: `@import "https://remote.test/external.css" layer(shared);\n@layer shared{.example{color:red}}`,
    expandedWithStatement: `@layer shared;\n@import "https://remote.test/external.css" layer(shared);\n@layer shared{.example{color:red}}` },
  { id: 'external-last', authored: 'blue',
    expandedNow: `@import "https://remote.test/external.css";\n.example{color:red}`,
    expandedWithStatement: null }
]
const colors = { 'rgb(255, 0, 0)': 'red', 'rgb(0, 0, 255)': 'blue' }
const browser = await browsers.chromium.launch()
try {
  const page = await browser.newPage()
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.hostname === 'remote.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
    if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><link rel="stylesheet" href="/entry.css"><div class="example">test</div>' })
    return route.fulfill({ contentType: 'text/css', body: page.__css })
  })
  for (const item of cases) {
    const row = { id: item.id, authored: item.authored }
    for (const variant of ['expandedNow', 'expandedWithStatement']) {
      if (!item[variant]) { row[variant] = 'n/a'; continue }
      page.__css = item[variant]
      await page.goto('https://host.test/', { waitUntil: 'load' })
      const value = await page.evaluate(() => getComputedStyle(document.querySelector('.example')).color)
      row[variant] = colors[value] ?? value
    }
    row.remedyWorks = row.expandedWithStatement === 'n/a' ? 'n/a' : row.expandedWithStatement === item.authored
    console.log(JSON.stringify(row))
  }
} finally { await browser.close() }

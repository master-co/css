import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = require('@playwright/test')
const root = mkdtempSync(join(tmpdir(), 'master-native-cli-order-'))
const source = '@master entry;@utilities{paint{padding:2rem!important}low{padding:1rem!important}}@layer{.a{@compose paint;}.b{@compose low;}}'
let css
try {
  writeFileSync(join(root, 'entry.css'), source)
  const result = spawnSync(fileURLToPath(new URL('../../../../packages/binding/artifacts/mcss', import.meta.url)), ['--no-export', '-v', '0'], { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr)
  css = result.stdout
} finally { rmSync(root, { recursive: true, force: true }) }
console.log(JSON.stringify({ source, css }))
let failures = 0
for (const name of ['chromium', 'firefox', 'webkit']) {
  const browser = await browsers[name].launch()
  try {
    const page = await browser.newPage()
    await page.setContent(`<style>html{font-size:16px}${css}</style><div class="a b">Probe</div>`)
    const actual = await page.locator('.a').evaluate(element => getComputedStyle(element).paddingTop)
    const pass = actual === '16px'
    if (!pass) failures++
    console.log(JSON.stringify({ browser: name, actual, expected: '16px', pass }))
  } finally { await browser.close() }
}
console.log(JSON.stringify({ observations: 3, failures }))
process.exitCode = failures ? 1 : 0

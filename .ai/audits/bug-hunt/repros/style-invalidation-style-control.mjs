import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(resolve(repo, 'package.json'))
const { chromium } = require('@playwright/test')
const root = resolve('.results/runtime-style-invalidation-diagnostics/pages/stress-dom-master-static-style-invalidation-static-baseline')
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
  if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return }
  try {
    const data = await readFile(file)
    res.writeHead(200, { 'content-type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(file)] || 'application/octet-stream' })
    res.end(data)
  } catch { res.writeHead(404); res.end() }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = await chromium.launch()
const rows = []
try {
  for (const disableStyles of [false, true]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    await page.goto(`http://127.0.0.1:${server.address().port}`)
    await page.waitForFunction(() => globalThis.__benchmarkReady === true)
    const result = await page.evaluate(async disable => {
      const probe = document.getElementById('interaction-style-probe')
      const initialTextAlign = getComputedStyle(probe).textAlign
      if (disable) for (const stylesheet of document.styleSheets) stylesheet.disabled = true
      const beforeTextAlign = getComputedStyle(probe).textAlign
      const interaction = await globalThis.__runInteractionScenario()
      return { initialTextAlign, beforeTextAlign, afterTextAlign: getComputedStyle(probe).textAlign,
        stylesheetCount: document.styleSheets.length, interaction }
    }, disableStyles)
    rows.push({ disableStyles, ...result })
    await writeFile(resolve(repo, '.ai/audits/bug-hunt/evidence/0084-style-control.json'), JSON.stringify({ browser: browser.version(), rows }, null, 2))
    await page.close()
  }
  assert(rows.every(r => r.initialTextAlign === 'center' && r.stylesheetCount > 0 && r.interaction.cleanupValid === 1))
  assert.equal(rows[0].afterTextAlign, 'center')
  assert.notEqual(rows[1].beforeTextAlign, 'center')
  assert.notEqual(rows[1].afterTextAlign, 'center')
  assert(rows.every(r => r.interaction.computedStyleValid === 1))
  console.log(JSON.stringify({ styleControl: 'observations PASS', reportedValidWithStylesDisabled: true }))
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir = resolve(process.env.BH_NEXT_PACKAGE_DIR || fileURLToPath(new URL('../../../../packages/next/', import.meta.url)))
const requireNext = createRequire(join(packageDir, 'package.json'))
const requireRuntime = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = requireRuntime('@playwright/test')
const parent = join(packageDir, 'e2e');mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'bug-hunt-static-publication-')), observations = []
let server
try {
  mkdirSync(join(root, 'app/nested/assets'), { recursive: true })
  mkdirSync(join(root, 'app/assets'))
  writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}')
  writeFileSync(join(root, 'next.config.js'), `import { withMasterCSS } from ${JSON.stringify(relative(root, join(packageDir, 'dist/index.js')))};export default await withMasterCSS(${JSON.stringify({output:'export',experimental:{cpus:1},...(process.env.BH_NEXT_WORKSPACE_ROOT ? {turbopack:{root:process.env.BH_NEXT_WORKSPACE_ROOT}} : {})})},{mode:'static'});`)
  writeFileSync(join(root, 'app/layout.jsx'), 'import "./globals.css";export default function Layout({children}){return <html><body>{children}</body></html>}')
  writeFileSync(join(root, 'app/page.jsx'), 'export default function Page(){return <main><div id="direct" className="direct">Direct</div><div id="nested" className="nested">Nested</div><div id="generated" className="p:2rem">Generated</div></main>}')
  const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><path fill="${color}" d="M0 0h4v4H0z"/></svg>`
  writeFileSync(join(root, 'app/assets/red.svg'), svg('red'))
  writeFileSync(join(root, 'app/nested/assets/blue.svg'), svg('blue'))
  writeFileSync(join(root, 'app/nested/child.css'), '.nested{width:4px;height:4px;background-image:url("./assets/blue.svg?nested=1#pixel")}')
  writeFileSync(join(root, 'app/globals.css'), '@master entry;@preserve native;@import "./nested/child.css" layer(card);.direct{width:4px;height:4px;background-image:url("./assets/red.svg?direct=1#pixel")}')
  const child = spawn(process.execPath, [requireNext.resolve('next/dist/bin/next'), 'build'], {
    cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', bytes => process.stdout.write(bytes))
  child.stderr.on('data', bytes => process.stderr.write(bytes))
  const timeout = setTimeout(() => child.kill('SIGTERM'), 180000)
  const [code, signal] = await once(child, 'exit');clearTimeout(timeout)
  assert.equal(code, 0, `Next build failed; signal=${signal}`)
  const output = join(root, 'out')
  const files = []
  function inventory(directory) {
    for (const name of readdirSync(directory)) {
      const file = join(directory, name)
      if (statSync(file).isDirectory()) inventory(file)
      else files.push({ file: relative(output, file), sha256: createHash('sha256').update(readFileSync(file)).digest('hex') })
    }
  }
  inventory(output)
  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const file = resolve(output, '.' + (pathname === '/' ? '/index.html' : pathname))
    if (!file.startsWith(output + '/') || !existsSync(file) || !statSync(file).isFile()) { response.writeHead(404);response.end();return }
    response.setHeader('content-type', ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream')
    response.end(readFileSync(file))
  })
  server.listen(0, '127.0.0.1');await once(server, 'listening')
  const url = `http://127.0.0.1:${server.address().port}/`
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'networkidle' })
      for (const [id, color] of [['direct', 'red'], ['nested', 'blue']]) {
        const result = await page.evaluate(async id => {
          const background = getComputedStyle(document.getElementById(id)).backgroundImage
          const match = background.match(/url\(["']?([^"')]+)["']?\)/)
          if (!match) return { background }
          const image = new Image();image.src = match[1];await image.decode()
          const response = await fetch(match[1])
          return { background, status: response.status, width: image.naturalWidth, height: image.naturalHeight, body: await response.text() }
        }, id)
        assert.equal(result.status, 200);assert.equal(result.width, 4);assert.equal(result.height, 4);assert.ok(result.body.includes(`fill="${color}"`))
        observations.push({ browser: name, id, ...result })
      }
      const padding = await page.locator('#generated').evaluate(element => getComputedStyle(element).paddingTop)
      assert.equal(padding, '32px');observations.push({ browser: name, id: 'generated', padding })
    } finally { await browser.close() }
  }
  console.log(JSON.stringify({ scope: 'Actual Next Turbopack static export, then three-browser rendering and SVG decoding of exported artifacts. No live HMR or dynamic SSR claim.', observations, files }, null, 2))
} finally {
  if (server) await new Promise(resolveClose => server.close(resolveClose))
  rmSync(root, { recursive: true, force: true })
}

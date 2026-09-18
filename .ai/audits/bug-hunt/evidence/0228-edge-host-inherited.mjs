import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

// Every build result is evidence, not an assertion that rejection is correct.
const packageDir = resolve(process.env.BH_NEXT_PACKAGE_DIR)
const evidence = resolve(process.env.BH_NEXT_HOST_EVIDENCE)
const requireNext = createRequire(join(packageDir, 'package.json'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const bundler = process.env.BH_NEXT_BUNDLER || 'turbopack'
const pure = process.env.BH_NEXT_PURE === '1'
const scenario = process.env.BH_NEXT_EDGE_CASE
const cases = {
  'acyclic-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', valid: true
  },
  'encoded-composes': {
    a: '.direct{composes:shared from "./other%20module.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', file: 'other module.module.css', valid: true
  },
  'literal-percent-composes': {
    a: '.direct{composes:shared from "./literal%2520name.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}', file: 'literal%20name.module.css', valid: true
  },
  'missing-composes': {
    a: '.direct{composes:missing from "./other.module.css";color:#123456}',
    b: '.shared{border-top:7px solid red}'
  },
  'independent-compose-cycle': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}.anchor{margin-left:11px}',
    b: '.shared{border-top:7px solid red}.dependent{composes:anchor from "./card.module.css";padding:13px}'
  },
  'recursive-composes': {
    a: '.direct{composes:shared from "./other.module.css";color:#123456}',
    b: '.shared{composes:direct from "./card.module.css";border-top:7px solid red}'
  },
  'icss-value-cycle': {
    a: ':import("./other.module.css"){tone:tone}:export{own:#654321}.direct{color:tone}',
    b: ':import("./card.module.css"){own:own}:export{tone:#123456}.shared{color:own}'
  },
  'missing-icss-value': {
    a: ':import("./other.module.css"){tone:missing}.direct{color:tone}',
    b: ':export{tone:#123456}.shared{border-top:7px solid red}'
  }
}
assert(cases[scenario], 'known edge scenario')
const parent = join(packageDir, 'e2e');mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'bug-hunt-module-edge-'))
const report = { scenario, bundler, pure, packageDir, input: cases[scenario], build: null, observations: [], stylesheets: [], errors: [], browserFailures: [] }
let server
try {
  mkdirSync(join(root, 'app'))
  writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}')
  const config = { output: 'export', experimental: { cpus: 1 }, turbopack: { root: '/Users/aron/master/css' } }
  writeFileSync(join(root, 'next.config.mjs'), pure ? `export default ${JSON.stringify(config)}` : `import {withMasterCSS} from ${JSON.stringify(relative(root, join(packageDir, 'dist/index.js')))};export default await withMasterCSS(${JSON.stringify(config)},{mode:'runtime',runtime:false})`)
  writeFileSync(join(root, 'app/layout.jsx'), 'export default function Layout({children}){return <html><body>{children}</body></html>}')
  writeFileSync(join(root, 'app/page.jsx'), 'import styles from "./card.module.css";export default function Page(){return <div id="probe" className={styles.direct}>Probe</div>}')
  writeFileSync(join(root, 'app/card.module.css'), (pure ? '' : '@master entry;@preserve native;') + cases[scenario].a)
  writeFileSync(join(root, 'app', cases[scenario].file || 'other.module.css'), cases[scenario].b)
  const child = spawn(process.execPath, [requireNext.resolve('next/dist/bin/next'), 'build', ...(bundler === 'webpack' ? ['--webpack'] : [])], { cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = '', timedOut = false
  for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { output += bytes; process.stdout.write(bytes) })
  const timeout = setTimeout(() => { timedOut = true; child.kill('SIGTERM') }, 120000)
  const [code, signal] = await once(child, 'exit');clearTimeout(timeout)
  report.build = { code, signal, timedOut, exported: existsSync(join(root, 'out/index.html')), log: output }
  if (code === 0 && report.build.exported) {
    const out = join(root, 'out')
    function collect(dir) {
      for (const name of readdirSync(dir)) {
        const file = join(dir, name)
        if (statSync(file).isDirectory()) collect(file)
        else if (name.endsWith('.css')) report.stylesheets.push({ file: relative(out, file), text: readFileSync(file, 'utf8') })
      }
    }
    collect(out)
    server = createServer((req, res) => {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      const file = resolve(out, '.' + (path === '/' ? '/index.html' : path))
      if (!file.startsWith(out + '/') || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404);res.end();return }
      res.setHeader('content-type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(file)] || 'application/octet-stream')
      res.end(readFileSync(file))
    })
    server.listen(0, '127.0.0.1');await once(server, 'listening')
    for (const name of ['chromium', 'firefox', 'webkit']) {
      let browser
      try {
        browser = await browsers[name].launch({ headless: true, timeout: 15000 })
        const page = await browser.newPage()
        page.on('pageerror', error => report.errors.push({ browser: name, message: String(error) }))
        await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' })
        const observation = await page.locator('#probe').evaluate(el => {
          const style = getComputedStyle(el)
          return { classes: el.className, color: style.color, border: style.borderTopWidth, margin: style.marginLeft, padding: style.paddingTop }
        })
        report.observations.push({ browser: name, ...observation, ...(cases[scenario].valid ? { pass: observation.color === 'rgb(18, 52, 86)' && observation.border === '7px' && !observation.classes.includes('undefined') } : {}) })
      } catch (error) { report.browserFailures.push({ browser: name, error: String(error.stack || error) }) } finally { if (browser) await browser.close() }
    }
  }
} catch (error) {
  report.harnessError = String(error.stack || error)
  process.exitCode = 1
} finally {
  if (server) await new Promise(done => server.close(done))
  writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n')
  rmSync(root, { recursive: true, force: true })
}
console.log(JSON.stringify({ scenario, bundler, pure, build: report.build && { ...report.build, log: undefined }, observations: report.observations, harnessError: report.harnessError }))

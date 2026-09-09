import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname, dirname } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-inline-delivery-'))), rows = []
const cases = [
  { id: 'opaque-url-string', source: '@master entry;@preserve native;.example{color:blue;--literal:\"https://master-css-inline.invalid/literal\"}', literal: true },
  ...['iife', 'umd'].map(format => ({ id: format + '-resource', format, source: '@master entry;@preserve native;.example{color:blue;background-image:url(\"./pixel.svg?q=1#part\")}', resource: true, custom: true })),
  { id: 'virtual-inline', entry: 'virtual:paint.css?inline', extraClass: 'block' },
  { id: 'virtual-child-inline', source: '@import \"virtual:paint.css\";@master entry;@preserve native;', extraClass: 'block' },
  { id: 'css-string', source: '@master entry;@preserve native;.example{color:blue}' },
  { id: 'sass-string', extension: 'scss', source: '@master entry;@preserve native;$paint:blue;.example{color:$paint}' },
  { id: 'construct-css', source: '@master entry;@preserve native;.example{color:blue}', construct: true },
  { id: 'construct-sass', extension: 'scss', source: '@master entry;@preserve native;$paint:blue;.example{color:$paint}', construct: true },
  { id: 'qualified-local', source: '@import "./child.css" layer(shared) supports(display:grid) print;@master entry;@preserve native;', printOnly: true, construct: true },
  { id: 'qualified-external', source: '@import "./external.css" layer(shared) print;@master entry;@preserve native;', printOnly: true },
  { id: 'resource-custom-output', source: '@master entry;@preserve native;.example{color:blue;background-image:url("./pixel.svg?q=1#part")}', resource: true, custom: true },
  { id: 'two-independent-strings', source: '@master entry;@preserve native;.example{color:blue}', second: true },
  { id: 'mixed-auto-and-string', source: '@master entry;@preserve native;.example{color:blue}', automatic: true }
].filter(test => !process.env.BH_CASE || process.env.BH_CASE.split(',').includes(test.id))
try {
  mkdirSync(join(root, 'node_modules'))
  symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
  writeFileSync(join(root, 'child.css'), '.example{color:blue}')
  writeFileSync(join(root, 'external.css'), '@import "https://inline-external.test/paint.css";')
  writeFileSync(join(root, 'other.css'), '@master entry;@preserve native;.example{color:red}')
  writeFileSync(join(root, 'automatic.css'), '@master entry;@preserve native;.example{color:green}')
  writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
  for (const test of cases) {
    const entry = `entry.${test.extension ?? 'css'}`, out = join(root, test.id)
    if (test.source) writeFileSync(join(root, entry), test.source)
    writeFileSync(join(root, 'index.html'), `<div id="target" class="example ${test.extraClass ?? ''}">test</div><script type="module" src="./entry.js"></script>`)
    const prefix = `${test.second ? 'import other from "./other.css?inline";window.other=other;' : ''}${test.automatic ? 'import "./automatic.css";' : ''}`
    writeFileSync(join(root, 'entry.js'), `${prefix}import css from ${JSON.stringify(test.entry ?? './' + entry + '?inline')};window.css=css;${process.env.BH_EARLY ? `window.before=getComputedStyle(document.querySelector('#target')).color;` : ''}${process.env.BH_EARLY ? (test.construct ? 'const sheet=new CSSStyleSheet();sheet.replaceSync(css);document.adoptedStyleSheets=[...document.adoptedStyleSheets,sheet];' : 'const style=document.createElement("style");style.textContent=css;document.head.append(style);') : ''}`)
    const warnings = []
    try {
      const built = await build({ root, base: './', configFile: false, logLevel: 'silent', plugins: [{ name: 'audit-inline-virtual', resolveId(id) { if (id.startsWith('virtual:paint.css')) return '\0' + id }, load(id) { if (id.startsWith('\0virtual:paint.css')) return '@master entry;@preserve native;.example{color:blue}' } }, ...createMasterCSSVitePlugin({ mode: 'static', runtime: false })], build: { outDir: out, lib: test.format ? { entry: join(root, 'entry.js'), name: 'InlineProbe', formats: [test.format] } : undefined, rolldownOptions: { onwarn(warning) { warnings.push(warning.message) }, output: test.custom ? { entryFileNames: 'scripts/deep/[name]-[hash].js', assetFileNames: 'styles/deep/[name]-[hash][extname]' } : undefined } } })
      if (test.format) {
        const entry = (Array.isArray(built) ? built : [built]).flatMap(output => output.output).find(output => output.type === 'chunk' && output.isEntry)
        writeFileSync(join(out, 'index.html'), `<div id="target" class="example">test</div><script src="./${entry.fileName}"></script>`)
      }
    } catch (error) { const row = { id: test.id, phase: 'build', result: 'FAIL', message: error.message }; rows.push(row); console.log(JSON.stringify(row)); continue }
    for (const name of ['chromium', 'firefox', 'webkit']) {
      const browser = await browsers[name].launch()
      try {
        for (const media of ['screen', 'print']) {
          const page = await browser.newPage(), missing = [], errors = []
          try {
            await page.emulateMedia({ media }); page.on('pageerror', e => errors.push(e.message))
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              if (url.host === 'inline-external.test') return route.fulfill({ contentType: 'text/css', body: '.example{color:blue}' })
              const file = join(out, url.pathname.replace(/^\/deployed\//, ''))
              if (!existsSync(file)) { missing.push(url.href); return route.fulfill({ status: 404, body: 'missing' }) }
              return route.fulfill({ contentType: { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml' }[extname(file)], body: readFileSync(file) })
            })
            await page.goto('http://inline-vite.test/deployed/index.html'); await page.waitForLoadState('networkidle')
            if (!process.env.BH_EARLY) {
              await page.evaluate(construct => {
                window.before = getComputedStyle(document.querySelector('#target')).color
                window.inlineReady = false
                if (construct) { const sheet = new CSSStyleSheet(); sheet.replaceSync(window.css); document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]; window.inlineReady = true }
                else { const style = document.createElement('style'); style.onload = () => { window.inlineReady = true }; style.onerror = () => { window.inlineError = 'Inline stylesheet failed to load' }; style.textContent = window.css; document.head.append(style); if (!window.css.includes('@import')) window.inlineReady = true }
              }, Boolean(test.construct))
              await page.waitForFunction(() => window.inlineReady || window.inlineError)
              assert.equal(await page.evaluate(() => window.inlineError), undefined)
            }
            const value = await page.evaluate(async () => {
              const style = getComputedStyle(document.querySelector('#target')), background = style.backgroundImage
              let imageLoaded = false
              if (background.startsWith('url(')) { const image = new Image(); image.src = background.slice(4, -1).replace(/^['"]|['"]$/g, ''); try { await image.decode(); imageLoaded = image.naturalWidth === 1 } catch {} }
              let otherColor
              if (window.other) {
                const host = document.createElement('div'), shadow = host.attachShadow({ mode: 'open' })
                shadow.innerHTML = '<div class="example">other</div>'
                const sheet = document.createElement('style'); sheet.textContent = window.other; shadow.append(sheet); document.body.append(host)
                otherColor = getComputedStyle(shadow.querySelector('.example')).color
                host.remove()
              }
              return { literal: style.getPropertyValue('--literal'), otherColor, color: style.color, before: window.before, css: window.css, other: window.other, background, imageLoaded }
            })
            const expected = test.printOnly && media === 'screen' ? 'rgb(0, 0, 0)' : 'rgb(0, 0, 255)'
            const pass = value.color === expected && value.before === (test.automatic ? 'rgb(0, 128, 0)' : 'rgb(0, 0, 0)') && !value.css.includes('master-css-slot') && (!test.literal || value.literal === '\"https://master-css-inline.invalid/literal\"') && (!test.construct || !value.css.includes('@import')) && (!test.second || value.otherColor === 'rgb(255, 0, 0)') && (!test.resource || value.imageLoaded) && !missing.length && !errors.length && !warnings.some(message => message.includes('Could not splice'))
            const row = { id: test.id, phase: 'browser', browser: name, media, value, expected, missing, errors, warnings, result: pass ? 'PASS' : 'FAIL' }; rows.push(row); console.log(JSON.stringify(row))
          } finally { await page.close() }
        }
      } finally { await browser.close() }
    }
  }
  const summary = { builds: cases.length, buildFailures: rows.filter(r => r.phase === 'build').length, comparisons: rows.filter(r => r.phase === 'browser').length, failures: rows.filter(r => r.result === 'FAIL').length }
  console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)
} finally { rmSync(root, { recursive: true, force: true }) }

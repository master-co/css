import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, extname } from 'node:path'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { build } = await import(require.resolve('vite'))
const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const rows = []
const managed = !process.env.BH_PURE_VITE
for (const extension of process.env.BH_EXTENSION ? [process.env.BH_EXTENSION] : ['css', 'scss']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-modules-watch-'))), out = join(root, 'dist'), pending = [], waiters = []
  let watcher
  const nextBuild = () => pending.length ? Promise.resolve(pending.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for Vite build event')), 30000)
    waiters.push(event => { clearTimeout(timer); resolve(event) })
  })
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
    const child = join(root, 'shared.module.css')
    writeFileSync(child, '.shared { color: red; }')
    const source = (managed ? '@master entry;' : '') + '.example { composes: shared from "./shared.module.css"; background-color: blue; }'
    writeFileSync(join(root, `style.module.${extension}`), source)
    const script = `import names from './style.module.${extension}';window.names=names;document.querySelector('#target').className=names.example;`
    writeFileSync(join(root, 'entry.js'), script)
    writeFileSync(join(root, 'index.html'), '<div id="target">test</div><script type="module" src="./entry.js"></script>')
    watcher = await build({ root, configFile: false, logLevel: 'silent', base: './', plugins: managed ? createMasterCSSVitePlugin({ mode: 'static', runtime: false }) : [], build: { outDir: out, watch: {}, minify: false } })
    watcher.on('event', event => {
      if (!['END', 'ERROR'].includes(event.code)) return
      const receiver = waiters.shift()
      if (receiver) receiver(event); else pending.push(event)
    })
    for (const [index, color] of ['red', 'red', 'green'].entries()) {
      if (index === 1) writeFileSync(join(root, 'entry.js'), script + 'console.log("JS-only rebuild")')
      if (index === 2) {
        writeFileSync(child, '.shared { color: green; }')
        if (process.env.BH_ROOT_EDIT) writeFileSync(join(root, `style.module.${extension}`), source + '\n')
      }
      const event = await nextBuild()
      if (event.code === 'ERROR') throw event.error
      for (const name of ['chromium', 'firefox', 'webkit']) {
        const browser = await browsers[name].launch()
        try {
          const page = await browser.newPage(), errors = [], missing = []
          page.on('pageerror', error => errors.push(error.message))
          await page.route('**/*', route => {
            const file = join(out, new URL(route.request().url()).pathname)
            if (!existsSync(file)) { missing.push(file); return route.fulfill({ status: 404, body: 'missing' }) }
            return route.fulfill({ contentType: { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)], body: readFileSync(file) })
          })
          await page.goto('http://module-watch.test/index.html')
          const value = await page.locator('#target').evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor, names: window.names }))
          const expected = color === 'red' ? 'rgb(255, 0, 0)' : 'rgb(0, 128, 0)'
          const row = { managed, rootEdit: Boolean(process.env.BH_ROOT_EDIT), extension, index, browser: name, value, expected, missing, errors, result: value.color === expected && value.background === 'rgb(0, 0, 255)' && !missing.length && !errors.length ? 'PASS' : 'FAIL' }; rows.push(row); console.log(JSON.stringify(row))
        } finally { await browser.close() }
      }
    }
  } finally { await watcher?.close(); rmSync(root, { recursive: true, force: true }) }
}
const summary = { builds: rows.length / 3, comparisons: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)

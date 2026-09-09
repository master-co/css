import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, renameSync, readdirSync } from 'node:fs'
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
  let watcher, revision = 0, buildingRevision = 0
  const nextEvent = () => pending.length ? Promise.resolve(pending.shift()) : new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for Vite build event')), 30000)
    waiters.push(event => { clearTimeout(timer); resolve(event) })
  })
  const nextBuild = async () => {
    for (;;) { const event = await nextEvent(); if (event.revision === revision) return event }
  }
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(dirname(createRequire(require.resolve('vite')).resolve('sass')), join(root, 'node_modules/sass'), 'dir')
    let child = join(root, process.env.BH_NESTED ? 'leaf.module.css' : 'shared.module.css')
    const className = process.env.BH_NESTED ? 'leaf' : 'shared'
    const childSource = color => `.${className} { color: ${color}; }`
    writeFileSync(child, childSource('red'))
    if (process.env.BH_NESTED) writeFileSync(join(root, 'shared.module.css'), '.shared { composes: leaf from "./leaf.module.css"; }')
    const source = (managed ? '@master entry;' : '') + '.example { composes: shared from "./shared.module.css"; background-color: blue; }'
    writeFileSync(join(root, `style.module.${extension}`), source)
    const script = `import names from './style.module.${extension}';window.names=names;document.querySelector('#target').className=names.example;`
    writeFileSync(join(root, 'entry.js'), script)
    writeFileSync(join(root, 'index.html'), '<div id="target">test</div><script type="module" src="./entry.js"></script>')
    watcher = await build({ root, configFile: false, logLevel: 'silent', base: './', plugins: managed ? createMasterCSSVitePlugin({ mode: 'static', runtime: false }) : [], build: { outDir: out, watch: {}, minify: false } })
    watcher.on('event', event => {
      if (event.code === 'BUNDLE_START') buildingRevision = revision
      console.log(JSON.stringify({ phase: 'watch-event', extension, code: event.code, revision: buildingRevision, time: Date.now() }))
      // END also follows ERROR; only BUNDLE_END proves successful publication.
      if (!['BUNDLE_END', 'ERROR'].includes(event.code)) return
      const files = new Map()
      if (event.code === 'BUNDLE_END') {
        for (const name of readdirSync(out, { recursive: true, withFileTypes: true })) {
          if (name.isFile()) { const file = join(name.parentPath, name.name); files.set(file, readFileSync(file)) }
        }
      }
      const result = { ...event, revision: buildingRevision, files }
      const receiver = waiters.shift()
      if (receiver) receiver(result); else pending.push(result)
    })
    const colors = process.env.BH_MUTATION === 'rename' ? ['red', 'red', 'green', 'blue'] : ['red', 'red', 'green']
    for (const [index, color] of colors.entries()) {
      if (index === 1) { revision++; writeFileSync(join(root, 'entry.js'), script + 'console.log("JS-only rebuild")') }
      if (index === 2) {
        if (process.env.BH_MUTATION) {
          assert.ok(['delete', 'rename'].includes(process.env.BH_MUTATION))
          revision++
          const previous = child
          if (process.env.BH_MUTATION === 'rename') {
            child = join(root, 'renamed.module.css')
            renameSync(previous, child)
          } else rmSync(child)
          if (process.env.BH_ROOT_EDIT) writeFileSync(join(root, `style.module.${extension}`), source + '\n')
          const failure = await nextBuild()
          assert.equal(failure.code, 'ERROR')
          assert.match(String(failure.error), /fileResolve|ENOENT|(?:leaf|shared)\.module\.css/)
          console.log(JSON.stringify({ managed, extension, phase: 'expected-missing-file', mutation: process.env.BH_MUTATION, error: String(failure.error), result: 'PASS' }))
          revision++
          if (process.env.BH_MUTATION === 'rename') {
            const consumer = process.env.BH_NESTED ? join(root, 'shared.module.css') : join(root, `style.module.${extension}`)
            writeFileSync(consumer, readFileSync(consumer, 'utf8').replace(process.env.BH_NESTED ? './leaf.module.css' : './shared.module.css', './renamed.module.css'))
          }
        }
        if (process.env.BH_RECOVERY) {
          revision++
          writeFileSync(child, `.${className} { @compose unknown-watch-utility; }`)
          const failure = await nextBuild()
          assert.equal(failure.code, 'ERROR')
          assert.match(String(failure.error), /unknown-watch-utility/)
          const error = failure.error.errors?.[0] ?? failure.error
          assert.ok(error.diagnostics?.[0], 'Expected a structured compiler diagnostic')
          assert.ok(!error.diagnostics[0].source?.includes('<no source>'))
          assert.ok(error.diagnostics[0].notes?.some(note => note.includes('preprocessed CSS')))
          console.log(JSON.stringify({ managed, extension, phase: 'expected-error', diagnostics: error.diagnostics, result: 'PASS' }))
        }
        if (!process.env.BH_MUTATION) revision++
        writeFileSync(child, childSource('green'))
        if (process.env.BH_ROOT_EDIT) writeFileSync(join(root, `style.module.${extension}`), source + '\n')
      }
      if (index === 3) { revision++; writeFileSync(child, childSource('blue')) }
      const event = await nextBuild()
      if (event.code === 'ERROR') throw event.error
      for (const name of ['chromium', 'firefox', 'webkit']) {
        const browser = await browsers[name].launch()
        try {
          const page = await browser.newPage(), errors = [], missing = []
          page.on('pageerror', error => errors.push(error.message))
          await page.route('**/*', route => {
            const file = join(out, new URL(route.request().url()).pathname)
            if (!event.files.has(file)) { missing.push(file); return route.fulfill({ status: 404, body: 'missing' }) }
            return route.fulfill({ contentType: { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)], body: event.files.get(file) })
          })
          await page.goto('http://module-watch.test/index.html')
          const value = await page.locator('#target').evaluate(el => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor, names: window.names }))
          const expected = ({ red: 'rgb(255, 0, 0)', green: 'rgb(0, 128, 0)', blue: 'rgb(0, 0, 255)' })[color]
          const row = { managed, revision: event.revision, delivery: 'completed-build-snapshot', mutation: process.env.BH_MUTATION, nested: Boolean(process.env.BH_NESTED), recovery: Boolean(process.env.BH_RECOVERY), rootEdit: Boolean(process.env.BH_ROOT_EDIT), extension, index, browser: name, value, expected, missing, errors, result: value.color === expected && value.background === 'rgb(0, 0, 255)' && !missing.length && !errors.length ? 'PASS' : 'FAIL' }; rows.push(row); console.log(JSON.stringify(row))
        } finally { await browser.close() }
      }
    }
  } finally { await watcher?.close(); rmSync(root, { recursive: true, force: true }) }
}
const summary = { builds: rows.length / 3, comparisons: rows.length, failures: rows.filter(row => row.result === 'FAIL').length }
console.log(JSON.stringify(summary)); assert.equal(summary.failures, 0)

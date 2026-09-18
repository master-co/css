import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
const require = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))
const webpack = require('webpack'), engines = require('@playwright/test')
const { default: Plugin } = await import(process.env.MASTER_WEBPACK_PLUGIN ? pathToFileURL(process.env.MASTER_WEBPACK_PLUGIN).href : new URL('../../../../packages/webpack/dist/index.js', import.meta.url).href)
const pure = Boolean(process.env.BH_PURE_WEBPACK), rows = []
for (const mode of ['multiple', 'lazy', 'combined-ab', 'combined-ba']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-owners-')))
  const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7"><rect width="7" height="7" fill="${color}"/></svg>`
  for (const [name, color] of [['a', 'red'], ['b', 'blue']]) {
    writeFileSync(join(root, `${name}.svg`), svg(color))
    writeFileSync(join(root, `${name}.css`), `@master entry;@preserve native;.card{color:${color};background-image:url("./${name}.svg");--owner:${name}}`)
    writeFileSync(join(root, `${name}.js`), `import "./${name}.css";document.body.dataset.ready="${name}";${mode === 'lazy' && name === 'a' ? 'globalThis.loadLazy=()=>import("./b.js")' : ''}`)
  }
  if (mode.startsWith('combined')) {
    const order = mode.endsWith('ab') ? ['a', 'b'] : ['b', 'a']
    writeFileSync(join(root, 'a.js'), order.map(name => `import './${name}.css';`).join('') + `document.body.dataset.ready="${order.at(-1)}"`)
  }
  const compiler = webpack({ mode: 'production', context: root, entry: mode === 'multiple' ? { a: './a.js', b: './b.js' } : { a: './a.js' }, resolve: { tsconfig: false }, experiments: { css: true },
    output: { path: join(root, 'out'), clean: true, publicPath: '/assets/', filename: 'js/[name].[contenthash:12].js', chunkFilename: 'js/[name].[contenthash:12].js', cssFilename: 'css/[name].[contenthash:12].css', cssChunkFilename: 'css/[name].[contenthash:12].css' },
    plugins: pure ? [] : [new Plugin({ mode: 'static', runtime: false }, root)] })
  try {
    const stats = await new Promise((resolve, reject) => compiler.run((error, stats) => error || !stats || stats.hasErrors() ? reject(error ?? new Error(stats?.toString({ all: false, errors: true }))) : resolve(stats)))
    const assets = Object.fromEntries(stats.compilation.getAssets().map(asset => [asset.name, readFileSync(join(root, 'out', asset.name), 'utf8')]))
    const entries = Object.fromEntries([...stats.compilation.entrypoints].map(([name, entry]) => [name, entry.getFiles()]))
    console.log(JSON.stringify({ build: mode, pure, entries, assets }))
    for (const engine of ['chromium', 'firefox', 'webkit']) {
      const browser = await engines[engine].launch()
      try {
        for (const name of Object.keys(entries)) {
          const page = await browser.newPage(), requests = [], missing = [], errors = []
          try {
            page.on('pageerror', e => errors.push(e.message))
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head>${entries[name].filter(file => file.endsWith('.css')).map(file => `<link rel="stylesheet" href="/assets/${file}">`).join('')}</head><body><div class="card">card</div>${entries[name].filter(file => file.endsWith('.js')).map(file => `<script src="/assets/${file}"></script>`).join('')}</body></html>` })
              const file = url.pathname.replace(/^\/assets\//, '');requests.push(file)
              if (!(file in assets)) { missing.push(file);return route.fulfill({ status: 404, body: 'missing' }) }
              return route.fulfill({ contentType: ({ '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[extname(file)] ?? 'text/plain', body: assets[file] })
            })
            await page.goto('http://webpack-ownership.test/', { waitUntil: 'load' })
            const check = async (phase, expectedName) => {
              await page.waitForFunction(name => document.body.dataset.ready === name, expectedName)
              if (phase === 'lazy-after') await page.waitForFunction(name => getComputedStyle(document.querySelector('.card')).getPropertyValue('--owner').trim() === name, expectedName, { timeout: 3000 }).catch(() => {})
              const actual = await page.locator('.card').evaluate(async el => {
                const style = getComputedStyle(el), image = new Image();image.src = style.backgroundImage.slice(5, -2);await image.decode()
                return { color: style.color, owner: style.getPropertyValue('--owner').trim(), image: style.backgroundImage, width: image.naturalWidth }
              })
              const wrongResource = requests.some(file => assets[file] === svg(expectedName === 'a' ? 'blue' : 'red'))
              const pass = actual.color === (expectedName === 'a' ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 255)') && actual.owner === expectedName && actual.width === 7 && !missing.length && !errors.length && (phase === 'lazy-after' || mode.startsWith('combined') || !wrongResource)
              const row = { mode, engine, entry: name, phase, expectedName, actual, wrongResource, missing, errors, result: pass ? 'PASS' : 'FAIL' };rows.push(row);console.log(JSON.stringify({ observation: row }))
            }
            await check('initial', mode === 'combined-ab' ? 'b' : name)
            if (mode === 'lazy') { await page.evaluate(() => globalThis.loadLazy());await check('lazy-after', 'b') }
          } finally { await page.close() }
        }
      } finally { await browser.close() }
    }
  } finally {
    await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
    rmSync(root, { recursive: true, force: true })
  }
}
console.log(JSON.stringify({ summary: { pure, observations: rows.length, failures: rows.filter(row => row.result === 'FAIL').length } }));if (rows.some(row => row.result === 'FAIL')) process.exitCode = 1

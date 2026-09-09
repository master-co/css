import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { MasterCSSScanner } from '../../../../packages/tooling/src/scanner/node.ts'
import { createStylesheetCollection } from '../../../../packages/compiler/src/stylesheet/index-public.ts'

const browsers = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))('@playwright/test')
const baseManifest = JSON.parse(readFileSync(new URL('../../../../packages/preset/src/default-manifest.json', import.meta.url), 'utf8'))
const cwd = mkdtempSync(join(tmpdir(), 'master-css-output-modes-'))
const packageRoot = join(cwd, 'node_modules/@master/css')
mkdirSync(packageRoot, { recursive: true })
writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ name: '@master/css', style: './index.css' }))
writeFileSync(join(packageRoot, 'index.css'), "@import './base.css' layer(master);@import 'https://remote.test/base.css';@utilities{package-custom{color:orange}}.base{color:blue}")
writeFileSync(join(packageRoot, 'base.css'), '.base-child{background-color:yellow}')
const source = "@import '@master/css';@import './child.css' supports(display:grid) screen;@import './dead.css' layer(later);@import 'https://remote.test/project.css';@master entry;@utilities{custom{color:purple}layer-probe{color:purple}}.project{color:red}.composed{@compose block;}"
writeFileSync(join(cwd, 'entry.css'), source)
writeFileSync(join(cwd, 'child.css'), '.nested{background-color:green}')
writeFileSync(join(cwd, 'dead.css'), '.dead{color:red}')
const classes = ['project', 'nested', 'composed', 'base', 'base-child', 'external', 'base-external', 'block', 'custom', 'package-custom', 'layer-probe']
const markup = classes.map(name => `<span class="${name}">${name}</span>`).join('')
writeFileSync(join(cwd, 'index.html'), markup)
const scanner = new MasterCSSScanner({ manifest: baseManifest, verbose: 0 }, cwd)
const collection = createStylesheetCollection()
const delivery = {
  entryURL: './output.css', relativeResourceURLs: true,
  stylesheetURL: (file, variant) => `./${createHash('sha256').update(variant ?? file).digest('hex')}.css`,
  resourceURL: () => { throw new Error('No resource callback is expected for this CSS-only corpus') }
}
let failures = 0
const records = []
try {
  await scanner.init()
  await collection.register(scanner, join(cwd, 'entry.css'), source, { baseManifest, projectDir: cwd, delivery })
  await scanner.scan(join(cwd, 'index.html'), markup)
  const cases = []
  for (const preserve of [false, true]) for (const native of [false, true]) for (const base of [false, true]) for (const generated of [false, true]) {
    const id = `preserve-${preserve}-native-${native}-base-${base}-generated-${generated}`
    const result = await collection.compose({ scanner, baseManifest, projectDir: cwd, delivery, includeNativeCSS: native, includeMasterBaseCSS: base, includeGeneratedCSS: generated, preserveNativeCSS: preserve })
    const output = join(cwd, id)
    mkdirSync(output)
    writeFileSync(join(output, 'output.css'), result.css)
    for (const asset of result.stylesheets) writeFileSync(join(output, asset.href), asset.css)
    const reference = [
      native && preserve ? "@import 'https://remote.test/project.css';" : '',
      base && preserve ? "@import 'https://remote.test/base.css';" : '',
      native && preserve ? '@layer later;.project{color:red}@supports(display:grid){@media screen{.nested{background-color:green}}}' : '',
      native ? '.composed{display:block}' : '',
      base && preserve ? '.base{color:blue}.base-child{background-color:yellow}' : '',
      generated ? '@layer utilities{.block{display:block}.custom{color:purple}.package-custom{color:orange}.layer-probe{color:purple}}' : ''
    ].join('\n')
    cases.push({ id, preserve, native, base, generated, output, reference })
  }
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch()
    try {
      for (const item of cases) for (const media of ['screen', 'print']) {
        const observations = {}
        for (const version of ['reference', 'compiled']) {
          const page = await browser.newPage()
          const external = []
          try {
            await page.emulateMedia({ media })
            await page.route('**/*', route => {
              const url = new URL(route.request().url())
              if (url.hostname === 'remote.test') {
                external.push(url.pathname)
                return route.fulfill({ contentType: 'text/css', body: url.pathname === '/base.css' ? '.base-external{opacity:0.5}' : '.external{opacity:0.25}' })
              }
              if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><link rel="stylesheet" href="/output.css"><style>@layer later{.layer-probe{color:blue}}</style>${markup}` })
              if (version === 'reference') {
                assert.equal(url.pathname, '/output.css')
                return route.fulfill({ contentType: 'text/css', body: item.reference })
              }
              return route.fulfill({ contentType: 'text/css', body: readFileSync(join(item.output, url.pathname)) })
            })
            await page.goto('http://output-modes.test/', { waitUntil: 'load' })
            observations[version] = {
              styles: await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('span')].map(el => {
                const css = getComputedStyle(el)
                return [el.className, { color: css.color, background: css.backgroundColor, display: css.display, opacity: css.opacity }]
              }))),
              external: [...new Set(external)].sort(), externalRequests: external
            }
          } finally { await page.close() }
        }
        const expectedExternal = [...(item.base && item.preserve ? ['/base.css'] : []), ...(item.native && item.preserve ? ['/project.css'] : [])].sort()
        assert.deepEqual(observations.reference.external, expectedExternal)
        assert.equal(observations.reference.styles.project.color, item.native && item.preserve ? 'rgb(255, 0, 0)' : 'rgb(0, 0, 0)')
        assert.equal(observations.reference.styles.nested.background, item.native && item.preserve && media === 'screen' ? 'rgb(0, 128, 0)' : 'rgba(0, 0, 0, 0)')
        assert.equal(observations.reference.styles.base.color, item.base && item.preserve ? 'rgb(0, 0, 255)' : 'rgb(0, 0, 0)')
        assert.equal(observations.reference.styles.custom.color, item.generated ? 'rgb(128, 0, 128)' : 'rgb(0, 0, 0)')
        assert.equal(observations.reference.styles['layer-probe'].color, item.native && item.preserve && item.generated ? 'rgb(128, 0, 128)' : 'rgb(0, 0, 255)')
        const comparable = value => ({ styles: value.styles, external: value.external })
        const pass = JSON.stringify(comparable(observations.compiled)) === JSON.stringify(comparable(observations.reference))
        if (!pass) failures++
        const record = { browser: name, id: item.id, media, ...observations, result: pass ? 'PASS' : 'FAIL' }
        records.push(record)
        console.log(JSON.stringify(record))
      }
    } finally { await browser.close() }
  }
} finally { await scanner.dispose(); collection.dispose(); rmSync(cwd, { recursive: true, force: true }) }
console.log(JSON.stringify({ modes: 16, comparisons: records.length, failures, scope: 'Public collection native/base/generated output selection; actual stylesheet files and external requests' }))
assert.equal(failures, 0)

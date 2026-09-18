import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

const require = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))
const webpack = require('webpack')
const Plugin = (await import(process.env.MASTER_WEBPACK_PLUGIN
  ? pathToFileURL(resolve(process.env.MASTER_WEBPACK_PLUGIN)).href
  : new URL('../../../../packages/webpack/dist/index.js', import.meta.url).href)).default
const mutation = process.env.BH_RESOURCE_MUTATION ?? 'write'
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-resource-snapshot-')))
const resource = join(root, 'pixel.svg')
const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7"><rect width="7" height="7" fill="${color}"/></svg>`
const digest = contents => createHash('sha256').update(contents).digest('hex').slice(0, 20)
writeFileSync(join(root, 'entry.js'), 'import "./entry.css";')
writeFileSync(join(root, 'entry.css'), '@master entry;@preserve native;.card{background-image:url("./pixel.svg?q=1#mark")}')
writeFileSync(resource, svg('red'))
const compiler = webpack({ mode: 'production', context: root, entry: './entry.js', resolve: { tsconfig: false },
  experiments: { css: true }, output: { path: join(root, 'out'), clean: true, filename: '[name].[contenthash:8].js', cssFilename: 'css/[name].[contenthash:8].css' },
  plugins: [new Plugin({ mode: 'static', runtime: false }, root)] })
let armed = mutation !== 'none', triggered = false
compiler.hooks.thisCompilation.tap('AuditResourceInterleaving', compilation => {
  const emitAsset = compilation.emitAsset.bind(compilation)
  compilation.emitAsset = (name, source, info) => {
    if (armed && name.includes('master-css-') && name.endsWith('.css')) {
      armed = false;triggered = true
      if (mutation === 'delete') rmSync(resource)
      else writeFileSync(resource, svg('blue'))
      console.log(JSON.stringify({ mutation, boundary: 'first managed stylesheet emit after composition', stylesheet: name }))
    }
    return emitAsset(name, source, info)
  }
})
const observations = []
async function build(phase, expected) {
  const stats = await new Promise((resolve, reject) => compiler.run((error, stats) => error || !stats ? reject(error ?? new Error('No stats')) : resolve(stats)))
  const errors = stats.toJson({ all: false, errors: true }).errors?.map(error => error.message) ?? []
  const assets = !stats.hasErrors() ? Object.fromEntries(stats.compilation.getAssets().map(asset => [asset.name, readFileSync(join(root, 'out', asset.name), 'utf8')])) : {}
  const resources = Object.entries(assets).filter(([name]) => name.endsWith('.svg')).map(([name, contents]) => ({
    name, digest: digest(contents), hashMatchesBytes: name.includes(digest(contents)), contents,
    expectedSnapshot: contents === svg(expected)
  }))
  const css = Object.entries(assets).filter(([name]) => name.endsWith('.css')).map(([, content]) => content).join('\n')
  const observation = { phase, errors, resources, queryPreserved: css.includes('?q=1#mark'),
    result: !errors.length && resources.length === 1 && resources.every(row => row.hashMatchesBytes && row.expectedSnapshot) && css.includes('?q=1#mark') ? 'PASS' : 'FAIL' }
  observations.push(observation);console.log(JSON.stringify({ observation }))
}
try {
  await build('interleaved-publication', 'red')
  if (mutation === 'delete') writeFileSync(resource, svg('blue'))
  await build('next-build-fresh-snapshot', mutation === 'none' ? 'red' : 'blue')
  const summary = { mutation, triggered, observations: observations.length,
    failures: observations.filter(row => row.result === 'FAIL').length + Number(triggered !== (mutation !== 'none')),
    scope: 'Actual Webpack builds; owned emitAsset hook changes the owned resource after graph composition but before resource publication. No installed dependency, source or shared artifact mutation.' }
  console.log(JSON.stringify({ summary }));if (summary.failures) process.exitCode = 1
} finally {
  await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
  rmSync(root, { recursive: true, force: true })
}

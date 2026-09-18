import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'

const cwd = resolve('examples/integration-lab')
const require = createRequire(join(cwd, 'package.json'))
const { default: MasterCSSPlugin } = await import(require.resolve('@master/css-webpack'))

/** Follows the `@import` chain the graph delivery emits and returns every reachable file's CSS. */
function flatten(file, seen = new Set()) {
  if (seen.has(file) || !existsSync(file)) return ''
  seen.add(file)
  const css = readFileSync(file, 'utf8')
  let out = css
  for (const [, href] of css.matchAll(/@import\s+["']([^"']+)["']/g)) {
    out += '\n' + flatten(join(dirname(file), href), seen)
  }
  return out
}

async function run(kind, preserve = false) {
  const root = mkdtempSync(join(cwd, `tmp/bh-0029-${kind}-`))
  const plugin = new MasterCSSPlugin({ mode: 'static' }, root)
  let compiler
  try {
    writeFileSync(join(root, 'package.json'), '{"type":"module"}')
    writeFileSync(join(root, 'entry.js'), 'import "./app.css"; document.body.className = "block"')
    writeFileSync(join(root, 'app.css'), `@import "@master/css";${preserve ? '@preserve native;' : ''} .control {color:red}`)
    const config = { context: root, mode: 'production', entry: './entry.js', output: { path: join(root, 'dist') } }
    if (kind === 'rspack') {
      const { rspack } = require('@rspack/core')
      compiler = rspack({ ...config, module: { rules: [{ test: /\.css$/, use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'] }] }, plugins: [new rspack.CssExtractRspackPlugin(), plugin] })
    } else {
      const webpack = createRequire(resolve('packages/webpack/package.json'))('webpack')
      const MiniCssExtractPlugin = createRequire(resolve('node_modules/.pnpm/mini-css-extract-plugin@2.10.2_webpack@5.107.2/node_modules/mini-css-extract-plugin/package.json'))('mini-css-extract-plugin')
      compiler = webpack({ ...config, module: { rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }] }, plugins: [new MiniCssExtractPlugin(), plugin] })
    }
    const stats = await new Promise((done, reject) => compiler.run((error, stats) => error ? reject(error) : done(stats)))
    const errors = stats.hasErrors() ? stats.toString({ all: false, errors: true }) : ''
    const main = join(root, 'dist/main.css')
    const direct = existsSync(main) ? readFileSync(main, 'utf8') : ''
    const reachable = flatten(main)
    return { kind, preserve, errors, mainInlinesBlock: direct.includes('.block{display:block}'), reachableHasBlock: reachable.includes('.block{display:block}'), reachableHasAuthored: reachable.includes('.control'), mainBytes: direct.length, reachableBytes: reachable.length }
  } finally {
    if (compiler) await new Promise(done => compiler.close(done))
    rmSync(root, { recursive: true, force: true })
  }
}

const rows = []
for (const kind of ['webpack', 'rspack']) {
  for (const preserve of [false, true]) {
    try { rows.push(await run(kind, preserve)) } catch (error) { rows.push({ kind, preserve, error: String(error).slice(0, 300) }) }
  }
}
console.log(JSON.stringify(rows, null, 2))

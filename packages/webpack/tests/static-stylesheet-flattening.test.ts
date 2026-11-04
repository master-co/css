import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, posix, sep } from 'node:path'
import webpack from 'webpack'
import Plugin from '../dist/index.js'

async function build(files: Record<string, string>) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-flattening-test-')))
  for (const [file, source] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), source)
  }
  const compiler = webpack({
    mode: 'production', context: root, entry: './entry.js',
    resolve: { tsconfig: false }, experiments: { css: true },
    output: { path: join(root, 'out'), clean: true, publicPath: './', filename: 'js/[name].[contenthash:12].js', cssFilename: 'css/[name].[contenthash:12].css' },
    plugins: [new Plugin({ mode: 'static', runtime: false }, root)]
  })
  try {
    const stats = await new Promise<webpack.Stats>((resolve, reject) => compiler.run((error, stats) => {
      if (error || !stats || stats.hasErrors()) reject(error || new Error(stats?.toString({ all: false, errors: true })))
      else resolve(stats)
    }))
    const entry = stats.compilation.entrypoints.get('main')!.getFiles().find(file => file.endsWith('.css'))!
    const files = readdirSync(join(root, 'out'), { recursive: true })
      .filter((file): file is string => typeof file === 'string' && /\.(css|svg)$/.test(file))
      .map(file => file.split(sep).join('/'))
    return { entry, files, contents: new Map(files.map(file => [file, readFileSync(join(root, 'out', file), 'utf8')])) }
  } finally {
    await new Promise<void>((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
    rmSync(root, { recursive: true, force: true })
  }
}

function expectOrdered(css: string, markers: string[]) {
  const positions = markers.map(marker => css.indexOf(marker))
  expect(markers.filter((_, index) => positions[index] < 0), css).toEqual([])
  expect(positions).toEqual([...positions].sort((a, b) => a - b))
}

const script = (imports: string[]) => `${imports.map(file => `import "./${file}";`).join('')}document.body.className = "after (display:block)"`

test('static production builds flatten nested, layered, conditional and empty imports into the host CSS asset', async () => {
  const { entry, files, contents } = await build({
    'entry.js': script(['plain.css', 'entry.css', 'tail.css']),
    'plain.css': '.plain{color:purple}',
    'tail.css': '.tail{color:orange}',
    'entry.css': '@layer reset, app;@import "@master/css";@import "./styles/base.css" layer(reset);@import "./styles/print.css" print;@import "./styles/grid.css" supports(display:grid);@import "./styles/empty.css";.after{color:green}',
    'styles/base.css': '@import "./nested.css";.base{background-image:url("../image.svg")}',
    'styles/nested.css': '.nested{color:blue}',
    'styles/print.css': '.print{color:black}',
    'styles/grid.css': '.grid{display:grid}',
    'styles/empty.css': '',
    'image.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>'
  })
  expect(files.filter(file => file.endsWith('.css'))).toEqual([entry])
  const css = contents.get(entry)!
  expect(css).not.toContain('@import')
  const resource = files.find(file => file.endsWith('.svg'))!
  expect(resource).toMatch(/^css\/master-css-resource-[0-9a-f]{20}\.svg$/)
  // Host chunk rules, layer statements, qualifier wrappers and generated rules keep their cascade positions.
  expectOrdered(css, ['.plain', '@layer reset,app;', '@layer base', '@layer reset{', '.nested', '.base', `url(./${posix.basename(resource)})`, '@media print{', '.print', '@supports (display:grid){', '.grid', '.after', '.\\(display\\:block\\)', '.tail'])
}, 120000)

test('static production builds publish only nonempty stylesheets that retained boundaries import', async () => {
  const { entry, files, contents } = await build({
    'entry.js': script(['entry.css']),
    'entry.css': '@import "@master/css";@import "./remote.css";.after{color:green}',
    // An external import cannot follow inlined rules, so this child keeps its boundary.
    'remote.css': '@import "https://remote.test/font.css";.remote{color:red}'
  })
  const visited = new Set<string>()
  const expand = (file: string): string => {
    visited.add(file)
    const css = contents.get(file)!
    expect(css.trim(), file).not.toBe('')
    return css.replace(/@import "\.\/(master-css-[^"]+)";/g, (_, href: string) => expand(posix.join(posix.dirname(file), href)))
  }
  const css = expand(entry)
  expect([...visited].sort()).toEqual(files.filter(file => file.endsWith('.css')).sort())
  expectOrdered(css, ['@layer base', '@import "https://remote.test/font.css";', '.remote', '.after', '.\\(display\\:block\\)'])
}, 120000)

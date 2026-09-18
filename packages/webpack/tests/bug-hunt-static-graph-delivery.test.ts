import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import webpack from 'webpack'
import Plugin from '../dist/index.js'

async function build(root: string) {
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
    const css = stats.compilation.entrypoints.get('main')!.getFiles().find(file => file.endsWith('.css'))!
    const files = readdirSync(join(root, 'out'), { recursive: true }).filter((file): file is string => typeof file === 'string' && /\.(css|svg)$/.test(file))
    return { css, files, contents: Object.fromEntries(files.map(file => [file, readFileSync(join(root, 'out', file), 'utf8')])), dependencies: [...stats.compilation.fileDependencies] }
  } finally {
    await new Promise<void>((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
  }
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-graph-test-')))
  writeFileSync(join(root, 'entry.js'), 'import "./entry.css"; console.log("card")')
  return root
}

test.each(['', ' layer(cards)', ' supports(display:grid) print'])('publishes external child imports with their boundaries: %s', async qualifier => {
  const root = fixture()
  try {
    writeFileSync(join(root, 'entry.css'), `@import "./child.css"${qualifier};@master entry;@preserve native;.root{display:block}`)
    writeFileSync(join(root, 'child.css'), '@import "https://external.invalid/font.css";.card{color:red}')
    const result = await build(root)
    expect(result.contents[result.css]).toMatch(/^@import /)
    expect(result.files.filter(file => file.endsWith('.css')).length).toBeGreaterThan(2)
    expect(Object.values(result.contents).join('\n')).toContain('https://external.invalid/font.css')
    expect(Object.values(result.contents).join('\n')).toContain('.card{color:red}')
    expect(result.dependencies).toContain(join(root, 'child.css'))
    for (const [file, source] of Object.entries(result.contents)) {
      for (const [, href] of source.matchAll(/@import\s+["'](\.\/master-css-[^"']+)["']/g)) {
        expect(result.files).toContain(join('css', href))
      }
      expect(file).toMatch(/^css\//)
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 120000)

test('nested CSS and resource edits change the real entry content hash and preserve resource payloads', async () => {
  const root = fixture()
  try {
    mkdirSync(join(root, 'images'))
    const resource = join(root, 'images/pixel.svg')
    writeFileSync(join(root, 'entry.css'), '@master entry;@preserve native;@import "./child.css" layer(cards);')
    writeFileSync(join(root, 'child.css'), '@import "https://external.invalid/font.css";.card{color:red;background-image:url("./images/pixel.svg?q=1#mark")}')
    const svg = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="${color}"/></svg>`
    writeFileSync(resource, svg('red'))
    const first = await build(root), repeated = await build(root)
    expect(repeated.css).toBe(first.css)
    expect(repeated.contents).toEqual(first.contents)
    expect(first.dependencies).toContain(resource)
    expect(Object.values(first.contents).join('\n')).toContain('?q=1#mark')
    const firstResource = first.files.find(file => file.endsWith('.svg'))!
    expect(first.contents[firstResource]).toBe(svg('red'))
    writeFileSync(join(root, 'child.css'), readFileSync(join(root, 'child.css'), 'utf8').replace('color:red', 'color:green'))
    const cssEdit = await build(root)
    expect(cssEdit.css).not.toBe(first.css)
    writeFileSync(resource, svg('blue'))
    const resourceEdit = await build(root)
    expect(resourceEdit.css).not.toBe(cssEdit.css)
    const nextResource = resourceEdit.files.find(file => file.endsWith('.svg'))!
    expect(nextResource).not.toBe(firstResource)
    expect(resourceEdit.contents[nextResource]).toBe(svg('blue'))
    expect(resourceEdit.files).not.toContain(firstResource)
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 120000)

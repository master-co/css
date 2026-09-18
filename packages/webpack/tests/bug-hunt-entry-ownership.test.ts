import { expect, test } from 'vitest'
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, posix } from 'node:path'
import webpack from 'webpack'
import Plugin from '../dist/index.js'

for (const lazy of [false, true]) test(`native CSS and resources remain owned by their entry: lazy=${lazy}`, async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-owner-test-')))
  for (const name of ['a', 'b']) {
    writeFileSync(join(root, `${name}.js`), `import './${name}.css';${lazy && name === 'a' ? 'globalThis.loadLazy=()=>import("./b.js")' : ''}`)
    writeFileSync(join(root, `${name}.css`), `@master entry;@preserve native;.card{--owner:${name};background-image:url("./${name}.svg")}`)
    writeFileSync(join(root, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" id="${name}"/>`)
  }
  const compiler = webpack({ mode: 'production', context: root, entry: lazy ? { a: './a.js' } : { a: './a.js', b: './b.js' }, resolve: { tsconfig: false }, experiments: { css: true },
    output: { path: join(root, 'out'), publicPath: '/assets/', filename: 'js/[name].[contenthash:8].js', cssFilename: 'css/[name].[contenthash:8].css', cssChunkFilename: 'css/[name].[contenthash:8].css' },
    plugins: [new Plugin({ mode: 'static', runtime: false }, root)] })
  try {
    const stats = await new Promise<webpack.Stats>((resolve, reject) => compiler.run((error, stats) => error || !stats || stats.hasErrors() ? reject(error ?? new Error(stats?.toString({ all: false, errors: true }))) : resolve(stats)))
    const contents = Object.fromEntries(stats.compilation.getAssets().map(asset => [asset.name, readFileSync(join(root, 'out', asset.name), 'utf8')]))
    const closure = (file: string, seen = new Set<string>()): string => {
      if (seen.has(file)) return ''
      seen.add(file)
      const source = contents[file]
      expect(source).toBeDefined()
      const imports = [...source.matchAll(/@import\s+"([^"]+)"/g)].map(([, href]) => posix.join(posix.dirname(file), href))
      return [source, ...imports.map(next => closure(next, seen))].join('\n')
    }
    const first = stats.compilation.entrypoints.get('a')!.getFiles().find(file => file.endsWith('.css'))!
    const second = lazy
      ? [...stats.compilation.chunks].filter(chunk => !chunk.canBeInitial()).flatMap(chunk => [...chunk.files]).find(file => file.endsWith('.css'))!
      : stats.compilation.entrypoints.get('b')!.getFiles().find(file => file.endsWith('.css'))!
    expect(first).toBeTruthy();expect(second).toBeTruthy()
    for (const [name, file] of [['a', first], ['b', second]]) {
      const source = closure(file)
      expect(source).toContain(`--owner:${name}`)
      expect(source).not.toContain(`--owner:${name === 'a' ? 'b' : 'a'}`)
      const urls = [...source.matchAll(/url\(["']?([^"'()#?]+)["']?\)/g)].map(([, url]) => url)
      expect(urls.length).toBeGreaterThan(0)
      for (const url of urls) {
        const resource = Object.entries(contents).find(([path]) => path.endsWith(url.replace(/^\.\//, '')))
        expect(resource?.[1]).toContain(`id="${name}"`)
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
    rmSync(root, { recursive: true, force: true })
  }
}, 120000)

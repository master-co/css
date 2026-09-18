import { expect, test } from 'vitest'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import webpack from 'webpack'
import Plugin from '../dist/index.js'

test.each(['write', 'delete', 'none'])('resource names and bytes share one snapshot across entries: %s', async mutation => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-resource-test-')))
  const resource = join(root, 'shared.svg')
  const svg = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg" id="${color}"/>`
  const digest = (contents: string) => createHash('sha256').update(contents).digest('hex').slice(0, 20)
  for (const name of ['a', 'b']) {
    writeFileSync(join(root, `${name}.js`), `import './${name}.css'`)
    writeFileSync(join(root, `${name}.css`), `@master entry;@preserve native;.${name}{background-image:url("./shared.svg?q=1#mark")}`)
  }
  writeFileSync(resource, svg('red'))
  const compiler = webpack({ mode: 'production', context: root, entry: { a: './a.js', b: './b.js' }, cache: { type: 'memory' },
    resolve: { tsconfig: false }, experiments: { css: true },
    output: { path: join(root, 'out'), clean: true, filename: '[name]/index.[contenthash:8].js', cssFilename: '[name]/index.[contenthash:8].css' },
    plugins: [new Plugin({ mode: 'static', runtime: false }, root)] })
  let armed = mutation !== 'none', triggered = false
  compiler.hooks.thisCompilation.tap('TestResourceSnapshot', compilation => {
    const emitAsset = compilation.emitAsset.bind(compilation)
    compilation.emitAsset = (name, source, info) => {
      if (armed && name.includes('master-css-') && name.endsWith('.css')) {
        armed = false;triggered = true
        if (mutation === 'delete') rmSync(resource)
        else writeFileSync(resource, svg('blue'))
      }
      return emitAsset(name, source, info)
    }
  })
  const build = async (color: string) => {
    const stats = await new Promise<webpack.Stats>((resolve, reject) => compiler.run((error, stats) =>
      error || !stats || stats.hasErrors() ? reject(error ?? new Error(stats?.toString({ all: false, errors: true }))) : resolve(stats)))
    const assets = stats.compilation.getAssets()
    const resources = assets.filter(asset => asset.name.endsWith('.svg'))
    expect(resources).toHaveLength(2)
    for (const asset of resources) {
      const contents = readFileSync(join(root, 'out', asset.name), 'utf8')
      expect(contents).toBe(svg(color))
      expect(asset.name).toContain(digest(contents))
      expect(asset.info.immutable).toBe(true)
    }
    for (const name of ['a', 'b']) {
      const css = assets.filter(asset => asset.name.startsWith(`${name}/`) && asset.name.endsWith('.css'))
        .map(asset => readFileSync(join(root, 'out', asset.name), 'utf8')).join('\n')
      expect(css).toContain(`master-css-resource-${digest(svg(color))}.svg?q=1#mark`)
    }
    return {
      resources: resources.map(asset => asset.name),
      entryCSS: ['a', 'b'].map(name => stats.compilation.entrypoints.get(name)!.getFiles().find(file => file.endsWith('.css')))
    }
  }
  try {
    const initial = await build('red')
    expect(triggered).toBe(mutation !== 'none')
    if (mutation === 'delete') await expect(build('red')).rejects.toThrow('shared.svg')
    writeFileSync(resource, svg('blue'))
    const updated = await build('blue')
    expect(updated.resources).not.toEqual(initial.resources)
    for (const [index, file] of initial.entryCSS.entries()) {
      expect(file).toBeTruthy()
      expect(updated.entryCSS[index]).not.toBe(file)
    }
    for (const file of initial.resources) expect(existsSync(join(root, 'out', file))).toBe(false)
  } finally {
    await new Promise<void>((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
    rmSync(root, { recursive: true, force: true })
  }
}, 120000)

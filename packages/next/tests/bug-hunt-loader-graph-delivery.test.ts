import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire, SourceMap } from 'node:module'
import { expect, test } from 'vitest'
import loader from '../src/stylesheet-loader'

function transform(root: string, file: string, source: string, dependencies: string[], options = {}) {
  return new Promise<{ code: string, map?: object }>((resolve, reject) => loader.call({
    resourcePath: file, rootContext: root, getOptions: () => options, addDependency: file => dependencies.push(file),
    async: () => (error, code, map) => error ? reject(error) : resolve({ code: code!, map })
  }, source))
}
function graph(file: string, code: string, output = new Map<string, string>()) {
  if (output.has(file)) return output
  output.set(file, code)
  for (const [, href] of code.matchAll(/@import\s+["']([^"']+)["']/g)) if (href.startsWith('.') || href.startsWith('file:')) {
    const child = fileURLToPath(new URL(href, pathToFileURL(file)))
    graph(child, readFileSync(child, 'utf8'), output)
  }
  return output
}
for (const kind of ['nested-resource', 'external-import'] as const) test(`general Next loader publishes retained ${kind} graph`, async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-loader-graph-'))
  try {
    const file = join(root, 'app/globals.css'), child = join(root, 'app/nested/child.css'), image = join(root, 'app/nested/pixel space.svg')
    mkdirSync(dirname(child), { recursive: true })
    const childSource = '/* original child */\n.probe { background-image:url("./pixel%20space.svg?audit=1#pixel"); }'
    const red = '<svg xmlns="http://www.w3.org/2000/svg" id="red"/>'
    writeFileSync(image, red);writeFileSync(child, childSource)
    const source = '@master entry;@preserve native;\n' + (kind === 'nested-resource'
      ? '@import "./nested/child.css" layer(card) supports(display:grid) screen;'
      : '@import "https://example.invalid/remote.css" layer(remote) screen;.probe{color:red}')
    writeFileSync(file, source)
    const dependencies: string[] = [], result = await transform(root, file, source, dependencies)
    const sheets = graph(file, result.code), full = [...sheets.values()].join('\n')
    expect(result.map).toBeDefined()
    if (kind === 'external-import') {
      expect(full).toMatch(/@import[^;]*https:\/\/example.invalid\/remote.css[^;]*layer\(remote\)[^;]*screen/)
    } else {
      expect(full).toMatch(/@import[^;]*layer\(card\)[^;]*supports\(display:\s*grid\)[^;]*screen/)
      expect(dependencies).toContain(child);expect(dependencies).toContain(image)
      const resources = [...sheets].flatMap(([owner, css]) => [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(([, href]) => ({ href, file: fileURLToPath(new URL(href, pathToFileURL(owner))) })))
      expect(resources.length).toBeGreaterThan(0)
      for (const resource of resources) { expect(resource.href).toContain('?audit=1#pixel');expect(readFileSync(resource.file, 'utf8')).toBe(red) }
      const owned = [...sheets].find(([owner, css]) => owner !== file && css.includes('.probe'))!
      expect(owned).toBeDefined()
      const encodedMap = owned[1].match(/sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/)?.[1]
      expect(encodedMap).toBeDefined()
      const map = JSON.parse(Buffer.from(encodedMap!, 'base64').toString())
      const position = owned[1].slice(0, owned[1].indexOf('.probe')).split('\n')
      expect(new SourceMap(map).findEntry(position.length - 1, position.at(-1)!.length)).toMatchObject({ originalSource: pathToFileURL(child).href, originalLine: 1 })
      expect(map.sourcesContent).toContain(childSource)
      rmSync(image)
      await expect(transform(root, file, source, [])).rejects.toThrow()
      for (const resource of resources) expect(readFileSync(resource.file, 'utf8')).toBe(red)
      writeFileSync(image, red.replace('red', 'blue'))
      const updated = await transform(root, file, source, [])
      expect(updated.code).not.toBe(result.code)
      for (const resource of resources) expect(readFileSync(resource.file, 'utf8')).toBe(red)
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('general Next delivered entry retains original native declaration source maps', async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-loader-entry-map-'))
  try {
    const file = join(root, 'entry.css'), source = '@master entry;@utilities{paint{padding:2rem}}\n.card{@compose paint;}'
    writeFileSync(file, source)
    const result = await transform(root, file, source, []), sheets = graph(file, result.code)
    const owner = [...sheets].find(([, css]) => css.includes('.card'))!
    expect(owner).toBeDefined()
    const encoded = owner[1].match(/sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/)?.[1]
    const map = encoded ? JSON.parse(Buffer.from(encoded, 'base64').toString()) : result.map
    expect(map).toBeDefined()
    const position = owner[1].slice(0, owner[1].indexOf('.card')).split('\n')
    expect(new SourceMap(map).findEntry(position.length - 1, position.at(-1)!.length)).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: 1, originalColumn: 0 })
    expect(map.sourcesContent).toContain(source)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

for (const syntax of ['scss', 'sass']) test(`general Next ${syntax} delivered entry retains imported partial ownership and map`, async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-loader-sass-entry-map-'))
  try {
    const requireVite = createRequire(new URL('../../vite/package.json', import.meta.url))
    const sass = createRequire(requireVite.resolve('vite')).resolve('sass')
    const file = join(root, 'entry.' + syntax), partial = join(root, 'parts/_entry.scss')
    mkdirSync(dirname(partial))
    writeFileSync(partial, '@reference "./tokens.css";.card{@compose paint;}')
    writeFileSync(join(root, 'parts/tokens.css'), '@utilities{paint{padding:2rem}}')
    writeFileSync(join(root, 'tokens.css'), '@utilities{paint{padding:99rem}}')
    const source = syntax === 'sass' ? '@use "parts/entry"\n@master entry\n' : '@use "parts/entry";@master entry;'
    writeFileSync(file, source)
    const dependencies: string[] = [], result = await transform(root, file, source, dependencies, { sassOptions: { implementation: sass } })
    const sheets = graph(file, result.code), css = [...sheets.values()].join('\n')
    expect(css).toContain('padding:2rem');expect(css).not.toContain('padding:99rem')
    expect(dependencies).toContain(partial);expect(dependencies).toContain(join(root, 'parts/tokens.css'))
    const owner = [...sheets].find(([, css]) => css.includes('.card'))!
    expect(owner).toBeDefined()
    const encoded = owner[1].match(/sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/)?.[1]
    const map = encoded ? JSON.parse(Buffer.from(encoded, 'base64').toString()) : result.map
    const position = owner[1].slice(0, owner[1].indexOf('.card')).split('\n')
    expect(new SourceMap(map).findEntry(position.length - 1, position.at(-1)!.length)).toMatchObject({ originalSource: pathToFileURL(partial).href, originalLine: 0 })
  } finally { rmSync(root, { recursive: true, force: true }) }
})

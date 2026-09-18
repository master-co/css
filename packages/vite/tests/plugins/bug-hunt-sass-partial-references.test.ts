import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire, SourceMap } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, preprocessCSS, resolveConfig } from 'vite'
import { expect, test } from 'vitest'
import MagicString from 'magic-string'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

function fixture(syntax: string) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-partial-reference-')))
  mkdirSync(join(root, 'node_modules')); symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
  for (const directory of ['main', 'shared']) mkdirSync(join(root, directory))
  const partial = join(root, `shared/_rules.${syntax}`)
  const source = syntax === 'scss' ? '@reference "./tokens.css";\n.target{@compose paint;}' : '@reference "./tokens.css"\n.target\n  @compose paint\n'
  writeFileSync(partial, source)
  writeFileSync(join(root, 'shared/tokens.css'), '@utilities{paint{padding:7rem;background:url("./pixel.svg?v=partial#icon")}}.never{color:red}')
  writeFileSync(join(root, 'shared/pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" data-owner="partial"/>')
  for (const directory of ['', 'main/']) writeFileSync(join(root, directory, 'tokens.css'), '@utilities{paint{padding:99rem}}')
  const input = syntax === 'scss' ? '@use "../shared/rules";' : '@use "../shared/rules"\n'
  return { root, partial, input, remove: () => rmSync(root, { recursive: true, force: true }) }
}

test.each(['scss', 'sass'])('pure Vite maps a partial reference to its original %s file', async syntax => {
  const f = fixture(syntax)
  try {
    const file = join(f.root, `main/style.${syntax}`)
    const config = await resolveConfig({ root: f.root, configFile: false, logLevel: 'silent', css: { devSourcemap: true, preprocessorOptions: { scss: { sourceMapIncludeSources: true }, sass: { sourceMapIncludeSources: true } }, postcss: { plugins: [] } } }, 'serve')
    const result = await preprocessCSS(f.input, file, config)
    expect(result.code).toContain('@reference "./tokens.css"')
    const raw = typeof result.map === 'string' ? JSON.parse(result.map) : result.map
    const lines = result.code.split('\n'), line = lines.findIndex(value => value.includes('@reference'))
    const origin = new SourceMap(raw as ConstructorParameters<typeof SourceMap>[0]).findEntry(line, lines[line].indexOf('@reference'))
    expect('originalSource' in origin).toBe(true)
    if (!('originalSource' in origin)) throw new Error('Missing original reference map')
    expect(origin.originalSource.startsWith('file:') ? fileURLToPath(origin.originalSource) : origin.originalSource).toBe(f.partial)
    console.log(JSON.stringify({ control: 'pure-vite-partial-reference', syntax, code: result.code, origin }))
  } finally { f.remove() }
})

test.each(['scss', 'sass'])('pure Vite needs the root identity when chaining a partial-only %s map with additionalData', async syntax => {
  const f = fixture(syntax)
  try {
    const file = join(f.root, `main/style.${syntax}`)
    for (const marker of [false, true]) {
      const additionalData = (source: string) => {
        const edited = new MagicString(source).prepend(syntax === 'scss' ? '$unused:1;\n' : '$unused:1\n')
        return { content: edited.toString() + (marker ? '\n/*!root-map-control*/' : ''), map: edited.generateMap({ source: file, file, includeContent: true, hires: true }) }
      }
      const config = await resolveConfig({ root: f.root, configFile: false, logLevel: 'silent', css: { devSourcemap: true, preprocessorOptions: { scss: { sourceMapIncludeSources: true, additionalData }, sass: { sourceMapIncludeSources: true, additionalData } }, postcss: { plugins: [] } } }, 'serve')
      const result = await preprocessCSS(f.input, file, config)
      const raw = typeof result.map === 'string' ? JSON.parse(result.map) : result.map
      const lines = result.code.split('\n'), line = lines.findIndex(value => value.includes('@reference'))
      const origin = new SourceMap(raw as ConstructorParameters<typeof SourceMap>[0]).findEntry(line, lines[line].indexOf('@reference'))
      const original = 'originalSource' in origin ? origin.originalSource : undefined
      const mapped = original?.startsWith('file:') ? fileURLToPath(original) : original
      console.log(JSON.stringify({ control: 'pure-vite-additional-map-chain', syntax, marker, sources: raw?.sources, origin }))
      expect(mapped === f.partial).toBe(marker)
    }
  } finally { f.remove() }
})

for (const addition of ['none', 'string', 'mapped']) for (const syntax of ['scss', 'sass']) test.each(['plain-root', 'module-root', 'retained-module'])('BH-0004 partial ' + syntax + ' reference with ' + addition + ' additionalData retains original owner in %s', async kind => {
  const f = fixture(syntax)
  try {
    const filename = kind === 'plain-root' ? `main/style.${syntax}` : kind === 'module-root' ? `main/style.module.${syntax}` : 'style.module.css'
    if (kind === 'retained-module') writeFileSync(join(f.root, `main/child.${syntax}`), f.input)
    writeFileSync(join(f.root, filename), kind === 'retained-module' ? `@import "./main/child.${syntax}" layer(owner);` : f.input)
    writeFileSync(join(f.root, 'entry.js'), `import "./${filename}";`)
    writeFileSync(join(f.root, 'index.html'), '<div class="target"></div><script type="module" src="./entry.js"></script>')
    const prefix = syntax === 'scss' ? '$unused:1;\n' : '$unused:1\n'
    const additionalData = addition === 'none' ? undefined : addition === 'string' ? prefix : async (source: string, file: string) => {
      const edited = new MagicString(source).prepend(prefix)
      return { content: edited.toString(), map: edited.generateMap({ source: file, file, includeContent: true, hires: true }) }
    }
    const result = await build({ root: f.root, cacheDir: join(f.root, '.vite'), configFile: false, logLevel: 'silent', css: { preprocessorOptions: { scss: { additionalData }, sass: { additionalData } } }, plugins: masterCSS({ mode: 'static', runtime: false }), build: { write: false, minify: false, assetsInlineLimit: 0 } })
    const assets: string[] = []
    for (const output of Array.isArray(result) ? result : [result]) {
      if (!('output' in output)) throw new Error('Unexpected watch output')
      for (const asset of output.output) if (asset.type === 'asset') assets.push(String(asset.source))
    }
    const css = assets.join('\n')
    expect(css).toMatch(/padding:\s*7rem/)
    expect(css).not.toMatch(/99rem|\.never|@reference|@compose|master-css:module-input/)
    expect(css).toContain('?v=partial#icon')
    expect(css).toContain('data-owner="partial"')
  } finally { f.remove() }
})

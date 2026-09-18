import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire, SourceMap } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { MasterCSSError } from '@master/css-schema'
import { build, createServer, preprocessCSS, resolveConfig } from 'vite'
import { expect, test } from 'vitest'
import MagicString from 'magic-string'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))
const cases = ['css', 'scss'].flatMap(rootExtension => ['scss', 'sass'].flatMap(syntax => [false, true].flatMap(partial => ['identity', 'string', 'mapped'].flatMap(addition => ['build', 'serve'].map(command => ({ rootExtension, syntax, partial, addition, command }))))))

test.each(cases)('imported Sass maps original file and token: $rootExtension / $syntax / partial=$partial / $addition / $command', async ({ rootExtension, syntax, partial, addition, command }) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-original-import-map-')))
  try {
    mkdirSync(join(root, 'node_modules')); symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    mkdirSync(join(root, 'nested'))
    const source = syntax === 'scss' ? '// removed\n$unused: 1;\n.bad {\n  @compose unknown-utility;\n}\n' : '// removed\n$unused: 1\n.bad\n  @compose unknown-utility\n'
    const child = join(root, `nested/child.${syntax}`)
    const original = partial ? join(root, `nested/_bad.${syntax}`) : child
    writeFileSync(original, source)
    if (partial) writeFileSync(child, syntax === 'scss' ? '@use "./bad";\n' : '@use "./bad"\n')
    writeFileSync(join(root, `style.module.${rootExtension}`), `@import "./nested/child.${syntax}" layer(guard);`)
    writeFileSync(join(root, 'entry.js'), `import "./style.module.${rootExtension}";`)
    writeFileSync(join(root, 'index.html'), '<div class="bad"></div><script type="module" src="./entry.js"></script>')
    const calls: string[] = []
    const additionalData = addition === 'string' ? '// Added prefix\n' : async (text: string, file: string) => {
      calls.push(file)
      if (addition === 'identity') return text
      const edited = new MagicString(text).prepend('// Added prefix\n')
      return { content: edited.toString(), map: edited.generateMap({ source: file, file, includeContent: true, hires: true }) }
    }
    const css = { devSourcemap: true, preprocessorOptions: { scss: { sourceMapIncludeSources: true, additionalData }, sass: { sourceMapIncludeSources: true, additionalData } } }
    let failure: MasterCSSError | undefined
    let server: Awaited<ReturnType<typeof createServer>> | undefined
    try {
      const config = { root, cacheDir: join(root, '.vite'), configFile: false as const, logLevel: 'silent' as const, css, plugins: masterCSS({ mode: 'static', runtime: false }) }
      if (command === 'build') await build({ ...config, build: { write: false, minify: false } })
      else {
        server = await createServer({ ...config, server: { host: '127.0.0.1', port: 0 } })
        await server.listen()
        await server.ssrLoadModule('/entry.js')
      }
    } catch (error) { failure = (error as MasterCSSError).diagnostics ? error as MasterCSSError : (error as { errors?: MasterCSSError[] }).errors?.[0] }
    finally { await server?.environments.client.waitForRequestsIdle(); await server?.close() }
    expect(failure?.diagnostics[0]?.code).toBe('invalid-compose-class')
    expect(calls.filter(file => file === child)).toHaveLength(addition === 'string' ? 0 : 1)
    const diagnostic = failure!.diagnostics[0]
    console.log(JSON.stringify({ rootExtension, syntax, partial, addition, command, diagnostic, additionalDataCalls: calls }))
    expect(diagnostic.source).toBe(original)
    expect(diagnostic.range).toEqual({ start: { line: 3, character: 11 }, end: { line: 3, character: 26 } })
    expect(diagnostic.notes).toBeUndefined()
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test.each(['scss', 'sass'])('pure Vite direct preprocessing exposes original imported-partial maps: %s', async syntax => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-vite-map-control-')))
  try {
    mkdirSync(join(root, 'node_modules')); symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const original = join(root, `_bad.${syntax}`), child = join(root, `child.${syntax}`)
    const source = syntax === 'scss' ? '// removed\n.bad {\n  @compose unknown-utility;\n}\n' : '// removed\n.bad\n  @compose unknown-utility\n'
    const input = syntax === 'scss' ? '@use "./bad";' : '@use "./bad"'
    writeFileSync(original, source); writeFileSync(child, input)
    const config = await resolveConfig({ root, configFile: false, logLevel: 'silent', css: { devSourcemap: true, preprocessorOptions: { scss: { sourceMapIncludeSources: true }, sass: { sourceMapIncludeSources: true } }, postcss: { plugins: [] } } }, 'serve')
    const result = await preprocessCSS(input, child, config)
    const raw = typeof result.map === 'string' ? JSON.parse(result.map) : result.map
    const line = result.code.split('\n').findIndex(text => text.includes('@compose'))
    const column = result.code.split('\n')[line].indexOf('@compose')
    const origin = new SourceMap(raw as ConstructorParameters<typeof SourceMap>[0]).findEntry(line, column)
    expect('originalSource' in origin).toBe(true)
    if (!('originalSource' in origin)) throw new Error('Missing original map source')
    expect(origin.originalSource.startsWith('file:') ? fileURLToPath(origin.originalSource) : origin.originalSource).toBe(original)
    expect(origin.originalLine).toBe(2)
    expect(origin.originalColumn).toBe(2)
    console.log(JSON.stringify({ control: 'pure-vite-preprocessCSS', syntax, origin, sources: raw?.sources, pass: true }))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

for (const syntax of ['scss', 'sass']) for (const kind of ['interpolated', 'unmapped']) test(`imported ${syntax} keeps honest ${kind} diagnostic precision`, async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-import-map-precision-')))
  try {
    mkdirSync(join(root, 'node_modules')); symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const child = join(root, `child.${syntax}`)
    const value = kind === 'interpolated' ? '#{$name}' : 'unknown-utility'
    const source = syntax === 'scss' ? `$name: unknown-utility;\n.bad {\n  @compose ${value};\n}\n` : `$name: unknown-utility\n.bad\n  @compose ${value}\n`
    writeFileSync(child, source)
    writeFileSync(join(root, 'style.module.css'), `@import "./child.${syntax}" layer(guard);`)
    writeFileSync(join(root, 'entry.js'), 'import "./style.module.css";')
    writeFileSync(join(root, 'index.html'), '<script type="module" src="./entry.js"></script>')
    let calls = 0
    const additionalData = (text: string) => { calls++; return kind === 'unmapped' ? '// Added without a map\n' + text : text }
    let failure: MasterCSSError | undefined
    try {
      await build({ root, cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', css: { preprocessorOptions: { scss: { additionalData }, sass: { additionalData } } }, plugins: masterCSS({ mode: 'static', runtime: false }), build: { write: false } })
    } catch (error) { failure = (error as { errors?: MasterCSSError[] }).errors?.[0] }
    expect(calls).toBe(1)
    const diagnostic = failure!.diagnostics[0]
    expect(diagnostic.code).toBe('invalid-compose-class')
    if (kind === 'interpolated') {
      expect(diagnostic.source).toBe(child)
      expect(diagnostic.range).toEqual({ start: { line: 2, character: 2 }, end: { line: 2, character: 2 } })
      expect(diagnostic.notes).toContain('The source map identifies the originating segment; an exact original token range is unavailable.')
    } else {
      expect(diagnostic.source).toBe(child + '.master-css-sass.css')
      expect(diagnostic.notes).toContain('Original Sass location is unavailable; this range refers to preprocessed CSS.')
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})

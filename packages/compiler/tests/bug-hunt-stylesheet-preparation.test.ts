import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import * as stylesheets from '../src/stylesheet/index-public'

const viteRequire = createRequire(new URL('../../vite/package.json', import.meta.url))
const sassRequire = createRequire(viteRequire.resolve('vite'))
const sass = sassRequire('sass')

async function fixture(run: (root: string) => Promise<void>) {
  const root = mkdtempSync(join(tmpdir(), 'compiler-preparation-'))
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(dirname(sassRequire.resolve('sass')), join(root, 'node_modules/sass'), 'dir')
    await run(root)
  } finally { rmSync(root, { recursive: true, force: true }) }
}

test('CSS preparation preserves source without loading Sass or requiring a manifest', async () => {
  await fixture(async root => {
    const id = join(root, 'entry.css'), source = '@reference "./master.css"; .card { @compose p:2rem; }'
    const prepared = await stylesheets.prepareStylesheet(id + '?direct', source, { loadSass: () => { throw new Error('CSS must not load Sass') } })
    expect(prepared).toEqual({ id, baseFile: id, source, dependencies: [id] })
    expect(Object.isFrozen(prepared)).toBe(true)
    expect(Object.isFrozen(prepared.dependencies)).toBe(true)
  })
})

for (const syntax of ['scss', 'sass']) test(`prepare ${syntax} before classification, retain loaded dependencies and original map`, async () => {
  await fixture(async root => {
    const id = join(root, `card.${syntax}`), partial = join(root, '_tokens.scss')
    const partialSource = '$space: 2rem; .imported { margin: $space; }'
    writeFileSync(partial, partialSource)
    const source = syntax === 'scss'
      ? '@use "tokens"; @reference "./master.css"; .card { @compose p:#{tokens.$space}; }'
      : '@use "tokens"\n@reference "./master.css"\n.card\n  @compose p:#{tokens.$space}\n'
    writeFileSync(id, source)
    const observed: string[] = []
    const prepared = await stylesheets.prepareStylesheet(id, source, { projectDir: root, onDependency: file => observed.push(file) })
    expect(prepared.source).toContain('@compose p:2rem;')
    expect(prepared.source).toContain('margin: 2rem')
    expect(new Set(prepared.dependencies)).toEqual(new Set([id, partial]))
    expect(new Set(observed)).toEqual(new Set([id, partial]))
    const map = JSON.parse(prepared.sourceMap!)
    expect(map.version).toBe(3)
    expect(map.mappings.length).toBeGreaterThan(0)
    expect(map.sources.map((url: string) => fileURLToPath(url))).toEqual(expect.arrayContaining([id, partial]))
    expect(map.sourcesContent).toEqual(expect.arrayContaining([source, partialSource]))
    const classified = await stylesheets.resolveStylesheet(id, prepared.source, { projectDir: root })
    expect(classified?.kind).toBe('local')
    writeFileSync(partial, '$space: 4rem; .imported { margin: $space; }')
    const updated = await stylesheets.prepareStylesheet(id, source, { projectDir: root })
    expect(updated.source).toContain('@compose p:4rem;')
  })
})

test('host Sass callback receives preparation options and keeps host importers', async () => {
  await fixture(async root => {
    const file = join(root, 'component.vue'), id = file + '?type=style&lang=scss', canonical = new URL('host:tokens')
    const prepared = await stylesheets.prepareStylesheet(id, '@use "host:tokens"; .card { @compose p:#{tokens.$space}; }', {
      projectDir: root,
      loadSass(projectDir) {
        expect(projectDir).toBe(root)
        return { async compileStringAsync(source, options) {
          expect(options.url.href).toBe(pathToFileURL(file).href)
          expect(options.style).toBe('expanded')
          return sass.compileStringAsync(source, { ...options, importers: [{ canonicalize: () => canonical, load: () => ({ contents: '$space: 3rem; .host { margin: $space; }', syntax: 'scss', sourceMapUrl: canonical }) }] })
        } }
      }
    })
    expect(prepared.source).toContain('@compose p:3rem;')
    expect(prepared.dependencies).toEqual([file])
    expect(JSON.parse(prepared.sourceMap!).sources).toContain('host:tokens')
  })
})

test('a virtual style uses its explicit physical base file for Sass and dependencies', async () => {
  await fixture(async root => {
    const file = join(root, 'card.scss'), id = '\0host:card.scss?opaque'
    const prepared = await stylesheets.prepareStylesheet(id, '$space:2rem;.card{@compose p:#{$space};}', { projectDir: root, baseFile: file })
    expect(prepared.id).toBe(id)
    expect(prepared.baseFile).toBe(file)
    expect(prepared.dependencies).toEqual([file])
    expect(prepared.source).toContain('@compose p:2rem;')
    expect(JSON.parse(prepared.sourceMap!).sources).toContain(pathToFileURL(file).href)
  })
})

test('Sass errors retain original spans and register the root before failure', async () => {
  await fixture(async root => {
    const file = join(root, 'bad.scss'), observed: string[] = []
    await expect(stylesheets.prepareStylesheet(file, '@use "missing";', { projectDir: root, onDependency: file => observed.push(file) })).rejects.toMatchObject({
      span: { url: pathToFileURL(file) }
    })
    expect(observed).toEqual([file])
    writeFileSync(join(root, '_missing.scss'), '$space:2rem;')
    await expect(stylesheets.prepareStylesheet(file, '@use "missing";.card{padding:missing.$space;}', { projectDir: root })).resolves.toMatchObject({ source: expect.stringContaining('padding: 2rem') })
  })
})

test('preparation checks cancellation before loading and after an async compiler returns', async () => {
  const cancelled = new AbortController();cancelled.abort(new Error('cancelled before load'))
  await expect(stylesheets.prepareStylesheet('/card.scss', '', { signal: cancelled.signal, loadSass: () => { throw new Error('unexpected load') } })).rejects.toThrow('cancelled before load')
  const pending = new AbortController()
  await expect(stylesheets.prepareStylesheet('/card.scss', '', { signal: pending.signal, loadSass: () => ({ async compileStringAsync() { pending.abort(new Error('cancelled during preparation'));return { css: '' } } }) })).rejects.toThrow('cancelled during preparation')
})

test('prepared Sass maps resolve relative references from an imported partial', async () => {
  await fixture(async root => {
    mkdirSync(join(root, 'parts'))
    const file = join(root, 'entry.scss'), partial = join(root, 'parts/_rules.scss')
    const token = join(root, 'parts/tokens.css')
    writeFileSync(partial, '@reference "./tokens.css"; .card { @compose paint; }')
    writeFileSync(token, '@utilities { paint { padding: 2rem; } }')
    writeFileSync(join(root, 'tokens.css'), '@utilities { paint { padding: 99rem; } }')
    const prepared = await stylesheets.prepareStylesheet(file, '@use "parts/rules";', { projectDir: root })
    const result = await stylesheets.transformStylesheet('\0prepared:entry.css', prepared.source, {
      baseManifest: { version: 1, utilities: [] }, projectDir: root,
      delivery: { baseFile: prepared.baseFile, sourceMap: prepared.sourceMap,
        entryURL: '/entry.css', stylesheetURL: id => '/' + Buffer.from(id).toString('hex') + '.css', resourceURL: id => id }
    })
    expect(result.code).toContain('padding:2rem')
    expect(result.code).not.toContain('99rem')
    expect(result.dependencies).toContain(token)
    expect(prepared.dependencies).toContain(partial)
  })
})

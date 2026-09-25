import { expect, test } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { SourceMap, createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { compileRenderedStylesheet } from '../src/stylesheet/index-public'
import { compileRenderedStylesheet as compileRenderedInternal } from '../src/stylesheet/index'

for (const qualifier of ['', ' layer(cards)', ' layer supports(display:grid) screen']) {
  test(`rendered delivery preserves external import boundaries ${qualifier}`, async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-rendered-delivery-'))
    try {
      mkdirSync(join(root, 'nested'))
      const entry = join(root, 'entry.css'), child = join(root, 'nested/child.css'), resource = join(root, 'nested/dot.svg')
      const source = `@import "./nested/child.css"${qualifier};@import "https://remote.test/last.css";@utilities{paint{padding:2rem}}\n.after{margin:1px}`
      const childSource = '/* child */\n.card{@compose paint;}\n.card{background:url("./dot.svg")}';writeFileSync(child, childSource);writeFileSync(resource, '<svg/>')
      const result = await compileRenderedStylesheet(entry, source, { projectDir: root, baseManifest: { version: 1, languageVersion: 3, utilities: [] }, delivery: { entryURL: '/built/main.css', stylesheetURL: file => `/built/${basename(file)}`, resourceURL: file => `/media/${basename(file)}` } })
      expect(result.css.indexOf('/built/child.css')).toBeLessThan(result.css.indexOf('https://remote.test/last.css'))
      const asset = result.stylesheets!.find(asset => asset.id === child)!
      expect(asset.css).toContain('padding:2rem')
      expect(asset.css).toContain('/media/dot.svg')
      expect(result.resources).toEqual([{ file: resource, href: '/media/dot.svg' }])
      const lines = asset.css.slice(0, asset.css.indexOf('.card')).split('\n')
      const origin = new SourceMap(JSON.parse(asset.sourceMap)).findEntry(lines.length - 1, lines.at(-1)!.length)
      expect(origin).toMatchObject({ originalSource: pathToFileURL(child).href, originalLine: 1, originalColumn: 0 })
      expect(JSON.parse(asset.sourceMap).sourcesContent).toContain(childSource)
      expect(result.stylesheets!.find(asset => asset.id === entry)?.css).toBe(result.css)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}

test('rendered delivery preserves host maps, supplied references, native pruning and dependency callbacks', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-rendered-host-'))
  try {
    const entry = join(root, 'entry.css'), original = join(root, 'original.scss'), child = join(root, 'child.css'), tokens = join(root, 'tokens.css')
    writeFileSync(child, '.used{color:red}.unused{color:blue}')
    writeFileSync(tokens, '@utilities{paint{padding:2rem}}')
    const source = '@import "./child.css";\n.card{@compose paint;}'
    const dependencies: string[] = [], deliveryDependencies: string[] = []
    const result = await compileRenderedInternal(entry, source, { projectDir: root,
      baseManifest: { version: 1, languageVersion: 3, utilities: [] }, classes: ['used', 'card'], pruneNativeCSS: true,
      references: [{ source: './tokens.css', file: entry }],
      sourceMap: JSON.stringify({ version: 3, sources: [pathToFileURL(original).href], sourcesContent: [source], names: [], mappings: 'AAAA;AACA' }),
      onDependency: file => dependencies.push(file),
      delivery: { entryURL: '/entry.css', stylesheetURL: file => `/${basename(file)}`, resourceURL: file => `/media/${basename(file)}`, onDependency: file => deliveryDependencies.push(file) }
    })
    const asset = result.stylesheets!.find(asset => asset.id === child)!
    expect(asset.css).toContain('.used')
    expect(asset.css).not.toContain('.unused')
    expect(result.css).toContain('padding:2rem')
    const lines = result.css.slice(0, result.css.indexOf('.card')).split('\n')
    expect(new SourceMap(JSON.parse(result.sourceMap!)).findEntry(lines.length - 1, lines.at(-1)!.length)).toMatchObject({ originalSource: pathToFileURL(original).href, originalLine: 1 })
    expect(dependencies).toEqual(expect.arrayContaining([entry, child, tokens]))
    expect(deliveryDependencies).toEqual(expect.arrayContaining([entry, child, tokens]))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('rendered delivery retains real Sass dependencies and original output maps', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-rendered-sass-'))
  try {
    const entry = join(root, 'entry.scss'), partial = join(root, '_tokens.scss'), child = join(root, 'child.css')
    writeFileSync(partial, '$padding:2rem;');writeFileSync(child, '.used{color:red}')
    const source = '@use "./tokens";\n@import "./child.css";\n.card{padding:tokens.$padding}'
    const require = createRequire(new URL('../../vite/package.json', import.meta.url))
    const sass = createRequire(require.resolve('vite'))('sass')
    const result = await compileRenderedStylesheet(entry, source, { projectDir: root, loadSass: () => sass,
      baseManifest: { version: 1, languageVersion: 3, utilities: [] },
      delivery: { entryURL: '/entry.css', stylesheetURL: file => `/${basename(file)}`, resourceURL: file => `/media/${basename(file)}` }
    })
    expect(result.dependencies).toContain(partial)
    const lines = result.css.slice(0, result.css.indexOf('.card')).split('\n')
    expect(new SourceMap(JSON.parse(result.sourceMap!)).findEntry(lines.length - 1, lines.at(-1)!.length)).toMatchObject({ originalSource: pathToFileURL(entry).href, originalLine: 2 })
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('rendered delivery maps invalid composed tokens back to their Sass partial', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-rendered-error-'))
  try {
    const entry = join(root, 'entry.scss'), partial = join(root, '_rules.scss')
    writeFileSync(partial, '/* original */\n.bad{@compose "block";}')
    const require = createRequire(new URL('../../vite/package.json', import.meta.url))
    const sass = createRequire(require.resolve('vite'))('sass')
    await expect(compileRenderedStylesheet(entry, '@use "./rules";', { projectDir: root, loadSass: () => sass,
      baseManifest: { version: 1, languageVersion: 3, utilities: [] },
      delivery: { entryURL: '/entry.css', stylesheetURL: file => `/${basename(file)}`, resourceURL: file => `/media/${basename(file)}` }
    })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ source: partial, range: { start: expect.objectContaining({ line: 1 }), end: expect.objectContaining({ line: 1 }) } })] })
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('rendered delivery emits generated classes once in the entry and leaves them unmapped', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-rendered-globals-'))
  try {
    const entry = join(root, 'entry.css'), child = join(root, 'child.css')
    writeFileSync(child, '.paint{color:red}')
    const result = await compileRenderedStylesheet(entry, '@import "./child.css";@utilities{paint{padding:2rem}}', { projectDir: root,
      baseManifest: { version: 1, languageVersion: 3, utilities: [] }, classes: ['paint'],
      delivery: { entryURL: '/entry.css', stylesheetURL: file => `/${basename(file)}`, resourceURL: file => `/media/${basename(file)}` }
    })
    expect(result.css).toContain('@layer utilities{.paint{padding:2rem}}')
    expect(result.stylesheets!.filter(asset => asset.css.includes('@layer utilities'))).toHaveLength(1)
    const lines = result.css.slice(0, result.css.indexOf('@layer utilities')).split('\n')
    const mapped = new SourceMap(JSON.parse(result.sourceMap!)).findEntry(lines.length - 1, lines.at(-1)!.length)
    // Node returns the previous mapped line when the requested line is unmapped.
    expect('generatedLine' in mapped && mapped.generatedLine === lines.length - 1 && 'originalSource' in mapped).toBe(false)
    expect(Object.isFrozen(result) && Object.isFrozen(result.stylesheets) && Object.isFrozen(result.stylesheets![0]) && Object.isFrozen(result.resources)).toBe(true)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

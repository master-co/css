import { mkdirSync, mkdtempSync, realpathSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createStylesheetCollection, transformStylesheet } from '../src/stylesheet/public'

const baseManifest = defaultManifestJSON as unknown as MasterCSSManifest

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-reference-owner-')))
  const scanner = { cwd: root, options: {}, css: { text: '', manifest: baseManifest }, latentClasses: new Set(), validClasses: new Set(), nativeClassNames: new Set(), usedNativeClasses: new Set(), registerNativeClasses: vi.fn() } as any
  const dependencies = new Set<string>()
  const delivery = {
    entryURL: '/entry.css', stylesheetURL: (file: string, variant?: string) => `/css/${Buffer.from(variant ?? file).toString('hex')}.css`,
    resourceURL: (file: string) => `/assets/${Buffer.from(file).toString('hex')}.svg`, onDependency: (file: string) => { dependencies.add(file) }
  }
  const sources = ['a', 'b'].map((side, index) => {
    const directory = join(root, side)
    mkdirSync(directory)
    const owner = join(directory, 'owner.scss'), reference = join(directory, 'tokens #.css'), resource = join(directory, 'pixel.svg')
    writeFileSync(resource, `<svg data-owner="${side}"/>`)
    writeFileSync(reference, `@utilities{paint-${side}{padding:${index + 2}rem;background:url("./pixel.svg?q=${side}#icon")}}.never-${side}{color:red}`)
    return { owner, reference, resource, source: `@reference "./tokens%20%23.css?v=1#theme";.${side}{@compose paint-${side};}` }
  })
  writeFileSync(join(root, 'tokens #.css'), '@utilities{paint-a{padding:99rem}paint-b{padding:99rem}}')
  return { root, sources, scanner, delivery, dependencies, remove: () => rmSync(root, { recursive: true, force: true }) }
}

test('BH-0004 missing virtual reference reports its attempted path and registration recovers without partial state', async () => {
  const f = fixture()
  using collection = createStylesheetCollection()
  try {
    const item = f.sources[0], id = '\0prepared:recovery.css'
    const options = { baseManifest, projectDir: f.root, delivery: { ...f.delivery, baseFile: item.owner } }
    const source = '@master entry;@preserve native;' + item.source
    await collection.register(f.scanner, id, source, options)
    const before = collection.snapshot()
    unlinkSync(item.reference)
    f.dependencies.clear()
    await expect(collection.register(f.scanner, id, source, options)).rejects.toThrow('ENOENT')
    expect(f.dependencies).toContain(item.reference)
    expect(collection.snapshot()).toEqual(before)
    writeFileSync(item.reference, '@utilities{paint-a{padding:7rem}}')
    await collection.register(f.scanner, id, source, options)
    const output = await collection.compose({ ...options, scanner: f.scanner })
    expect(output.stylesheets?.map(asset => asset.css).join('')).toContain('padding:7rem')
    expect(output.resources).toEqual([])
    expect(collection.snapshot().dependencies).not.toContain(item.resource)
  } finally { f.remove() }
})

test.each(['self', 'indirect'])('BH-0004 virtual owner participates in %s reference cycle detection', async cycle => {
  const f = fixture()
  try {
    const owner = join(f.root, 'owner.css')
    writeFileSync(owner, '@utilities{paint{color:red}}')
    writeFileSync(join(f.root, 'other.css'), '@reference "./owner.css";')
    await expect(transformStylesheet('\0prepared:cycle.css', `@reference "./${cycle === 'self' ? 'owner' : 'other'}.css";.a{@compose paint;}`, {
      baseManifest, projectDir: f.root, delivery: { ...f.delivery, baseFile: owner }
    })).rejects.toThrow('Circular CSS reference:')
  } finally { f.remove() }
})

test('BH-0004 original virtual diagnostic identity survives filesystem reference rebasing', async () => {
  const f = fixture()
  try {
    const id = '\0prepared:diagnostic.css'
    await expect(transformStylesheet(id, f.sources[0].source + '\n.bad{@compose unknown-owner-utility;}', {
      baseManifest, projectDir: f.root, delivery: { ...f.delivery, baseFile: f.sources[0].owner }
    })).rejects.toMatchObject({ diagnostics: expect.arrayContaining([expect.objectContaining({ source: id, code: 'invalid-compose-class' })]) })
  } finally { f.remove() }
})

for (const location of ['physical', 'virtual-entry', 'virtual-child'] as const) {
  test.each(['transform', 'collection'] as const)(`BH-0004 ${location} references use filesystem owners during %s`, async operation => {
    const f = fixture()
    using collection = createStylesheetCollection()
    try {
      const css: string[] = []
      const resources: string[] = []
      for (const [index, item] of f.sources.entries()) {
        const virtual = `\0prepared:${index}.css`
        const id = location === 'physical' ? item.owner + '.css' : virtual
        const source = location === 'virtual-child' ? '@import "prepared-child" layer(owner);' : item.source
        const delivery = { ...f.delivery,
          ...(location === 'virtual-entry' ? { baseFile: item.owner } : {}),
          ...(location === 'virtual-child' ? { resolveImport: async () => ({ id: `\0child:${index}.css`, source: item.source, baseFile: item.owner }) } : {})
        }
        if (operation === 'collection') {
          await collection.register(f.scanner, id, '@master entry;@preserve native;' + source, { baseManifest, projectDir: f.root, delivery })
        } else {
          const result = await transformStylesheet(id, source, { baseManifest, projectDir: f.root, delivery })
          css.push(result.code, ...result.stylesheets?.map(asset => asset.css) ?? [])
          resources.push(...result.resources?.map(asset => asset.file) ?? [])
          expect(result.dependencies).toContain(item.reference)
        }
      }
      if (operation === 'collection') {
        const result = await collection.compose({ scanner: f.scanner, baseManifest, projectDir: f.root, delivery: f.delivery })
        css.push(result.css, ...result.stylesheets?.map(asset => asset.css) ?? [])
        resources.push(...result.resources?.map(asset => asset.file) ?? [])
        expect(collection.snapshot().dependencies).toEqual(expect.arrayContaining(f.sources.map(item => item.reference)))
      }
      const text = css.join('\n')
      expect(text).toContain('padding:2rem')
      expect(text).toContain('padding:3rem')
      expect(text).not.toMatch(/99rem|never-|@reference|@compose/)
      expect(new Set(resources)).toEqual(new Set(f.sources.map(item => item.resource)))
      for (const [index, item] of f.sources.entries()) {
        expect(text).toContain(`${f.delivery.resourceURL(item.resource)}?q=${index ? 'b' : 'a'}#icon`)
        expect(f.dependencies).toContain(item.reference)
        expect(f.dependencies).toContain(item.resource)
      }
    } finally { f.remove() }
  })
}

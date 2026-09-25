import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { createStylesheetCollection, resolveStylesheet } from '../src/stylesheet/public'
import { prepareCSSImportGraphWithResolver } from '../src/node-imports'
import { analyzeCSSDependencies } from '../src/node-compiler'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-css-virtual-sources-'))
  const scanner = { cwd: root, options: {}, css: { text: '', manifest: { version: 1, languageVersion: 2, utilities: [] } }, latentClasses: new Set(), validClasses: new Set(), nativeClassNames: new Set(), usedNativeClasses: new Set(), registerNativeClasses: vi.fn(), removeOwner: vi.fn() } as any
  const delivery = { entryURL: './entry.css', stylesheetURL: (file: string, variant?: string) => `./${Buffer.from(variant ?? file).toString('hex')}.css`, resourceURL: () => './resource.svg', relativeResourceURLs: true }
  return { root, scanner, delivery, remove: () => rmSync(root, { recursive: true, force: true }) }
}

test('BH-0004 virtual identities and supplied resource bases survive classification, registration and composition', async () => {
  const f = fixture()
  try {
    writeFileSync(join(f.root, 'image.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
    const id = '\0virtual:entry.css?entry=2', child = '\0virtual:child.css?part=1'
    const source = '@import "virtual:child.css" layer(shared) print;@utilities{paint{color:blue}}'
    const resolveImport = vi.fn(async () => ({ id: child, source: '@master entry;@preserve native;.example{@compose paint;background:url("./image.svg?v=1#icon")}', baseFile: join(f.root, 'owner.css') }))
    const resolution = await resolveStylesheet(id, source, { preserveImports: true, resolveImport })
    expect(resolution).toMatchObject({ id, kind: 'entry', dependencies: [id, child] })
    using collection = createStylesheetCollection()
    await collection.register(f.scanner, id, source, { baseManifest: f.scanner.css.manifest, delivery: { ...f.delivery, resolveImport } })
    expect(collection.snapshot().sourceIds).toEqual([id])
    const calls = resolveImport.mock.calls.length
    const result = await collection.compose({ scanner: f.scanner, baseManifest: f.scanner.css.manifest, delivery: f.delivery })
    expect(resolveImport.mock.calls).toHaveLength(calls)
    expect(result.stylesheets?.some(asset => asset.css.includes('layer(shared) print'))).toBe(true)
    expect(result.stylesheets?.some(asset => asset.css.includes('color:#00f') && asset.css.includes('resource.svg?v=1#icon'))).toBe(true)
    expect(result.resources).toEqual([{ file: join(f.root, 'image.svg'), href: './resource.svg' }])
    expect(collection.delete(id)).toBe(true)
  } finally { f.remove() }
})

test('BH-0004 empty virtual sources and repeated identities do not read fabricated filenames', async () => {
  const graph = await prepareCSSImportGraphWithResolver('\0virtual:entry.css', '@import "empty";@import "empty";', {}, analyzeCSSDependencies, async () => ({ id: '\0virtual:empty.css', source: '' }))
  expect(Object.keys(graph.files)).toEqual(['\0virtual:entry.css', '\0virtual:empty.css'])
  expect(graph.edges).toHaveLength(2)
})

test('BH-0004 virtual relative resources require an explicit source owner and do not register partial state', async () => {
  const f = fixture()
  try {
    using collection = createStylesheetCollection()
    const resolveImport = async () => ({ id: '\0virtual:child.css', source: '.example{background:url(image.svg)}' })
    await expect(collection.register(f.scanner, '\0virtual:entry.css', '@master entry;@import "child";', { baseManifest: f.scanner.css.manifest, delivery: { ...f.delivery, resolveImport } })).rejects.toThrow('Relative resource URL requires a source baseFile:')
    expect(collection.size).toBe(0)
  } finally { f.remove() }
})

test('BH-0004 malformed supplied source reports its virtual identity', async () => {
  const f = fixture()
  try {
    using collection = createStylesheetCollection()
    const child = '\0virtual:broken.css'
    const resolveImport = async () => ({ id: child, source: '{color:red}' })
    await expect(collection.register(f.scanner, '\0virtual:entry.css', '@master entry;@import "child";', { baseManifest: f.scanner.css.manifest, delivery: { ...f.delivery, resolveImport } })).rejects.toThrowError(expect.objectContaining({ diagnostics: expect.arrayContaining([expect.objectContaining({ source: child })]) }))
    expect(collection.size).toBe(0)
  } finally { f.remove() }
})

test('BH-0004 a virtual entry baseFile supplies Node fallback and root resource ownership', async () => {
  const f = fixture()
  try {
    const owner = join(f.root, 'owner.scss'), child = join(f.root, 'child.css')
    writeFileSync(child, '.example{color:blue}')
    writeFileSync(join(f.root, 'image.svg'), '<svg/>')
    const source = '@import "./child.css";@master entry;@preserve native;.example{background:url(image.svg)}'
    const id = '\0prepared:entry.css'
    const resolveImport = async () => undefined
    const resolution = await resolveStylesheet(id, source, { baseFile: owner, preserveImports: true, resolveImport })
    expect(resolution?.dependencies).toContain(child)
    expect((await resolveStylesheet(id, source, { baseFile: owner, preserveImports: true }))?.dependencies).toContain(child)
    using collection = createStylesheetCollection()
    await collection.register(f.scanner, id, source, { baseManifest: f.scanner.css.manifest, delivery: { ...f.delivery, baseFile: owner } })
    const output = await collection.compose({ scanner: f.scanner, baseManifest: f.scanner.css.manifest, delivery: f.delivery })
    expect(output.resources).toEqual([{ file: join(f.root, 'image.svg'), href: './resource.svg' }])
    expect(output.stylesheets?.map(asset => asset.css).join('\n')).toMatch(/color:\s*#00f/)
  } finally { f.remove() }
})

test('BH-0004 nonabsolute entry source owners fail before graph registration', async () => {
  await expect(prepareCSSImportGraphWithResolver('\0entry.css', '', { baseFile: 'relative.scss' }, analyzeCSSDependencies, async () => undefined)).rejects.toThrow('absolute')
})

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { createStylesheetCollection, resolveStylesheet } from '../src/stylesheet/public'
import { prepareCSSImportGraphWithResolver } from '../src/node-imports'
import { analyzeCSSDependencies } from '../src/node-compiler'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-css-host-resolution-'))
  mkdirSync(join(root, 'styles'))
  const entry = join(root, 'entry.css'), child = join(root, 'styles/child.css')
  writeFileSync(child, '@master entry;@preserve native;.example{@compose paint;}')
  const scanner = { cwd: root, options: {}, css: { text: '', manifest: { version: 1, languageVersion: 3, utilities: [] } }, latentClasses: new Set(), validClasses: new Set(), nativeClassNames: new Set(), usedNativeClasses: new Set(), registerNativeClasses: vi.fn() } as any
  const delivery = { entryURL: './entry.css', stylesheetURL: (file: string, variant?: string) => `./${Buffer.from(variant ?? file).toString('hex')}.css`, resourceURL: () => './resource.svg', relativeResourceURLs: true }
  return { root, entry, child, scanner, delivery, remove: () => rmSync(root, { recursive: true, force: true }) }
}

test('BH-0004 async host classification and registration preserve transitive definitions and CSS conditions', async () => {
  const f = fixture()
  try {
    const calls: string[] = []
    const resolveImport = async (specifier: string, importer: string) => { calls.push(importer); return specifier === '@theme' ? f.child : undefined }
    const source = '@import "@theme" layer(shared) print;@utilities{paint{color:blue}}'
    const resolution = await resolveStylesheet(f.entry, source, { preserveImports: true, resolveImport })
    expect(resolution).toMatchObject({ kind: 'entry', source, compilationSource: source, dependencies: [f.entry, f.child] })
    using collection = createStylesheetCollection()
    await collection.register(f.scanner, f.entry, source, { baseManifest: f.scanner.css.manifest, delivery: { ...f.delivery, resolveImport } })
    const result = await collection.compose({ scanner: f.scanner, baseManifest: f.scanner.css.manifest, delivery: f.delivery })
    expect(result.stylesheets?.some(asset => asset.css === '.example{color:#00f}')).toBe(true)
    expect(result.stylesheets?.some(asset => asset.css.includes('layer(shared)') && asset.css.includes('print'))).toBe(true)
    expect(calls.every(importer => importer === f.entry)).toBe(true)
  } finally { f.remove() }
})

test('BH-0004 undefined uses Node fallback while null retains an explicitly external import', async () => {
  const f = fixture()
  try {
    const ignored = join(f.root, 'ignored.css')
    writeFileSync(ignored, '.ignored{color:red}')
    const graph = await prepareCSSImportGraphWithResolver(f.entry, '@import "./styles/child.css";@import "./ignored.css";', {}, analyzeCSSDependencies, async specifier => specifier === './ignored.css' ? null : undefined)
    expect(Object.keys(graph.files)).toEqual([f.entry, f.child])
    expect(graph.edges).toHaveLength(1)
    expect(graph.files[f.entry]).toContain('./ignored.css')
  } finally { f.remove() }
})

test('BH-0004 missing resolved files report attempted watch dependencies and do not register partial state', async () => {
  const f = fixture()
  try {
    const missing = join(f.root, 'missing.css'), onDependency = vi.fn()
    using collection = createStylesheetCollection()
    const resolveImport = async () => missing
    await expect(collection.register(f.scanner, f.entry, '@master entry;@import "alias";', { baseManifest: f.scanner.css.manifest, delivery: { ...f.delivery, resolveImport, onDependency } })).rejects.toThrow('ENOENT')
    expect(onDependency).toHaveBeenCalledWith(missing)
    expect(collection.size).toBe(0)
    await expect(resolveStylesheet(f.entry, '@master entry;@import "alias";', { preserveImports: true, resolveImport, onDependency })).rejects.toThrow('ENOENT')
  } finally { f.remove() }
})

test('BH-0004 abort during a host resolver prevents registration and further file loading', async () => {
  const f = fixture()
  try {
    const controller = new AbortController(), onDependency = vi.fn()
    using collection = createStylesheetCollection()
    const resolveImport = async () => { controller.abort(); return f.child }
    await expect(collection.register(f.scanner, f.entry, '@master entry;@import "alias";', { baseManifest: f.scanner.css.manifest, signal: controller.signal, delivery: { ...f.delivery, resolveImport, onDependency } })).rejects.toThrow()
    expect(collection.size).toBe(0)
    expect(onDependency).not.toHaveBeenCalledWith(f.child)
  } finally { f.remove() }
})

test('BH-0004 disposal while a resolver is pending prevents registration', async () => {
  const f = fixture()
  try {
    const onDependency = vi.fn()
    const collection = createStylesheetCollection()
    const resolveImport = async () => { collection.dispose(); return f.child }
    await expect(collection.register(f.scanner, f.entry, '@master entry;@import "alias";', { baseManifest: f.scanner.css.manifest, delivery: { ...f.delivery, resolveImport, onDependency } })).rejects.toThrowError(expect.objectContaining({ code: 'SESSION_DISPOSED' }))
    expect(onDependency).not.toHaveBeenCalledWith(f.child)
  } finally { f.remove() }
})


test('BH-0004 host aliases remain project CSS while alternate package export files retain package ownership', async () => {
  const f = fixture()
  try {
    const pkg = join(f.root, 'node_modules/paint-package')
    mkdirSync(pkg, { recursive: true })
    writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'paint-package', exports: './node.css' }))
    writeFileSync(join(pkg, 'node.css'), '.example{color:red}')
    writeFileSync(join(pkg, 'browser.css'), '.example{color:blue}')
    const packageFile = join(pkg, 'browser.css')
    const graph = await prepareCSSImportGraphWithResolver(f.entry, '@import "alias";@import "paint-package";', { projectDir: f.root }, analyzeCSSDependencies, async specifier => specifier === 'alias' ? f.child : packageFile)
    expect(graph.packageFiles).toEqual([packageFile])
    expect(graph.edges.map(edge => edge.resolved)).toEqual([f.child, packageFile])
    const overridden = await prepareCSSImportGraphWithResolver(f.entry, '@import "paint-package";', { projectDir: f.root }, analyzeCSSDependencies, async () => f.child)
    expect(overridden.packageFiles).toBeUndefined()
  } finally { f.remove() }
})

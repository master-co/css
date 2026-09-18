import { expect, test } from 'vitest'
import { createRequire } from 'node:module'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compileRenderedStylesheet, compileStylesheet } from '@master/css-compiler/stylesheet'
import { pitch as inputPitch } from '../src/stylesheet-input-loader'
import postcssDispatcher from '../src/webpack-postcss-loader'
import { protectNextGeneratedGlobals } from '../src/prepare-global-module'
import { rebasePostCSSResources, type NextPostCSSResourcePolicy } from '../src/postcss-resource-policy'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'

const require = createRequire(import.meta.url)
const nextRequire = createRequire(require.resolve('next/package.json'))
const postcss = nextRequire('postcss')
const nativeLoader = require.resolve('next/dist/build/webpack/loaders/postcss-loader/src/index')
interface Declaration { prop: string; value: string; remove(): void }
interface Root { append(node: unknown): void; walkDecls(callback: (declaration: Declaration) => void): void; walkRules(selector: string, callback: (rule: Root) => void): void }
interface Output { source: string; sourceMap: string; globalAnimations: string[]; processedGlobals?: Required<MasterCSSEmittedGlobals> }
const baseManifest = { version: 1 as const, utilities: [] }
const source = '@theme{--color-old:#111111;--color-late:#abcdef;--color-child:#010203;--shape-late:url("../late.svg?rev=1#shape")}.card{color:var(--color-old)}'

/** Run the owned input pitch, the dispatcher and Next's installed PostCSS loader as the Webpack chain does. */
async function runHostChain(projectDir: string, file: string, snapshot: { source: string, sourceMap?: string, generatedCSS?: string, resources?: NextPostCSSResourcePolicy }, plugins: unknown[], scoped: boolean) {
  const snapshotFile = join(projectDir, '.master/postcss', Math.random().toString(36).slice(2) + '.json')
  writeFileSync(snapshotFile, JSON.stringify(snapshot))
  const dependencies: string[] = []
  const pitched = await new Promise<[string, object | undefined, { masterPostCSSResources?: unknown } | undefined]>((resolve, reject) => inputPitch.call({
    resourcePath: file, getOptions: () => ({ snapshot: snapshotFile }), addDependency: (dependency: string) => dependencies.push(dependency),
    callback: (error: Error | null, css?: string, map?: object, meta?: object) => error ? reject(error) : resolve([css!, map, meta])
  }))
  const trace = { traceChild: () => trace, traceAsyncFn: (fn: () => unknown) => Promise.resolve().then(fn), traceFn: (fn: () => unknown) => fn(), setAttribute: () => {} }
  const processor = postcss(plugins)
  const options = { postcss: async () => ({ postcss, postcssWithPlugins: processor }) }
  const native = await new Promise<{ css: string; meta?: { ast?: { root: { toJSON(): object } } } }>((resolve, reject) => postcssDispatcher.call({
    resourcePath: file, context: projectDir, currentTraceSpan: trace, sourceMap: true,
    getOptions: () => ({ loader: nativeLoader, options }),
    async: () => (error: Error | null, css: string, _map: object, meta?: { ast?: { root: { toJSON(): object } } }) => error ? reject(error) : resolve({ css, meta }),
    ...Object.fromEntries(['addDependency', 'addBuildDependency', 'addMissingDependency', 'addContextDependency', 'emitWarning', 'emitFile'].map(name => [name, () => {}]))
  } as never, pitched[0], pitched[1], pitched[2] as never))
  expect(processor.plugins).toEqual(plugins)
  // prepare-postcss only protects ownership when the pass carried generated globals or a resource policy.
  if (!snapshot.generatedCSS && !snapshot.resources) return { dependencies, pitched, css: native.css, output: undefined }
  if (!native.meta?.ast) throw new Error('Native PostCSS did not preserve the generated-global AST.')
  // The capture loader transfers the AST as JSON through importModule before ownership protection.
  const transferred = JSON.parse(JSON.stringify(native.meta.ast.root.toJSON()))
  return { dependencies, pitched, css: native.css, output: protectNextGeneratedGlobals(file, transferred, scoped) as Output }
}

test('installed Next PostCSS loader chain emits late resources once, keeps user deletions and rebases allocated resource URLs', async () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'master-next-resource-host-'))
  try {
    mkdirSync(join(projectDir, 'styles'))
    mkdirSync(join(projectDir, '.master/postcss'), { recursive: true })
    writeFileSync(join(projectDir, 'late.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><rect id="shape" width="1" height="1"/></svg>')
    const entry = join(projectDir, 'styles/entry.module.css')
    writeFileSync(entry, source)
    const resourceFiles = new Map<string, string>()
    const manifest = await compileRenderedStylesheet(entry, source, {
      baseManifest, projectDir, preserveNativeCSS: true, baseFile: entry,
      delivery: { entryURL: './entry.css', stylesheetURL: id => './' + id + '.css', resourceURL: file => { const url = pathToFileURL(file).href;resourceFiles.set(url, file);return url }, resolveImport: async () => undefined }
    })
    const generatedCSS = rebasePostCSSResources(manifest.generatedCSS, entry, [...resourceFiles])
    expect(generatedCSS).toMatch(/--color-old:#111(111)?[;}]/)
    expect(generatedCSS).not.toContain('--color-late')
    const lowered = await compileStylesheet(entry, source, { baseManifest: manifest.manifest, projectDir, preserveNativeCSS: true, preserveNativeSource: true, baseFile: entry })
    const policy: NextPostCSSResourcePolicy = { file: entry, projectDir, manifest: manifest.manifest, processedGlobals: manifest.emittedGlobals, resourceFiles: [...resourceFiles] }
    const counts: number[] = []
    const plugins = [{ postcssPlugin: 'delete-and-reference', Once(root: Root) {
      counts.push(1)
      root.walkDecls(declaration => { if (declaration.prop === '--color-old') declaration.remove() })
      root.walkRules('.card', rule => { rule.append({ prop: 'background-image', value: 'var(--shape-late)' });rule.append({ prop: 'color', value: 'var(--color-late)' }) })
    } }, { postcssPlugin: 'consume-late', Once(root: Root) {
      counts.push(2)
      root.walkDecls(declaration => { if (declaration.prop === '--color-late') declaration.value = '#fedcba' })
    } }]
    const { dependencies, pitched, output } = await runHostChain(projectDir, entry, { source: lowered.css, sourceMap: lowered.sourceMap, generatedCSS, resources: policy }, plugins, true)
    expect(dependencies).toEqual([expect.stringContaining('.master/postcss'), entry])
    expect(pitched[2]?.masterPostCSSResources).toBeTypeOf('function')
    expect(counts).toEqual([1, 2])
    expect(output).toBeDefined()
    // Late globals reach the following user plugin in the same pass, and only once.
    expect(output!.source.match(/--color-late:/g)).toHaveLength(1)
    expect(output!.source).toContain('--color-late:#fedcba')
    expect(output!.source.match(/--shape-late:/g)).toHaveLength(1)
    expect(output!.source).toMatch(/--shape-late:url\(["']?\.\/\.\.\/late\.svg\?rev=1#shape["']?\)/)
    expect(output!.source).not.toContain('file://')
    // The user's deletion is intent, not a missing resource.
    expect(output!.source).not.toContain('--color-old:')
    // Generated globals keep Module ownership after the transfer.
    expect(output!.source.match(/:global\(:root\)/g)!.length).toBeGreaterThanOrEqual(2)
    expect(output!.source).not.toMatch(/:global\(\.card\)/)
    expect(output!.processedGlobals?.variables).toMatchObject({ 'color-old': 1, 'color-late': 1, 'shape-late': 1 })
    expect(output!.processedGlobals?.variables).not.toHaveProperty('color-child')
    expect(JSON.parse(output!.sourceMap).sources.some((file: string) => file.includes('entry.module.css'))).toBe(true)
    // A child root inherits the entry history: it emits only globals never processed before.
    const child = join(projectDir, 'styles/child.module.css')
    writeFileSync(child, '.child{color:var(--color-late);border-color:var(--color-child)}')
    const childRun = await runHostChain(projectDir, child, { source: '.child{color:var(--color-late);border-color:var(--color-child)}', resources: { ...policy, file: child, processedGlobals: output!.processedGlobals! } }, [], true)
    expect(childRun.output!.source).not.toContain('--color-late:')
    expect(childRun.output!.source).toContain('--color-child:#010203')
    expect(childRun.output!.source).toContain(':global(:root)')
    expect(childRun.output!.processedGlobals?.variables).toMatchObject({ 'color-old': 1, 'color-late': 1, 'color-child': 1 })
    // Without resources or generated globals the pitch keeps the native pass untouched.
    const plain = await runHostChain(projectDir, child, { source: '.plain{color:red}' }, [], true)
    expect(plain.pitched[2]).toBeUndefined()
    expect(plain.pitched[0]).toBe('.plain{color:red}')
    expect(plain.css).toBe('.plain{color:red}')
  } finally {
    rmSync(projectDir, { recursive: true, force: true })
  }
})

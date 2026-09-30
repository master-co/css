import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SourceMap } from 'node:module'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { compileRenderedStylesheet, compileStylesheet } from '../src/stylesheet/index-public'

const baseManifest = {
  mixins: [
  {
    "name": "--all",
    "body": [
      {
        "type": "condition" as const,
        "condition": "@media all",
        "body": [
          {
            "type": "contents" as const,
            "fallback": []
          }
        ]
      }
    ]
  }
],
  "version": 4 as const,
  "languageVersion": 12 as const
}
function origin(result: { css: string, sourceMap?: string }, text: string) {
  expect(result.sourceMap).toBeTypeOf('string')
  const offset = result.css.indexOf(text)
  expect(offset).toBeGreaterThanOrEqual(0)
  const lines = result.css.slice(0, offset).split('\n')
  const payload = JSON.parse(result.sourceMap!)
  return { entry: new SourceMap(payload).findEntry(lines.length - 1, lines.at(-1)!.length), payload }
}

test('final CSS maps native selectors and lowered compose to authored UTF-16 locations', async () => {
  const file = '/project/entry.css'
  const source = "/* 😀 */\n@mixin --paint {padding:2rem}\n.plain{color:red}\n.card{@apply --all {padding:2rem;}}"
  const result = await compileStylesheet(file, source, { baseManifest, preserveNativeCSS: true })
  expect(origin(result, '.plain').entry).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: 2, originalColumn: 0 })
  expect(origin(result, 'padding:2rem').entry).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: 3, originalColumn: 20 })
  expect(origin(result, '.card').payload.sourcesContent).toContain(source)
})

test('rendered graph maps imported compose and native selectors after reference removal', async () => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'master-output-map-')))
  try {
    const file = join(root, 'entry.css'), child = join(root, 'child.css')
    const text = "/* child */\n@reference \"./tokens.css\";\n.card{@apply --all {padding:3rem;}}\n.plain{color:red}"
    writeFileSync(child, text)
    writeFileSync(join(root, 'tokens.css'), '@mixin --paint {padding:3rem}')
    const result = await compileRenderedStylesheet(file, '@import "./child.css";\n.root{display:block}', { baseManifest, projectDir: root, preserveNativeCSS: true })
    expect(origin(result, '.card').entry).toMatchObject({ originalSource: pathToFileURL(child).href, originalLine: 2, originalColumn: 0 })
    expect(origin(result, 'padding:3rem').entry).toMatchObject({ originalSource: pathToFileURL(child).href, originalLine: 2, originalColumn: 20 })
    expect(origin(result, '.plain').payload.sourcesContent).toContain(text)
    expect(origin(result, '.root').entry).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: 1, originalColumn: 0 })
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('raw Sass output map chains imported partial sources through native printing and compose lowering', async () => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'master-sass-output-map-')))
  try {
    const file = join(root, 'entry.scss'), partial = join(root, '_card.scss')
    const source = `@use "card";
@#{'mixin'} --paint {padding:2rem}`
    const child = ".card {\n  @media all {padding:2rem;}\n}\n.plain {color:red}"
    writeFileSync(partial, child)
    const result = await compileRenderedStylesheet(file, source, { baseManifest, projectDir: root, preserveNativeCSS: true })
    expect(origin(result, '.card').entry).toMatchObject({ originalSource: pathToFileURL(partial).href, originalLine: 0, originalColumn: 0 })
    expect(origin(result, 'padding: 2rem').entry).toMatchObject({ originalSource: pathToFileURL(partial).href, originalLine: 0 })
    expect(origin(result, '.plain').payload.sourcesContent).toContain(child)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('expanded lowering diagnostics point to the authored child rather than flattened CSS', async () => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'master-expanded-error-')))
  try {
    const child = join(root, 'child.css')
    writeFileSync(child, '/* authored */\n.card{@compose does-not-exist;}')
    await expect(compileRenderedStylesheet(join(root, 'entry.css'), '\n\n@import "./child.css";', { baseManifest, projectDir: root }))
      .rejects.toMatchObject({ diagnostics: [expect.objectContaining({ source: child, range: { start: { line: 1, character: 6 }, end: { line: 1, character: 14 } } })] })
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('native and Wasm transports retain identical rule, compose and copied graph mappings', async () => {
  const { createCompilerBindingSession } = await import('../src/session')
  const native = await createCompilerBindingSession({ binding: 'native' })
  const wasm = await createCompilerBindingSession({ binding: 'wasm' })
  try {
    const source = "@mixin --paint {padding:2rem}\n.card{@apply --all {padding:2rem;}}\n.plain{color:red}"
    const parsed = native.compileCSS(source, { from: '/entry.css' })
    expect(wasm.compileCSS(source, { from: '/entry.css' })).toEqual(parsed)
    expect(parsed.nativeMappings?.length).toBeGreaterThan(0)
    const request = { manifestInput: parsed.manifestInput, styleDefinitions: parsed.styleDefinitions ?? [], warnings: parsed.warnings }
    const lowered = native.lowerCSSDirectives(request, { baseManifest })
    expect(wasm.lowerCSSDirectives(request, { baseManifest })).toEqual(lowered)
    expect(lowered).toMatchObject({ generatedMappings: expect.arrayContaining([expect.objectContaining({ source: expect.objectContaining({ file: '/entry.css' }) })]) })
    const graph = { entry: '/entry.css', files: { '/entry.css': '@import "./child.css";', '/child.css': source }, edges: [{ from: '/entry.css', specifier: './child.css', resolved: '/child.css' }] }
    expect(wasm.resolveCSSImportGraph(graph)).toEqual(native.resolveCSSImportGraph(graph))
    expect(native.resolveCSSImportGraph(graph)).toMatchObject({ sourceMappings: expect.arrayContaining([expect.objectContaining({ source: expect.objectContaining({ file: '/child.css' }) })]) })
  } finally { native.dispose(); wasm.dispose() }
})

test('invalid host maps keep successful output tied to explicit preprocessed content', async () => {
  const file = '/project/prepared.css', source = '.card{color:red}'
  const result = await compileStylesheet(file, source, { baseManifest, preserveNativeCSS: true, sourceMap: '{invalid' })
  expect(origin(result, '.card').entry).toMatchObject({ originalSource: pathToFileURL(file).href + '?master-css-preprocessed' })
  expect(result.css).toContain('.card')
})

test('managed keyframes map to the authored definition after generated layers', async () => {
  const file = '/project/entry.css'
  const source = `/* definition */
@theme {
 @keyframes reveal { to { opacity:1 } }
}
.run{animation:reveal 1s}`
  const result = await compileRenderedStylesheet(file, source, { baseManifest, preserveNativeCSS: true })
  expect(origin(result, '@keyframes reveal').entry).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: 2, originalColumn: 1 })
  expect(result.emittedGlobals.keyframes).toEqual({ reveal: 1 })
})

test.each([false, true])('reference styles never create animation roots or native collisions, delivery=%s', async (delivery) => {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'master-keyframes-reference-')))
  try {
    const file = join(root, 'entry.css'), child = join(root, 'tokens.css')
    writeFileSync(child, `@theme{@keyframes reveal{to{opacity:1}}@keyframes unused{to{opacity:0}}}
@keyframes reveal{to{opacity:.5}}.unused{animation:var(--unknown)}`)
    const result = await compileRenderedStylesheet(file, '@reference "./tokens.css";.run{animation:reveal 1s}', {
      baseManifest, projectDir: root, preserveNativeCSS: true,
      ...(delivery ? { delivery: { entryURL: '/entry.css', stylesheetURL: (id: string) => pathToFileURL(id).href, resourceURL: (id: string) => pathToFileURL(id).href } } : {})
    })
    expect(result.css).not.toContain('@keyframes unused')
    expect(result.css.match(/@keyframes reveal/g)).toHaveLength(1)
    expect(result.emittedGlobals.keyframes).toEqual({ reveal: 1 })
    expect(origin(result, '@keyframes reveal').entry).toMatchObject({ originalSource: pathToFileURL(child).href })
  } finally { rmSync(root, { recursive: true, force: true }) }
})

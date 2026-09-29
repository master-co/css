import { expect, test } from 'vitest'
import { createCompiler, migrateRC } from '@master/css-compiler'
import { createEngine } from '@master/css'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }

const baseManifest = preset as unknown as MasterCSSManifest
const source = `
@theme { :root {
  --spacing-probe: 1rem;
  --font-family-probe: monospace;
  --font-size-probe: 2rem;
} }
@mixin --audit-dark {
  @media (prefers-color-scheme: dark) { @contents; }
}
@mixin --audit-wide { @media (width >= 40rem) { @contents; } }
@mixin --audit-card { @container card (width >= 30rem) { @contents; } }
@mixin --audit-align-start { text-align: start; }
@mixin --audit-align-end { text-align: end; }
`

const valid = [
  ["display:flex", ['display:flex']],
  ['flex:1', ['flex:1']],
  ['flex:hover', ['{flex:hover}']],
  ['display:flex:hover', [':hover{display:flex}']],
  ['color:red', ['color:red']],
  ['fg-red', ['color:var(--color-red)']],
  ["padding:8px", ['padding:8px']],
  ['p-probe', ['padding:var(--spacing-probe)']],
  ['-m-probe', ['margin:calc(var(--spacing-probe) * -1)']],
  ['audit-align-start', ['text-align:start']],
  ['audit-align-end:hover', [':hover{text-align:end}']],
  ['font-family-probe', ['font-family:var(--font-family-probe)']],
  ['font:16px', ['{font:16px}']],
  ["p-probe:hover", [':hover{', 'padding:var(--spacing-probe)']],
  ["padding-top:12px:hover", [':hover{', 'padding-top:12px']],
  ['display:block[data-state=":first"]:first', ['[data-state=":first"]:first-child']],
  [String.raw`display:block[data-state="escaped\":first"]:last`, [String.raw`[data-state="escaped\":first"]:last-child`]],
  ['display:block:is(:first,[data-state=":last"])::before', [':is(:first-child,[data-state=":last"])::before']],
  ["padding:8px@media((width>=800px))", ['@media (width>=800px)']],
  ["padding:8px@media((40rem<=width<64rem))", ['@media (40rem<=width<64rem)']],
  ["padding:8px@media((resolution>=2x))", ['@media (resolution>=2x)']],
  ["padding:8px@supports((display:grid))", ['@supports (display:grid)']],
  ["padding:8px@container(card|(width>=40rem))", ['@container card (width>=40rem)']],
  ["padding:8px@container(style(--density:compact))", ['@container style(--density:compact)']],
  ["padding:8px@apply(--audit-card)", ['@container card (width >= 30rem)']],
  ["padding:8px@apply(--audit-dark)@apply(--audit-wide)", ['prefers-color-scheme: dark', 'width >= 40rem']],
  ["padding:8px@apply(--audit-wide)@apply(--audit-dark)", ['prefers-color-scheme: dark', 'width >= 40rem']],
  ["padding:8px@media((width>=800px))@supports((display:grid))@container(card|(width>=40rem))", ['@media (width>=800px){@supports (display:grid){@container card (width>=40rem)']]
] as const

const invalid = [
  ["{p-probe;padding-top:12px}:hover", "syntax-error", "CLASS_SYNTAX_ERROR"],
  ["p-probe:of(.active)", "syntax-error", "CLASS_SYNTAX_ERROR"],
  ['ordinary-audit-class', 'unmatched', undefined],
  ['font-probe', 'ambiguous', 'AMBIGUOUS_TOKEN'],
  ['font-family-absent', 'syntax-error', 'UNKNOWN_TOKEN'],
  ["display:block@audit-undefined", 'syntax-error', 'UNKNOWN_CONDITION'],
  ['display:block@media(width>=800px)', 'syntax-error', 'MASTER_QUERY_REQUIRES_CSS'],
  ['display:block@supports(selector([lang|=en]))', 'syntax-error', 'MASTER_QUERY_REQUIRES_CSS'],
  ['padding:1px.<br', 'syntax-error', 'CLASS_SYNTAX_ERROR']
] as const

test('447: compiler and engine binding combinations agree on the language contract', async () => {
  using nativeCompiler = await createCompiler({ binding: 'native' })
  using wasmCompiler = await createCompiler({ binding: 'wasm' })
  expect(nativeCompiler.binding).toBe('native')
  expect(wasmCompiler.binding).toBe('wasm')
  const compiled = nativeCompiler.compileManifest(source, { baseManifest })
  expect(wasmCompiler.compileManifest(source, { baseManifest })).toEqual(compiled)
  using reference = await createEngine({ manifest: compiled.manifest, binding: 'native' })
  const classNames = valid.map(([className]) => className)
  reference.ensureClassRules(classNames)

  for (const compiler of [nativeCompiler, wasmCompiler]) {
    const { manifest } = compiler.compileManifest(source, { baseManifest })
    for (const binding of ['native', 'wasm'] as const) {
      using engine = await createEngine({ manifest, binding })
      expect(engine.binding).toBe(binding)
      for (const [className, fragments] of valid) {
        const inspection = engine.inspect(className)
        expect(inspection, `${compiler.binding}/${binding}: ${className}`).toEqual(reference.inspect(className))
        expect(inspection.matchStatus, className).toBe('matched')
        const css = inspection.rules.map(rule => rule.text).join('')
        for (const fragment of fragments) expect(css, className).toContain(fragment)
        if (className.includes('@')) {
          const parsed = compiler.compileManifest(css, {
            baseManifest: {
  "version": 4 as const,
  "languageVersion": 9 as const
}, preserveNativeCSS: true
          })
          expect(parsed.css, className).not.toBe('')
        }
      }
      for (const [className, status, code] of invalid) {
        const inspection = engine.inspect(className)
        expect(inspection, `${compiler.binding}/${binding}: ${className}`).toEqual(reference.inspect(className))
        expect(inspection.matchStatus, className).toBe(status)
        expect(inspection.rules, className).toEqual([])
        if (code) expect(inspection.diagnostics?.map(item => item.code), className).toContain(code)
      }
      const ambiguous = engine.inspect('font-probe')
      expect(ambiguous.diagnostics?.flatMap(item => item.notes ?? [])).toEqual(expect.arrayContaining([
        'font-family-probe', 'font-size-probe'
      ]))
      using incremental = await createEngine({ manifest, binding })
      engine.ensureClassRules(classNames)
      expect(engine.snapshot()).toEqual(reference.snapshot())
      for (const className of [...classNames].reverse()) incremental.ensureClassRules([className])
      const snapshot = engine.snapshot()
      const reversed = incremental.snapshot()
      expect(reversed.rules).toEqual(snapshot.rules)
      // Resource insertion order follows first use; distinct variable declaration
      // order is not a cascade promise. Preserve every resource and ref count.
      const byName = (left: { name: string }, right: { name: string }) => left.name.localeCompare(right.name)
      expect([...reversed.resources.variables].sort(byName)).toEqual([...snapshot.resources.variables].sort(byName))
      expect(reversed.resources).not.toHaveProperty('animations')
    }
  }
})

test('447: legacy mode settings are rejected consistently by both engine bindings', async () => {
  for (const binding of ['native', 'wasm'] as const) {
    for (const [key, value] of [
      ['modeTrigger', 'media'], ['defaultMode', 'dark'], ['modes', ['light', 'dark']], ['rootSize', 16]
    ] as const) {
      const manifest = { ...baseManifest, settings: { [key]: value } } as MasterCSSManifest
      await expect(createEngine({ manifest, binding }), `${binding}: ${key}`)
        .rejects.toThrow('settings was removed')
    }
  }
})

test('447: saved media mode settings migrate to executable custom media', async () => {
  const migrated = await migrateRC({
    from: 'rc-named',
    sourceVersion: '2.0.0-rc.named',
    manifest: {
      version: 1 as const,
      settings: { modeTrigger: 'media', modes: ['light', 'dark'] },
      conditions: {
        sm: { id: 'media', nodes: [{ type: 'number' as const, value: 52.125, unit: 'rem' }] }
      },
      utilities: []
    },
    targetManifest: baseManifest,
    targetIsPreset: true,
    classLists: [['padding:8px@dark@sm']]
  })
  expect(migrated.configurationCSS).toContain('@custom-media --dark (prefers-color-scheme:dark);')
  expect(migrated.classLists[0][0].status).not.toBe('review')
  const className = migrated.classLists[0][0].after!
  for (const binding of ['native', 'wasm'] as const) {
    using compiler = await createCompiler({ binding })
    const { manifest } = compiler.compileManifest(migrated.configurationCSS, { baseManifest })
    using engine = await createEngine({ manifest, binding })
    const inspection = engine.inspect(className)
    expect(inspection.matchStatus).toBe('matched')
    expect(inspection.rules).not.toHaveLength(0)
    for (const rule of inspection.rules) {
      expect(rule.text.match(/(?<!\\)@media\b/g), rule.text).toHaveLength(2)
      expect(rule.text).toContain('prefers-color-scheme:dark')
      expect(rule.text).toContain('padding:8px')
    }
  }
})

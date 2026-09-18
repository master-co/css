import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { resolveStylesheetSync } from '../src/stylesheet/public'

function fixture(entrySource: string, childSource?: string) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'graph-classification-')))
  const entry = join(root, 'entry.css')
  writeFileSync(entry, entrySource)
  if (childSource !== undefined) writeFileSync(join(root, 'child.css'), childSource)
  return { root, entry, remove: () => rmSync(root, { recursive: true, force: true }) }
}

/** Flattening cannot place an `@import` inside a qualifier's block, so it refuses
 *  shapes the delivery path compiles. Classification must not inherit that limit. */
test.each([
  ['named layer', '@master entry;@import "./child.css" layer(cards);'],
  ['anonymous layer', '@master entry;@import "./child.css" layer;'],
  ['supports and media', '@master entry;@import "./child.css" supports(display:grid) screen;']
])('BH-0004 a qualified parent of an unresolved external import classifies with %s', (_name, source) => {
  const f = fixture(source, '@import "https://external.invalid/style.css";.child{color:red}')
  try {
    expect(() => resolveStylesheetSync(f.entry, source, { projectDir: f.root })).toThrow(/unresolved imports/)
    const resolution = resolveStylesheetSync(f.entry, source, { projectDir: f.root, preserveImports: true })
    expect(resolution?.kind).toBe('entry')
    expect(resolution?.dependencies).toHaveLength(2)
  } finally { f.remove() }
})

test('BH-0004 local directives declared by an imported file classify the root as local', () => {
  const source = '@import "./child.css";'
  const f = fixture(source, '.child{@compose p:2rem;}')
  try {
    expect(resolveStylesheetSync(f.entry, source, { projectDir: f.root })?.kind).toBe('plain')
    const resolution = resolveStylesheetSync(f.entry, source, { projectDir: f.root, preserveImports: true })
    expect(resolution?.kind).toBe('local')
    expect(resolution?.dependencies).toHaveLength(2)
  } finally { f.remove() }
})

test.each([
  ['a plain entry', '@master entry;\n.a{color:red}', undefined, 'entry', 1],
  ['a local import', '@master entry;@import "./child.css";', '.b{color:red}', 'entry', 2],
  ['a qualified import', '@master entry;@import "./child.css" layer(cards);', '.b{color:red}', 'entry', 2],
  ['local directives', '.a{@compose p:2rem;}', undefined, 'local', 1],
  ['plain css', '.a{color:red}', undefined, 'plain', 1]
])('BH-0004 %s classifies the same either way', (_name, source, child, kind, dependencies) => {
  const f = fixture(source, child)
  try {
    for (const preserveImports of [false, true]) {
      const resolution = resolveStylesheetSync(f.entry, source, { projectDir: f.root, preserveImports })
      expect({ preserveImports, kind: resolution?.kind, dependencies: resolution?.dependencies.length })
        .toEqual({ preserveImports, kind, dependencies })
    }
  } finally { f.remove() }
})

/** A directive diagnostic raised while classifying must name the file it is in,
 *  not the compiler's default filename. */
test('BH-0004 a directive diagnostic raised during classification names its file', () => {
  const source = '/* original */\n.card{@compose "block";}'
  const f = fixture(source)
  try {
    for (const preserveImports of [false, true]) {
      let source: string | undefined
      try { resolveStylesheetSync(f.entry, '/* original */\n.card{@compose "block";}', { projectDir: f.root, preserveImports }) }
      catch (error) { source = (error as { diagnostics?: { source?: string }[] }).diagnostics?.[0]?.source }
      expect({ preserveImports, source }).toEqual({ preserveImports, source: f.entry })
    }
  } finally { f.remove() }
})

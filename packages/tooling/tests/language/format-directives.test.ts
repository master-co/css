import { beforeAll, expect, test } from 'vitest'
import { fileURLToPath } from 'node:url'
import { createPresetManifest } from './helpers/create-preset-manifest'
import type { MasterCSSToolingSession } from '../../src'
import { createTestToolingSession } from '../helpers/create-tooling-session'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(
    new URL('../../../binding/artifacts/mastercss.node', import.meta.url)
  )
})

function applyEdits(
  source: string,
  edits: ReturnType<MasterCSSToolingSession['formatDirectives']>['edits']
) {
  let result = source
  for (const edit of [...edits].sort((left, right) => right.range.start - left.range.start)) {
    result = result.slice(0, edit.range.start) + edit.text + result.slice(edit.range.end)
  }
  return result
}

function format(source: string, range?: { start: number, end: number }) {
  const session = createTestToolingSession(createPresetManifest())
  try {
    return applyEdits(source, session.formatDirectives({ source, range }).edits)
  } finally {
    session.dispose()
  }
}

test('formats safelist class lists and repairs detached important suffixes', () => {
  expect(format('@safelist "background-color:transparent !   fg-red !@sm";'))
    .toBe('@safelist "background-color:transparent! fg-red!@sm";')
})

test('leaves removed compose directives unchanged', () => {
  for (const source of ['.btn { @compose block  fg-red !; }', '.btn { @compose "block"; }', '.btn { @compose {block}; }']) {
    expect(format(source)).toBe(source)
  }
})

test('preserves safelist quote style', () => {
  expect(format("@safelist  'display:block  bg-blue !' ;")).toBe("@safelist 'display:block bg-blue!';")
})

test('normalizes directive spacing without changing block contents', () => {
  expect(format("@mixin --wrapper { &:hover { color: red; } @contents ; } @utility wrapper { &:hover { color: red; } @contents ; }\n"))
    .toBe("@mixin --wrapper { &:hover { color: red; } @contents; } @utility wrapper { &:hover { color: red; } @contents; }\n")
})

test('ignores directives inside comments and strings', () => {
  const source = '/* @compose block !; */ .x { content: "@compose block !;"; }'
  expect(format(source)).toBe(source)
})

test('can limit edits to a source range', () => {
  const source = '@safelist "bg-red !";\n@safelist "bg-blue !";'
  const start = source.indexOf('@safelist "bg-blue')
  expect(format(source, { start, end: source.length })).toBe('@safelist "bg-red !";\n@safelist "bg-blue!";')
})

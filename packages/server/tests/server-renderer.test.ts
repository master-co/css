import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  createServerCSS,
  createServerRenderer,
  render
} from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function expectCSSParity(
  actual: ReturnType<typeof render>,
  expected: ReturnType<typeof render>
) {
  expect(actual.html).toBe(expected.html)
  expect(actual.classes).toEqual(expected.classes)
  expect(actual.css?.text).toBe(expected.css?.text)
  expect(actual.css?.rules).toEqual(expected.css?.rules)
  expect(actual.hydrationManifest).toEqual(expected.hydrationManifest)
}

test('reuses a manifest renderer without leaking rules between pages', () => {
  const renderer = createServerRenderer(defaultManifest)
  const firstHTML = '<main class="fg:red block"></main>'
  const secondHTML = '<main class="fg:blue"></main>'
  const first = renderer.render(firstHTML)
  const second = renderer.render(secondHTML)
  const expectedFirst = render(firstHTML, defaultManifest)
  const expectedSecond = render(secondHTML, defaultManifest)

  try {
    expectCSSParity(first, expectedFirst)
    expectCSSParity(second, expectedSecond)
    expect(second.css?.text).not.toContain('.fg\\:red')
  } finally {
    first.css?.dispose()
    second.css?.dispose()
    expectedFirst.css?.dispose()
    expectedSecond.css?.dispose()
    renderer.dispose()
  }
})

test('creates page-local CSS views that accumulate classes progressively', () => {
  const renderer = createServerRenderer(defaultManifest)
  const css = renderer.createCSS()
  const expected = createServerCSS(defaultManifest)

  try {
    css.ensureClassRules('fg:red')
    css.ensureClassRules('bg:blue', 'fg:red')
    expected.ensureClassRules('fg:red', 'bg:blue')

    expect(css.text).toBe(expected.text)
    expect(css.rules).toEqual(expected.rules)
    expect(css.hydrationManifest).toEqual(expected.hydrationManifest)
  } finally {
    css.dispose()
    expected.dispose()
    renderer.dispose()
  }
})

test('rebuilds bounded cache generations without changing output', () => {
  const renderer = createServerRenderer(defaultManifest, { maxCachedClasses: 2 })
  const pages = [
    '<div class="fg:red bg:blue"></div>',
    '<div class="block"></div>',
    '<div class="fg:red"></div>'
  ]

  try {
    for (const html of pages) {
      const actual = renderer.render(html)
      const expected = render(html, defaultManifest)
      try {
        expectCSSParity(actual, expected)
      } finally {
        actual.css?.dispose()
        expected.css?.dispose()
      }
    }
  } finally {
    renderer.dispose()
  }
})

test('renders oversized pages outside the bounded cache', () => {
  const renderer = createServerRenderer(defaultManifest, { maxCachedClasses: 1 })
  const html = '<div class="fg:red bg:blue"></div>'
  const actual = renderer.render(html)
  const expected = render(html, defaultManifest)

  try {
    expectCSSParity(actual, expected)
  } finally {
    actual.css?.dispose()
    expected.css?.dispose()
    renderer.dispose()
  }
})

test('validates cache bounds and preserves materialized snapshots after disposal', () => {
  for (const maxCachedClasses of [0, -1, 1.5, Number.NaN, Number.NEGATIVE_INFINITY]) {
    expect(() => createServerRenderer(defaultManifest, { maxCachedClasses })).toThrow(TypeError)
  }

  const unbounded = createServerRenderer(defaultManifest, { maxCachedClasses: Infinity })
  expect(unbounded.maxCachedClasses).toBe(Infinity)
  unbounded.dispose()

  const renderer = createServerRenderer(defaultManifest)
  const result = renderer.render('<div class="fg:red"></div>')
  const text = result.css?.text
  renderer.dispose()
  renderer.dispose()

  expect(result.css?.text).toBe(text)
  expect(() => renderer.render('<div></div>')).toThrow('ServerRenderer has been disposed.')
  expect(() => result.css?.ensureClassRules('bg:blue')).toThrow('ServerRenderer has been disposed.')
})

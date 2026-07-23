import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createHTMLRenderSession, createServerRenderer, renderHTML } from '../src'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function expectHTMLParity(
  actual: ReturnType<typeof renderHTML>,
  expected: ReturnType<typeof renderHTML>
) {
  expect(actual.html).toBe(expected.html)
  expect(actual.classNames).toEqual(expected.classNames)
  expect(actual.cssText).toBe(expected.cssText)
  expect(actual.invalidClassNames).toEqual(expected.invalidClassNames)
  expect(actual.hydrationManifest).toEqual(expected.hydrationManifest)
}

test('reuses a renderer without leaking rules between documents', () => {
  using renderer = createServerRenderer({ manifest: defaultManifest })
  const firstHTML = '<main class="fg:red block"></main>'
  const secondHTML = '<main class="fg:blue"></main>'
  const first = renderer.renderHTML(firstHTML)
  const second = renderer.renderHTML(secondHTML)

  expectHTMLParity(first, renderHTML(firstHTML, { manifest: defaultManifest }))
  expectHTMLParity(second, renderHTML(secondHTML, { manifest: defaultManifest }))
  expect(second.cssText).not.toContain('.fg\\:red')
})

test('preserves native aliases that share a declaration across cached pages', () => {
  const manifest = {
    version: 1,
    variables: {
      '': [{
        name: 'stripe',
        key: 'stripe',
        type: 'string',
        value: 'linear-gradient(red,blue)'
      }]
    },
    utilities: []
  } as unknown as MasterCSSManifest
  using renderer = createServerRenderer({
    manifest,
    maxCachedClasses: Infinity
  })
  renderer.renderHTML('<div class="background:var(--stripe)"></div>')
  const second = renderer.renderHTML('<div class="bg:stripe"></div>')

  expectHTMLParity(second, renderHTML('<div class="bg:stripe"></div>', { manifest }))
  expect(second.cssText).toContain('.bg\\:stripe{background:var(--stripe)}')
})

test('rebuilds bounded cache generations without changing output', () => {
  using renderer = createServerRenderer({
    manifest: defaultManifest,
    maxCachedClasses: 2
  })
  const pages = [
    '<div class="fg:red bg:blue"></div>',
    '<div class="block"></div>',
    '<div class="fg:red"></div>'
  ]

  for (const html of pages) {
    expectHTMLParity(
      renderer.renderHTML(html),
      renderHTML(html, { manifest: defaultManifest })
    )
  }
})

test('renders oversized pages outside the bounded cache', () => {
  using renderer = createServerRenderer({
    manifest: defaultManifest,
    maxCachedClasses: 1
  })
  const html = '<div class="fg:red bg:blue"></div>'
  expectHTMLParity(
    renderer.renderHTML(html),
    renderHTML(html, { manifest: defaultManifest })
  )
})

test('validates cache bounds and preserves immutable results after disposal', () => {
  for (const maxCachedClasses of [0, -1, 1.5, Number.NaN, Number.NEGATIVE_INFINITY]) {
    expect(() => createServerRenderer({
      manifest: defaultManifest,
      maxCachedClasses
    })).toThrow(TypeError)
  }

  const unbounded = createServerRenderer({
    manifest: defaultManifest,
    maxCachedClasses: Infinity
  })
  expect(unbounded.maxCachedClasses).toBe(Infinity)
  unbounded.dispose()

  const renderer = createServerRenderer({ manifest: defaultManifest })
  const result = renderer.renderHTML('<div class="fg:red"></div>')
  renderer.dispose()
  renderer.dispose()

  expect(result.cssText).toContain('.fg\\:red')
  expect(Object.isFrozen(result)).toBe(true)
  expect(() => renderer.renderHTML('<div></div>')).toThrow(
    'The Master CSS server renderer has been disposed.'
  )
})

test('streams the stable document prefix across arbitrary chunk boundaries', () => {
  using renderer = createServerRenderer({ manifest: defaultManifest })
  using session = renderer.createHTMLRenderSession({ hydrationManifest: 'inject' })

  expect(session.write('<ht')).toBe('')
  expect(session.write('ml><he')).toBe('')
  const prefix = session.write('ad></he')
  expect(prefix).toBe('<html><head>')
  const ended = session.end('ad><body><div class="text-center"></div></body></html>')

  expect(prefix + ended.chunk).toBe(ended.result.html)
  expect(ended.result.cssText).toBe('@layer utilities{.text-center{text-align:center}}')
  expect(ended.chunk).toContain('master-css-hydration-manifest')
  expect(() => session.write('later')).toThrow('The Master CSS HTML render session has ended.')
})

test('returns a complete final chunk when no prefix can be emitted safely', () => {
  using session = createHTMLRenderSession({
    manifest: defaultManifest,
    hydrationManifest: 'inject'
  })

  expect(session.write('<html lang="en"><head>')).toBe('')
  const ended = session.end('<body class="block"></body></html>')

  expect(ended.chunk).toBe(ended.result.html)
  expect(ended.result.cssText).toBe('@layer utilities{.block{display:block}}')
})

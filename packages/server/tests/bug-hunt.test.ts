import { expect, test } from 'vitest'
import { parseDocument } from 'htmlparser2'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { renderHTML } from '../src'

const manifest = defaultManifestJSON as unknown as MasterCSSManifest

test('BH-0005: HTML character references form browser class separators', () => {
  const result = renderHTML('<div class="block&#32;hidden"></div>', { manifest })
  expect(result.classNames).toEqual(['block', 'hidden'])
  expect(result.cssText).toContain('.hidden{display:none}')
})

test.each([
  ['&#x62;lock&#9;hidden', ['block', 'hidden']],
  ['block&NewLine;hidden&Tab;flex', ['block', 'hidden', 'flex']],
  ['block&nbsp;hidden', ['block\u00a0hidden']],
  ['block\vhidden', ['block\vhidden']],
  ['block&amp;#32;hidden', ['block&#32;hidden']],
  ['&NotEqualTilde; &nbsp;', ['\u2242\u0338', '\u00a0']],
  ['&copy=1 &copy;', ['&copy=1', '\u00a9']]
])('BH-0005 decodes attribute references once with ASCII separators: %s', (value, expected) => {
  const result = renderHTML(`<div class="${value}"></div>`, { manifest })
  expect(result.classNames).toEqual(expected)
})

test('BH-0006: escaped class content cannot create executable HTML elements', () => {
  const input = '<div class="content:\'&lt;/style&gt;&lt;script&gt;globalThis.__audit=1&lt;/script&gt;\'"></div>'
  expect(parseDocument(input).children.filter((node) => node.type === 'script')).toHaveLength(0)
  const result = renderHTML(input, { manifest })
  const scripts = parseDocument(result.html).children.filter((node) => node.type === 'script')
  expect(scripts).toHaveLength(0)
})

test('BH-0007: static resources render even when HTML has no class attributes', () => {
  const staticManifest: MasterCSSManifest = {
    version: 1,
    variables: { color: [{ key: 'brand', value: 'red', static: true }] },
    utilities: []
  }
  const result = renderHTML('<p style="color:var(--color-brand)">text</p>', { manifest: staticManifest })
  expect(result.cssText).toContain('--color-brand:red')
})

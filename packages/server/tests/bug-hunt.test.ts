import { expect, test } from 'vitest'
import { parseDocument } from 'htmlparser2'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { renderHTML } from '../src'

const manifest = defaultManifestJSON as unknown as MasterCSSManifest

test('BH-0005: HTML character references form browser class separators', () => {
  const result = renderHTML('<div class="display:block&#32;display:none"></div>', { manifest })
  expect(result.classNames).toEqual(["display:block", "display:none"])
  expect(result.cssText).toContain(".display\\:none{display:none}")
})

test.each([
  ['display:&#x62;lock&#9;display:none', ["display:block", "display:none"]],
  ['display:block&NewLine;display:none&Tab;display:flex', ["display:block", "display:none", "display:flex"]],
  ['display:block&nbsp;display:none', ["display:block display:none"]],
  ["display:block\u000bdisplay:none", ["display:block\u000bdisplay:none"]],
  ['display:block&amp;#32;display:none', ['display:block&#32;display:none']],
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

test('BH-0007: unused theme tokens are absent when HTML has no class attributes', () => {
  const staticManifest: MasterCSSManifest = {
  "theme": [
    {
      "type": "rule" as const,
      "prelude": ":root,:host",
      "children": [
        {
          "type": "declaration" as const,
          "name": "color-brand",
          "value": "red"
        }
      ]
    }
  ],
  "version": 4 as const,
  "languageVersion": 13 as const,
  "variables": {
    "color": [
      {
        "key": "brand",
        "values": [
          {
            "path": [
              ":root,:host"
            ],
            "value": "red"
          }
        ]
      }
    ]
  }
}
  const result = renderHTML('<p style="color:var(--color-brand)">text</p>', { manifest: staticManifest })
  expect(result.cssText).toBe('')
})

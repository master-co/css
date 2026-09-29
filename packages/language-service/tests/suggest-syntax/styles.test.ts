import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './helper'
import type { Settings } from '../helpers/rc87-language-service'
import { createPresetManifest } from '../helpers/create-preset-manifest'

const settings: Settings = {
  manifest: createPresetManifest({
    mixins: [
  {
    "name": "--btn",
    "body": [
      {
        "type": "rule" as const,
        "selector": "&",
        "body": [
          {
            "type": "declaration" as const,
            "property": "display",
            "value": [
              {
                "type": "text" as const,
                "value": "inline-block"
              }
            ]
          }
        ]
      }
    ]
  }
]
  })
}
it.concurrent('info', () => expect(hint('b', settings)?.find(({ label }) => label === 'btn')).toMatchObject({
  detail: 'mixin',
  documentation: {
    kind: 'markdown',
    value: dedent`
      \`\`\`css
      @layer utilities {
        .btn {
          display: inline-block
        }
      }
      \`\`\`
    `
  }
}))
it.concurrent('offers states after a mixin', () => expect(hint('btn:', settings)?.map(({ label }) => label)).toContain(':hover'))


test('quoted mixin arguments do not become completion query delimiters', () => {
  const manifest = createPresetManifest({ mixins: [{
    name: '--label',
    parameters: [{ name: '--value', syntax: 'string' }],
    body: [{ type: 'declaration', property: 'content', value: [{ type: 'function', name: 'var', value: [{ type: 'text', value: '--value' }] }] }]
  }] })
  expect(hint("label('a@b'):", { manifest })?.map(({ label }) => label)).toContain(':hover')
  expect(hint("label('a@b')@", { manifest })?.map(({ label }) => label)).toContain('@sm')
})

import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './helper'
import type { Settings } from '../helpers/rc87-language-service'
import { createPresetManifest } from '../helpers/create-preset-manifest'

const settings: Settings = {
  manifest: createPresetManifest({
    utilities: [
      {
        name: 'btn',
        layer: 'components',
        rules: [
          { selector: '&', declarations: { display: 'inline-block' } }
        ]
      }
    ]
  })
}
it.concurrent('info', () => expect(hint('b', settings)?.find(({ label }) => label === 'btn')).toMatchObject({
  detail: 'component',
  documentation: {
    kind: 'markdown',
    value: dedent`
      \`\`\`css
      @layer components {
        .btn {
          display: inline-block
        }
      }
      \`\`\`
    `
  }
}))
it.concurrent('types btn: and should not hint', () => expect(hint('btn:', settings)).toBe(undefined))


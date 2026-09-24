import { beforeAll, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { validateCSS } from '../../src/css'
import { createTestToolingSession } from '../helpers/create-tooling-session'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(
    new URL('../../../binding/artifacts/mastercss.node', import.meta.url)
  )
})

it('validates classes through a Rust session with independent CSS value checks', () => {
  const validator = createTestToolingSession(defaultManifest)
  try {
    const classNames = [
      'text-center',
      'font-size:.75rem@media(print)',
      'mt:var(--top)',
      'right:max(0px,calc(50%-45.3125rem))',
      '{text-wrap:pretty}',
      'display:block',
      'color:oklch(63.7%|0.237|25.331)',
      'text-align:asdf',
      'made-up:left'
    ]
    const result = validator.validateClassNames(classNames)
    const byClass = new Map(result.classes.map((value) => [value.className, value]))

    for (const className of classNames.slice(0, 7)) {
      const generated = byClass.get(className)!
      expect(generated.matchStatus, className).toBe('matched')
      expect(generated.rules.flatMap(({ text }) => validateCSS(text)), className).toEqual([])
    }
    expect(byClass.get('text-align:asdf')?.cssValueStatus).toBe('unknown')
    expect(byClass.get('text-align:asdf')?.rules[0].text).toContain('{text-align:asdf}')
    expect(byClass.get('made-up:left')?.cssValueStatus).toBe('unknown')
  } finally {
    validator.dispose()
  }
})

it('preserves native declarations while reporting invalid CSS values', () => {
  const validator = createTestToolingSession(defaultManifest)
  try {
    const result = validator.validateClassNames([
      'float:left',
      'view-transition-name:hero',
      '--foo:123',
      'float:16px',
      'display:16px'
    ])
    expect(result.classes[0].rules[0]?.text).toBe('.float\\:left{float:left}')
    expect(result.classes[1].rules[0]?.text)
      .toBe('.view-transition-name\\:hero{view-transition-name:hero}')
    expect(result.classes[2].rules[0]?.text).toContain('{--foo:123}')
    expect(result.classes[3].cssValueStatus).toBe('invalid')
    expect(result.classes[4].cssValueStatus).toBe('invalid')
  } finally {
    validator.dispose()
  }
})

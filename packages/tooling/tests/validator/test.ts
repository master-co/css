import { beforeAll, expect, it } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createValidatorSync } from '../../src/validator/node'
import validateCSS from '../../src/validator/validate-css'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

it('validates classes through a Rust session and host CSS oracle', () => {
  const validator = createValidatorSync(defaultManifest)
  try {
    const classNames = [
      'text-center',
      'font:.75rem@media(print)',
      'mt:var(--top)',
      'right:max(0px,calc(50%-45.3125rem))',
      '{text-wrap:pretty}',
      'display:block',
      'color:oklch(63.7%|0.237|25.331)',
      'text-align:asdf',
      'made-up:left'
    ]
    const result = validator.generate(classNames)
    const byClass = new Map(result.classes.map((value) => [value.className, value]))

    for (const className of classNames.slice(0, 7)) {
      const generated = byClass.get(className)!
      expect(generated.matched, className).toBe(true)
      expect(generated.rules.flatMap(({ text }) => validateCSS(text)), className).toEqual([])
    }
    expect(byClass.get('text-align:asdf')?.matched).toBe(false)
    expect(byClass.get('text-align:asdf')?.rules).toEqual([])
    expect(byClass.get('made-up:left')?.matched).toBe(false)
  } finally {
    validator.dispose()
  }
})

it('keeps native declarations behind host support checks', () => {
  const validator = createValidatorSync(defaultManifest)
  try {
    const result = validator.generate([
      'float:left',
      'view-transition-name:hero',
      '--foo:123',
      'float:banana',
      'display:banana'
    ])
    expect(result.classes[0].rules[0]?.text).toBe('.float\\:left{float:left}')
    expect(result.classes[1].rules[0]?.text)
      .toBe('.view-transition-name\\:hero{view-transition-name:hero}')
    expect(result.classes[2].rules[0]?.text).toContain('{--foo:123}')
    expect(result.classes[3].matched).toBe(false)
    expect(result.classes[4].matched).toBe(false)
  } finally {
    validator.dispose()
  }
})

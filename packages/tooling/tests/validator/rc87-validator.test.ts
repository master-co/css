import { afterAll, expect, it } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { validateCSS } from '../../src/css'
import { createTestToolingSession } from '../helpers/create-tooling-session'

const validator = createTestToolingSession(defaultManifestJSON as unknown as MasterCSSManifest)

afterAll(() => validator.dispose())

function generateValidRules(className: string) {
  const result = validator.validateClassNames([className]).classes[0]
  if (!result?.matched || result.rules.some(({ text }) => validateCSS(text).length)) return []
  return result.rules
}

function validate(className: string) {
  const rules = generateValidRules(className)
  return { errors: rules.length ? [] : [{ className }] }
}

function expectClassWithErrors(className: string) {
  expect(validate(className).errors.length).toBeGreaterThan(0)
}

function expectClassWithoutErrors(className: string) {
  expect(validate(className).errors).toEqual([])
}

function expectClassInvalid(className: string) {
  expect(generateValidRules(className)).toHaveLength(0)
}

function expectClassValid(className: string) {
  expect(generateValidRules(className).length).toBeGreaterThan(0)
}

it('validate an invalid CSS property value', () => {
  expectClassWithErrors('text-align:asdf')
  expectClassInvalid('text-align:asdf')
})

it('validate valid classes', () => {
  expectClassWithoutErrors('text-center')
  expectClassWithoutErrors('font:.75rem@media(print)')
  expectClassWithoutErrors('mt:var(--top)')
  expectClassWithoutErrors('right:max(0px,calc(50%-45.3125rem))')
  expectClassWithoutErrors('{text-wrap:pretty}')
  expectClassWithoutErrors('{content:\'\';block}::after@light')
  expect(validate('bg:light-dark(#333b3c,#efefec)').errors).toEqual([])
  expectClassValid('text-center')
  expectClassValid('font:.75rem@media(print)')
  expectClassValid('mt:var(--top)')
  expectClassValid('right:max(0px,calc(50%-45.3125rem))')
  expectClassValid('{text-wrap:pretty}')
  expectClassValid('{content:\'\';block}::after@light')
})

it('create rules by class', () => {
  expect(generateValidRules('text-center')).toHaveLength(1)
  expect(generateValidRules('text:cente')).toHaveLength(0)
})

it('validates native CSS declarations through css-tree fallback', () => {
  expect(generateValidRules('float:left')[0]?.text).toBe('.float\\:left{float:left}')
  expect(generateValidRules('display:block')[0]?.text).toBe('.display\\:block{display:block}')
  expect(generateValidRules('field-sizing:content')[0]?.text).toBe('.field-sizing\\:content{field-sizing:content}')
  expect(generateValidRules('transition-behavior:allow-discrete')[0]?.text)
    .toBe('.transition-behavior\\:allow-discrete{transition-behavior:allow-discrete}')
  expect(generateValidRules('view-transition-name:hero')[0]?.text)
    .toBe('.view-transition-name\\:hero{view-transition-name:hero}')
  expect(generateValidRules('color:oklch(63.7%|0.237|25.331)')[0]?.text)
    .toBe('.color\\:oklch\\(63\\.7\\%\\|0\\.237\\|25\\.331\\){color:oklch(63.7% 0.237 25.331)}')
  expect(generateValidRules('--foo:123')[0]?.text).toContain('{--foo:123}')

  expect(generateValidRules('$foo:123')).toHaveLength(0)
  expect(generateValidRules('mt:$(top)')).toHaveLength(0)
  expect(generateValidRules('made-up:left')).toHaveLength(0)
  expect(generateValidRules('float:banana')).toHaveLength(0)
  expect(generateValidRules('display:banana')).toHaveLength(0)
  expect(generateValidRules('d:banana')).toHaveLength(0)
})

it('fairly irregular classes can be ignored very well', () => {
  expect(generateValidRules('shadow:rgba(45,43,37,0.05)|0|-1|0|0|inset,rgba(15,14,12,')).toHaveLength(0)
})

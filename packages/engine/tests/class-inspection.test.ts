import { describe, expect, test } from 'vitest'
import {
  inspectMasterCSSClass,
  normalizeMasterCSSNumericValue
} from '../src/inspect'
import { createDefaultCSS } from './helpers/css-tester'

describe('class inspection', () => {
  test('inspects key/value utilities with variants and token metadata', () => {
    const css = createDefaultCSS()
    const inspection = inspectMasterCSSClass(css, 'fg:red-60:hover@sm')

    expect(inspection).toMatchObject({
      className: 'fg:red-60:hover@sm',
      base: 'fg:red-60',
      suffix: ':hover@sm',
      key: 'fg',
      value: 'red-60',
      keyToken: 'fg:',
      valueToken: 'red-60',
      stateToken: ':hover@sm',
      matcherTypes: ['key']
    })
    expect(inspection.rules).toHaveLength(1)
    expect(inspection.variables.has('red-60')).toBe(true)
    expect(inspection.variableEntries.some(({ key }) => key === 'red-60')).toBe(true)
  })

  test('inspects static utilities and important suffixes', () => {
    const css = createDefaultCSS()

    expect(inspectMasterCSSClass(css, 'block:hover')).toMatchObject({
      base: 'block',
      suffix: ':hover',
      stateToken: ':hover'
    })
    expect(inspectMasterCSSClass(css, 'm:16px!@sm')).toMatchObject({
      base: 'm:16px',
      suffix: '!@sm',
      key: 'm',
      value: '16px',
      keyToken: 'm:',
      valueToken: '16px',
      stateToken: '@sm',
      important: true
    })
  })

  test('falls back to lexical class parts for unknown classes', () => {
    const css = createDefaultCSS()

    expect(inspectMasterCSSClass(css, 'unknown:1.5:hover')).toMatchObject({
      rules: [],
      base: 'unknown:1.5',
      suffix: ':hover',
      key: 'unknown',
      value: '1.5',
      matcherTypes: []
    })
  })

  test('normalizes number, rem, px, and base-unit numeric values', () => {
    const css = createDefaultCSS()

    expect(normalizeMasterCSSNumericValue(css, 1)).toEqual({ kind: 'number', value: 1 })
    expect(normalizeMasterCSSNumericValue(css, '1rem')).toEqual({ kind: 'rem', value: 1 })
    expect(normalizeMasterCSSNumericValue(css, '16px')).toEqual({ kind: 'rem', value: 1 })
    expect(normalizeMasterCSSNumericValue(css, '4x')).toEqual({
      kind: 'rem',
      value: 4 * css.settings.baseUnit / css.settings.rootSize
    })
    expect(normalizeMasterCSSNumericValue(css, '50%')).toBeUndefined()
  })
})

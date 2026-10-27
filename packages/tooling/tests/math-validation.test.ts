import { describe, expect, it } from 'vitest'
import { cssValueStatus } from '../src/value-validation'

describe('known CSS math grammar', () => {
  it.each(['calc(1px + )', 'min(1px,,2px)', 'clamp(1px,2px)', 'pow(2)', 'log()', 'log(1,2,3)', 'round(up,,2px)', 'sin(1,2)', 'calc(var(--size) + )', 'min(calc(1px + ),var(--size))'])('diagnoses %s', value => {
    expect(cssValueStatus('width', value)).toBe('invalid')
  })
  it.each(['calc(1px + 2px)', 'calc(log(2)*1px)', 'round(up,2px,1px)', 'min(1px,2px)', 'clamp(1px,2px,3px)', 'calc(1px / 1px * 2px)'])('retains %s', value => {
    expect(cssValueStatus('width', value)).not.toBe('invalid')
  })
  it.each(['calc(var(--size))', 'clamp(var(--args))', 'calc(--future())', 'calc(1future + 1px)'])('does not infer %s', value => {
    expect(cssValueStatus('width', value)).toBe('unknown')
  })
  it('does not impose property grammar on custom property token streams', () => {
    expect(cssValueStatus('--expression', 'calc(1px + )')).toBe('unknown')
  })
})

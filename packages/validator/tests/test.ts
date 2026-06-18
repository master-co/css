import { test, it, expect } from 'vitest'
import { generateValidRules, validate } from '../src'
import expectClassWithErrors from './utils/expect-class-with-errors'
import expectClassWithoutErrors from './utils/expect-class-without-errors'
import expectClassInvalid from './utils/expect-class-invalid'
import expectClassValid from './utils/expect-class-valid'

it('validate an invalid CSS property value', () => {
    expectClassWithErrors('text-align:asdf')
    expectClassInvalid('text-align:asdf')
})

it('validate valid classes', () => {
    expectClassWithoutErrors('text-center')
    expectClassWithoutErrors('font:.75rem@media(print)')
    expectClassWithoutErrors('mt:$(top)')
    expectClassWithoutErrors('right:max(0px,calc(50%-45.3125rem))')
    expectClassWithoutErrors('{text-wrap:pretty}')
    expectClassWithoutErrors('{content:\'\';block}::after@light')
    expect(validate('bg:light-dark(#333b3c,#efefec)').errors).toEqual([])
    expectClassValid('text-center')
    expectClassValid('font:.75rem@media(print)')
    expectClassValid('mt:$(top)')
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
    expect(generateValidRules('made-up:left')).toHaveLength(0)
    expect(generateValidRules('float:banana')).toHaveLength(0)
    expect(generateValidRules('display:banana')).toHaveLength(0)
    expect(generateValidRules('d:banana')).toHaveLength(0)
})

it('fairly irregular classes can be ignored very well', () => {
    expect(generateValidRules('shadow:rgba(45,43,37,0.05)|0|-1|0|0|inset,rgba(15,14,12,')).toHaveLength(0)
})

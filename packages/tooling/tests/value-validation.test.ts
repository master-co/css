import { cssSyntaxStatus, CSS_SYNTAX_CHECK } from '../src/syntax-validation'
import { describe, expect, it } from 'vitest'
import { cssValueStatus, withCSSValueValidation, validateRuleDeclarations, CSS_VALUE_CHECK } from '../src/value-validation'

describe('CSS validation reports knowledge without changing declarations', () => {
  it.each([
    ['--pipe', 'a|b', 'unknown'],
    ['--money', '$100', 'unknown'],
    ['--data', '{"x": [1, 2]}', 'unknown'],
    ['font', '16px', 'invalid'],
    ['padding', 'red', 'invalid'],
    ['grid-template-columns', 'repeat(2.5,minmax(0,1fr))', 'invalid'],
    ['grid-template-columns', 'repeat(foo,minmax(0,1fr))', 'invalid'],
    ['grid-template-columns', 'repeat(3,minmax(0,1fr))', 'valid'],
    ['color', 'red', 'valid'],
    ['padding', 'var(--spacing)', 'unknown'],
    ['width', '--space(2)', 'unknown'],
    ['width', '2future', 'unknown'],
    ['future-property', 'future-value', 'unknown'],
    ['display', 'future-layout', 'unknown'],
    ['padding', 'future-spacing', 'unknown'],
    ['future-property', 'repeat(foo)', 'unknown'],
    ['content', '"a|b"', 'valid']
  ])('%s:%s is %s', (property, value, status) => {
    expect(cssValueStatus(property, value)).toBe(status)
  })

  it('checks descriptor grammars in their native at-rule context', () => {
    const declarations = validateRuleDeclarations('@font-face{font-weight:100 900;src:url(font.woff2)}@media all{.a{font-weight:100 900}}@page{size:A4;margin:1cm;@top-center{content:"Title"}}@property --x{syntax:"<length>";inherits:false;initial-value:0px}')
    expect(declarations.map(({ property, status, atRule }) => [atRule, property, status])).toEqual([
      ['font-face', 'font-weight', 'valid'], ['font-face', 'src', 'valid'],
      [undefined, 'font-weight', 'invalid'], ['page', 'size', 'valid'], ['page', 'margin', 'valid'],
      ['top-center', 'content', 'valid'], ['property', 'syntax', 'valid'],
      ['property', 'inherits', 'valid'], ['property', 'initial-value', 'valid']
    ])
    expect(validateRuleDeclarations('@font-face{font-weight:red;future-descriptor:future(1)}').map(d => d.status)).toEqual(['invalid', 'unknown'])
  })

  it('checks every declaration in managed and conditional rules', () => {
    const rules = [{ text: '@media (width>1px){.grid{display:grid;grid-template-columns:repeat(2.5,minmax(0,1fr))}}' }]
    const result = withCSSValueValidation({ className: 'grid-cols:2.5', rules })
    expect(result.rules).toBe(rules)
    expect(result.declarations.map(declaration => declaration.status)).toEqual(['valid', 'invalid'])
    expect(result.cssValueStatus).toBe('invalid')
    expect(result.browserSupport).toBe('not-checked')
    expect(result.checks).toEqual([CSS_SYNTAX_CHECK, CSS_VALUE_CHECK])
    expect(result.diagnostics[0]).toMatchObject({ code: 'CSS_VALUE_INVALID', phase: 'css-value', severity: 'error' })
  })
})

it('checks custom-property structure separately from its unknown value grammar', () => {
  expect(cssSyntaxStatus('.a{--data:{"x":[1,2]};--money:$100;--pipe:a|b}')).toBe('valid')
  expect(cssSyntaxStatus('.a{--data:{"x":[1,2]}')).toBe('invalid')
  expect(cssSyntaxStatus('.a{--value:"unterminated}')).toBe('invalid')
})

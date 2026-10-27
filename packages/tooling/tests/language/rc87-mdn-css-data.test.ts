import { expect, test } from 'vitest'
import {
  getMdnPropertySyntax,
  getMdnPropertyValueNames
} from '../../src/language/utils/mdn-css-data'

test.concurrent('uses unprefixed MDN syntax for vendor-prefixed properties', () => {
  const syntax = getMdnPropertySyntax('text-size-adjust')

  expect(syntax).toBeTruthy()
  expect(getMdnPropertySyntax('-webkit-text-size-adjust')).toBe(syntax)
  expect(getMdnPropertySyntax('-moz-text-size-adjust')).toBe(syntax)
  expect(getMdnPropertySyntax('-ms-text-size-adjust')).toBe(syntax)
  expect(getMdnPropertyValueNames('-webkit-text-size-adjust')).toEqual(expect.arrayContaining(['auto', 'none']))
})

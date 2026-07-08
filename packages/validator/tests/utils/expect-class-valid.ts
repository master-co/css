import { expect } from 'vitest'
import { validate } from '../../src'

export default function expectClassValid(syntax: string) {
  const errors = validate(syntax).errors
  expect(errors).toEqual([])
}
import { describe, expect, it } from 'vitest'
import {
  MasterCSSError,
  type MasterCSSDiagnostic
} from '../src/diagnostics'

describe('MasterCSSError', () => {
  it('exposes one immutable structured payload', () => {
    const diagnostics: readonly MasterCSSDiagnostic[] = Object.freeze([Object.freeze({
      version: 1,
      code: 'INVALID_CLASS',
      domain: 'engine',
      severity: 'error',
      message: 'Invalid class name.'
    })])
    const error = new MasterCSSError({
      code: 'ENGINE_FAILED',
      domain: 'engine',
      message: 'Engine operation failed.',
      diagnostics
    })

    expect(Object.isFrozen(error.payload)).toBe(true)
    expect(error.payload).toEqual({
      code: 'ENGINE_FAILED',
      domain: 'engine',
      message: 'Engine operation failed.',
      diagnostics
    })
    expect(error.toJSON()).toBe(error.payload)
  })
})

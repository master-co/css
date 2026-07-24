import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { describe, expect, it } from 'vitest'
import {
  createEngineBindingSession,
  createRenderBindingSession
} from '../src/engine-binding'
import { createCompilerBindingSession } from '../src/compiler-binding'
import { createToolingBinding } from '../src/tooling-binding'

const manifest = Object.freeze({
  version: 1,
  utilities: Object.freeze([Object.freeze({
    id: 'display-block',
    name: 'block',
    type: -2,
    emit: Object.freeze({
      type: 'static',
      rules: Object.freeze([Object.freeze({
        declarations: Object.freeze({ display: 'block' })
      })])
    }),
    matchers: Object.freeze([Object.freeze({
      type: 'static',
      name: 'block'
    })])
  })])
}) as unknown as MasterCSSManifest

describe('binding loader', () => {
  it('normalizes operation failures and disposes engine sessions idempotently', async () => {
    const session = await createEngineBindingSession(
      { manifest },
      { binding: 'native' }
    )
    expect(session.ensureClassRules(['block']).mutations).toHaveLength(1)
    session.dispose()
    session.dispose()
    expect(() => session.snapshot()).toThrowError(expect.objectContaining({
      code: 'SESSION_DISPOSED',
      domain: 'engine',
      payload: expect.objectContaining({
        code: 'SESSION_DISPOSED',
        domain: 'engine'
      })
    }))
  })

  it('disposes render sessions idempotently', async () => {
    const session = await createRenderBindingSession(
      { manifest },
      { binding: 'wasm' }
    )
    session.ensureClassRules(['block'])
    expect(session.snapshot().snapshot.text).toContain('.block{display:block}')
    session.dispose()
    session.dispose()
    expect(() => session.snapshot()).toThrowError(expect.objectContaining({
      code: 'SESSION_DISPOSED',
      domain: 'server'
    }))
  })

  it('normalizes compiler errors as structured Master CSS errors', async () => {
    const compiler = await createCompilerBindingSession({ binding: 'native' })
    try {
      expect(() => compiler.compileCSSDirectives(`
        @utilities {
          x-<> {
            color: --value();
          }
        }
      `)).toThrowError(expect.objectContaining({
        domain: 'compiler',
        payload: expect.objectContaining({
          domain: 'compiler',
          diagnostics: expect.any(Array)
        })
      }))
    } finally {
      compiler.dispose()
      compiler.dispose()
    }
  })

  it('owns tooling session disposal', async () => {
    const tooling = await createToolingBinding({ binding: 'wasm' })
    const lexer = await tooling.createLexerSession()
    expect(lexer.analyze({ classLists: [{ source: 'block' }] })).toMatchObject({
      version: 1
    })
    lexer.dispose()
    lexer.dispose()
  })
})

import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { describe, expect, it } from 'vitest'
import {
  createEngineBindingSession,
  createRenderBindingSession
} from '../src/engine-binding'
import { createCompilerBindingSession } from '../src/compiler-binding'
import { createToolingBinding } from '../src/tooling-binding'

const manifest: MasterCSSManifest = {
  version: 5, languageVersion: 14,
  mixins: [{ name: '--block', body: [{ type: 'declaration', property: 'display', value: [{ type: 'text', value: 'block' }] }] }]
}

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

    const nativeDeclarationSession = await createEngineBindingSession({
      manifest: {
  "theme": [
    {
      "type": "rule" as const,
      "prelude": ":root,:host",
      "children": [
        {
          "type": "declaration" as const,
          "name": "stripe",
          "value": "linear-gradient(red,blue)"
        }
      ]
    }
  ],
  "version": 5 as const,
  "languageVersion": 14 as const,
  "variables": {
    "": [
      {
        "name": "stripe",
        "key": "stripe",
        "type": "string" as const,
        "values": [
          {
            "path": [
              ":root,:host"
            ],
            "value": "linear-gradient(red,blue)"
          }
        ]
      }
    ]
  }
}
    }, { binding: 'native' })
    try {
      nativeDeclarationSession.ensureClassRules(["background:var(--stripe)"])
      expect(nativeDeclarationSession.snapshot().text).toBe(
        '@layer theme{:root,:host{--stripe:linear-gradient(red,blue)}}'
        + "@layer utilities{.background\\:var\\(--stripe\\){background:var(--stripe)}}"
      )
    } finally {
      nativeDeclarationSession.dispose()
    }
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

          @utility x-<> {
            color: --master-value();
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
      version: 1 as const
    })
    lexer.dispose()
    lexer.dispose()
  })
})

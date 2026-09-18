import { test, vi } from 'vitest'
import { CSSDirectiveError } from '@master/css-schema/css-directives'
import { getMasterCSSDiagnostics } from '../src/diagnostics'
import { withFixture } from './setup'

withFixture('invalid-manifest', context => {
  test('preserves the real compiler diagnostic when manifest loading fails', async ({ expect }) => {
    const document = context.createDocument('<div class="block"></div>', { lang: 'html' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)
    try {
      await context.server.onDidOpen({ document })
      const error = context.rootWorkspace?.manifestErrors?.[0]
      expect(error).toMatchObject({ name: 'MasterCSSError' })
      const original = getMasterCSSDiagnostics(error)?.[0]
      expect(original?.code).toBe('compose-quoted-syntax')
      expect(original?.source).toMatch(/invalid-manifest[/\\]index\.css$/)
      const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics
      expect(diagnostics).toHaveLength(1)
      expect(diagnostics?.[0]).toMatchObject({
        code: original?.code,
        message: `Failed to load Master CSS manifest: ${original?.message}`,
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }
      })
    } finally {
      await context.server.onDidClose({ document })
      sendDiagnostics.mockRestore()
    }
  })

  for (const error of [new Error('Unable to read manifest'), new CSSDirectiveError('legacy-error', 'Legacy manifest failure')]) {
    test(`keeps the generic loading code for unstructured ${error.name}`, async ({ expect }) => {
      const document = context.createDocument('<div class="block"></div>', { lang: 'html' })
      const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)
      try {
        await context.server.onDidOpen({ document })
        context.rootWorkspace!.manifestErrors = [error]
        await context.server.onDidChangeContent({ document })
        const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics?.[0]).toMatchObject({
          code: 'manifest-loading-error',
          message: `Failed to load Master CSS manifest: ${error.message}`
        })
      } finally {
        await context.server.onDidClose({ document })
        sendDiagnostics.mockRestore()
      }
    })
  }
})

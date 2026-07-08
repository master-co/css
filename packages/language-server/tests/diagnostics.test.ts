import { test, vi } from 'vitest'
import { withFixture } from './setup'

withFixture('basic', async (context) => {
  test('publishes exact @compose class diagnostics in CSS documents', async ({ expect }) => {
    const text = '.btn { @compose not-a-real-class; }'
    const document = context.createDocument(text, { lang: 'css' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics[0]
    expect(diagnostics).toHaveLength(1)
    expect(diagnostic.code).toBe('invalid-compose-class')
    expect(document.offsetAt(diagnostic.range.start)).toBe(text.indexOf('not-a-real-class'))
    expect(document.offsetAt(diagnostic.range.end)).toBe(text.indexOf('not-a-real-class') + 'not-a-real-class'.length)

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  test('publishes exact @compose class diagnostics in SFC style blocks', async ({ expect }) => {
    const text = '<template><button /></template>\n<style>\n.btn { @compose not-a-real-class; }\n</style>'
    const document = context.createDocument(text, { lang: 'vue' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics[0]
    expect(diagnostics).toHaveLength(1)
    expect(diagnostic.code).toBe('invalid-compose-class')
    expect(document.offsetAt(diagnostic.range.start)).toBe(text.indexOf('not-a-real-class'))
    expect(document.offsetAt(diagnostic.range.end)).toBe(text.indexOf('not-a-real-class') + 'not-a-real-class'.length)

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  test('publishes quoted @compose syntax diagnostics', async ({ expect }) => {
    const text = '.btn { @compose "block"; }'
    const document = context.createDocument(text, { lang: 'css' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics[0]
    expect(diagnostics).toHaveLength(1)
    expect(diagnostic.code).toBe('compose-quoted-syntax')
    expect(document.offsetAt(diagnostic.range.start)).toBe(text.indexOf('"block"'))
    expect(document.offsetAt(diagnostic.range.end)).toBe(text.indexOf('"block"') + '"block"'.length)

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })

  test('publishes grouped @compose syntax diagnostics', async ({ expect }) => {
    const text = '.btn { @compose {block}; }'
    const document = context.createDocument(text, { lang: 'css' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    const diagnostic = diagnostics[0]
    expect(diagnostics).toHaveLength(1)
    expect(diagnostic.code).toBe('compose-group-syntax')
    expect(document.offsetAt(diagnostic.range.start)).toBe(text.indexOf('{block}'))
    expect(document.offsetAt(diagnostic.range.end)).toBe(text.indexOf('{block}') + '{block}'.length)

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })
})

withFixture('invalid-manifest', async (context) => {
  test('publishes manifest loading diagnostics', async ({ expect }) => {
    const document = context.createDocument('<div class="block"></div>', { lang: 'html' })
    const sendDiagnostics = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)

    await context.server.onDidOpen({ document })

    const diagnostics = sendDiagnostics.mock.calls.at(-1)?.[0].diagnostics || []
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0].code).toBe('manifest-loading-error')
    expect(diagnostics[0].message).toContain('Failed to load Master CSS manifest')

    await context.server.onDidClose({ document })
    sendDiagnostics.mockRestore()
  })
})

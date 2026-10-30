import { test, vi } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { URI } from 'vscode-uri'
import { join } from 'node:path'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { InitializeRequest, InitializedNotification, type InitializeParams } from 'vscode-languageserver/node'
import { withFixture } from './setup'
import { connect } from './connection'

withFixture('manifest', (context) => {
  test('does not collect design-system source scope unless the checks are enabled', async ({ expect }) => {
    const document = TextDocument.create(URI.file(join(context.fixtureDir, 'index.css')).toString(), 'css', 1, '.x {color:red}')
    await context.server.onDidOpen({ document })
    expect(context.rootWorkspace!.designSystemFiles).toEqual([])
    await context.server.onDidClose({ document })
  })
})

withFixture('manifest', (context) => {
  test('uses the shared Rust report for managed native CSS with exact UTF-16 ranges', async ({ expect }) => {
    const source = '/* 😀 */ .button { color:var(--color-blue-60) }'
    const document = TextDocument.create(URI.file(join(context.fixtureDir, 'index.css')).toString(), 'css', 1, source)
    const send = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)
    await context.server.onDidOpen({ document })
    const session = context.rootWorkspace!.languageService!.session
    const report = session.inspectDesignSystem({
      version: 1,
      metadata: { '--color-blue-60': { deprecated: true } },
      stylesheets: [{ source: join(context.fixtureDir, 'index.css'), content: source }]
    })
    const diagnostics = send.mock.calls.at(-1)?.[0].diagnostics ?? []
    for (const item of report.diagnostics) {
      expect(diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: item.code, message: item.message })]))
    }
    const located = diagnostics.find(item => item.range.start.character > 0)
    expect(located).toBeDefined()
    expect(document.offsetAt(located!.range.start)).toBe(source.indexOf('--color-blue-60'))
    await context.server.onDidClose({ document })
    send.mockRestore()
  })

  test('does not apply project policies to an unrelated stylesheet', async ({ expect }) => {
    const document = TextDocument.create(URI.file(join(context.fixtureDir, 'unmanaged.css')).toString(), 'css', 1, '.x {color:var(--color-blue-60)}')
    const send = vi.spyOn(context.server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)
    await context.server.onDidOpen({ document })
    expect(send.mock.calls.at(-1)?.[0].diagnostics).toEqual([])
    await context.server.onDidClose({ document })
    send.mockRestore()
  })
}, { designSystem: { version: 1, metadata: { '--color-blue-60': { deprecated: true } } } })

test('excludes managed symlinks to external and package CSS while retaining project-owned symlinks', async ({ expect }) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'master-lsp-design-symlinks-')))
  const cwd = join(directory, 'project')
  const content = '.card {color:var(--color-brand)}'
  const { server, clientConnection } = connect({ designSystem: { version: 1, metadata: { '--color-brand': { deprecated: true } } } })
  try {
    mkdirSync(join(cwd, 'node_modules/@master/css'), { recursive: true })
    mkdirSync(join(cwd, 'node_modules/vendor'), { recursive: true })
    writeFileSync(join(cwd, 'node_modules/@master/css/package.json'), JSON.stringify({ name: '@master/css', style: './index.css' }))
    writeFileSync(join(cwd, 'node_modules/@master/css/index.css'), '@theme {--color-brand:red}')
    writeFileSync(join(directory, 'external.css'), content)
    writeFileSync(join(cwd, 'node_modules/vendor/styles.css'), content)
    writeFileSync(join(cwd, 'local.css'), content)
    symlinkSync(join(directory, 'external.css'), join(cwd, 'external-link.css'))
    symlinkSync(join(cwd, 'node_modules/vendor/styles.css'), join(cwd, 'package-link.css'))
    symlinkSync(join(cwd, 'local.css'), join(cwd, 'local-link.css'))
    writeFileSync(join(cwd, 'app.css'), '@import "@master/css";@import "./external-link.css";@import "./package-link.css";@import "./local-link.css";')
    const rootUri = URI.file(cwd).toString()
    await clientConnection.sendRequest(InitializeRequest.type, {
      rootUri, capabilities: { workspace: { configuration: false, workspaceFolders: true } },
      workspaceFolders: [{ uri: rootUri, name: 'design-system' }]
    } as InitializeParams)
    await clientConnection.sendNotification(InitializedNotification.method, {})
    await server.init()
    const send = vi.spyOn(server.connection, 'sendDiagnostics').mockImplementation(() => undefined as any)
    try {
      for (const filename of ['external-link.css', 'package-link.css', 'local-link.css']) {
        const document = TextDocument.create(URI.file(join(cwd, filename)).toString(), 'css', 1, content)
        await server.onDidOpen({ document })
        const diagnostics = send.mock.calls.at(-1)?.[0].diagnostics ?? []
        expect(diagnostics.filter(item => item.code === 'DEPRECATED_TOKEN')).toHaveLength(filename === 'local-link.css' ? 1 : 0)
        expect(server.workspaces.get(rootUri)?.manifestErrors).toEqual([])
        await server.onDidClose({ document })
      }
    } finally { send.mockRestore() }
  } finally {
    server.dispose()
    clientConnection.dispose()
    rmSync(directory, { recursive: true, force: true })
  }
})

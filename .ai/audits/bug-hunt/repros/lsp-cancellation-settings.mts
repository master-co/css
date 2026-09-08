import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { connect } from '../../../../packages/language-server/tests/connection.ts'

const require = createRequire(new URL('../../../../packages/language-server/package.json', import.meta.url))
const { CancellationTokenSource } = require('vscode-languageserver/node')
const { URI } = require('vscode-uri')
const root = mkdtempSync(join(tmpdir(), 'master-css-bh-lsp-'))
const rootUri = URI.file(root).toString()
const uri = URI.file(join(root, 'index.html')).toString()
const cssUri = URI.file(join(root, 'style.css')).toString()
const records: unknown[] = []
const configurations = [
  { embeddedSyntaxHighlighting: 'active', formatDirectives: false },
  { embeddedSyntaxHighlighting: 'always', formatDirectives: true },
  { embeddedSyntaxHighlighting: 'off', formatDirectives: false }
]
async function until(check: () => unknown, label: string) {
  const end = Date.now() + 5000
  while (!check()) {
    assert(Date.now() < end, label)
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}
try {
  for (const [round, settings] of configurations.entries()) {
    const { server, clientConnection: client } = connect()
    const restartRequests: unknown[] = []
    const configurationRequests: unknown[] = []
    const notifications: unknown[] = []
    client.onRequest('workspace/configuration', (params: any) => {
      configurationRequests.push(params)
      return params.items.map(() => settings)
    })
    client.onRequest('masterCSS/restart', (params: unknown) => { restartRequests.push(params); return null })
    client.onNotification('masterCSS/globalSettingsChanged', (params: unknown) => notifications.push(params))
    client.onRequest('workspace/semanticTokens/refresh', () => null)
    try {
      const initialized: any = await client.sendRequest('initialize', {
        processId: null, rootUri,
        capabilities: { workspace: { configuration: true, workspaceFolders: true, semanticTokens: { refreshSupport: true } } },
        workspaceFolders: [{ uri: rootUri, name: 'audit' }],
        initializationOptions: { masterCSS: settings }
      })
      assert.equal(!!initialized.capabilities.semanticTokensProvider, settings.embeddedSyntaxHighlighting === 'always')
      assert.equal(!!initialized.capabilities.documentFormattingProvider, settings.formatDirectives)
      await client.sendNotification('initialized', {})
      await server.init()
      assert.equal(configurationRequests.length, 1)
      assert.equal((configurationRequests[0] as any).items[0].scopeUri, rootUri)
      const workspace = server.workspaces.get(rootUri)!
      let version = 1
      await client.sendNotification('textDocument/didOpen', { textDocument: { uri, languageId: 'html', version, text: '<div class="fg:red"></div>' } })
      await until(() => workspace.languageService, 'opened document initializes language service')
      const cancellations: unknown[] = []
      for (const [className, expected] of [
        ['block', 'display: block'], ['inline-flex', 'display: inline-flex'], ['grid', 'display: grid'],
        ['flex', 'display: flex'], ['inline-block', 'display: inline-block'], ['block', 'display: block']
      ]) {
        const tokenSource = new CancellationTokenSource()
        const pending = client.sendRequest('textDocument/hover', { textDocument: { uri }, position: { line: 0, character: 14 } }, tokenSource.token)
          .then(value => ({ returned: value != null }), (error: any) => { assert.equal(error.code, -32800); return { cancelled: true } })
        tokenSource.cancel()
        version++
        await client.sendNotification('textDocument/didChange', { textDocument: { uri, version }, contentChanges: [{ text: `<div class="${className}"></div>` }] })
        await until(() => server.documents.get(uri)?.version === version, 'transport receives current document version')
        cancellations.push(await pending)
        tokenSource.dispose()
        const hover = await client.sendRequest('textDocument/hover', { textDocument: { uri }, position: { line: 0, character: 14 } })
        assert(JSON.stringify(hover).includes(expected), `current v${version} hover must contain ${expected}: ${JSON.stringify(hover)}`)
      }
      const previousService = workspace.languageService
      await client.sendNotification('textDocument/didClose', { textDocument: { uri } })
      await until(() => !workspace.languageService && !server.documents.get(uri), 'last document close releases service')
      await client.sendNotification('textDocument/didOpen', { textDocument: { uri, languageId: 'html', version: ++version, text: '<div class="grid"></div>' } })
      await until(() => workspace.languageService, 'reopen initializes a fresh service')
      assert.notEqual(workspace.languageService, previousService)
      assert(JSON.stringify(await client.sendRequest('textDocument/hover', { textDocument: { uri }, position: { line: 0, character: 14 } })).includes('display: grid'))
      await client.sendNotification('textDocument/didOpen', { textDocument: { uri: cssUri, languageId: 'css', version: 1, text: '.btn { @compose bg:transparent !; }' } })
      await until(() => server.documents.get(cssUri), 'CSS document opened')
      const edits: any = await client.sendRequest('textDocument/formatting', { textDocument: { uri: cssUri }, options: { tabSize: 2, insertSpaces: true } })
      assert.equal(edits.length > 0, settings.formatDirectives)
      const nextSettings = configurations[(round + 1) % configurations.length]
      await client.sendNotification('workspace/didChangeConfiguration', { settings: { masterCSS: nextSettings } })
      await until(() => restartRequests.length === 1 && notifications.length === 1, 'settings ask client to restart')
      assert.deepEqual(notifications[0], nextSettings)
      records.push({ round, settings, scopedConfiguration: true, latestVersion: version, cancellations, reopenFreshService: true, formattingEdits: edits.length, restartRequests })
    } finally { server.dispose(); client.dispose() }
  }
  console.log(JSON.stringify(records, null, 2))
} finally { rmSync(root, { recursive: true, force: true }) }

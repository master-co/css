import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { Duplex } from 'node:stream'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { MasterCSSLanguageServer } from '../../../../packages/language-server/dist/index.js'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(resolve(root, 'packages/language-server/package.json'))
const { createConnection, StreamMessageReader, StreamMessageWriter } = require('vscode-languageserver/node')
const { TextDocument } = require('vscode-languageserver-textdocument')
const stream = () => new Duplex({ read() {}, write(chunk, encoding, callback) { callback() } })
const input = stream(), output = stream()
const connection = createConnection(new StreamMessageReader(input), new StreamMessageWriter(output))
const published = []
connection.sendDiagnostics = params => published.push(params)
connection.sendNotification = async () => undefined
const server = new MasterCSSLanguageServer(connection)
const directory = resolve(root, 'packages/language-server/tests/fixtures/invalid-manifest')
const uri = pathToFileURL(directory).href
const document = TextDocument.create(pathToFileURL(resolve(directory, 'index.html')).href, 'html', 0, '<div class="block"></div>')
try {
  server.onInitialize({ processId: null, rootUri: uri, capabilities: {}, workspaceFolders: [{ uri, name: 'diagnostic-control' }] })
  await server.init()
  await server.onDidOpen({ document })
  const workspace = server.workspaces.get(uri)
  assert.ok(workspace)
  const error = workspace.manifestErrors[0]
  assert.equal(error.name, 'MasterCSSError')
  const original = error.diagnostics[0]
  assert.equal(original.code, 'compose-quoted-syntax')
  const actual = published.at(-1).diagnostics[0]
  assert.equal(actual.code, original.code)
  assert.equal(actual.message, `Failed to load Master CSS manifest: ${original.message}`)
  workspace.manifestErrors = [new Error('Unstructured loading control')]
  await server.onDidChangeContent({ document })
  const fallback = published.at(-1).diagnostics[0]
  assert.equal(fallback.code, 'manifest-loading-error')
  console.log(JSON.stringify({ original, actual, fallback, assertions: 'structured code preserved; generic fallback retained', scope: 'Delivered Node package; read-only existing fixture; no LSP transport listener or foreign server' }, null, 2))
} finally {
  await server.onDidClose({ document })
  server.dispose()
  connection.dispose()
  input.destroy()
  output.destroy()
}

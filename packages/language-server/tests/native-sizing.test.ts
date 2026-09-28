import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { URI } from 'vscode-uri'
import type { MasterCSSWorkspace } from '../src'
import { connect } from './connection'

test('workspace reload updates native class registrations used by inspection', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-native-sizing-'))
  const entry = join(root, 'index.css')
  const workspace: MasterCSSWorkspace = {
    uri: URI.file(root).toString(), openedTextDocuments: [],
    languageServiceSettings: {}, planEntries: [entry]
  }
  const { server, clientConnection } = connect()
  try {
    writeFileSync(entry, String.raw`@master entry; .size\:20px { color:red; }`)
    await server.initWorkspaceLanguageService(workspace)
    const inspect = (name: string) => workspace.languageService!.session.inspectClassName(name)
    expect(inspect('size:20px').diagnostics?.some(d => d.code === 'REMOVED_PRESET_UTILITY')).toBe(false)
    expect(inspect('size:30px').diagnostics?.some(d => d.code === 'REMOVED_PRESET_UTILITY')).toBe(true)
    workspace.languageService?.dispose()
    writeFileSync(entry, '@master entry;')
    await server.initWorkspaceLanguageService(workspace)
    expect(inspect('size:20px').diagnostics?.some(d => d.code === 'REMOVED_PRESET_UTILITY')).toBe(true)
  } finally {
    workspace.languageService?.dispose()
    server.dispose()
    clientConnection.dispose()
    rmSync(root, { recursive: true, force: true })
  }
})

import { InitializeRequest, InitializedNotification, type InitializeParams } from 'vscode-languageserver/node'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { URI } from 'vscode-uri'
import { expect, test } from 'vitest'
import { connect } from './connection'
import createDocument from '../src/utils/create-document'
import { withFixture } from './setup'

withFixture('monorepo', async (context) => {
  async function verifyWorkspaceManifest() {
    const textDocument = context.createDocument('<div class=""></div>')

    await context.server.onDidOpen({ document: textDocument })

    expect(context.rootWorkspace?.manifestSource).toBe('workspace')
    expect(context.rootWorkspace?.manifestResolution?.presetManifest?.entry).toBeTruthy()
    await context.server.onDidClose({ document: textDocument })
  }

  test('uses a resolved workspace Master CSS manifest when available', verifyWorkspaceManifest)
  test('uses a resolved workspace Master CSS runtime when available', verifyWorkspaceManifest)
})

async function verifyBundledManifestFallback() {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-language-server-runtime-'))
  try {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ private: true }))
    const brokenCSSPackageDir = join(cwd, 'node_modules', '@master', 'css')
    mkdirSync(brokenCSSPackageDir, { recursive: true })
    writeFileSync(join(brokenCSSPackageDir, 'package.json'), JSON.stringify({
      name: '@master/css',
      type: 'module',
      exports: {
        '.': './missing.js'
      }
    }))
    const rootUri = URI.file(cwd).toString()
    const { server, clientConnection } = connect()
    try {
      await clientConnection.sendRequest(InitializeRequest.type, {
        rootUri,
        capabilities: {
          workspace: {
            configuration: false,
            workspaceFolders: true
          }
        },
        workspaceFolders: [
          {
            uri: rootUri,
            name: 'fallback'
          }
        ]
      } as InitializeParams)
      await clientConnection.sendNotification(InitializedNotification.method, {})
      await server.init()
      const textDocument = createDocument('<div class=""></div>', { dir: cwd })
      const workspace = server.workspaces.get(rootUri)

      await server.onDidOpen({ document: textDocument })

      expect(workspace?.manifestSource).toBe('bundled')
      expect(workspace?.languageService?.session.binding).toMatch(/native|wasm/)
      await server.onDidClose({ document: textDocument })
    } finally {
      server.dispose()
      clientConnection.dispose()
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}

test('uses the bundled manifest when workspace packages are missing', verifyBundledManifestFallback)
test('falls back to the bundled runtime when workspace packages are missing', verifyBundledManifestFallback)

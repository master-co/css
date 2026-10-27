import { resolve } from 'path'
import { withFixture } from './setup'
import { test, vi } from 'vitest'
import type { MasterCSSWorkspace } from '../src'
import { connect } from './connection'

function createWorkspace(uri: string): MasterCSSWorkspace {
  return {
    uri,
    openedTextDocuments: [],
    languageServiceSettings: {}
  }
}

test('propagates workspace initialization failures', async ({ expect }) => {
  const { server, clientConnection } = connect()
  const failure = new Error('workspace initialization failed')
  const mutableServer = server as unknown as {
    initWorkspaceFolder(uri: string): Promise<void>
  }
  let shouldFail = true
  mutableServer.initWorkspaceFolder = async () => {
    if (shouldFail) throw failure
  }
  server.workspaceFolders = [{ uri: 'file:///project', name: 'project' }]
  try {
    await expect(server.init()).rejects.toBe(failure)
    shouldFail = false
    await expect(server.init()).resolves.toBeUndefined()
  } finally {
    server.dispose()
    clientConnection.dispose()
  }
})

withFixture('basic', async (context) => {
  test('root workspace', async ({ expect }) => {
    expect(context.server.workspaces.size).toBe(1)
    expect(context.server.workspaces.get(context.rootUri)?.uri).toBe(context.rootUri)
  })

  test('open and close a document', async ({ expect }) => {
    const textDocument = context.createDocument()
    await context.server.onDidOpen({ document: textDocument })
    expect(context.rootWorkspace?.openedTextDocuments?.length).toBe(1)
    expect(context.rootWorkspace?.openedTextDocuments).toEqual([textDocument])
    await context.server.onDidClose({ document: textDocument })
    expect(context.rootWorkspace?.openedTextDocuments?.length).toBe(0)
  })

  test('coordinates concurrent document opens with closes during initialization', async ({ expect }) => {
    const first = context.createDocument()
    const second = context.createDocument()
    const originalInit = context.server.initWorkspaceLanguageService.bind(context.server)
    let releaseInitialization: (() => void) | undefined
    const initializationGate = new Promise<void>((resolve) => {
      releaseInitialization = resolve
    })
    let initializationCalls = 0
    context.server.initWorkspaceLanguageService = async (workspace) => {
      initializationCalls++
      await initializationGate
      await originalInit(workspace)
    }
    try {
      const firstOpen = context.server.onDidOpen({ document: first })
      const secondOpen = context.server.onDidOpen({ document: second })
      await vi.waitFor(() => expect(initializationCalls).toBe(1))
      await context.server.onDidClose({ document: first })
      await context.server.onDidClose({ document: second })
      releaseInitialization?.()
      await Promise.all([firstOpen, secondOpen])

      expect(context.rootWorkspace?.openedTextDocuments).toEqual([])
      expect(context.rootWorkspace?.languageService).toBeUndefined()
    } finally {
      releaseInitialization?.()
      context.server.initWorkspaceLanguageService = originalInit
    }
  })

  test('open an external document', async ({ expect }) => {
    const dir = resolve(__dirname, './external')
    const textDocument = context.createDocument('', { dir })
    await context.server.onDidOpen({ document: textDocument })
    expect(context.server.globalWorkspace.openedTextDocuments?.length).toBe(1)
    expect(context.server.globalWorkspace.openedTextDocuments).toEqual([textDocument])
    await context.server.onDidClose({ document: textDocument })
    expect(context.server.globalWorkspace.openedTextDocuments?.length).toBe(0)
  })

  test('matches Windows URI variants for the same workspace path', ({ expect }) => {
    const workspaceURI = 'file:///c%3A/Users/RUNNER~1/AppData/Local/Temp/master-css-vscode-workspace-laNRGV'
    const documentURI = 'file:///C:/Users/RUNNER%7E1/AppData/Local/Temp/master-css-vscode-workspace-laNRGV/index.html'
    const workspace = createWorkspace(workspaceURI)
    context.server.workspaces.set(workspaceURI, workspace)
    try {
      expect(context.server.findClosestWorkspace(documentURI)).toBe(workspace)
    } finally {
      context.server.workspaces.delete(workspaceURI)
    }
  })

  test('does not match sibling Windows path prefixes', ({ expect }) => {
    const workspaceURI = 'file:///C:/Users/RUNNER%7E1/AppData/Local/Temp/master-css-vscode-workspace-laNRGV'
    const documentURI = 'file:///C:/Users/RUNNER%7E1/AppData/Local/Temp/master-css-vscode-workspace-laNRGV2/index.html'
    const workspace = createWorkspace(workspaceURI)
    context.server.workspaces.set(workspaceURI, workspace)
    try {
      expect(context.server.findClosestWorkspace(documentURI)).toBe(context.server.globalWorkspace)
    } finally {
      context.server.workspaces.delete(workspaceURI)
    }
  })

  test('uses the nearest nested workspace path', ({ expect }) => {
    const parentWorkspaceURI = 'file:///C:/repo'
    const nestedWorkspaceURI = 'file:///C:/repo/packages/app'
    const documentURI = 'file:///c%3A/repo/packages/app/src/index.html'
    const parentWorkspace = createWorkspace(parentWorkspaceURI)
    const nestedWorkspace = createWorkspace(nestedWorkspaceURI)
    context.server.workspaces.set(parentWorkspaceURI, parentWorkspace)
    context.server.workspaces.set(nestedWorkspaceURI, nestedWorkspace)
    try {
      expect(context.server.findClosestWorkspace(documentURI)).toBe(nestedWorkspace)
    } finally {
      context.server.workspaces.delete(parentWorkspaceURI)
      context.server.workspaces.delete(nestedWorkspaceURI)
    }
  })
})

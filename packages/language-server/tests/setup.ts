import { ClientCapabilities, InitializeParams, InitializeRequest, InitializedNotification, ProtocolConnection } from 'vscode-languageserver/node'
import CSSLanguageServer, { Settings, Workspace } from '../src'
import { beforeAll, describe } from 'vitest'
import { resolve } from 'node:path'
import { URI } from 'vscode-uri'
import createDocument from '../src/utils/create-document'
import { connect } from './connection'
import { TextDocument } from 'vscode-languageserver-textdocument'

declare interface FixtureContext {
    server: CSSLanguageServer,
    fixtureDir: string,
    rootUri: string,
    rootWorkspace: Workspace | undefined,
    workspaceFolders: { uri: string, name: string }[],
    clientConnection: ProtocolConnection,
    createDocument: (text?: string, options?: { lang?: string, dir?: string }) => TextDocument
}

export function withFixture(fixture: string, cb: (context: FixtureContext) => void, settings?: Settings) {
    describe(fixture, async () => {
        const context = {}
        beforeAll(async () => {
            const fixtureDir = resolve(__dirname, `./fixtures/${fixture}`)
            const workspaceFolders = [{
                uri: URI.file(fixtureDir).toString(),
                name: 'test'
            }]
            const rootUri = workspaceFolders[0].uri
            const { server, clientConnection } = connect(settings)
            const capabilities: ClientCapabilities = {
                textDocument: {
                    completion: {
                        completionItem: {
                            commitCharactersSupport: true,
                            documentationFormat: ['markdown', 'plaintext'],
                            snippetSupport: true,
                        },
                        completionItemKind: {
                            valueSet: [
                                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
                                25,
                            ],
                        },
                        contextSupport: true
                    },
                    documentSymbol: {
                        symbolKind: {
                            valueSet: [
                                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
                                25, 26,
                            ],
                        },
                    },
                    hover: {
                        contentFormat: ['markdown', 'plaintext']
                    },
                    publishDiagnostics: { relatedInformation: true },
                    signatureHelp: {
                        signatureInformation: { documentationFormat: ['markdown', 'plaintext'] },
                    },
                    synchronization: {
                        didSave: true,
                        willSave: true,
                        willSaveWaitUntil: true,
                    }
                },
                workspace: {
                    applyEdit: true,
                    configuration: false,
                    symbol: {
                        symbolKind: {
                            valueSet: [
                                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
                                25, 26,
                            ],
                        },
                    },
                    workspaceEdit: { documentChanges: true },
                    workspaceFolders: true,
                }
            }
            await clientConnection.sendRequest(InitializeRequest.type, {
                rootUri,
                capabilities,
                workspaceFolders
            } as InitializeParams)
            await clientConnection.sendNotification(InitializedNotification.method, {})
            /**
             * For tests that require the server to be initialized before running,
             */
            await server.init()
            Object.setPrototypeOf(context, {
                server,
                fixtureDir,
                rootUri,
                workspaceFolders,
                clientConnection,
                rootWorkspace: server.workspaces.get(rootUri),
                createDocument: (text = '', options?: { lang?: string, dir?: string }) => {
                    return createDocument(text, { lang: options?.lang, dir: options?.dir || fixtureDir })
                }
            } as FixtureContext)
            return () => {
                server.stop()
                clientConnection.dispose()
            }
        })
        cb(context as FixtureContext)
    })
}
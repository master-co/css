import { test } from 'vitest'
import { DocumentFormattingRequest, DocumentRangeFormattingRequest, type TextEdit } from 'vscode-languageserver/node'
import { withFixture } from './setup'
import type { TextDocument } from 'vscode-languageserver-textdocument'

function applyTextEdits(document: TextDocument, edits: TextEdit[]) {
    const source = document.getText()
    return [...edits]
        .sort((a, b) => document.offsetAt(b.range.start) - document.offsetAt(a.range.start))
        .reduce((result, edit) => {
            const start = document.offsetAt(edit.range.start)
            const end = document.offsetAt(edit.range.end)
            return result.slice(0, start) + edit.newText + result.slice(end)
        }, source)
}

withFixture('basic', async (context) => {
    test('advertises directive formatting by default', async ({ expect }) => {
        const capabilities = context.server.onInitialize({
            capabilities: {},
            workspaceFolders: context.workspaceFolders
        } as any).capabilities
        expect(capabilities.documentFormattingProvider).toBe(true)
        expect(capabilities.documentRangeFormattingProvider).toBe(true)
    })

    test('returns document formatting edits for CSS directives', async ({ expect }) => {
        const textDocument = context.createDocument('.btn { @compose bg:transparent ! fg:red !@sm; }', { lang: 'css' })
        await context.server.onDidOpen({ document: textDocument })
        const edits = await context.clientConnection.sendRequest<TextEdit[]>(DocumentFormattingRequest.method, {
            textDocument: {
                uri: textDocument.uri
            },
            options: {
                tabSize: 4,
                insertSpaces: true
            }
        })

        expect(applyTextEdits(textDocument, edits)).toBe('.btn { @compose bg:transparent! fg:red!@sm; }')
        await context.server.onDidClose({ document: textDocument })
    })

    test('returns range formatting edits for CSS directives', async ({ expect }) => {
        const source = '.a { @compose bg:red !; }\n.b { @compose bg:blue !; }'
        const textDocument = context.createDocument(source, { lang: 'css' })
        await context.server.onDidOpen({ document: textDocument })
        const edits = await context.clientConnection.sendRequest<TextEdit[]>(DocumentRangeFormattingRequest.method, {
            textDocument: {
                uri: textDocument.uri
            },
            range: {
                start: textDocument.positionAt(source.indexOf('@compose bg:blue')),
                end: textDocument.positionAt(source.length)
            },
            options: {
                tabSize: 4,
                insertSpaces: true
            }
        })

        expect(applyTextEdits(textDocument, edits)).toBe('.a { @compose bg:red !; }\n.b { @compose bg:blue!; }')
        await context.server.onDidClose({ document: textDocument })
    })
})

withFixture('basic', async (context) => {
    test('omits directive formatting capability when disabled', async ({ expect }) => {
        const capabilities = context.server.onInitialize({
            capabilities: {},
            workspaceFolders: context.workspaceFolders
        } as any).capabilities
        expect(capabilities.documentFormattingProvider).toBeUndefined()
        expect(capabilities.documentRangeFormattingProvider).toBeUndefined()
    })

    test('returns no formatting edits when disabled', async ({ expect }) => {
        const textDocument = context.createDocument('.btn { @compose bg:transparent !; }', { lang: 'css' })
        await context.server.onDidOpen({ document: textDocument })
        const edits = await context.server.onDocumentFormatting({
            textDocument: {
                uri: textDocument.uri
            },
            options: {
                tabSize: 4,
                insertSpaces: true
            }
        })

        expect(edits).toEqual([])
        await context.server.onDidClose({ document: textDocument })
    })
}, { formatDirectives: false })

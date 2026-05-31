import { resolve } from 'path'
import { withFixture } from './setup'
import { test } from 'vitest'
import { URI } from 'vscode-uri'

withFixture('monorepo', async (context) => {
    test('workspaces', async ({ expect }) => {
        expect(context.server.workspaces.size).toBe(5)
        expect(Array.from(context.server.workspaces).map(([_, x]) => x.uri)).toEqual(
            expect.arrayContaining([
                URI.file(resolve('tests/fixtures/monorepo')).toString(),
                URI.file(resolve('tests/fixtures/monorepo/a')).toString(),
                URI.file(resolve('tests/fixtures/monorepo/b')).toString(),
                URI.file(resolve('tests/fixtures/monorepo/c')).toString(),
                URI.file(resolve('tests/fixtures/monorepo/d')).toString()
            ])
        )
    })

    test('open a document and link it to the nearest workspace', async ({ expect }) => {
        const dir = resolve(__dirname, './fixtures/monorepo/a')
        const textDocument = context.createDocument('', { dir })
        await context.server.onDidOpen({ document: textDocument })
        const targetWorkspace = context.server.workspaces.get(URI.file(dir).toString())
        expect(targetWorkspace?.openedTextDocuments.length).toBe(1)
        await context.server.onDidClose({ document: textDocument })
        expect(context.rootWorkspace?.openedTextDocuments?.length).toBe(0)
    })

    test('open a document in a package dependency workspace without config', async ({ expect }) => {
        const dir = resolve(__dirname, './fixtures/monorepo/c')
        const textDocument = context.createDocument('', { dir })
        await context.server.onDidOpen({ document: textDocument })
        const targetWorkspace = context.server.workspaces.get(URI.file(dir).toString())
        expect(targetWorkspace?.openedTextDocuments.length).toBe(1)
        await context.server.onDidClose({ document: textDocument })
        expect(context.rootWorkspace?.openedTextDocuments?.length).toBe(0)
    })
})

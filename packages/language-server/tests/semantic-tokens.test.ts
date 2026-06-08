import { test } from 'vitest'
import { withFixture } from './setup'
import { ACTIVE_SEMANTIC_TOKENS_REQUEST } from '../src'
import { SEMANTIC_TOKEN_TYPES } from '@master/css-language-service'

withFixture('basic', async (context) => {
    test('omits full semantic token capability in active mode', async ({ expect }) => {
        expect(context.server.onInitialize({
            capabilities: {},
            workspaceFolders: context.workspaceFolders
        } as any).capabilities.semanticTokensProvider).toBeUndefined()
    })

    test('returns active semantic tokens for the class at a position', async ({ expect }) => {
        const text = '<div class="fg:red block:hover"></div>'
        const textDocument = context.createDocument(text)
        await context.server.onDidOpen({ document: textDocument })
        const semanticTokens = await context.clientConnection.sendRequest<{ data: number[] }>(ACTIVE_SEMANTIC_TOKENS_REQUEST, {
            textDocument: {
                uri: textDocument.uri
            },
            position: textDocument.positionAt(text.indexOf('block') + 1)
        })

        expect(semanticTokens.data.length).toBeGreaterThan(0)
        expect(semanticTokens.data.some((_: number, index: number) =>
            index % 5 === 3 && SEMANTIC_TOKEN_TYPES[semanticTokens.data[index]] === 'class'
        )).toBe(true)
        expect(semanticTokens.data.some((_: number, index: number) =>
            index % 5 === 3 && SEMANTIC_TOKEN_TYPES[semanticTokens.data[index]] === 'property'
        )).toBe(false)
        await context.server.onDidClose({ document: textDocument })
    })
})

withFixture('basic', async (context) => {
    test('initializes full semantic token capability in always mode', async ({ expect }) => {
        expect(context.server.onInitialize({
            capabilities: {},
            workspaceFolders: context.workspaceFolders
        } as any).capabilities.semanticTokensProvider).toMatchObject({
            full: true,
            legend: {
                tokenTypes: expect.arrayContaining(['class', 'property', 'variable']),
                tokenModifiers: expect.arrayContaining(['declaration'])
            }
        })
    })

    test('returns full semantic tokens for opened documents', async ({ expect }) => {
        const textDocument = context.createDocument('<div class="fg:red block"></div>')
        await context.server.onDidOpen({ document: textDocument })
        const semanticTokens = await context.server.onSemanticTokens({
            textDocument: {
                uri: textDocument.uri
            }
        } as any)

        expect(semanticTokens.data.length).toBeGreaterThan(0)
        expect(semanticTokens.data.some((_, index) =>
            index % 5 === 3 && SEMANTIC_TOKEN_TYPES[semanticTokens.data[index]] === 'property'
        )).toBe(true)
        expect(semanticTokens.data.some((_, index) =>
            index % 5 === 3 && SEMANTIC_TOKEN_TYPES[semanticTokens.data[index]] === 'class'
        )).toBe(true)
        await context.server.onDidClose({ document: textDocument })
    })
}, {
    syntaxHighlighting: 'always'
})

withFixture('basic', async (context) => {
    test('omits semantic token capability when highlighting is off', async ({ expect }) => {
        expect(context.server.onInitialize({
            capabilities: {},
            workspaceFolders: context.workspaceFolders
        } as any).capabilities.semanticTokensProvider).toBeUndefined()
    })
}, {
    syntaxHighlighting: 'off'
})

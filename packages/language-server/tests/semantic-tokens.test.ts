import { test } from 'vitest'
import { withFixture } from './setup'
import { SEMANTIC_TOKEN_TYPES } from '@master/css-language-service'

withFixture('basic', async (context) => {
    test('initializes semantic token capability', async ({ expect }) => {
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

    test('returns semantic tokens for opened documents', async ({ expect }) => {
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
})

withFixture('basic', async (context) => {
    test('omits semantic token capability when disabled', async ({ expect }) => {
        expect(context.server.onInitialize({
            capabilities: {},
            workspaceFolders: context.workspaceFolders
        } as any).capabilities.semanticTokensProvider).toBeUndefined()
    })
}, {
    renderSemanticTokens: false
})

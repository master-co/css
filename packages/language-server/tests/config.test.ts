import { test } from 'vitest'
import { withFixture } from './setup'

withFixture('config', async (context) => {
    test('loads TypeScript workspace config before language features run', async ({ expect }) => {
        const textDocument = context.createDocument('<div class="fixture-button"></div>')

        await context.server.onDidOpen({ document: textDocument })

        expect(context.rootWorkspace?.languageService?.settings.config).toMatchObject({
            components: {
                'fixture-button': ['inline-flex fg:white bg:blue']
            },
            extends: [
                {
                    components: {
                        'fixture-card': ['block']
                    }
                }
            ]
        })

        await context.server.onDidClose({ document: textDocument })
    })
})

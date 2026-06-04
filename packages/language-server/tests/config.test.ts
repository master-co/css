import { test } from 'vitest'
import { withFixture } from './setup'

withFixture('config', async (context) => {
    test('loads managed CSS entry config before language features run', async ({ expect }) => {
        const textDocument = context.createDocument('<div class="fixture-button"></div>')

        await context.server.onDidOpen({ document: textDocument })

        expect(context.rootWorkspace?.languageService?.settings.config).toMatchObject({
            utilities: expect.arrayContaining([
                expect.objectContaining({
                    name: 'fixture-card',
                    type: -4,
                    layer: 'components',
                    declarations: { display: 'block' }
                }),
                expect.objectContaining({
                    name: 'fixture-button',
                    type: -4,
                    layer: 'components',
                    declarations: {
                        display: 'inline-flex',
                        color: 'oklch(100% 0 none)',
                        'background-color': 'oklch(63.7% .237 25.331)'
                    }
                })
            ])
        })

        await context.server.onDidClose({ document: textDocument })
    })
})

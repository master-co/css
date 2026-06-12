import { test } from 'vitest'
import { withFixture } from './setup'

withFixture('config', async (context) => {
    test('loads managed CSS entry plan before language features run', async ({ expect }) => {
        const textDocument = context.createDocument('<div class="fixture-button"></div>')

        await context.server.onDidOpen({ document: textDocument })

        expect(context.rootWorkspace?.languageService?.settings.plan).toMatchObject({
            utilities: expect.arrayContaining([
                expect.objectContaining({
                    name: 'fixture-card',
                    type: -4,
                    layer: 'components',
                    emit: expect.objectContaining({
                        type: 'static',
                        rules: expect.arrayContaining([
                            expect.objectContaining({
                                declarations: { display: 'block' }
                            })
                        ])
                    })
                }),
                expect.objectContaining({
                    name: 'fixture-button',
                    type: -4,
                    layer: 'components',
                    emit: expect.objectContaining({
                        type: 'static',
                        rules: expect.arrayContaining([
                            expect.objectContaining({
                                declarations: {
                                    display: 'inline-flex',
                                    color: 'oklch(100% 0 none)',
                                    'background-color': 'oklch(63.7% .237 25.331)'
                                }
                            })
                        ])
                    })
                })
            ])
        })

        await context.server.onDidClose({ document: textDocument })
    })
})

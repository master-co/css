import { test } from 'vitest'
import { withFixture } from './setup'

withFixture('config', async (context) => {
    test('loads TypeScript workspace config before language features run', async ({ expect }) => {
        const textDocument = context.createDocument('<div class="fixture-button"></div>')

        await context.server.onDidOpen({ document: textDocument })

        expect(context.rootWorkspace?.languageService?.settings.config).toMatchObject({
            components: {
                'fixture-card': [
                    { selector: '&', declarations: { display: 'block' } }
                ],
                'fixture-button': [
                    { selector: '&', declarations: { display: 'inline-flex' } },
                    { selector: '&', declarations: { color: 'oklch(100% 0 none)' } },
                    { selector: '&', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } }
                ]
            }
        })

        await context.server.onDidClose({ document: textDocument })
    })
})

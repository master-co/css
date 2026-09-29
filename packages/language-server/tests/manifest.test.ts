import { test } from 'vitest'
import { withFixture } from './setup'

withFixture('manifest', async (context) => {
  test('loads managed CSS entry manifest before language features run', async ({ expect }) => {
    const textDocument = context.createDocument('<div class="fixture-button"></div>')

    await context.server.onDidOpen({ document: textDocument })

    expect(context.rootWorkspace?.languageService?.settings.manifest).toMatchObject({
      mixins: expect.arrayContaining([
        expect.objectContaining({ name: '--fixture-card', body: expect.arrayContaining([
          expect.objectContaining({ type: 'declaration', property: 'display', value: [{ type: 'text', value: 'block' }] })
        ]) }),
        expect.objectContaining({ name: '--fixture-button', body: expect.arrayContaining([
          expect.objectContaining({ type: 'declaration', property: 'display', value: [{ type: 'text', value: 'inline-flex' }] }),
          expect.objectContaining({ type: 'declaration', property: 'color' }),
          expect.objectContaining({ type: 'declaration', property: 'background-color' })
        ]) })
      ])
    })

    await context.server.onDidClose({ document: textDocument })
  })
})

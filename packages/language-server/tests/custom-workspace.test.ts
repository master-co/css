import { resolve } from 'path'
import { withFixture } from './setup'
import { test } from 'vitest'
import { Settings } from '../src'
import { URI } from 'vscode-uri'

const settings: Settings = {
    workspaces: [
        './c'
    ]
}

withFixture('monorepo', async (context) => {
    test('workspaces', async ({ expect }) => {
        expect(context.server.workspaces.size).toBe(2)
        expect(Array.from(context.server.workspaces).map(([_, x]) => x.uri)).toEqual(
            expect.arrayContaining([
                URI.file(resolve('tests/fixtures/monorepo')).toString(),
                URI.file(resolve('tests/fixtures/monorepo/c')).toString(),
            ])
        )
    })
}, settings)

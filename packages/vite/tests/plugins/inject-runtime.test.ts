import { it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import InjectRuntimePlugin from '../../src/plugins/inject-runtime'
import { runTransform } from '../plugin-test-helper'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/inject-runtime')
const ENTRY_ID = '/project/src/main.ts'

// fixture name → isEntry
const entryCases = {
    'basic': true,
    'alt': true,
    'already-injected': true,
    'non-entry': false,
}

const plugin = InjectRuntimePlugin({}, {
    entryId: ENTRY_ID,
    extractor: {} as any,
})

const cases = fs.readdirSync(FIXTURE_DIR)
    .filter(file => file.endsWith('.ts'))
    .map(file => [file.replace(/\.ts$/, '') as keyof typeof entryCases, file] as const)

it.each(cases)(
    'InjectRuntimePlugin fixture: %s',
    async (name, filename) => {
        const id = path.join(FIXTURE_DIR, filename)
        const result = await runTransform(plugin, id)
        if (result === null) {
            expect(result).toBeNull()
        } else {
            expect(result.code).toMatchSnapshot()
        }
    }
)
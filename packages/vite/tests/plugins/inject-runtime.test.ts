import { it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import InjectCSSRuntimeInitPlugin from '../../src/plugins/inject-runtime-init'
import { runLoad } from '../plugin-test-helper'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/inject-runtime')
const ENTRY_ID = '/project/src/main.ts'

// fixture name → isEntry
const entryCases = {
    'basic': true,
    'alt': true,
    'already-injected': true,
    'non-entry': false,
}

const plugin = InjectCSSRuntimeInitPlugin({}, {
    entryId: ENTRY_ID,
    builder: {} as any,
})

const cases = fs.readdirSync(FIXTURE_DIR)
    .filter(file => file.endsWith('.ts'))
    .map(file => [file.replace(/\.ts$/, '') as keyof typeof entryCases, file] as const)

it.each(cases)(
    'InjectCSSRuntimeInitPlugin fixture: %s',
    async (name, filename) => {
        const id = path.join(FIXTURE_DIR, filename)
        const result = await runLoad(plugin, id)
        if (result === undefined) {
            expect(result).toBeUndefined()
        } else {
            expect(result.code).toMatchSnapshot()
        }
    }
)
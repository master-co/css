import { it, expect } from 'vitest'
import fs, { readFileSync } from 'fs'
import path from 'path'
import AvoidFOUCPlugin from '../../src/plugins/avoid-fouc'
import { runTransformIndexHtml } from '../plugin-test-helper'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/avoid-fouc')

const plugin = AvoidFOUCPlugin()

const cases = fs.readdirSync(FIXTURE_DIR)
    .map(file => [file.replace(/\.html$/, ''), file] as const)

it.each(cases)(
    'AvoidFOUCPlugin fixture: %s',
    async (_, filename) => {
        const input = readFileSync(path.join(FIXTURE_DIR, filename), 'utf-8')
        const result = await runTransformIndexHtml(plugin, input)
        expect(result).toMatchSnapshot()
    }
)
import { it, test, expect, beforeAll, afterAll } from 'vitest'
import fs from 'fs'
import { explorePathSync } from '@techor/glob'
import path from 'path'
import { execSync } from 'child_process'
import { copy, rm } from 'shared/utils/fs'

const examplePath = path.join(__dirname, '../../../../examples/react-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp/build')

beforeAll(() => {
    copy(examplePath, tmpDir)
    execSync('pnpm run build', { cwd: tmpDir })
})

it('build', () => {
    const file = explorePathSync(path.resolve(tmpDir, 'dist/assets/index-*.css'))
    expect(file).toBeDefined()
    expect(fs.readFileSync(file).toString()).toContain('font\\:heavy')
})

afterAll(() => {
    rm(tmpDir)
})
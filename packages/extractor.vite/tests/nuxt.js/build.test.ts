import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { copy, rm } from 'shared/utils/fs'
import { explorePathSync } from '@techor/glob'

const examplePath = path.join(__dirname, '../../../../examples/nuxt.js-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp/build')

it('build', () => {
    copy(examplePath, tmpDir)
    execSync('pnpm run build', { cwd: tmpDir, stdio: 'inherit' })
    expect(fs.readFileSync(explorePathSync(path.resolve(tmpDir, '.nuxt/dist/client/_nuxt/entry.*.css'))).toString()).toContain('font\\:heavy')
    rm(tmpDir)
})
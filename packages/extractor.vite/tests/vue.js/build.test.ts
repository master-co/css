import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { copy, rm } from 'css-shared/utils/fs'
import { explorePathSync } from '@techor/glob'

const examplePath = path.join(__dirname, '../../../../examples/vue.js-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp/build')

it('build', () => {
    copy(examplePath, tmpDir)
    execSync('pnpm run build', { cwd: tmpDir })
    expect(fs.readFileSync(explorePathSync(path.resolve(tmpDir, 'dist/assets/index-*.css'))).toString()).toContain('font\\:heavy')
    rm(tmpDir)
})
import fs from 'fs'
import path from 'path'
import { execaCommandSync } from 'execa'
import { copy, rm } from 'css-shared/utils/fs'
import { explorePathSync } from '@techor/glob'

const examplePath = path.join(__dirname, '../../../../examples/nuxt.js-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp/build')

it('build', () => {
    copy(examplePath, tmpDir)
    execaCommandSync('pnpm run build', { cwd: tmpDir })
    expect(fs.readFileSync(explorePathSync(path.resolve(tmpDir, '.nuxt/dist/client/_nuxt/entry.*.css'))).toString()).toContain('font\\:heavy')
    rm(tmpDir)
})
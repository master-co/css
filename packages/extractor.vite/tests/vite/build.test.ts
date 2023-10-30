import fs from 'fs'
import { explorePathSync } from '@techor/glob'
import path from 'path'
import { execSync } from 'child_process'
import { copy, rm } from 'css-shared/utils/fs'

const examplePath = path.join(__dirname, '../../../../examples/vite-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp/build')

it('build', () => {
    copy(examplePath, tmpDir)
    execSync('pnpm run build', { cwd: tmpDir, stdio: 'inherit' })
    expect(fs.readFileSync(explorePathSync(path.resolve(tmpDir, 'dist/assets/index-*.css'))).toString()).toContain('center-content')
    rm(tmpDir)
})
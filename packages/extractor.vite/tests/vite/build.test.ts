import fs from 'fs'
import fg from 'fast-glob'
import path from 'upath'
import { execSync } from 'child_process'
import { copy, rm } from 'shared/utils/fs'

const examplePath = path.join(__dirname, '../../../../examples/vite-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp/build')

it('build', () => {
    copy(examplePath, tmpDir)
    execSync('npm run build', { cwd: tmpDir, stdio: 'inherit' })
    expect(fs.readFileSync(fg.sync(path.join(tmpDir, 'dist/assets/index-*.css'))[0]).toString()).toContain('center-content')
    rm(tmpDir)
})
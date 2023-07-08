import fs from 'fs-extra'
import fg from 'fast-glob'
import path from 'path'
import { execSync } from 'child_process'
import { copy, rm } from 'shared/utils/fs'

const examplePath = path.join(__dirname, '../../../../examples/react-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp/build')

/** TODO: Error: Cannot find module '../lib/tsc.js' */
it('build', () => {
    copy(examplePath, tmpDir)
    execSync('npm run build', { cwd: tmpDir, stdio: 'inherit' })
    expect(fs.readFileSync(fg.sync(path.join(tmpDir, 'dist/assets/index-*.css'))[0]).toString()).toContain('font\\:heavy')
    rm(tmpDir)
})
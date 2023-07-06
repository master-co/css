import fs from 'fs-extra'
import fg from 'fast-glob'
import path from 'path'
import { execSync } from 'child_process'

const examplePath = path.join(__dirname, '../../../../examples/vite-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp')

it('vite build', () => {
    fs.copySync(examplePath, tmpDir)
    execSync('vite build', { cwd: tmpDir })
    expect(fs.readFileSync(fg.sync(path.join(tmpDir, 'dist/assets/index-*.css'))[0]).toString()).toContain('center-content')
})
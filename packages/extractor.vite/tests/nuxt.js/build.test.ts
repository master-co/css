import fs from 'fs-extra'
import fg from 'fast-glob'
import path from 'path'
import { spawnSync } from 'child_process'
import { copy, rm } from 'shared/utils/fs'

const examplePath = path.join(__dirname, '../../../../examples/nuxt.js-with-static-extraction')
// const tmpDir = path.join(__dirname, 'tmp/build')

it('build', () => {
    // copy(examplePath, tmpDir)
    spawnSync('npm', ['run', 'build'], { cwd: examplePath })
    expect(fs.readFileSync(fg.sync(path.join(examplePath, '.nuxt/dist/client/_nuxt/entry.*.css'))[0]).toString()).toContain('font\\:heavy')
    // rm(tmpDir)
})
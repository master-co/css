import fs from 'fs'
import { explorePathSync } from '@techor/glob'
import path from 'upath'
import { execSync } from 'child_process'
import { copy, rm } from 'shared/utils/fs'

const examplePath = path.join(__dirname, '../../../../examples/svelte-with-static-extraction')
const tmpDir = path.join(__dirname, 'tmp/build')

it('build', () => {
    copy(examplePath, tmpDir)
    execSync('pnpm run build', { cwd: tmpDir, stdio: 'inherit' })
    expect(fs.readFileSync(explorePathSync(path.resolve(tmpDir, '.svelte-kit/output/server/_app/immutable/assets/_layout.*.css'))).toString()).toContain('.mt\\:-2vw{margin-top:-2vw}')
    rm(tmpDir)
})
import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'

writeFileSync(join(__dirname, 'package.json'), JSON.stringify({
    "name": "with-package-json.test",
    "private": true
}))

it('init', () => {
    execSync('tsx ../../src/bin', { cwd: __dirname })
    expect(JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8')).dependencies['@master/css']).toBeDefined()
})

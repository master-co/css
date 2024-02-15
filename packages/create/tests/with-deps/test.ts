import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { existsSync, writeFileSync } from 'node:fs'

writeFileSync(join(__dirname, 'package.json'), JSON.stringify({
    "name": "with-package-json.test",
    "private": true,
    "dependencies": {
        "@master/css": "latest"
    }
}))

it('init', () => {
    execSync('tsx ../../src/bin', { cwd: __dirname })
    expect(existsSync(join(__dirname, 'node_modules'))).toBeFalsy()
})

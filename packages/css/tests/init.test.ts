import fs from 'fs'
import { execSync } from 'child_process'
import path from 'path'

it('init and check the definition exists', () => {
    execSync('node ../dist/cjs/bin/index init', { cwd: __dirname })
    expect(fs.existsSync(path.join(__dirname, 'master.css.js'))).toBeTruthy()
})

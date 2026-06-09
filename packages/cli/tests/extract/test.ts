import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import fs, { readFileSync } from 'fs'
import os from 'node:os'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'
import { it, expect } from 'vitest'

const cliFilepath = resolve(__dirname, '../../src/bin/index.ts')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

it('basic extract', async () => {
    const cwd = fs.mkdtempSync(join(os.tmpdir(), 'master-css-cli-extract-'))
    try {
        fs.writeFileSync(join(cwd, 'a.html'), '<h1 class="bg:primary fg:primary">Hello World</h1>', { flag: 'w' })
        fs.writeFileSync(join(cwd, 'b.html'), '<h1 class="m:12x text:center font:sans font:heavy font:48">Hello World</h1>', { flag: 'w' })
        fs.writeFileSync(join(cwd, 'main.css'), `
            @import "@master/css";
            @theme {
                color-primary: $(blue);
            }
        `, { flag: 'w' })
        execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, 'extract'], { cwd })
        expect(readFileSync(join(cwd, 'master.css')).toString()).toMatch(/(fg\\:primary|m\\:12x|text\\:center|font\\:sans|font\\:heavy|font\\:48)/)
    } finally {
        fs.rmSync(cwd, { recursive: true, force: true })
    }
})

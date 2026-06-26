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
        fs.writeFileSync(join(cwd, 'b.html'), '<h1 class="m:12x text-center font:sans font:heavy font:48px">Hello World</h1>', { flag: 'w' })
        fs.writeFileSync(join(cwd, 'main.css'), `
            @import "@master/css";
            @theme {
                --color-primary: var(--blue);
            }
        `, { flag: 'w' })
        execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath], { cwd })
        expect(readFileSync(join(cwd, 'master.css')).toString()).toMatch(/(fg\\:primary|m\\:12x|text-center|font\\:sans|font\\:heavy|font\\:48px)/)
    } finally {
        fs.rmSync(cwd, { recursive: true, force: true })
    }
})

it('prints CSS without exporting', async () => {
    const cwd = fs.mkdtempSync(join(os.tmpdir(), 'master-css-cli-no-export-'))
    try {
        fs.writeFileSync(join(cwd, 'index.html'), '<h1 class="text-center">Hello World</h1>', { flag: 'w' })
        const output = execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, '--no-export'], {
            cwd,
            encoding: 'utf8'
        })
        expect(output).toContain('text-center')
        expect(fs.existsSync(join(cwd, 'master.css'))).toBe(false)
    } finally {
        fs.rmSync(cwd, { recursive: true, force: true })
    }
})

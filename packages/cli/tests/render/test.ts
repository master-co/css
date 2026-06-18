import { execFileSync } from 'child_process'
import { createRequire } from 'module'
import fs from 'fs'
import dedent from 'ts-dedent'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'
import { it, expect } from 'vitest'

const cliFilepath = resolve(__dirname, '../../src/bin/index.ts')
const tsxLoaderURL = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

it('render css text into <head>', async () => {
    const filePath = join(__dirname, './a.test.html')
    fs.rmSync(filePath, { force: true })
    fs.writeFileSync(filePath, dedent`
        <html>
            <head>
                <link rel="styleSheet">
                <style></style>
            </head>
            <body>
                <h1 class="text-center ml:0>:is(a,button):first font:32">Hello World</h1>
            </body>
        </html>
    `)
    execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, 'render', filePath], { cwd: __dirname })
    expect(fs.readFileSync(filePath, { encoding: 'utf-8' })).toMatch(dedent`
        <html>
            <head>
                <link rel="styleSheet">
                <style></style>
            <style id="master">@layer utilities{.text-center{text-align:center}.font\\:32{font-size:2rem}.ml\\:0\\>\\:is\\(a\\,button\\)\\:first>:is(a,button):first-child{margin-left:0rem}}</style></head>
            <body>
                <h1 class="text-center ml:0>:is(a,button):first font:32">Hello World</h1>
            </body>
        </html>
    `)
}, 60_000)

it('render css text into head and create <style id="master">', async () => {
    const filePath = join(__dirname, './b.test.html')
    fs.rmSync(filePath, { force: true })
    fs.writeFileSync(filePath, dedent`
        <html>
            <head>
                <link rel="styleSheet">
                <style></style>
                <style id="master"></style>
            </head>
            <body>
                <h1 class="top:10 font:48">Hello World</h1>
            </body>
        </html>
    `)
    execFileSync(process.execPath, ['--import', tsxLoaderURL, cliFilepath, 'render', filePath], { cwd: __dirname })
    expect(fs.readFileSync(filePath, { encoding: 'utf-8' })).toMatch(dedent`
        <html>
            <head>
                <link rel="styleSheet">
                <style></style>
                <style id="master">@layer utilities{.font\\:48{font-size:3rem}.top\\:10{top:0.625rem}}</style>
            </head>
            <body>
                <h1 class="top:10 font:48">Hello World</h1>
            </body>
        </html>
    `)
}, 60_000)

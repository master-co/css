import { execSync } from 'child_process'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'
import { CONFIG_TEXT } from '../../src'
import fs from 'fs'
import path from 'path'

it('init cjs', () => {
    execSync('node ../../dist/cjs/bin init -o', { cwd: __dirname })
    expectFileIncludes('master.css.js', [CONFIG_TEXT])
})

it('render cjs', () => {
    const htmlAPath = path.resolve(__dirname, './a.html')
    const htmlBPath = path.resolve(__dirname, './b.html')

    fs.writeFileSync(
        htmlAPath, 
        `<html>
    <head>
        <link rel="styleSheet">
        <style></style>
    </head>
    <body>
        <h1 class="text:center ml:0&gt;:is(a,button):first font:32">Hello World</h1>
    </body>
</html>`
    )
    fs.writeFileSync(
        htmlBPath,
        `<html>
    <head>
        <link rel="styleSheet">
        <style></style>
        <style id="master"></style>
    </head>
    <body>
        <h1 class="top:10 font:48">Hello World</h1>
    </body>
</html>`
    )

    execSync('node ../../dist/cjs/bin render ./*.html', { cwd: __dirname })

    expect(fs.readFileSync(htmlAPath, { encoding: 'utf-8' })).toMatch(`<html>
    <head>
        <link rel="styleSheet">
        <style></style>
    <style id="master">.font\\:32{font-size:2rem}.ml\\:0\\>\\:is\\(a\\,button\\)\\:first>:is(a,button):first-child{margin-left:0rem}.text\\:center{text-align:center}</style></head>
    <body>
        <h1 class="text:center ml:0&gt;:is(a,button):first font:32">Hello World</h1>
    </body>
</html>`)

    expect(fs.readFileSync(htmlBPath, { encoding: 'utf-8' })).toMatch(`<html>
    <head>
        <link rel="styleSheet">
        <style></style>
        <style id="master">.font\\:48{font-size:3rem}.top\\:10{top:0.625rem}</style>
    </head>
    <body>
        <h1 class="top:10 font:48">Hello World</h1>
    </body>
</html>`)
})